import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// scheduled_date llega como "YYYY-MM-DD HH:mm:ss" en hora de CDMX sin zona; se
// interpreta como hora local para mostrar siempre la hora de pared del evento.
export function parseTalkDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value.replace(" ", "T"));
  return isNaN(parsed.getTime()) ? null : parsed;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

// Fechas sin "Z" + ctz: Google Calendar las toma como hora de CDMX sin importar
// la zona del navegador (antes se mandaba la hora local marcada como UTC).
export function googleCalendarUrl(talk: { title: string; scheduled_date?: string | null; description_short?: string | null; abstract?: string | null }): string {
  const start = parseTalkDate(talk.scheduled_date);
  if (!start) return "#";
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const stamp = (d: Date) =>
    `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: talk.title,
    dates: `${stamp(start)}/${stamp(end)}`,
    ctz: "America/Mexico_City",
    details: talk.description_short || talk.abstract || "",
    location: "Casa Pädi, Av. Piracantos 1507, Col. Alborada, Pachuca",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const DIACRITICS = new RegExp("[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]", "g");

export function normalizeText(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().normalize("NFD").replace(DIACRITICS, "").trim();
}

export function formatDriveUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  // Transform standard Drive view links to direct image links
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  
  // Also catch 'id=' format just in case
  const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1] && !url.includes("export=view")) {
    return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
  }
  
  return url;
}
