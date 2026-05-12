import express from "express";
import { Pool } from "pg";
import multer from "multer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { z } from "zod";

dotenv.config();

const app = express();

app.use(express.json({ limit: "50mb" }));

const JWT_SECRET = process.env.JWT_SECRET || "casapadi-super-secret-key-2026-xyz";

const authenticateToken = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) { res.status(401).json({ error: "Access denied" }); return; }
  jwt.verify(token, JWT_SECRET, (err) => {
    if (err) { res.status(403).json({ error: "Invalid token" }); return; }
    next();
  });
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Init schema on cold start
pool.query(`
  CREATE TABLE IF NOT EXISTS talks (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, abstract TEXT NOT NULL,
    speaker_name TEXT NOT NULL, speaker_bio TEXT NOT NULL,
    speaker_photo_url TEXT, email TEXT, phone TEXT, social_media TEXT,
    technical_needs TEXT, transmission_url TEXT, category TEXT DEFAULT 'General',
    promo_email_sent INTEGER DEFAULT 0, status TEXT DEFAULT 'pending',
    scheduled_date TIMESTAMP, summary TEXT, event_photos TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS subscribers (
    id SERIAL PRIMARY KEY, email TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS topic_suggestions (
    id SERIAL PRIMARY KEY, topic TEXT NOT NULL, description TEXT,
    category TEXT DEFAULT 'General', votes INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY, talk_id INTEGER REFERENCES talks(id) ON DELETE CASCADE,
    rating INTEGER, comment TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS checkins (
    id SERIAL PRIMARY KEY, user_email TEXT NOT NULL,
    talk_id INTEGER REFERENCES talks(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_email, talk_id)
  );
  CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, type TEXT, contact_person TEXT,
    phone TEXT, social_media TEXT, notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
    -- Sync sequences robustly
    DO $$ 
    DECLARE 
      r RECORD;
    BEGIN
      FOR r IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') LOOP
        BEGIN
          EXECUTE 'SELECT setval(pg_get_serial_sequence(''' || r.table_name || ''', ''id''), COALESCE(MAX(id), 0) + 1, false) FROM ' || r.table_name;
        EXCEPTION WHEN OTHERS THEN
          -- Skip tables without an 'id' serial column
        END;
      END LOOP;
    END $$;
  `).catch(console.error);

const upload = multer({ storage: multer.memoryStorage() });

const talkLimiter = rateLimit({ windowMs: 60*60*1000, max: 5, message: { error: "Demasiadas propuestas. Intenta en una hora." }});
const subscriberLimiter = rateLimit({ windowMs: 60*60*1000, max: 3, message: { error: "Demasiadas suscripciones." }});
const talkSchema = z.object({ title: z.string().min(5).max(200), abstract: z.string().min(10).max(2000), speaker_name: z.string().min(2).max(100), speaker_bio: z.string().min(10).max(1000), email: z.string().email(), phone: z.string().regex(/^\d{10}$/), _trap: z.string().max(0) });
const subscriberSchema = z.object({ email: z.string().email() });

// ── Routes ──────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD || "casapadi2024";
  if (username === adminUser && password === adminPass) {
    const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, error: "Credenciales incorrectas" });
  }
});

app.post("/api/subscribers", subscriberLimiter, async (req, res) => {
  try {
    const parsed = subscriberSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Email inválido" });
    await pool.query("INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING", [req.body.email]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to subscribe" }); }
});

app.get("/api/suggestions", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM topic_suggestions ORDER BY votes DESC, created_at DESC");
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed to fetch suggestions" }); }
});

app.post("/api/suggestions", async (req, res) => {
  try {
    const { topic, description, category } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO topic_suggestions (topic, description, category) VALUES ($1, $2, $3) RETURNING id",
      [topic, description || "", category || "General"]
    );
    res.json({ id: rows[0].id, success: true });
  } catch { res.status(500).json({ error: "Failed to add suggestion" }); }
});

app.post("/api/suggestions/:id/vote", async (req, res) => {
  try {
    await pool.query("UPDATE topic_suggestions SET votes = votes + 1 WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to vote" }); }
});

