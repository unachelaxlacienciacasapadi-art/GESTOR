import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 3000;

app.use(express.json());

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

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use("/uploads", express.static(uploadsDir));

// Setup SQLite database
const db = new Database("casapadi.db");

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS talks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    abstract TEXT NOT NULL,
    speaker_name TEXT NOT NULL,
    speaker_bio TEXT NOT NULL,
    speaker_photo_url TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, scheduled, completed
    scheduled_date TEXT,
    summary TEXT,
    event_photos TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS topic_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    description TEXT,
    votes INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    talk_id INTEGER,
    rating INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(talk_id) REFERENCES talks(id)
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    talk_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_email, talk_id),
    FOREIGN KEY(talk_id) REFERENCES talks(id)
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT,
    contact_person TEXT,
    phone TEXT,
    social_media TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

try { db.exec("ALTER TABLE talks ADD COLUMN email TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE talks ADD COLUMN phone TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE talks ADD COLUMN social_media TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE talks ADD COLUMN technical_needs TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE talks ADD COLUMN transmission_url TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE talks ADD COLUMN category TEXT DEFAULT 'General';"); } catch (e) {}
try { db.exec("ALTER TABLE topic_suggestions ADD COLUMN category TEXT DEFAULT 'General';"); } catch (e) {}
try { db.exec("ALTER TABLE talks ADD COLUMN promo_email_sent INTEGER DEFAULT 0;"); } catch (e) {}

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

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
app.post("/api/subscribers", (req, res) => {
  try {
    const { email } = req.body;
    const stmt = db.prepare("INSERT OR IGNORE INTO subscribers (email) VALUES (?)");
    stmt.run(email);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

app.get("/api/suggestions", (req, res) => {
  try {
    const suggestions = db.prepare("SELECT * FROM topic_suggestions ORDER BY votes DESC, created_at DESC").all();
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

app.post("/api/suggestions", (req, res) => {
  try {
    const { topic, description, category } = req.body;
    const stmt = db.prepare("INSERT INTO topic_suggestions (topic, description, category) VALUES (?, ?, ?)");
    const info = stmt.run(topic, description || "", category || "General");
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to add suggestion" });
  }
});

app.post("/api/suggestions/:id/vote", (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare("UPDATE topic_suggestions SET votes = votes + 1 WHERE id = ?");
    stmt.run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to vote" });
  }
});

app.post("/api/talks/:id/feedback", (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const stmt = db.prepare("INSERT INTO feedback (talk_id, rating, comment) VALUES (?, ?, ?)");
    stmt.run(id, rating, comment || "");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

app.get("/api/talks/:id/feedback", (req, res) => {
  try {
    const { id } = req.params;
    const feedback = db.prepare("SELECT * FROM feedback WHERE talk_id = ? ORDER BY created_at DESC").all();
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

app.post("/api/checkin", (req, res) => {
  try {
    const { email, talk_id } = req.body;
    const stmt = db.prepare("INSERT OR IGNORE INTO checkins (user_email, talk_id) VALUES (?, ?)");
    stmt.run(email, talk_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to check in" });
  }
});

app.get("/api/passport/:email", (req, res) => {
  try {
    const { email } = req.params;
    const checkins = db.prepare(`
      SELECT c.*, t.title, t.scheduled_date 
      FROM checkins c 
      JOIN talks t ON c.talk_id = t.id 
      WHERE c.user_email = ? 
      ORDER BY c.created_at DESC
    `).all();
    res.json({ count: checkins.length, checkins });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch passport" });
  }
});

app.get("/api/speakers", (req, res) => {
  try {
    const speakers = db.prepare(`
      SELECT speaker_name, speaker_bio, speaker_photo_url, COUNT(id) as talk_count 
      FROM talks 
      WHERE status IN ('completed', 'scheduled')
      GROUP BY speaker_name 
      ORDER BY talk_count DESC
    `).all();
    res.json(speakers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch speakers" });
  }
});

app.get("/api/talks", (req, res) => {
  try {
    const talks = db.prepare("SELECT * FROM talks ORDER BY created_at DESC").all();
    res.json(talks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch talks" });
  }
});

app.post("/api/talks", upload.single("photo"), (req, res) => {
  try {
    const { title, abstract, speaker_name, speaker_bio, email, phone, social_media, technical_needs } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const stmt = db.prepare(`
      INSERT INTO talks (title, abstract, speaker_name, speaker_bio, speaker_photo_url, email, phone, social_media, technical_needs)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      title || "", 
      abstract || "", 
      speaker_name || "", 
      speaker_bio || "", 
      photoUrl, 
      email || "", 
      phone || "", 
      social_media || null, 
      technical_needs || null
    );

    res.status(201).json({ id: info.lastInsertRowid, message: "Talk submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit talk" });
  }
});

app.patch("/api/talks/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const keys = Object.keys(updates);
    if (keys.length === 0) return res.status(400).json({ error: "No fields to update" });
    
    const setClause = keys.map(k => `${k} = ?`).join(", ");
    const values = keys.map(k => updates[k]);
    
    const stmt = db.prepare(`UPDATE talks SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);
    
    res.json({ message: "Talk updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update talk" });
  }
});

app.delete("/api/talks/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare("DELETE FROM talks WHERE id = ?");
    stmt.run(id);
    res.json({ message: "Talk deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete talk" });
  }
});

app.post("/api/talks/:id/photos", authenticateToken, upload.array("photos", 10), (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No photos uploaded" });
    }

    const photoUrls = files.map(file => `/uploads/${file.filename}`);
    
    // Get existing photos
    const talk = db.prepare("SELECT event_photos FROM talks WHERE id = ?").get(id) as { event_photos: string | null };
    let existingPhotos: string[] = [];
    if (talk && talk.event_photos) {
      try {
        existingPhotos = JSON.parse(talk.event_photos);
      } catch (e) {}
    }

    const allPhotos = [...existingPhotos, ...photoUrls];
    
    const stmt = db.prepare("UPDATE talks SET event_photos = ? WHERE id = ?");
    stmt.run(JSON.stringify(allPhotos), id);

    res.json({ message: "Photos uploaded successfully", photos: allPhotos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload photos" });
  }
});

app.get("/api/subscribers", authenticateToken, (req, res) => {
  try {
    const subscribers = db.prepare("SELECT * FROM subscribers ORDER BY created_at DESC").all();
    res.json(subscribers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch subscribers" });
  }
});

app.get("/api/contacts", authenticateToken, (req, res) => {
  try {
    const contacts = db.prepare("SELECT * FROM contacts ORDER BY name ASC").all();
    res.json(contacts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

app.post("/api/contacts", authenticateToken, (req, res) => {
  try {
    const { name, type, contact_person, phone, social_media, notes } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const stmt = db.prepare("INSERT INTO contacts (name, type, contact_person, phone, social_media, notes) VALUES (?, ?, ?, ?, ?, ?)");
    const info = stmt.run(name, type || "", contact_person || "", phone || "", social_media || "", notes || "");
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add contact" });
  }
});

app.post("/api/talks/:id/promo", authenticateToken, (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare("UPDATE talks SET promo_email_sent = 1 WHERE id = ?");
    stmt.run(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update promo status" });
  }
});

app.get("/api/admin/backup", authenticateToken, (req, res) => {
  try {
    const dbPath = path.join(process.cwd(), "casapadi.db");
    res.download(dbPath, `respaldo_casapadi_${Date.now()}.sqlite`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate backup" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
