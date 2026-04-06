import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
