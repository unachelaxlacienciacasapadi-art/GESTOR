import Database from "better-sqlite3";

const db = new Database("casapadi.db");

const talks = [
  {
    title: "Representación corporal en la era digital: el fenómeno de las influencers plus size",
    abstract: "4 de marzo Día Mundial de la obesidad",
    speaker_name: "Thania Valdivia Guzmán/ Dra. Sandra Flores Guevara",
    speaker_bio: "Doctorado Ciencias Sociales UAEH",
    status: "completed",
    scheduled_date: "2026-03-11T19:00:00.000Z",
    email: "va137622@uaeh.edu.mx",
    phone: "771 130 14 32",
    category: "General"
  },
  {
    title: "De la Nahuala al Suzume japonés. Una reflexión cinematográfica",
    abstract: "20 de marzo Día de la tradición oral",
    speaker_name: "Fernanda Ezenice Peralta Canseco/ Dr. Manuel Jesús González Manrique",
    speaker_bio: "Doctorado Ciencias Sociales UAEH",
    status: "completed",
    scheduled_date: "2026-03-25T19:00:00.000Z",
    email: "ezenicepeca@gmail.com",
    phone: "771 105 49 68",
    category: "General"
  },
  {
    title: "Cervecería DosAves",
    abstract: "Cervecería DosAves",
    speaker_name: "Santiago",
    speaker_bio: "Cervecería DosAves",
    status: "scheduled",
    scheduled_date: "2026-04-08T19:00:00.000Z",
    phone: "7717951475",
    category: "General"
  },
  {
    title: "Cuidadanía de niñas y niños, y los barrios tradicionales de Pachuca: La Raza y El Arbolito",
    abstract: "25 de abril Día internacional de la lucha contra el maltrato infantil",
    speaker_name: "Karina Pizarro Hernández / Dra. Rosa Elena Durán González",
    speaker_bio: "Doctorado Ciencias Sociales UAEH",
    status: "scheduled",
    scheduled_date: "2026-04-22T19:00:00.000Z",
    email: "oc263226@uaeh.edu.mx",
    phone: "772 107 94 69",
    category: "General"
  },
  {
    title: "La huella dactilar del universo ¿Cómo sabemos de qué están hechas las estrellas?",
    abstract: "La huella dactilar del universo",
    speaker_name: "Dr Fernando Donado Pérez",
    speaker_bio: "Física y Matemáticas ICBI UAEH",
    status: "scheduled",
    scheduled_date: "2026-05-06T19:00:00.000Z",
    phone: "7711604038",
    category: "Física"
  },
  {
    title: "Las dueñas del balón: mujeres en la industria del futbol",
    abstract: "25 de mayo Día Mundial del Fútbol",
    speaker_name: "Beatriz Méndez de Dios / Dra. Azul Kikey Castelli Olvera",
    speaker_bio: "Doctorado Ciencias Sociales UAEH",
    status: "scheduled",
    scheduled_date: "2026-05-20T19:00:00.000Z",
    email: "me216362@uaeh.edu.mx",
    phone: "434 143 90 79",
    category: "General"
  },
  {
    title: "Hijes trans. Familias que eligen y familias elegidas",
    abstract: "25 de junio Día mundial de la diversidad sexual, 28 de junio Día internacional del orgullo LGBT+",
    speaker_name: "Leticia Bárcena Díaz/ Dra. Karina Pizarro Hernández",
    speaker_bio: "Doctorado Ciencias Sociales UAEH",
    status: "scheduled",
    scheduled_date: "2026-06-17T19:00:00.000Z",
    email: "leticia_barcena149@uaeh.edu.mx",
    phone: "771 360 01 57",
    category: "General"
  },
  {
    title: "Análisis nacional del sistema penitenciario",
    abstract: "18 de julio Día del personal penitenciario",
    speaker_name: "Brenda Soto Martínez/ Dr. Joaquín García Hernández",
    speaker_bio: "Doctorado Ciencias Sociales UAEH",
    status: "scheduled",
    scheduled_date: "2026-07-29T19:00:00.000Z",
    email: "brendasotomtz@gmail.com",
    phone: "771 404 18 62",
    category: "General"
  },
  {
    title: "Miradas en tensión: entre reconocer y abolir el trabajo infantil",
    abstract: "9 de agosto Día Internacional de los Pueblos Indígenas",
    speaker_name: "Leslie Abigail Fierro Sánchez / Dra. María Valeria Judith Montoya García",
    speaker_bio: "Doctorado Ciencias Sociales UAEH",
    status: "scheduled",
    scheduled_date: "2026-08-12T19:00:00.000Z",
    email: "abbafs2010@gmail.com",
    phone: "771 722 66 30",
    category: "General"
  },
  {
    title: "Relaciones de cuidado en las experiencias de maternidad en una comunidad totonaca, tutunakú",
    abstract: "2 de septiembre Día Internacional de la crianza respetuosa",
    speaker_name: "Karen Jeanette Reyes Badillo / Dra. Leyla Chávez Arteaga y Dra. Silvia Mendoza Mendoza",
    speaker_bio: "Doctorado Ciencias Sociales UAEH",
    status: "scheduled",
    scheduled_date: "2026-09-09T19:00:00.000Z",
    email: "re232582@uaeh.edu.mx",
    phone: "771 100 24 74",
    category: "General"
  },
  {
    title: "Educar desde la raíz. El rol del mediador comunitario",
    abstract: "11 septiembre Dìas de los Educadores Comunitarios",
    speaker_name: "Magali Ortiz Bravo / Dr. Sergio Sánchez Vázquez",
    speaker_bio: "Doctorado Ciencias Sociales UAEH",
    status: "scheduled",
    scheduled_date: "2026-09-23T19:00:00.000Z",
    email: "magaliortizbravo@hotmail.com",
    phone: "775 107 13 21",
    category: "General"
  },
  {
    title: "Hablar de la muerte: abrir camino a una nueva sensibilidad escolar",
    abstract: "2 de octubre Día del luto",
    speaker_name: "Ruth Patricia Ávila Vázquez / Dra. Celia Mercedes Alanís Rufino",
    speaker_bio: "Doctorado Ciencias Sociales UAEH",
    status: "scheduled",
    scheduled_date: "2026-10-07T19:00:00.000Z",
    email: "va227373@uaeh.edu.mx",
    phone: "771 185 94 39",
    category: "General"
  },
  {
    title: "Zacahuil, patrimonio gastronómico y Biocultural de Hidalgo",
    abstract: "Zacahuil, patrimonio gastronómico y Biocultural de Hidalgo",
    speaker_name: "Dra Carmen López Ramirez",
    speaker_bio: "Centro de Investigaciones Biológicas UAEH",
    status: "scheduled",
    scheduled_date: "2026-10-21T19:00:00.000Z",
    phone: "771 240 5718",
    category: "General"
  },
  {
    title: "Etnografía feminista con mujeres emprendedoras y comerciantes mediante internet",
    abstract: "19 de noviembre Día internacional de la mujer emprendedora",
    speaker_name: "María del Carmen García Contreras / Dra. Araceli Jiménez Pelcastre",
    speaker_bio: "Doctorado Ciencias Sociales UAEH",
    status: "scheduled",
    scheduled_date: "2026-11-18T19:00:00.000Z",
    email: "mariadelcarmen_garcia@uaeh.edu.mx",
    phone: "775 110 48 59",
    category: "General"
  },
  {
    title: "Comités de Contraloría Social, una herramienta para combatir la corrupción",
    abstract: "9 de diciembre Día internacional contra la corrupción",
    speaker_name: "Elia Tejeda Salinas/ Dra. Talina Merit Olvera Mejía",
    speaker_bio: "Doctorado Ciencias Sociales UAEH",
    status: "scheduled",
    scheduled_date: "2026-12-02T19:00:00.000Z",
    email: "elia_tesa@yahoo.com.mx",
    phone: "771 139 80 41",
    category: "General"
  },
  {
    title: "Voces que cruzan fronteras, conocimientos que perduran: mujeres hidalguenses en movilidad",
    abstract: "Voces que cruzan fronteras",
    speaker_name: "Alicia de Lourdes Melgarejo Ávila / Dra. Laura Myriam Franco Sánchez",
    speaker_bio: "Doctorado Ciencias Sociales UAEH",
    status: "scheduled",
    scheduled_date: "2026-12-16T19:00:00.000Z",
    category: "General"
  }
];

