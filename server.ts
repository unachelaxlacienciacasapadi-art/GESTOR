import "./api/server/env";
import express from "express";
import { createServer as createViteServer } from "vite";
import app from "./api/server/app";

// Punto de entrada de DESARROLLO (npm run dev → tsx server.ts).
// Reutiliza el `app` de Express compartido (server/app.ts) — misma lógica de
// rutas y mismo esquema que producción (api/index.ts). Aquí solo se añade el
// servido del frontend y el listen(), que no aplican en serverless.

const PORT = process.env.PORT || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Dev: Vite en middleware mode sirve el frontend con HMR junto a la API.
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Prod (arranque local del build): sirve los estáticos compilados.
    app.use(express.static("dist"));
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
