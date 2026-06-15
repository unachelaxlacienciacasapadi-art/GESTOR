# 🗺️ Mapa del Proyecto: Chelaxlaciencia

Este documento visualiza las dependencias entre páginas, componentes, endpoints y la base de datos. Sirve como referencia técnica para el mantenimiento y desarrollo del sistema.

## 🚀 Arquitectura de Páginas (Frontend)

### 🏠 Inicio (`Home.tsx`) ✅
*   **Refactor:** Pestañas "Próximas" y "Comunidad" consolidadas en una sola pestaña "🎤 Próximas & Comunidad".
*   **Newsletter:** Formulario integrado directamente en el bloque de Comunidad (migrado desde el footer).
*   **Componentes:** `React`, `Link`, `WhatsAppShareButton` 🆕, `lucide-react`.
*   **Endpoints:**
    *   `GET /api/talks` ──▶ `talks` (tabla) ✅
    *   `POST /api/subscribers` ──▶ `subscribers` (tabla) ✅

### 🎬 Cartelera (`Cartelera.tsx`) ✅
*   **Componentes:** `React`, `WhatsAppShareButton` 🆕, `lucide-react`.
*   **Endpoints:**
    *   `GET /api/talks` ──▶ `talks` (tabla) ✅

### 🛠️ Administración (`Admin.tsx`) ✅
*   **Mejoras:** 
    *   **Métricas:** Dashboard actualizado para mostrar "Aprobadas + Agendadas" (consolidando ambos estados).
    *   **Listado:** Filtros dinámicos (Todas, Pendientes, Aprobadas, Completadas) integrados en UI.
    *   **Diseño:** Nueva sección para subir/previsualizar el **Flyer Promocional** de cada charla.
    *   **Agenda:** Calendario corregido a formato **gregory** (Domingo-Sábado) y filtrado para mostrar charlas aprobadas, agendadas y completadas.
*   **Componentes:** `AdminAgendaCalendar`, `WhatsAppShareButton` 🆕, `react-calendar`, `lucide-react`.
*   **Endpoints:**
    *   `GET /api/talks` (con filtros de estado) ✅
    *   `POST /api/admin/talks` (creación de charlas desde admin, autenticado) ✅
    *   `PATCH /api/talks/:id` (incluyendo actualización de `flyer_image_url`) ✅
    *   `GET /api/available-dates` (lógica simplificada) ✅
    *   `GET /api/subscribers`, `GET /api/contacts` ✅

### 📝 Registro (`Registro.tsx`) ✅
*   **Endpoints:**
    *   `GET /api/available-dates` ──▶ Genera miércoles disponibles (+3 meses, 19:00 MX) filtrando solo charlas agendadas. ✅

---

## 🏗️ Infraestructura del Backend (`server.ts`)

### ⚙️ Arquitectura Modular Backend ✅
*   **server/env.ts** — Carga variables de entorno (dotenv).
*   **server/db.ts** — Pool PostgreSQL + función `initDb()` para inicializar esquema.
*   **server/auth.ts** — Middleware JWT (`authenticateToken`) y constante `JWT_SECRET`.
*   **server/validation.ts** — Schemas Zod para validación (`talkSchema`, `subscriberSchema`).
*   **server/app.ts** — ÚNICA fuente de verdad de todas las rutas (~550 líneas). Exporta `app` Express.
*   **server.ts** — Wrapper de desarrollo: monta Vite HMR + estáticos + llama `listen()`.
*   **api/index.ts** — Wrapper de producción Vercel (~8 líneas): importa y exporta `app`.
*   **Lógica de Fechas:** Endpoint `/api/available-dates` simplificado para eliminar dependencia de tablas externas, calculando dinámicamente los miércoles y cruzando con charlas agendadas en la tabla `talks`.
*   **Timezone:** Cálculos forzados a `America/Mexico_City` para evitar desfases UTC. Backend y frontend sincronizados para garantizar la visualización de las 19:00 hrs. ✅

### 📦 Base de Datos (PostgreSQL) ✅
*   `talks`: Almacena propuestas, eventos y **URLs de flyers**.
    *   *Nuevos campos preparados:* `stream_url`, `recap_summary`, `recap_photos` (fase de recap).
*   `subscribers`: Lista de correos para el newsletter.
*   `topic_suggestions`: Ideas de la comunidad y votos.
*   `feedback`: Calificaciones de las charlas.
*   `contacts`: Directorio de artistas y proveedores.
*   `custom_availability`: Sistema de excepciones personalizadas de disponibilidad (activo).

---

## 🆕 Reusable Components & Logic

### 🟢 `WhatsAppShareButton.tsx` 🆕
*   Genera mensajes dinámicos con título, ponente, fecha, hora y enlace al flyer.
*   Integrado en: `NextTalkCard`, `UpcomingTalksCarousel`, `Cartelera` y `Admin`.

---

## 📋 Último Refactor Backend (2026-06-14)

Unificación de la lógica backend en `server/app.ts` como fuente única de verdad. Consolidación de:
- Rutas de CRUD (talks, subscribers, contacts, feedback)
- Endpoints administrativos (login, creación de charlas autenticada, gestión de disponibilidad)
- Endpoints públicos (cartelera, registro, fechas disponibles, check-in, pasaporte)
- Validaciones Zod centralizadas
- Middleware de autenticación JWT
- Rate limiters anti-abuso

Resultado: ~550 líneas en `app.ts`, separadas en 11 secciones temáticas, con mantainability mejorada y cero redundancia.

---

## ✅ ESTADO DE IMPLEMENTACIÓN (Actualizado 2026-05-12)

1.  **WhatsApp Sharing:** ✅ Completado. Mensajes dinámicos con flyers.
2.  **Dashboard Admin:** ✅ Completado. Métricas consolidadas, gestión de flyers y nuevos filtros en el listado.
3.  **Refactor Home:** ✅ Completado. Tabs unificados y newsletter integrado.
4.  **Available Dates:** ✅ Completado. Lógica simplificada e inmune a desfases de timezone.
5.  **Timezone Sync:** ✅ Completado. Corrección del error de visualización (13:00 vs 19:00) en todos los componentes. 🆕
6.  **Calendar Fix:** ✅ Completado. Formato gregory en el panel de administración.
7.  **Preparación Recap:** ✅ Schema de base de datos listo para almacenar URLs de stream y recaps.

---

## ⚠️ Restricción de Arquitectura Vercel (CRÍTICO)

`api/index.ts` **DEBE ser autosuficiente** — sin imports relativos fuera de `api/`.

Vercel Functions solo resuelve imports de `node_modules`, no paths relativos a carpetas del proyecto. Los imports como `import app from "../../src/lib/email"` fallan en runtime con `FUNCTION_INVOCATION_FAILED` (HTTP 500).

### Solución Implementada
- **Producción (Vercel):** `api/index.ts` contiene TODO inline:
  - Inicialización de dotenv
  - Pool PostgreSQL + `initDb()`
  - Schemas Zod
  - Middleware JWT
  - `sendConfirmationEmail` (Resend)
  - Todas las rutas Express (~860 líneas)
  
- **Desarrollo (local):** `server.ts` → `api/server/app.ts` (modular, con Vite HMR)

### 🚨 Regla Importante
Si agregas lógica nueva al backend, **debes actualizarla en DOS lugares:**
1. `api/server/app.ts` (para desarrollo local con HMR)
2. `api/index.ts` (para producción en Vercel)

Luego haz commit normal: El `api/index.js` compilado está en `.gitignore` (Vercel lo genera en su build).

---
*Última actualización: 2026-06-14 (Restricción Vercel + api/index.ts autosuficiente)*
