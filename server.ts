import express from "express";
import { createServer as createViteServer } from "vite";
import { Pool } from "pg";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { toZonedTime, format as tzFormat } from "date-fns-tz";
import { addDays, startOfDay, isAfter } from "date-fns";
import { sendConfirmationEmail } from "./src/lib/email";


dotenv.config();

const TIMEZONE = "America/Mexico_City";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

const JWT_SECRET = process.env.JWT_SECRET || "casapadi-super-secret-key-2026-xyz";

const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: "Access denied" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ error: "Invalid token" });
      return;
    }
    next();
  });
};

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize schema on startup
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS talks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        abstract TEXT NOT NULL,
        speaker_name TEXT NOT NULL,
        speaker_bio TEXT NOT NULL,
        speaker_photo_url TEXT,
        email TEXT,
        phone TEXT,
        social_media TEXT,
        technical_needs TEXT,
        transmission_url TEXT,
        category TEXT DEFAULT 'General',
        promo_email_sent INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        scheduled_date TIMESTAMP,
        summary TEXT,
        event_photos TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS topic_suggestions (
        id SERIAL PRIMARY KEY,
        topic TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'General',
        votes INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        talk_id INTEGER REFERENCES talks(id) ON DELETE CASCADE,
        rating INTEGER,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS checkins (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL,
        talk_id INTEGER REFERENCES talks(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_email, talk_id)
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT,
        contact_person TEXT,
        phone TEXT,
        social_media TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS custom_availability (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        time TIME NOT NULL DEFAULT '19:00:00',
        is_available BOOLEAN NOT NULL DEFAULT true,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(date, time)
      );
    `);

    // Add preferred_date columns to talks if they don't exist yet
    await pool.query(`
      ALTER TABLE talks
        ADD COLUMN IF NOT EXISTS preferred_date_1 TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS preferred_date_2 TIMESTAMP WITH TIME ZONE;
    `);

    // Create index for custom_availability if it doesn't exist
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_custom_availability_date ON custom_availability(date);
    `);

    // Sync sequences robustly
    await pool.query(`
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        FOR r IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') LOOP
          BEGIN
            EXECUTE 'SELECT setval(pg_get_serial_sequence(''' || r.table_name || ''', ''id''), COALESCE(MAX(id), 0) + 1, false) FROM ' || r.table_name;
          EXCEPTION WHEN OTHERS THEN
            -- Skip tables without an ''id'' serial column
          END;
        END LOOP;
      END $$;
    `);
    console.log("Database initialized and sequences synchronized!");
  } catch (error) {
    console.error("Failed to initialize database schema:", error);
  }
};

initDb();

// Setup Multer for memory uploads (Base64 conversion)
const upload = multer({ storage: multer.memoryStorage() });

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD || "casapadi2024";

  if (username === adminUser && password === adminPass) {
    const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, error: "Credenciales incorrectas" });
  }
});

