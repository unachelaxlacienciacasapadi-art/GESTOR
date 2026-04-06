import SQLiteDatabase from "better-sqlite3";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const sqliteDB = new SQLiteDatabase("casapadi.db");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  console.log("Iniciando conexión y creación de esquema...");
  
  try {
    // Create schema
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
    `);
    console.log("Esquema creado o verificado.");
  } catch (e: any) {
    console.error("ERROR AL CREAR ESQUEMA:", e.message);
    process.exit(1);
  }

  console.log("Migrando Talks...");
  const talks = sqliteDB.prepare("SELECT * FROM talks").all() as any[];
  for (const t of talks) {
    try {
      await pool.query(
        `INSERT INTO talks (id, title, abstract, speaker_name, speaker_bio, speaker_photo_url, email, phone, social_media, technical_needs, transmission_url, category, promo_email_sent, status, scheduled_date, summary, event_photos, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
         ON CONFLICT (id) DO NOTHING`,
        [t.id, t.title, t.abstract, t.speaker_name, t.speaker_bio, t.speaker_photo_url, t.email, t.phone, t.social_media, t.technical_needs, t.transmission_url, t.category, t.promo_email_sent, t.status, t.scheduled_date, t.summary, t.event_photos, t.created_at]
      );
    } catch(e) { console.error("Error migrating talk ID " + t.id, e); }
  }

  console.log("Migrando Contactos...");
  const contacts = sqliteDB.prepare("SELECT * FROM contacts").all() as any[];
  for (const c of contacts) {
    try {
      await pool.query(`INSERT INTO contacts (id, name, type, contact_person, phone, social_media, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`, [c.id, c.name, c.type, c.contact_person, c.phone, c.social_media, c.notes, c.created_at]);
    } catch(e) {}
  }

  console.log("Migración completada exitosamente!");
  process.exit();
}
run();
