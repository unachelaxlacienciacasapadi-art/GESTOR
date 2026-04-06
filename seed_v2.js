import Database from "better-sqlite3";
const db = new Database("casapadi.db");

console.log("Inserting contacts...");
const contacts = [
  { name: "Dars Mental suplies, Los famosos artistas, Colectivo tres sesenta", type: "Visuales, instalaciones, diseño 3D y Multi", contact_person: "", phone: "", social_media: "", notes: "" },
  { name: "Muricio, Jordan Zepol y María", type: "Teatro", contact_person: "", phone: "7711514711, 7731131470 y 7716995299", social_media: "", notes: "Teatro para no videntes" },
  { name: "Tatiana Tiburcio", type: "Teatro, cantante y multi", contact_person: "", phone: "7711260548", social_media: "", notes: "Puesta en escena teatro infantil" },
  { name: "Autómata (Oliver)", type: "Audiovisual", contact_person: "", phone: "7713401320", social_media: "", notes: "" },
  { name: "Semillero de artes vivas (Yakin)", type: "Multi", contact_person: "", phone: "", social_media: "", notes: "Instalaciones, performance, expos" },
  { name: "Paco Rubin", type: "Poesía", contact_person: "", phone: "", social_media: "Instagram", notes: "Juegos de palabra" },
  { name: "PITAYA", type: "Poesía", contact_person: "", phone: "", social_media: "", notes: "Slam de poesía, open mic, talleres" },
  { name: "Jerry (Gerardo Alcántara)", type: "Pintura y Escultura", contact_person: "", phone: "", social_media: "", notes: "Escultura en vivo" },
  { name: "Sophi Bloom (Sofía)", type: "Acuarela y Encuadernado", contact_person: "", phone: "", social_media: "Instagram", notes: "Expo acuarela" }
];

const insertContact = db.prepare("INSERT INTO contacts (name, type, contact_person, phone, social_media, notes) VALUES (?, ?, ?, ?, ?, ?)");
for (const c of contacts) {
  insertContact.run(c.name, c.type, c.contact_person, c.phone, c.social_media, c.notes);
}

