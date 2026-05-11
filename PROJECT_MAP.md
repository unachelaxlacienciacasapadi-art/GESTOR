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
    *   `GET /api/available-dates` ──▶ lógica en servidor ✅ 🆕

---

## 🏗️ Infraestructura del Backend (`server.ts`)

### ⚙️ Servidor y API (`server.ts` / `api/index.ts`) ✅
*   **Vercel Entry Point:** `api/index.ts` (Configurado para Serverless).
*   **Validación:** Uso de `zod` para esquemas de datos en propuestas y suscripciones.
*   **Seguridad:** `express-rate-limit` implementado para prevenir abuso en `/api/talks` y `/api/subscribers`.
*   **Autenticación:** JWT para rutas protegidas (`/api/admin/*`, `PATCH`, `DELETE`).

### 📦 Base de Datos (PostgreSQL) ✅
*   `talks`: Almacena propuestas y eventos agendados. 🔄 Nuevos campos: `preferred_date_1`, `preferred_date_2`.
*   `subscribers`: Lista de correos para el newsletter (con validación Zod).
*   `topic_suggestions`: Ideas de la comunidad y votos.
*   `feedback`: Calificaciones de las charlas.
*   `checkins`: Registro de asistencia para el Pasaporte.
*   `contacts`: Directorio de artistas y proveedores.
*   `custom_availability`: Excepciones de disponibilidad (fechas bloqueadas/extra). 🆕

### 🔑 Variables de Entorno (Vercel/Local)
*   `DATABASE_URL`: ✅ Definida (Supabase/PostgreSQL).
*   `JWT_SECRET`: ✅ Definida.
*   `ADMIN_USERNAME`: ✅ Definida (`admin`).
*   `ADMIN_PASSWORD`: ✅ Definida (`casapadi2024`).
*   `PORT`: ✅ Definida (3000 o inyectada por host).
*   ⚠️ `GEMINI_API_KEY`: Definida en Vercel pero sin uso activo en el código actual.
*   ⚠️ `APP_URL`: Definida en Vercel pero sin uso activo en el código actual.

---

## 🆕 FEATURE EN DESARROLLO: Sistema de Fechas Disponibles

### Endpoints nuevos
*   `GET /api/available-dates` → Genera miércoles disponibles (+3 meses, 19:00 MX) filtrando excepciones y charlas aprobadas. 🆕
*   `POST /api/admin/availability` → Crea excepción de disponibilidad (requiere JWT). 🆕
*   `GET /api/admin/availability` → Lista todas las excepciones activas (requiere JWT). 🆕
*   `DELETE /api/admin/availability/:id` → Elimina excepción por ID (requiere JWT). 🆕

### Endpoints modificados
*   `POST /api/talks` → Acepta `preferred_date_1`, `preferred_date_2`. Valida que sean miércoles y no estén bloqueadas. 🔄
*   `GET /api/talks` → Con `?includeAll=true` retorna todas las charlas (para admin). Sin parámetros: solo `approved` con fecha. 🔄
*   `PATCH /api/talks/:id` → Al aprobar (`status=approved`), valida que exista `scheduled_date`. 🔄

### Dependencias nuevas
*   `date-fns-tz` → Manejo de zona horaria `America/Mexico_City`.

### Estado de implementación:

**✅ FASE 1 - Backend + Base de Datos (Completada 2026-05-11)**
- Migraciones ejecutadas automáticamente via `initDb()`
- Endpoint `GET /api/available-dates` retorna 13 miércoles disponibles
- Timezone configurado: America/Mexico_City (-06:00)
- Validaciones funcionando correctamente
- Tests: ✅ Endpoint devuelve fechas en formato ISO 8601

**✅ FASE 2 - Frontend Registro (Completada 2026-05-11)**
- Selector de 2 fechas (1ª y 2ª opción) implementado en `Registro.tsx`.
- Fetch de fechas disponibles al cargar el componente.
- Formateo en español usando `Intl.DateTimeFormat`.
- Validaciones: fechas diferentes y orden cronológico.

**⏳ FASE 3 - Admin Panel (Próxima)**
- Gestionar disponibilidad y excepciones desde el panel de administración.


---

## 🚀 PRÓXIMOS PASOS (actualizado)

1.  **Fix de credenciales Git (PAT):** ✅ Completado y verificado con push exitoso. El remoto utiliza el token de `unachelaxlacienciacasapadi-art`.
2.  **Verificar variables de entorno en Vercel:** ⚠️ Pendiente de validación manual en el dashboard.
3.  🔄 **Feature: Sistema de fechas disponibles** (EN DESARROLLO)
    - ✅ Fase 1: Backend + Base de Datos ← COMPLETADA 2026-05-11
    - ✅ Fase 2: Frontend Registro (selector de 2 fechas) ← COMPLETADA 2026-05-11
    - ⏳ Fase 3: Admin Panel (gestionar disponibilidad)
4.  **Integración de emails:** 🛠️ En desarrollo. Pendiente elegir entre SendGrid o Resend.
5.  **Cartelera pública:** ✅ Funcional y desplegada.
6.  **Passport de Ciencia:** ✅ Lógica implementada. Pendiente integración de escáner de códigos QR para el Admin.
7.  **Sistema de Fechas Disponibles (Fase 2):** ✅ Frontend implementado. Pendiente: Fase 3 (Admin Panel).

---
*Última actualización: 2026-05-11*