const contacts = [
  { name: "Dars Mental suplies", type: "Visuales, instalaciones, diseño 3D", contact: "Muricio", phone: "7711514711" },
  { name: "Los famosos artistas", type: "Multi", contact: "Jordan Zepol", phone: "7731131470" },
  { name: "Colectivo tres sesenta", type: "Teatro", contact: "María", phone: "7716995299", notes: "Teatro para no videntes" },
  { name: "Tatiana Tiburcio", type: "Teatro, cantante, multi", contact: "Tatiana Tiburcio", phone: "7711260548", notes: "Puesta en escena teatro infantil" },
  { name: "Autómata", type: "Audiovisual", contact: "Oliver", phone: "7713401320" },
  { name: "Semillero de artes vivas", type: "Multi", contact: "Yakin", notes: "Instalaciones, performance, expos" },
  { name: "Paco Rubin", type: "Poesía", contact: "Paco Rubin", social: "https://www.instagram.com/paco_rubin?igsh=MXhhZGFrM2dubHAxag==", notes: "Juegos de palabra" },
  { name: "PITAYA", type: "Poesía", notes: "Slam de poesía, open mic, talleres" },
  { name: "Jerry", type: "Pintura Escultura", contact: "Gerardo Alcántara", notes: "Escultura en vivo" },
  { name: "Sophi Bloom", type: "Acuarela Encuadernado", contact: "Sofía", social: "https://www.instagram.com/_sophibloom?igsh=MTRsaGNsbWJhYzl4OQ", notes: "Expo acuarela" }
];

const insertTalk = db.prepare("INSERT INTO talks (title, abstract, speaker_name, speaker_bio, status, scheduled_date, email, phone, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

for (const talk of talks) {
  insertTalk.run(talk.title, talk.abstract, talk.speaker_name, talk.speaker_bio, talk.status, talk.scheduled_date, talk.email || null, talk.phone || null, talk.category);
}

db.exec(`
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

const insertContact = db.prepare("INSERT INTO contacts (name, type, contact_person, phone, social_media, notes) VALUES (?, ?, ?, ?, ?, ?)");

for (const contact of contacts) {
  insertContact.run(contact.name, contact.type || null, contact.contact || null, contact.phone || null, contact.social || null, contact.notes || null);
}

console.log("Data inserted successfully.");
