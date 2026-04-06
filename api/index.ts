import express from "express";
import { Pool } from "pg";
import multer from "multer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

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
`).catch(console.error);

const upload = multer({ storage: multer.memoryStorage() });

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

app.post("/api/subscribers", async (req, res) => {
  try {
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

app.get("/api/talks", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM talks ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch talks" }); }
});

app.post("/api/talks", upload.single("photo"), async (req, res) => {
  try {
    const { title, abstract, speaker_name, speaker_bio, email, phone, social_media, technical_needs } = req.body;
    let photoUrl = null;
    if (req.file) {
      photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }
    const { rows } = await pool.query(
      `INSERT INTO talks (title, abstract, speaker_name, speaker_bio, speaker_photo_url, email, phone, social_media, technical_needs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [title || "", abstract || "", speaker_name || "", speaker_bio || "", photoUrl, email || "", phone || "", social_media || null, technical_needs || null]
    );
    res.status(201).json({ id: rows[0].id, message: "Talk submitted successfully" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to submit talk" }); }
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

export default app;
