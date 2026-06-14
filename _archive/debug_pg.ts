import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  try {
    await pool.query("SELECT * FROM talks");
    console.log("OK!");
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    process.exit();
  }
}
check();