console.log("Inserting talks...");
const talks = [
  { title: "Evento en Casa Pädi", abstract: "Agendado", speaker_name: "Thania Valdivia Guzmán", speaker_bio: "Investigadora", scheduled_date: "2026-02-11 18:00", status: "scheduled", email: "va137622@uaeh.edu.mx", phone: "771 130 14 32", category: "General" },
  { title: "Evento por definir", abstract: "Fecha agendada", speaker_name: "Por Confirmar", speaker_bio: "", scheduled_date: "2026-02-25 18:00", status: "scheduled", email: "", phone: "", category: "General" },
  { title: "Representación corporal en la era digital: el fenómeno de las influencers plus size", abstract: "Se enmarca en el 4 de marzo, Día Mundial de la obesidad.", speaker_name: "Thania Valdivia Guzmán y Dra. Sandra Flores Guevara", speaker_bio: "Doctorado Ciencias Sociales UAEH", scheduled_date: "2026-03-11 18:00", status: "scheduled", email: "", phone: "", category: "Salud Digital" },
  { title: "De la Nahuala al Suzume japonés. Una reflexión cinematográfica", abstract: "Se enmarca en el 20 de marzo, Día de la tradición oral.", speaker_name: "Fernanda Ezenice Peralta Canseco y Dr. Manuel Jesús González Manrique", speaker_bio: "Doctorado Ciencias Sociales UAEH", scheduled_date: "2026-03-25 18:00", status: "scheduled", email: "ezenicepeca@gmail.com", phone: "771 105 49 68", category: "Arte y Cine" },
  { title: "Evento de Cervecería", abstract: "Institución: Cervecería DosAves", speaker_name: "Santiago", speaker_bio: "Cervecería DosAves", scheduled_date: "2026-04-08 18:00", status: "scheduled", email: "", phone: "7717951475", category: "Cultura" },
  { title: "Cuidadanía de niñas y niños, y los barrios tradicionales de Pachuca: La Raza y El Arbolito", abstract: "Se enmarca en el 25 de abril, Día internacional contra el maltrato infantil.", speaker_name: "Karina Pizarro Hernández y Dra. Rosa Elena Durán González", speaker_bio: "Doctorado Ciencias Sociales UAEH", scheduled_date: "2026-04-22 18:00", status: "scheduled", email: "oc263226@uaeh.edu.mx", phone: "772 107 94 69", category: "Sociedad" },
  { title: "La huella dactilar del universo", abstract: "Física y Matemáticas IC", speaker_name: "Dr. Fernando Donado Pérez", speaker_bio: "Investigador", scheduled_date: "2026-05-06 18:00", status: "scheduled", email: "", phone: "", category: "Física" },
  { title: "Las dueñas del balón: mujeres en la industria del futbol", abstract: "Se enmarca en el 25 de mayo, Día Mundial del Fútbol.", speaker_name: "Beatriz Méndez de Dios y Dra. Azul Kikey Castelli Olvera", speaker_bio: "Doctorado Ciencias Sociales UAEH", scheduled_date: "2026-05-20 18:00", status: "scheduled", email: "me216362@uaeh.edu.mx", phone: "7711604038", category: "Deportes y Género" },
  { title: "Tema de Diversidad Sexual (Por definir)", abstract: "Relacionado con el 25 de junio (Día mundial de la diversidad sexual) y 28 de junio.", speaker_name: "Leticia Bárcena Diaz", speaker_bio: "Investigadora", scheduled_date: "2026-06-03 18:00", status: "scheduled", email: "leticia_barcena149@uaeh.edu.mx", phone: "771 360 01 57", category: "Sociedad" },
  { title: "Hijes trans. Familias que eligen y familias elegidas", abstract: "Mes del orgullo LGBT+", speaker_name: "Leticia Bárcena Díaz y Dra. Karina Pizarro Hernández", speaker_bio: "Doctorado Ciencias Sociales UAEH", scheduled_date: "2026-06-17 18:00", status: "scheduled", email: "", phone: "", category: "Sociedad" },
  { title: "Evento por definir", abstract: "Fecha agendada", speaker_name: "Por Confirmar", speaker_bio: "", scheduled_date: "2026-07-01 18:00", status: "scheduled", email: "", phone: "", category: "General" },
  { title: "Evento por definir", abstract: "Fecha agendada", speaker_name: "Por Confirmar", speaker_bio: "", scheduled_date: "2026-07-15 18:00", status: "scheduled", email: "", phone: "", category: "General" },
  { title: "Análisis del sistema penitenciario nacional", abstract: "Se enmarca en el 18 de julio, Día del personal penitenciario.", speaker_name: "Brenda Soto Martínez y Dr. Joaquín García Hernández", speaker_bio: "Doctorado Ciencias Sociales UAEH", scheduled_date: "2026-07-29 18:00", status: "scheduled", email: "brendasotomtz@gmail.com", phone: "771 404 18 62", category: "Sociedad" },
  { title: "Miradas en tensión: entre reconocer y abolir el trabajo infantil", abstract: "Se enmarca en el 9 de agosto, Día Internacional de los Pueblos Indígenas", speaker_name: "Leslie Abigail Fierro Sánchez y Dra. María Valeria Judith Montoya García", speaker_bio: "Doctorado Ciencias Sociales UAEH", scheduled_date: "2026-08-12 18:00", status: "scheduled", email: "abbafs2010@gmail.com", phone: "771 722 66 30", category: "Sociedad" },
  { title: "Evento por definir", abstract: "Fecha agendada", speaker_name: "Por Confirmar", speaker_bio: "", scheduled_date: "2026-08-26 18:00", status: "scheduled", email: "", phone: "", category: "General" },
  { title: "Relaciones de cuidado en las experiencias de maternidad en una comunidad totonaca, tutunakú", abstract: "Se enmarca en el 2 de septiembre, Día Internacional de la crianza respetuosa", speaker_name: "Karen Jeanette Reyes Badillo, Dra. Leyla Chávez Arteaga y Dra. Silvia Mendoza Mendoza", speaker_bio: "Doctorado Ciencias Sociales UAEH", scheduled_date: "2026-09-09 18:00", status: "scheduled", email: "re232582@uaeh.edu.mx", phone: "771 100 24 74", category: "Comunidad" },
  { title: "Educar desde la raíz. El rol del mediador comunitario", abstract: "Se enmarca en el 11 septiembre, Día de los Educadores Comunitarios", speaker_name: "Magali Ortiz Bravo y Dr. Sergio Sánchez Vázquez", speaker_bio: "Doctorado Ciencias Sociales UAEH", scheduled_date: "2026-09-23 18:00", status: "scheduled", email: "magaliortizbravo@hotmail.com", phone: "775 107 13 21", category: "Educación" },
  { title: "Hablar de la muerte: abrir camino a una nueva sensibilidad escolar", abstract: "Se enmarca en el 2 de octubre, Día del luto", speaker_name: "Ruth Patricia Ávila Vázquez y Dra. Celia Mercedes Alanís Rufino", speaker_bio: "Doctorado Ciencias Sociales UAEH", scheduled_date: "2026-10-07 18:00", status: "scheduled", email: "va227373@uaeh.edu.mx", phone: "771 185 94 39", category: "Educación" },
  { title: "Zacahuil, patrimonio gastronómico", abstract: "Centro de Investigacion", speaker_name: "Dra. Carmen López Ramirez", speaker_bio: "Investigadora", scheduled_date: "2026-10-21 18:00", status: "scheduled", email: "", phone: "771 240 5718", category: "Gastronomía" },
  { title: "Investigación sobre emprendimiento (Por definir)", abstract: "Relacionado con el 19 de noviembre, Día internacional de la mujer emprendedora", speaker_name: "María del Carmen García Contreras", speaker_bio: "Investigadora", scheduled_date: "2026-11-04 18:00", status: "scheduled", email: "mariadelcarmen_garcia@uaeh.edu.mx", phone: "775 110 48 59", category: "Emprendimiento" },
  { title: "Etnografía feminista con mujeres emprendedoras y comerciantes mediante internet", abstract: "Continuación mes del emprendimiento.", speaker_name: "María del Carmen García Contreras y Dra. Araceli Jiménez Pelcastre", speaker_bio: "Doctorado Ciencias Sociales UAEH", scheduled_date: "2026-11-18 18:00", status: "scheduled", email: "", phone: "", category: "Emprendimiento" },
  { title: "Comités de Contraloría Social, una herramienta para combatir la corrupción", abstract: "Se enmarca en el 9 de diciembre, Día internacional contra la corrupción", speaker_name: "Elia Tejeda Salinas y Dra. Talina Merit Olvera Mejía", speaker_bio: "Doctorado Ciencias Sociales UAEH", scheduled_date: "2026-12-02 18:00", status: "scheduled", email: "elia_tesa@yahoo.com.mx", phone: "771 139 80 41", category: "Sociedad" },
  { title: "Voces que cruzan fronteras, conocimientos que perduran: mujeres hidalguenses en movilidad", abstract: "Ciencias Sociales", speaker_name: "Alicia de Lourdes Melgarejo Ávila y Dra. Laura Myriam Franco Sánchez", speaker_bio: "Doctorado Ciencias Sociales UAEH", scheduled_date: "2026-12-16 18:00", status: "scheduled", email: "", phone: "", category: "Sociedad" },
  { title: "Evento por definir", abstract: "Fecha agendada", speaker_name: "Por Confirmar", speaker_bio: "", scheduled_date: "2026-12-30 18:00", status: "scheduled", email: "", phone: "", category: "General" },
  { title: "Evento por definir", abstract: "Fecha agendada", speaker_name: "Por Confirmar", speaker_bio: "", scheduled_date: "2027-01-13 18:00", status: "scheduled", email: "", phone: "", category: "General" },
  { title: "Evento por definir", abstract: "Fecha agendada", speaker_name: "Por Confirmar", speaker_bio: "", scheduled_date: "2027-01-27 18:00", status: "scheduled", email: "", phone: "", category: "General" }
];

const insertTalk = db.prepare(`
  INSERT INTO talks (title, abstract, speaker_name, speaker_bio, scheduled_date, status, email, phone, category)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const t of talks) {
  insertTalk.run(t.title, t.abstract, t.speaker_name, t.speaker_bio, t.scheduled_date, t.status, t.email, t.phone, t.category);
}

console.log("DB seeded successfully!");