// Community Features
app.post("/api/subscribers", async (req, res) => {
  try {
    const { email } = req.body;
    await pool.query("INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING", [email]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

app.get("/api/suggestions", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM topic_suggestions ORDER BY votes DESC, created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

app.post("/api/suggestions", async (req, res) => {
  try {
    const { topic, description, category } = req.body;
    const result = await pool.query(
      "INSERT INTO topic_suggestions (topic, description, category) VALUES ($1, $2, $3) RETURNING id",
      [topic, description || "", category || "General"]
    );
    res.json({ id: result.rows[0].id, success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to add suggestion" });
  }
});

app.post("/api/suggestions/:id/vote", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE topic_suggestions SET votes = votes + 1 WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to vote" });
  }
});

app.post("/api/talks/:id/feedback", async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    await pool.query("INSERT INTO feedback (talk_id, rating, comment) VALUES ($1, $2, $3)", [id, rating, comment || ""]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

app.get("/api/talks/:id/feedback", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM feedback WHERE talk_id = $1 ORDER BY created_at DESC", [id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

app.post("/api/checkin", async (req, res) => {
  try {
    const { email, talk_id } = req.body;
    await pool.query("INSERT INTO checkins (user_email, talk_id) VALUES ($1, $2) ON CONFLICT (user_email, talk_id) DO NOTHING", [email, talk_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to check in" });
  }
});

app.get("/api/passport/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { rows } = await pool.query(`
      SELECT c.*, t.title, t.scheduled_date 
      FROM checkins c 
      JOIN talks t ON c.talk_id = t.id 
      WHERE c.user_email = $1 
      ORDER BY c.created_at DESC
    `, [email]);
    res.json({ count: rows.length, checkins: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch passport" });
  }
});

app.get("/api/speakers", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT speaker_name, speaker_bio, speaker_photo_url, COUNT(id) as talk_count 
      FROM talks 
      WHERE status IN ('completed', 'scheduled')
      GROUP BY speaker_name, speaker_bio, speaker_photo_url
      ORDER BY talk_count DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch speakers" });
  }
});

// GET /api/available-dates
// Genera miércoles disponibles de los próximos 3 meses a las 19:00 MX
app.get("/api/available-dates", async (req, res) => {
  try {
    console.log("GET /api/available-dates - Calculando fechas disponibles...");
    const nowUtc = new Date();
    const nowMx = toZonedTime(nowUtc, TIMEZONE);
    // Fechas disponibles: desde mañana hasta +3 meses
    const tomorrowMx = startOfDay(addDays(nowMx, 1));
    const endDateMx = new Date(nowMx);
    endDateMx.setMonth(endDateMx.getMonth() + 3);

    // Obtener excepciones de custom_availability dentro del rango
    const { rows: exceptions } = await pool.query(
      `SELECT date::text, time::text, is_available, reason FROM custom_availability
       WHERE date >= $1 AND date <= $2`,
      [tomorrowMx.toISOString().slice(0, 10), endDateMx.toISOString().slice(0, 10)]
    );
    const exceptionMap = new Map<string, { is_available: boolean; reason: string | null }>();
    for (const ex of exceptions) {
      exceptionMap.set(ex.date, { is_available: ex.is_available, reason: ex.reason });
    }

    // Obtener fechas ya ocupadas por charlas aprobadas
    const { rows: approvedTalks } = await pool.query(
      `SELECT preferred_date_1, preferred_date_2 FROM talks WHERE status = 'approved'`
    );
    const occupiedDates = new Set<string>();
    for (const t of approvedTalks) {
      if (t.preferred_date_1) occupiedDates.add(new Date(t.preferred_date_1).toISOString().slice(0, 10));
      if (t.preferred_date_2) occupiedDates.add(new Date(t.preferred_date_2).toISOString().slice(0, 10));
    }

    // Generar todos los miércoles en el rango
    const availableDates: { date: string; formatted: string }[] = [];
    const cursor = new Date(tomorrowMx);
    // Avanzar al próximo miércoles (día 3)
    while (cursor.getDay() !== 3) cursor.setDate(cursor.getDate() + 1);

    while (cursor <= endDateMx) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const exception = exceptionMap.get(dateStr);

      // Si hay excepción y marca como no disponible, saltar
      if (exception && !exception.is_available) {
        cursor.setDate(cursor.getDate() + 7);
        continue;
      }
      // Si está ocupada por una charla aprobada, saltar
      if (occupiedDates.has(dateStr)) {
        cursor.setDate(cursor.getDate() + 7);
        continue;
      }

      // Construir timestamp a las 19:00 MX
      const dtMx = new Date(`${dateStr}T19:00:00`);
      const isoDate = tzFormat(
        toZonedTime(dtMx, TIMEZONE),
        "yyyy-MM-dd'T'HH:mm:ssxxx",
        { timeZone: TIMEZONE }
      );

      // Formato legible en español
      const formatted = tzFormat(
        toZonedTime(dtMx, TIMEZONE),
        "EEEE d 'de' MMMM 'de' yyyy - HH:mm",
        { timeZone: TIMEZONE }
      );

      availableDates.push({ date: isoDate, formatted });
      cursor.setDate(cursor.getDate() + 7);
    }

    console.log(`Fechas disponibles generadas: ${availableDates.length}`);
    res.json({ availableDates });
  } catch (err: any) {
    console.error("Error en GET /api/available-dates:", err);
    res.status(500).json({ error: "Failed to generate available dates", details: err.message });
  }
});

// GET /api/talks
// Default: charlas aprobadas con fecha. Con ?includeAll=true retorna todas (para admin)
app.get("/api/talks", async (req, res) => {
  try {
    const includeAll = req.query.includeAll === "true";
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || null;

    let query: string;
    let values: any[] = [];

    if (includeAll) {
      query = "SELECT * FROM talks ORDER BY created_at DESC";
    } else if (status) {
      query = "SELECT * FROM talks WHERE status = $1 ORDER BY scheduled_date DESC";
      values = [status];
    } else {
      query = "SELECT * FROM talks WHERE (status = 'approved' OR status = 'scheduled' OR status = 'completed') AND scheduled_date IS NOT NULL ORDER BY scheduled_date DESC";
    }

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch talks" });
  }
});

app.post("/api/talks", upload.single("photo"), async (req, res) => {
  try {
    console.log("POST /api/talks - Recibiendo propuesta...");
    const {
      title, abstract, speaker_name, speaker_bio,
      email, phone, social_media, technical_needs,
      preferred_date_1, preferred_date_2
    } = req.body;

    // Validar fechas preferidas si se proporcionaron
    if (preferred_date_1 && preferred_date_2) {
      if (preferred_date_1 === preferred_date_2) {
        return res.status(400).json({ error: "Las fechas preferidas deben ser diferentes" });
      }
    }

    // Validar que las fechas estén en la lista de disponibles (si se proporcionaron)
    if (preferred_date_1 || preferred_date_2) {
      // Obtener fechas disponibles simplificado: verificar que sean miércoles y no bloqueadas
      const datesToCheck: string[] = [];
      if (preferred_date_1) datesToCheck.push(new Date(preferred_date_1).toISOString().slice(0, 10));
      if (preferred_date_2) datesToCheck.push(new Date(preferred_date_2).toISOString().slice(0, 10));

      for (const dateStr of datesToCheck) {
        const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay(); // Evitar problemas de zona horaria
        if (dayOfWeek !== 3) {
          return res.status(400).json({ error: `La fecha ${dateStr} no es miércoles. Solo se permiten miércoles.` });
        }
        // Verificar que no esté bloqueada en custom_availability
        const { rows: blockedRows } = await pool.query(
          `SELECT id FROM custom_availability WHERE date = $1 AND is_available = false`,
          [dateStr]
        );
        if (blockedRows.length > 0) {
          return res.status(400).json({ error: `La fecha ${dateStr} no está disponible.` });
        }
      }
    }

    // Convert to Base64 data URL if we received a file via multer memoryStorage
    let photoUrl = null;
    if (req.file) {
      console.log(`Procesando foto: ${req.file.size} bytes`);
      const base64 = req.file.buffer.toString("base64");
      photoUrl = `data:${req.file.mimetype};base64,${base64}`;
    }

    const { rows } = await pool.query(`
      INSERT INTO talks (
        title, abstract, speaker_name, speaker_bio, speaker_photo_url,
        email, phone, social_media, technical_needs,
        preferred_date_1, preferred_date_2,
        status, scheduled_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', NULL)
      RETURNING id
    `, [
      title || "", abstract || "", speaker_name || "", speaker_bio || "", photoUrl,
      email || "", phone || "", social_media || null, technical_needs || null,
      preferred_date_1 || null, preferred_date_2 || null
    ]);

    console.log(`Propuesta guardada con éxito. Folio: #${rows[0].id}`);
    
    // Enviar email de confirmación (sin bloquear la respuesta)
    sendConfirmationEmail({
      id: rows[0].id,
      title, abstract, speaker_name, speaker_bio,
      email, phone, social_media, technical_needs,
      preferred_date_1, preferred_date_2
    }).catch(err => console.error("Error al enviar email de confirmación:", err));

    res.status(201).json({ id: rows[0].id, message: "Talk submitted successfully" });
  } catch (err: any) {
    console.error("Error en POST /api/talks:", err);
    res.status(500).json({ error: "Failed to submit talk", details: err.message });
  }
});

app.patch("/api/talks/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const keys = Object.keys(updates);
    if (keys.length === 0) return res.status(400).json({ error: "No fields to update" });

    // Validar: si se está aprobando la charla, debe incluirse scheduled_date
    if (updates.status === "approved" && !updates.scheduled_date) {
      // Verificar si ya tiene fecha en la BD
      const { rows: existing } = await pool.query(
        "SELECT scheduled_date FROM talks WHERE id = $1",
        [id]
      );
      if (!existing[0]?.scheduled_date) {
        return res.status(400).json({
          error: "Para aprobar una charla debes incluir la fecha (scheduled_date)"
        });
      }
    }

    // Build dynamic update query for PG: SET col1 = $1, col2 = $2 WHERE id = $N
    const setClause = keys.map((k, index) => `${k} = $${index + 1}`).join(", ");
    const values = keys.map(k => updates[k]);
    values.push(id); // id es el último parámetro

    await pool.query(`UPDATE talks SET ${setClause} WHERE id = $${values.length}`, values);
    console.log(`PATCH /api/talks/${id} - Actualizado: ${JSON.stringify(updates)}`);
    res.json({ message: "Talk updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update talk" });
  }
});

app.delete("/api/talks/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM talks WHERE id = $1", [id]);
    res.json({ message: "Talk deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete talk" });
  }
});

app.post("/api/talks/:id/photos", authenticateToken, upload.array("photos", 10), async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No photos uploaded" });
    }

    const newPhotos = files.map(f => `data:${f.mimetype};base64,${f.buffer.toString('base64')}`);
    
    const { rows } = await pool.query("SELECT event_photos FROM talks WHERE id = $1", [id]);
    let existingPhotos: string[] = [];
    if (rows[0] && rows[0].event_photos) {
      try {
        existingPhotos = JSON.parse(rows[0].event_photos);
      } catch (e) {}
    }

    const allPhotos = [...existingPhotos, ...newPhotos];
    await pool.query("UPDATE talks SET event_photos = $1 WHERE id = $2", [JSON.stringify(allPhotos), id]);

    res.json({ message: "Photos uploaded successfully", photos: allPhotos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload photos" });
  }
});

app.get("/api/subscribers", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM subscribers ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch subscribers" });
  }
});

app.get("/api/contacts", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM contacts ORDER BY name ASC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

app.post("/api/contacts", authenticateToken, async (req, res) => {
  try {
    const { name, type, contact_person, phone, social_media, notes } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const { rows } = await pool.query(
      "INSERT INTO contacts (name, type, contact_person, phone, social_media, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [name, type || "", contact_person || "", phone || "", social_media || "", notes || ""]
    );
    res.json({ id: rows[0].id, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add contact" });
  }
});

app.post("/api/talks/:id/promo", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE talks SET promo_email_sent = 1 WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update promo status" });
  }
});

app.get("/api/admin/backup", authenticateToken, async (req, res) => {
  try {
    const { rows: talks } = await pool.query("SELECT * FROM talks");
    const { rows: subscribers } = await pool.query("SELECT * FROM subscribers");
    const { rows: contacts } = await pool.query("SELECT * FROM contacts");

    // In PG we return a JSON backup since we don't have a single SQLite file anymore
    res.json({ talks, subscribers, contacts, export_date: new Date() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate backup" });
  }
});

// ─────────────────────────────────────────────
// ADMIN: Gestión de disponibilidad personalizada
// ─────────────────────────────────────────────

// POST /api/admin/availability - Crear excepción de disponibilidad
app.post("/api/admin/availability", authenticateToken, async (req, res) => {
  try {
    const { date, time, is_available, reason } = req.body;
    console.log("POST /api/admin/availability - Creando excepción:", { date, time, is_available, reason });

    // Validar formato de fecha (YYYY-MM-DD)
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Formato de fecha inválido. Usa YYYY-MM-DD" });
    }
    // Validar formato de hora (HH:MM o HH:MM:SS)
    const timeToUse = time || "19:00:00";
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(timeToUse)) {
      return res.status(400).json({ error: "Formato de hora inválido. Usa HH:MM o HH:MM:SS" });
    }

    const { rows } = await pool.query(
      `INSERT INTO custom_availability (date, time, is_available, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (date, time) DO UPDATE
         SET is_available = EXCLUDED.is_available,
             reason = EXCLUDED.reason,
             updated_at = NOW()
       RETURNING *`,
      [date, timeToUse, is_available !== undefined ? is_available : true, reason || null]
    );

    console.log(`Excepción guardada para fecha ${date}`);
    res.status(201).json({ success: true, availability: rows[0] });
  } catch (err: any) {
    console.error("Error en POST /api/admin/availability:", err);
    res.status(500).json({ error: "Failed to create availability exception", details: err.message });
  }
});

// GET /api/admin/availability - Listar todas las excepciones
app.get("/api/admin/availability", authenticateToken, async (req, res) => {
  try {
    console.log("GET /api/admin/availability - Obteniendo excepciones...");
    const { rows } = await pool.query(
      `SELECT * FROM custom_availability ORDER BY date ASC, time ASC`
    );
    res.json({ availability: rows });
  } catch (err: any) {
    console.error("Error en GET /api/admin/availability:", err);
    res.status(500).json({ error: "Failed to fetch availability exceptions", details: err.message });
  }
});

// DELETE /api/admin/availability/:id - Eliminar excepción por ID
app.delete("/api/admin/availability/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`DELETE /api/admin/availability/${id} - Eliminando excepción...`);
    const { rowCount } = await pool.query(
      `DELETE FROM custom_availability WHERE id = $1`,
      [id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "Excepción no encontrada" });
    }
    res.json({ success: true, message: "Excepción eliminada correctamente" });
  } catch (err: any) {
    console.error("Error en DELETE /api/admin/availability:", err);
    res.status(500).json({ error: "Failed to delete availability exception", details: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
