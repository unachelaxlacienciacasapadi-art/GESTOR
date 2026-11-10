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
