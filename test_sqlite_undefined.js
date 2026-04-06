import Database from "better-sqlite3";
const db = new Database("casapadi.db");
const stmt = db.prepare(`
  INSERT INTO talks (title, abstract, speaker_name, speaker_bio, speaker_photo_url, email, phone, social_media, technical_needs)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
try {
  stmt.run("title", "abstract", "speaker_name", "speaker_bio", null, "email", "phone", undefined, undefined);
} catch (e) {
  console.error(e);
}
