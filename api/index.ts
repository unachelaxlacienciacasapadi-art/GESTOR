import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { Pool, types } from "pg";
import { z } from "zod";
import { Resend } from "resend";
import type { Request, Response, NextFunction } from "express";

// ── Entorno ───────────────────────────────────────────────────────────────────

dotenv.config();

// ── Base de datos ─────────────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL not defined. Database operations will fail.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Devuelve timestamps sin zona horaria como strings crudos.
types.setTypeParser(1114, (str: string) => str);

const initDb = async (): Promise<void> => {
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

    await pool.query(`
      ALTER TABLE talks ADD COLUMN IF NOT EXISTS flyer_image_url TEXT;
      ALTER TABLE talks ADD COLUMN IF NOT EXISTS preferred_date_1 TIMESTAMP WITH TIME ZONE;
      ALTER TABLE talks ADD COLUMN IF NOT EXISTS preferred_date_2 TIMESTAMP WITH TIME ZONE;
      ALTER TABLE talks ADD COLUMN IF NOT EXISTS stream_url TEXT;
      ALTER TABLE talks ADD COLUMN IF NOT EXISTS recap_summary TEXT;
      ALTER TABLE talks ADD COLUMN IF NOT EXISTS recap_photos TEXT DEFAULT '[]';
      ALTER TABLE talks ADD COLUMN IF NOT EXISTS description_short TEXT;
      ALTER TABLE talks ADD COLUMN IF NOT EXISTS speaker_2_name TEXT;
      ALTER TABLE talks ADD COLUMN IF NOT EXISTS speaker_2_photo_url TEXT;
      ALTER TABLE talks ADD COLUMN IF NOT EXISTS speaker_2_bio TEXT;
      ALTER TABLE talks ADD COLUMN IF NOT EXISTS facebook_url TEXT;
      ALTER TABLE talks ADD COLUMN IF NOT EXISTS admin_notes TEXT;
      ALTER TABLE talks ADD COLUMN IF NOT EXISTS institution TEXT;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_custom_availability_date ON custom_availability(date);
    `);

    await pool.query(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') LOOP
          BEGIN
            EXECUTE 'SELECT setval(pg_get_serial_sequence(''' || r.table_name || ''', ''id''), COALESCE(MAX(id), 0) + 1, false) FROM ' || r.table_name;
          EXCEPTION WHEN OTHERS THEN
            -- Tabla sin columna id serial: se ignora.
          END;
        END LOOP;
      END $$;
    `);

    console.log("Database initialized and sequences synchronized!");
  } catch (error) {
    console.error("Failed to initialize database schema:", error);
  }
};

initDb().catch((err) => {
  console.error("Database initialization error (will retry on first request):", err.message);
});

// ── Validación ────────────────────────────────────────────────────────────────

const talkSchema = z.object({
  title: z.string().min(5).max(200),
  abstract: z.string().min(10).max(2000),
  speaker_name: z.string().min(2).max(100),
  speaker_bio: z.string().min(2).max(2000),
  email: z.string().email(),
  phone: z.string().transform(val => val.replace(/[\s\-\(\)]/g, '')).pipe(z.string().regex(/^\d{10,11}$/)),
  _trap: z.string().max(0).optional().default(""),
  preferred_date_1: z.string().optional(),
  preferred_date_2: z.string().optional(),
});

const subscriberSchema = z.object({
  email: z.string().email(),
});

// ── Auth ──────────────────────────────────────────────────────────────────────

// Sin valor por defecto: el repo es público, así que un fallback permitiría
// falsificar tokens. Si falta, el login responde 503 y todo token se rechaza.
const JWT_SECRET = process.env.JWT_SECRET ?? "";
if (!JWT_SECRET) {
  console.error("JWT_SECRET no está definido: el panel de administración queda deshabilitado.");
}

const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) { res.status(401).json({ error: "Access denied" }); return; }
  jwt.verify(token, JWT_SECRET, (err) => {
    if (err) { res.status(403).json({ error: "Invalid token" }); return; }
    next();
  });
};

// ── Email ─────────────────────────────────────────────────────────────────────

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const sendConfirmationEmail = async (talk: any) => {
  if (!resend) {
    console.warn("RESEND_API_KEY no configurada. Saltando envío de email.");
    return { success: false, error: "API Key missing" };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: "Chelaxlaciencia <onboarding@resend.dev>",
      to: [talk.email],
      subject: `✅ Propuesta recibida - ${talk.title.toUpperCase()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; padding: 20px; border-radius: 15px;">
          <h2 style="color: #9933FF; text-align: center;">¡Hola ${talk.speaker_name}!</h2>
          <p>Hemos recibido correctamente tu propuesta para participar en <strong>Una chela por la ciencia</strong> en Casa Pädi.</p>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0; font-size: 16px;">Resumen de tu propuesta:</h3>
            <p style="margin: 5px 0;"><strong>Título:</strong> ${talk.title}</p>
            <p style="margin: 5px 0;"><strong>Categoría:</strong> ${talk.category || "General"}</p>
            <p style="margin: 5px 0;"><strong>1ª Opción:</strong> ${talk.preferred_date_1 || "No especificada"}</p>
            <p style="margin: 5px 0;"><strong>2ª Opción:</strong> ${talk.preferred_date_2 || "No especificada"}</p>
          </div>
          <p><strong>¿Qué sigue?</strong> Nuestro equipo revisará los detalles y nos pondremos en contacto contigo a través de este correo o por teléfono para coordinar la fecha definitiva y los detalles técnicos.</p>
          <p style="text-align: center; margin-top: 30px;">
            <a href="https://chelaxlaciencia.vercel.app" style="background: #9933FF; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold;">Visitar Cartelera</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <div style="text-align: center; font-size: 12px; color: #888;">
            <p><strong>Casa Pädi - Pachuca, Hidalgo</strong></p>
            <p>Av. Piracantos 1507, Pachuca de Soto.</p>
          </div>
        </div>
      `,
    });
    if (error) { console.error("Error de Resend:", error); return { success: false, error }; }
    return { success: true, data };
  } catch (err) {
    console.error("Error inesperado al enviar email:", err);
    return { success: false, error: err };
  }
};

// ── App Express ───────────────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: "50mb" }));

const upload = multer({ storage: multer.memoryStorage() });

const talkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Demasiadas propuestas. Intenta en una hora." },
});
const subscriberLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Demasiadas suscripciones." },
});

const TALK_EDITABLE_FIELDS = [
  "title", "abstract", "speaker_name", "speaker_bio", "speaker_photo_url",
  "email", "phone", "social_media", "technical_needs", "transmission_url",
  "category", "promo_email_sent", "status", "scheduled_date", "summary",
  "event_photos", "flyer_image_url", "preferred_date_1", "preferred_date_2",
  "stream_url", "recap_summary", "recap_photos",
  "description_short", "speaker_2_name", "speaker_2_photo_url", "speaker_2_bio",
  "facebook_url", "admin_notes", "institution",
];

// ── Salud ─────────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── Admin login ───────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: "Demasiados intentos. Espera 15 minutos." },
});

app.post("/api/admin/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass || !JWT_SECRET) {
    console.error("ADMIN_PASSWORD o JWT_SECRET no están definidos.");
    return res.status(503).json({ success: false, error: "Panel no configurado en el servidor." });
  }
  if (username === adminUser && password === adminPass) {
    const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, error: "Credenciales incorrectas" });
  }
});

// ── Comunidad: newsletter ─────────────────────────────────────────────────────

app.post("/api/subscribers", subscriberLimiter, async (req, res) => {
  try {
    const parsed = subscriberSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Email inválido" });
    await pool.query(
      "INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING",
      [req.body.email]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// ── Comunidad: sugerencias de temas ──────────────────────────────────────────

app.get("/api/suggestions", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM topic_suggestions ORDER BY votes DESC, created_at DESC"
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

// Límites por IP para los formularios públicos de comunidad.
const suggestionLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { error: "Demasiadas propuestas. Intenta en una hora." } });
const voteLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 30, message: { error: "Demasiados votos." } });
const feedbackLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: "Demasiadas opiniones." } });

const cleanText = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

app.post("/api/suggestions", suggestionLimiter, async (req, res) => {
  try {
    const topic = cleanText(req.body?.topic, 120);
    if (!topic) return res.status(400).json({ error: "El tema es obligatorio" });
    const { rows } = await pool.query(
      "INSERT INTO topic_suggestions (topic, description, category) VALUES ($1, $2, $3) RETURNING id",
      [topic, cleanText(req.body?.description, 400), cleanText(req.body?.category, 40) || "General"]
    );
    res.json({ id: rows[0].id, success: true });
  } catch {
    res.status(500).json({ error: "Failed to add suggestion" });
  }
});

app.post("/api/suggestions/:id/vote", voteLimiter, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  try {
    await pool.query(
      "UPDATE topic_suggestions SET votes = votes + 1 WHERE id = $1",
      [req.params.id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to vote" });
  }
});

// ── Feedback de charlas ───────────────────────────────────────────────────────

app.post("/api/talks/:id/feedback", feedbackLimiter, async (req, res) => {
  const rating = Number(req.body?.rating);
  if (!/^\d+$/.test(req.params.id) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Calificación inválida" });
  }
  try {
    // Solo se puede opinar sobre charlas públicas que ya ocurrieron.
    const { rowCount } = await pool.query(
      `INSERT INTO feedback (talk_id, rating, comment)
       SELECT id, $2, $3 FROM talks
       WHERE id = $1 AND status IN ('scheduled', 'completed')
         AND scheduled_date < now() AT TIME ZONE 'America/Mexico_City'`,
      [req.params.id, rating, cleanText(req.body?.comment, 1000)]
    );
    if (!rowCount) return res.status(404).json({ error: "Charla no encontrada" });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

app.get("/api/talks/:id/feedback", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM feedback WHERE talk_id = $1 ORDER BY created_at DESC",
      [req.params.id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// ── Check-in / pasaporte ──────────────────────────────────────────────────────

// Solo el staff registra asistencias: abierto al público, cualquiera podía
// sumarse las 5 visitas del Pasaporte para cualquier correo.
app.post("/api/checkin", authenticateToken, async (req, res) => {
  const email = cleanText(req.body?.email, 254).toLowerCase();
  const talkId = Number(req.body?.talk_id);
  if (!email.includes("@") || !Number.isInteger(talkId)) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  try {
    await pool.query(
      "INSERT INTO checkins (user_email, talk_id) VALUES ($1, $2) ON CONFLICT (user_email, talk_id) DO NOTHING",
      [email, talkId]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to check in" });
  }
});

app.get("/api/passport/:email", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, t.title, t.scheduled_date FROM checkins c JOIN talks t ON c.talk_id = t.id WHERE c.user_email = $1 ORDER BY c.created_at DESC`,
      [req.params.email]
    );
    res.json({ count: rows.length, checkins: rows });
  } catch {
    res.status(500).json({ error: "Failed to fetch passport" });
  }
});

// ── Lectura pública de charlas ───────────────────────────────────────────────
//
// Las respuestas públicas NUNCA incluyen datos de contacto del ponente (email,
// teléfono, redes), notas internas ni propuestas pendientes/rechazadas: esos
// solo salen con token de admin. Las fotos guardadas como data URL base64 se
// sirven aparte por /api/talks/:id/photo para no inflar cada listado con MBs.

const PUBLIC_STATUSES = ["scheduled", "completed"];

const photoUrlSql = (column: string, n: 1 | 2) =>
  `CASE WHEN ${column} LIKE 'data:%' THEN '/api/talks/' || id || '/photo${n === 2 ? "?n=2" : ""}' ELSE ${column} END AS ${column}`;

const PUBLIC_TALK_COLUMNS = [
  "id", "title", "abstract", "description_short", "category", "status",
  "scheduled_date", "speaker_name", "speaker_bio", "speaker_2_name",
  "speaker_2_bio", "institution", "transmission_url", "stream_url",
  "flyer_image_url", "facebook_url", "summary", "recap_summary",
  photoUrlSql("speaker_photo_url", 1),
  photoUrlSql("speaker_2_photo_url", 2),
].join(", ");

const isAdminRequest = (req: express.Request): boolean => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
};

app.get("/api/speakers", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      WITH s AS (
        SELECT id, trim(speaker_name) AS speaker_name, speaker_bio, institution,
               speaker_photo_url, scheduled_date, lower(trim(speaker_name)) AS k
        FROM talks WHERE status = ANY($1)
      )
      SELECT DISTINCT ON (k)
        speaker_name, speaker_bio, institution,
        ${photoUrlSql("speaker_photo_url", 1)},
        (SELECT count(*)::int FROM s s2 WHERE s2.k = s.k) AS talk_count,
        (SELECT max(scheduled_date) FROM s s2 WHERE s2.k = s.k) AS last_talk_date
      FROM s
      ORDER BY k, (speaker_photo_url IS NULL OR speaker_photo_url = ''), scheduled_date DESC
    `, [PUBLIC_STATUSES]);
    rows.sort((a, b) =>
      b.talk_count - a.talk_count ||
      String(b.last_talk_date ?? "").localeCompare(String(a.last_talk_date ?? ""))
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch speakers" });
  }
});

// Público: charlas agendadas/realizadas (pasadas y futuras), ordenadas por fecha.
//   ?upcoming=true → solo de hoy en adelante (hora de CDMX).
// Admin (requiere token): ?includeAll=true → todas las columnas y estados.
//   ?status=… con un estado no público también requiere token.
app.get("/api/talks", async (req, res) => {
  try {
    const includeAll = req.query.includeAll === "true";
    const status = typeof req.query.status === "string" ? req.query.status : null;
    const upcoming = req.query.upcoming === "true";
    const parsedLimit = parseInt(req.query.limit as string, 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 500) : null;
    const admin = isAdminRequest(req);

    if ((includeAll || (status && !PUBLIC_STATUSES.includes(status))) && !admin) {
      return res.status(401).json({ error: "Access denied" });
    }

    let query: string;
    const values: any[] = [];

    if (includeAll) {
      query = "SELECT * FROM talks ORDER BY created_at DESC";
    } else {
      const columns = admin && status ? "*" : PUBLIC_TALK_COLUMNS;
      values.push(status ? [status] : PUBLIC_STATUSES);
      query = `SELECT ${columns} FROM talks WHERE status = ANY($1) AND scheduled_date IS NOT NULL`;
      if (upcoming) {
        // scheduled_date guarda hora local de CDMX sin zona: se compara contra el
        // inicio del día de hoy en CDMX para que la charla siga visible todo el día.
        query += " AND scheduled_date >= date_trunc('day', now() AT TIME ZONE 'America/Mexico_City')";
      }
      query += upcoming ? " ORDER BY scheduled_date ASC" : " ORDER BY scheduled_date DESC";
    }

    if (limit) query += ` LIMIT ${limit}`;

    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch talks" });
  }
});

// Detalle público de una charla (incluye fotos del evento, que no van en el listado).
app.get("/api/talks/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const { rows } = await pool.query(
      `SELECT ${PUBLIC_TALK_COLUMNS}, event_photos FROM talks WHERE id = $1 AND status = ANY($2)`,
      [id, PUBLIC_STATUSES]
    );
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch talk" });
  }
});

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

app.get("/api/talks/:id/photo", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).end();
  const column = req.query.n === "2" ? "speaker_2_photo_url" : "speaker_photo_url";
  try {
    const { rows } = await pool.query(
      `SELECT ${column} AS url FROM talks WHERE id = $1 AND status = ANY($2)`,
      [id, PUBLIC_STATUSES]
    );
    const url: string | null = rows[0]?.url ?? null;
    if (!url) return res.status(404).end();
    if (/^https?:\/\//i.test(url)) return res.redirect(url);
    const match = url.match(/^data:([^;,]+);base64,([\s\S]*)$/);
    // Solo tipos de imagen rasterizados: un data URL de SVG/HTML podría ejecutar scripts.
    if (!match || !ALLOWED_PHOTO_TYPES.includes(match[1].toLowerCase())) return res.status(404).end();
    res.set("Content-Type", match[1]);
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    res.send(Buffer.from(match[2], "base64"));
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

// ── Charlas: creación PÚBLICA ─────────────────────────────────────────────────

app.post("/api/talks", talkLimiter, upload.single("photo"), async (req, res) => {
  try {
    const parsed = talkSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });

    console.log("POST /api/talks - Recibiendo propuesta...");
    const {
      title, abstract, speaker_name, speaker_bio,
      email, phone, social_media, technical_needs,
      preferred_date_1, preferred_date_2,
    } = req.body;

    let photoUrl = null;
    if (req.file) {
      console.log(`Procesando foto: ${req.file.size} bytes`);
      photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    const { rows } = await pool.query(
      `INSERT INTO talks (title, abstract, speaker_name, speaker_bio, speaker_photo_url, email, phone, social_media, technical_needs, preferred_date_1, preferred_date_2)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [
        title || "", abstract || "", speaker_name || "", speaker_bio || "", photoUrl,
        email || "", phone || "", social_media || null, technical_needs || null,
        preferred_date_1 || null, preferred_date_2 || null,
      ]
    );

    console.log(`Propuesta guardada con éxito. Folio: #${rows[0].id}`);

    sendConfirmationEmail({
      id: rows[0].id,
      title, abstract, speaker_name, speaker_bio,
      email, phone, social_media, technical_needs,
      preferred_date_1, preferred_date_2,
    }).catch((err) => console.error("Error al enviar email de confirmación:", err));

    res.json({ success: true, id: rows[0].id });
  } catch (err: any) {
    console.error("Error en POST /api/talks:", err);
    res.status(500).json({ error: "Failed to submit talk", details: err.message });
  }
});

// ── Charlas: creación ADMIN ───────────────────────────────────────────────────

app.post("/api/admin/talks", authenticateToken, async (req, res) => {
  try {
    const updates: Record<string, any> = {};
    for (const key of Object.keys(req.body)) {
      if (TALK_EDITABLE_FIELDS.includes(key)) updates[key] = req.body[key];
    }
    if (!updates.title || String(updates.title).trim() === "") {
      return res.status(400).json({ error: "El título es obligatorio" });
    }
    const keys = Object.keys(updates);
    const cols = keys.join(", ");
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const values = keys.map((k) => updates[k]);
    const { rows } = await pool.query(
      `INSERT INTO talks (${cols}) VALUES (${placeholders}) RETURNING id`,
      values
    );
    res.json({ id: rows[0].id, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create talk" });
  }
});

// ── Charlas: actualización / borrado ─────────────────────────────────────────

app.patch("/api/talks/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates: Record<string, any> = {};
    for (const key of Object.keys(req.body)) {
      if (TALK_EDITABLE_FIELDS.includes(key)) updates[key] = req.body[key];
    }
    const keys = Object.keys(updates);
    if (keys.length === 0) return res.status(400).json({ error: "No fields to update" });

    if (updates.status === "approved" && !updates.scheduled_date) {
      const { rows: existing } = await pool.query(
        "SELECT scheduled_date FROM talks WHERE id = $1",
        [id]
      );
      if (!existing[0]?.scheduled_date) {
        return res.status(400).json({
          error: "Para aprobar una charla debes incluir la fecha (scheduled_date)",
        });
      }
    }

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = [...keys.map((k) => updates[k]), id];
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
    await pool.query("DELETE FROM talks WHERE id = $1", [req.params.id]);
    res.json({ message: "Talk deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete talk" });
  }
});

app.post("/api/talks/:id/photos", authenticateToken, upload.array("photos", 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) return res.status(400).json({ error: "No photos uploaded" });
    const newPhotos = files.map((f) => `data:${f.mimetype};base64,${f.buffer.toString("base64")}`);
    const { rows } = await pool.query("SELECT event_photos FROM talks WHERE id = $1", [req.params.id]);
    let existing: string[] = [];
    try { if (rows[0]?.event_photos) existing = JSON.parse(rows[0].event_photos); } catch {}
    const all = [...existing, ...newPhotos];
    await pool.query("UPDATE talks SET event_photos = $1 WHERE id = $2", [JSON.stringify(all), req.params.id]);
    res.json({ message: "Photos uploaded successfully", photos: all });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload photos" });
  }
});

// ── Suscriptores / contactos (admin) ─────────────────────────────────────────

app.get("/api/subscribers", authenticateToken, async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM subscribers ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch subscribers" });
  }
});

app.get("/api/contacts", authenticateToken, async (_req, res) => {
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
      "INSERT INTO contacts (name, type, contact_person, phone, social_media, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
      [name, type || "", contact_person || "", phone || "", social_media || "", notes || ""]
    );
    res.json({ id: rows[0].id, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add contact" });
  }
});

// ── Promo / backup (admin) ────────────────────────────────────────────────────

app.post("/api/talks/:id/promo", authenticateToken, async (req, res) => {
  try {
    await pool.query("UPDATE talks SET promo_email_sent = 1 WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update promo status" });
  }
});

app.get("/api/admin/backup", authenticateToken, async (_req, res) => {
  try {
    const { rows: talks } = await pool.query("SELECT * FROM talks");
    const { rows: subscribers } = await pool.query("SELECT * FROM subscribers");
    const { rows: contacts } = await pool.query("SELECT * FROM contacts");
    res.json({ talks, subscribers, contacts, export_date: new Date() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate backup" });
  }
});

// ── Disponibilidad personalizada (admin) ──────────────────────────────────────

app.post("/api/admin/availability", authenticateToken, async (req, res) => {
  try {
    const { date, time, is_available, reason } = req.body;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Formato de fecha inválido. Usa YYYY-MM-DD" });
    }
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
    res.status(201).json({ success: true, availability: rows[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to create availability exception" });
  }
});

app.get("/api/admin/availability", authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || null;
    let query = "SELECT * FROM custom_availability ORDER BY date ASC, time ASC";
    if (limit) query += ` LIMIT ${limit}`;
    const { rows } = await pool.query(query);
    res.json({ availability: rows });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch availability exceptions" });
  }
});

app.delete("/api/admin/availability/:id", authenticateToken, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM custom_availability WHERE id = $1",
      [req.params.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "Excepción no encontrada" });
    }
    res.json({ success: true, message: "Excepción eliminada correctamente" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete availability exception" });
  }
});

// ── Fechas disponibles (formulario público) ───────────────────────────────────

app.get("/api/available-dates", async (_req, res) => {
  try {
    const { rows: scheduled } = await pool.query(
      "SELECT scheduled_date FROM talks WHERE status = 'scheduled' AND scheduled_date >= CURRENT_DATE"
    );

    const blockedDates = new Set<string>();
    scheduled.forEach((t: any) => {
      if (t.scheduled_date) {
        const d = new Date(t.scheduled_date);
        blockedDates.add(d.toISOString().split("T")[0]);
      }
    });

    const availableDates: { date: string; formatted: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limitDate = new Date(today);
    limitDate.setMonth(limitDate.getMonth() + 3);

    const cur = new Date(today);
    while (cur <= limitDate) {
      if (cur.getDay() === 3) {
        const dateStr = cur.toISOString().split("T")[0];
        if (!blockedDates.has(dateStr)) {
          const withTime = new Date(cur);
          withTime.setHours(19, 0, 0, 0);
          const formatted = new Intl.DateTimeFormat("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Mexico_City",
          }).format(withTime);
          availableDates.push({ date: dateStr + "T19:00:00", formatted });
        }
      }
      cur.setDate(cur.getDate() + 1);
    }

    res.json({ availableDates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed", availableDates: [] });
  }
});

export default app;
