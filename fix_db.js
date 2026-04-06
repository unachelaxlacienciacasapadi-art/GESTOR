import Database from "better-sqlite3";
const db = new Database("casapadi.db");

// Rename blank slots for clarity
db.prepare("UPDATE talks SET title = 'Espacio Disponible' WHERE title = 'Evento por definir'").run();

// Fix the title for ID 1
db.prepare("UPDATE talks SET title = 'Charla: Thania Valdivia Guzmán' WHERE id = 1").run();
db.prepare("UPDATE talks SET title = 'Tema de Diversidad Sexual' WHERE title = 'Tema de Diversidad Sexual (Por definir)'").run();
db.prepare("UPDATE talks SET title = 'Investigación sobre emprendimiento' WHERE title = 'Investigación sobre emprendimiento (Por definir)'").run();

// Reset erroneous completed statuses for blank slots
db.prepare("UPDATE talks SET status = 'scheduled' WHERE status = 'completed' AND title = 'Espacio Disponible'").run();

console.log("DB fixes applied.");
