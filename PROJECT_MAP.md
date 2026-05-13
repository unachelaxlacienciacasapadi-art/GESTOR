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
    *   `PATCH /api/talks/:id` (incluyendo actualización de `flyer_image_url`) ✅
    *   `GET /api/available-dates` (lógica simplificada) ✅
    *   `GET /api/subscribers`, `GET /api/contacts` ✅

### 📝 Registro (`Registro.tsx`) ✅
*   **Endpoints:**
    *   `GET /api/available-dates` ──▶ Genera miércoles disponibles (+3 meses, 19:00 MX) filtrando solo charlas agendadas. ✅

---

## 🏗️ Infraestructura del Backend (`server.ts`)

### ⚙️ Servidor y API (`server.ts` / `api/index.ts`) ✅
*   **Vercel Entry Point:** `api/index.ts`.
*   **Lógica de Fechas:** Endpoint `/api/available-dates` simplificado para eliminar dependencia de tablas externas, calculando dinámicamente los miércoles y cruzando con charlas agendadas en la tabla `talks`.
*   **Timezone:** Cálculos forzados a `America/Mexico_City` para evitar desfases UTC. Backend y frontend sincronizados para garantizar la visualización de las 19:00 hrs. ✅

### 📦 Base de Datos (PostgreSQL) ✅
*   `talks`: Almacena propuestas, eventos y **URLs de flyers**.
    *   *Nuevos campos preparados:* `stream_url`, `recap_summary`, `recap_photos` (fase de recap).
*   `subscribers`: Lista de correos para el newsletter.
*   `topic_suggestions`: Ideas de la comunidad y votos.
*   `feedback`: Calificaciones de las charlas.
*   `contacts`: Directorio de artistas y proveedores.
*   `custom_availability`: (Depreciado/Opcional) Antiguo sistema de excepciones, actualmente la lógica es dinámica.

---

## 🆕 Reusable Components & Logic

### 🟢 `WhatsAppShareButton.tsx` 🆕
*   Genera mensajes dinámicos con título, ponente, fecha, hora y enlace al flyer.
*   Integrado en: `NextTalkCard`, `UpcomingTalksCarousel`, `Cartelera` y `Admin`.

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
*Última actualización: 2026-05-12 (Nuevos filtros de admin y schema de recap)*
