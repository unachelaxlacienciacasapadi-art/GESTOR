# 🗺️ Mapa del Proyecto: Chelaxlaciencia

Este documento visualiza las dependencias entre páginas, componentes, endpoints y la base de datos. Sirve como referencia técnica para el mantenimiento y desarrollo del sistema.

## 🚀 Arquitectura de Páginas (Frontend)

### 🏠 Inicio (`Home.tsx`) ✅
*   **Componentes:** `React`, `Link` (react-router-dom), `lucide-react` icons.
*   **Assets:** `logo.png`, `galeria*.jpeg`, `memorias*.jpeg`.
*   **Endpoints:**
    *   `GET /api/talks` ──▶ `talks` (tabla) ✅
    *   `POST /api/subscribers` ──▶ `subscribers` (tabla) ✅

### 🎬 Cartelera (`Cartelera.tsx`) ✅
*   **Componentes:** `React`, `date-fns`, `lucide-react` icons.
*   **Endpoints:**
    *   `GET /api/talks` ──▶ `talks` (tabla) ✅
    *   `POST /api/talks/:id/feedback` ──▶ `feedback` (tabla) ✅

### 🛠️ Administración (`Admin.tsx`) ✅
*   **Componentes:** `AdminAgendaCalendar`, `AdminCarteleraPreview`, `html-to-image`, `lucide-react`.
*   **Endpoints:**
    *   `POST /api/admin/login` ──▶ (Auth via ENV) ✅
    *   `GET /api/talks` ──▶ `talks` (tabla) ✅
    *   `PATCH /api/talks/:id` ──▶ `talks` (tabla) ✅
    *   `DELETE /api/talks/:id` ──▶ `talks` (tabla) ✅
    *   `GET /api/subscribers` ──▶ `subscribers` (tabla) ✅
    *   `GET /api/contacts` ──▶ `contacts` (tabla) ✅
    *   `POST /api/contacts` ──▶ `contacts` (tabla) ✅
    *   `GET /api/admin/backup` ──▶ `talks`, `subscribers`, `contacts` ✅

### 👥 Comunidad (`Comunidad.tsx`) ✅
*   **Componentes:** `React`, `date-fns`, `lucide-react`.
*   **Endpoints:**
    *   `GET /api/suggestions` ──▶ `topic_suggestions` (tabla) ✅
    *   `POST /api/suggestions` ──▶ `topic_suggestions` (tabla) ✅
    *   `POST /api/suggestions/:id/vote` ──▶ `topic_suggestions` (tabla) ✅
    *   `GET /api/speakers` ──▶ `talks` (tabla) ✅
    *   `GET /api/passport/:email` ──▶ `checkins` + `talks` ✅

### 📝 Registro (`Registro.tsx`) ✅
*   **Componentes:** `jspdf`, `html-to-image`, `lucide-react`.
*   **Endpoints:**
    *   `POST /api/talks` ──▶ `talks` (tabla) ✅

---

## 🏗️ Infraestructura del Backend (`server.ts`)

### ⚙️ Servidor y API (`server.ts` / `api/index.ts`) ✅
*   **Vercel Entry Point:** `api/index.ts` (Configurado para Serverless).
*   **Validación:** Uso de `zod` para esquemas de datos en propuestas y suscripciones.
*   **Seguridad:** `express-rate-limit` implementado para prevenir abuso en `/api/talks` y `/api/subscribers`.
*   **Autenticación:** JWT para rutas protegidas (`/api/admin/*`, `PATCH`, `DELETE`).

### 📦 Base de Datos (PostgreSQL) ✅
*   `talks`: Almacena propuestas y eventos agendados.
*   `subscribers`: Lista de correos para el newsletter (con validación Zod).
*   `topic_suggestions`: Ideas de la comunidad y votos.
*   `feedback`: Calificaciones de las charlas.
*   `checkins`: Registro de asistencia para el Pasaporte.
*   `contacts`: Directorio de artistas y proveedores.

### 🔑 Variables de Entorno (Vercel/Local)
*   `DATABASE_URL`: ✅ Definida (Supabase/PostgreSQL).
*   `JWT_SECRET`: ✅ Definida.
*   `ADMIN_USERNAME`: ✅ Definida (`admin`).
*   `ADMIN_PASSWORD`: ✅ Definida (`casapadi2024`).
*   `PORT`: ✅ Definida (3000 o inyectada por host).
*   ⚠️ `GEMINI_API_KEY`: Definida en Vercel pero sin uso activo en el código actual.
*   ⚠️ `APP_URL`: Definida en Vercel pero sin uso activo en el código actual.

---

## 🚀 PRÓXIMOS PASOS

1.  **Fix de credenciales Git (PAT):** ✅ Completado y verificado con push exitoso. El remoto utiliza el token de `unachelaxlacienciacasapadi-art`.
2.  **Verificar variables de entorno en Vercel:** ⚠️ Pendiente de validación manual en el dashboard.
3.  **Integración de emails:** 🛠️ En desarrollo. Pendiente elegir entre SendGrid o Resend.
4.  **Cartelera pública:** ✅ Funcional y desplegada.
5.  **Passport de Ciencia:** ✅ Lógica implementada. Pendiente integración de escáner de códigos QR para el Admin.

---
*Última actualización: 2026-05-11*
