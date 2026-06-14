import "./env";
import { Pool, types } from "pg";

// ─────────────────────────────────────────────────────────────────────────────
// Conexión a PostgreSQL (Supabase)
// ─────────────────────────────────────────────────────────────────────────────
//
// Pool único compartido por todo el backend. Tanto el entry point serverless
// (api/index.ts) como el dev server (server.ts) importan este módulo, por lo
// que existe una sola configuración de conexión y un solo esquema.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Fuerza a node-pg a devolver `timestamp without time zone` (OID 1114) como
// string crudo, evitando que la zona horaria local del servidor desplace las
// fechas. El frontend interpreta esos strings como hora de America/Mexico_City.
types.setTypeParser(1114, (str) => str);

// ─────────────────────────────────────────────────────────────────────────────
// Inicialización / migración idempotente del esquema
// ─────────────────────────────────────────────────────────────────────────────
//
// Crea las tablas si no existen y añade columnas nuevas con ADD COLUMN IF NOT
// EXISTS. Es seguro ejecutarla múltiples veces (cold start serverless o arranque
// del dev server). Esta es ahora la ÚNICA definición de esquema del proyecto.
export const initDb = async (): Promise<void> => {
  try {
    // 1) Tablas base
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

    // 2) Columnas extendidas de `talks` (superset de ambos backends).
    //    Incluye flyer_image_url, que server.ts nunca creaba.
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

    // 3) Índice de disponibilidad
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_custom_availability_date ON custom_availability(date);
    `);

    // 4) Sincroniza secuencias SERIAL de forma robusta (evita colisiones de id
    //    tras importaciones/seed manuales). Salta tablas sin columna `id` serial.
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

// Dispara la inicialización al cargar el módulo (fire-and-forget), replicando el
// comportamiento de cold start de producción. Como ambos entry points importan
// este módulo (vía app.ts), el esquema se inicializa idéntico en dev y prod.
void initDb();
