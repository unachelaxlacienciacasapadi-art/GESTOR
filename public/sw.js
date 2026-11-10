// Service worker de Una chela x la ciencia.
// - Páginas y API pública: red primero; sin conexión se usa la última copia.
// - Archivos estáticos, fotos y fuentes: caché y actualización en segundo plano.
// - Nada del admin ni nada con Authorization se guarda (datos personales).

const VERSION = "v1";
const SHELL_CACHE = `shell-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;
const STATIC_CACHE = `static-${VERSION}`;
const SHELL_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll([SHELL_URL, "/manifest.webmanifest", "/icons/icon-192.png", "/assets/logo.webp"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = [SHELL_CACHE, DATA_CACHE, STATIC_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isPrivate = (request, url) =>
  request.headers.has("Authorization") ||
  url.pathname.startsWith("/api/admin") ||
  url.pathname === "/admin" ||
  url.searchParams.has("includeAll") ||
  url.pathname.startsWith("/api/passport") ||
  url.pathname.startsWith("/api/subscribers") ||
  url.pathname.startsWith("/api/contacts");

const networkFirst = async (request, cacheName, fallbackUrl) => {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(fallbackUrl || request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(fallbackUrl || request);
    if (cached) return cached;
    throw err;
  }
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === "opaque") cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== self.location.origin && !isFont) return;
  if (isFont) return event.respondWith(staleWhileRevalidate(request));
  if (isPrivate(request, url)) return;

  // Navegación de la SPA: todas las rutas sirven el mismo index.html.
  if (request.mode === "navigate") {
    return event.respondWith(networkFirst(request, SHELL_CACHE, SHELL_URL));
  }

  if (url.pathname.startsWith("/api/")) {
    // Las fotos de ponentes cambian poco: caché con actualización.
    if (/^\/api\/talks\/\d+\/photo$/.test(url.pathname)) return event.respondWith(staleWhileRevalidate(request));
    return event.respondWith(networkFirst(request, DATA_CACHE));
  }

  if (/\.(js|css|png|jpe?g|webp|svg|woff2?)$/i.test(url.pathname)) {
    return event.respondWith(staleWhileRevalidate(request));
  }
});
