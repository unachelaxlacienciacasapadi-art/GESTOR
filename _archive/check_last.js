import Database from "better-sqlite3";
const db = new Database("casapadi.db");
console.log(db.prepare("SELECT * FROM talks ORDER BY id DESC LIMIT 1").get());