app.post("/api/talks/:id/feedback", async (req, res) => {
  try {
    const { rating, comment } = req.body;
    await pool.query("INSERT INTO feedback (talk_id, rating, comment) VALUES ($1, $2, $3)", [req.params.id, rating, comment || ""]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to submit feedback" }); }
});

app.get("/api/talks/:id/feedback", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM feedback WHERE talk_id = $1 ORDER BY created_at DESC", [req.params.id]);
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed to fetch feedback" }); }
});

app.post("/api/checkin", async (req, res) => {
  try {
    const { email, talk_id } = req.body;
    await pool.query("INSERT INTO checkins (user_email, talk_id) VALUES ($1, $2) ON CONFLICT (user_email, talk_id) DO NOTHING", [email, talk_id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to check in" }); }
});

app.get("/api/passport/:email", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, t.title, t.scheduled_date FROM checkins c JOIN talks t ON c.talk_id = t.id WHERE c.user_email = $1 ORDER BY c.created_at DESC`,
      [req.params.email]
    );
    res.json({ count: rows.length, checkins: rows });
  } catch { res.status(500).json({ error: "Failed to fetch passport" }); }
});

app.get("/api/speakers", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT speaker_name, speaker_bio, speaker_photo_url, COUNT(id) as talk_count FROM talks WHERE status IN ('completed','scheduled') GROUP BY speaker_name, speaker_bio, speaker_photo_url ORDER BY talk_count DESC`
    );
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed to fetch speakers" }); }
});

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
      // FIX: Mostrar solo charlas agendadas (scheduled) con fecha futura para la cartelera
      query = "SELECT * FROM talks WHERE status = 'scheduled' AND scheduled_date IS NOT NULL AND scheduled_date >= CURRENT_TIMESTAMP ORDER BY scheduled_date ASC";
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

app.post("/api/talks", talkLimiter, upload.single("photo"), async (req, res) => {
  try {
    const parsed = talkSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });
    console.log("POST /api/talks - Recibiendo propuesta...");
    const { title, abstract, speaker_name, speaker_bio, email, phone, social_media, technical_needs } = req.body;
    let photoUrl = null;
    if (req.file) {
      console.log(`Procesando foto: ${req.file.size} bytes`);
      photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }
    const { rows } = await pool.query(
      `INSERT INTO talks (title, abstract, speaker_name, speaker_bio, speaker_photo_url, email, phone, social_media, technical_needs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [title || "", abstract || "", speaker_name || "", speaker_bio || "", photoUrl, email || "", phone || "", social_media || null, technical_needs || null]
    );
    console.log(`Propuesta guardada con éxito. Folio: #${rows[0].id}`);
    res.status(201).json({ id: rows[0].id, message: "Talk submitted successfully" });
  } catch (err) { 
    console.error("Error en POST /api/talks:", err); 
    res.status(500).json({ error: "Failed to submit talk" }); 
  }
});

app.patch("/api/talks/:id", authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    const keys = Object.keys(updates);
    if (keys.length === 0) return res.status(400).json({ error: "No fields to update" });
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = [...keys.map(k => updates[k]), req.params.id];
    await pool.query(`UPDATE talks SET ${setClause} WHERE id = $${values.length}`, values);
    res.json({ message: "Talk updated successfully" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update talk" }); }
});

app.delete("/api/talks/:id", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM talks WHERE id = $1", [req.params.id]);
    res.json({ message: "Talk deleted successfully" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to delete talk" }); }
});

app.post("/api/talks/:id/photos", authenticateToken, upload.array("photos", 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) return res.status(400).json({ error: "No photos uploaded" });
    const newPhotos = files.map(f => `data:${f.mimetype};base64,${f.buffer.toString("base64")}`);
    const { rows } = await pool.query("SELECT event_photos FROM talks WHERE id = $1", [req.params.id]);
    let existing: string[] = [];
    try { if (rows[0]?.event_photos) existing = JSON.parse(rows[0].event_photos); } catch {}
    const all = [...existing, ...newPhotos];
    await pool.query("UPDATE talks SET event_photos = $1 WHERE id = $2", [JSON.stringify(all), req.params.id]);
    res.json({ message: "Photos uploaded successfully", photos: all });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to upload photos" }); }
});

app.get("/api/subscribers", authenticateToken, async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM subscribers ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch subscribers" }); }
});

app.get("/api/contacts", authenticateToken, async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM contacts ORDER BY name ASC");
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch contacts" }); }
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
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to add contact" }); }
});

app.post("/api/talks/:id/promo", authenticateToken, async (req, res) => {
  try {
    await pool.query("UPDATE talks SET promo_email_sent = 1 WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update promo status" }); }
});

app.get("/api/admin/backup", authenticateToken, async (_req, res) => {
  try {
    const { rows: talks } = await pool.query("SELECT * FROM talks");
    const { rows: subscribers } = await pool.query("SELECT * FROM subscribers");
    const { rows: contacts } = await pool.query("SELECT * FROM contacts");
    res.json({ talks, subscribers, contacts, export_date: new Date() });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to generate backup" }); }
});

// Endpoint para fechas disponibles (formulario público)

// Endpoint para fechas disponibles (formulario público)
app.get("/api/available-dates", async (_req, res) => {
  try {
    // Obtener charlas ya agendadas
    const { rows: scheduled } = await pool.query(
      "SELECT scheduled_date FROM talks WHERE status = 'scheduled' AND scheduled_date >= CURRENT_DATE"
    );

    const blockedDates = new Set<string>();

    // Marcar fechas ocupadas
    scheduled.forEach((t: any) => {
      if (t.scheduled_date) {
        const dateStr = new Date(t.scheduled_date).toISOString().split('T')[0];
        blockedDates.add(dateStr);
      }
    });

    // Generar miércoles de próximos 3 meses EN TIMEZONE MÉXICO
    const availableDates: { date: string; formatted: string }[] = [];
    
    const today = new Date(); // Fecha actual del servidor
    const threeMonthsLater = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    let currentDate = new Date(today);
    
    while (currentDate <= threeMonthsLater) {
      // Obtener fecha en México
      const mxDateString = currentDate.toLocaleString('en-US', { timeZone: 'America/Mexico_City' });
      const mxDateObj = new Date(mxDateString);
      const dayOfWeekMX = mxDateObj.getDay();
      
      // Solo miércoles (3) y no ocupados
      if (dayOfWeekMX === 3) {
        const yyyy = mxDateObj.getFullYear();
        const mm = String(mxDateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(mxDateObj.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        if (!blockedDates.has(dateStr)) {
          // Fecha a las 19:00 (7 PM) hora México
          const dateWithTime = dateStr + 'T19:00:00';
          
          const formatted = new Intl.DateTimeFormat('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC'
          }).format(new Date(dateStr + 'T00:00:00Z')) + ', 7:00 p. m.';
          
          availableDates.push({ date: dateWithTime, formatted });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ availableDates });
  } catch (err) {
    console.error("Error in /api/available-dates:", err);
    res.status(500).json({ error: "Failed to fetch available dates", availableDates: [] });
  }
});

export default app;
