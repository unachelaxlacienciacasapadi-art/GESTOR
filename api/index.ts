import "../server/env";
import app from "../server/app";

// Punto de entrada serverless de Vercel.
// Toda la lógica de rutas vive en server/app.ts (fuente única compartida con el
// dev server). Importar el módulo dispara la inicialización del esquema (vía
// server/db) en el cold start. Vercel ejecuta este `app` de Express como función.
export default app;
