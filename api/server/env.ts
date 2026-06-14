import dotenv from "dotenv";

// Carga las variables de entorno desde .env UNA sola vez para todo el backend.
//
// Este módulo solo produce un efecto secundario (poblar process.env) y debe
// importarse ANTES que cualquier otro módulo que lea process.env en el momento
// de carga, como db.ts (DATABASE_URL) o auth.ts (JWT_SECRET).
//
// Por eso los puntos de entrada (api/index.ts y server.ts) lo importan en su
// primera línea, y los módulos compartidos que dependen de env también lo
// importan al inicio. dotenv.config() es idempotente: la segunda llamada no
// vuelve a sobreescribir variables ya definidas.
dotenv.config();
