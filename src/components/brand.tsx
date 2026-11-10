import type { CSSProperties, ReactNode } from "react";
import { cn } from "../lib/utils";

// Piezas visuales de la identidad "Papel, coral y espuma".

type Swatch = { bg: string; fg: string };

const COLLAGE: Swatch[] = [
  { bg: "#C42A5E", fg: "#FFFFFF" }, // magenta
  { bg: "#2C55C9", fg: "#FFFFFF" }, // cobalto
  { bg: "#2A9D8F", fg: "#1F1D1A" }, // turquesa
  { bg: "#F2B134", fg: "#1F1D1A" }, // ámbar
  { bg: "#7A4BC2", fg: "#FFFFFF" }, // morado
  { bg: "#E8826F", fg: "#1F1D1A" }, // coral
  { bg: "#B5452F", fg: "#FFFFFF" }, // coral oscuro
];

// Categorías con color fijo para que sean reconocibles entre pantallas.
const CATEGORY_SWATCH: Record<string, Swatch> = {
  sociedad: COLLAGE[0],
  gastronomia: COLLAGE[1],
  salud: COLLAGE[2],
  "salud digital": COLLAGE[2],
  general: COLLAGE[3],
  cultura: COLLAGE[4],
  "arte y cine": COLLAGE[4],
  "arte y cultura": COLLAGE[4],
  emprendimiento: COLLAGE[6],
  ciencia: { bg: "#2E6F40", fg: "#F3EDE1" },
  fisica: { bg: "#2E6F40", fg: "#F3EDE1" },
  biologia: { bg: "#2E6F40", fg: "#F3EDE1" },
  "medio ambiente": { bg: "#2E6F40", fg: "#F3EDE1" },
};

const stripAccents = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(new RegExp("[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]", "g"), "").trim();

const hash = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const swatchFor = (seed: string): Swatch => COLLAGE[hash(seed) % COLLAGE.length];

export const categorySwatch = (category?: string | null): Swatch =>
  CATEGORY_SWATCH[stripAccents(category || "general")] ?? swatchFor(stripAccents(category || "general"));

// Color de texto de la categoría sobre fondo papel: los colores claros del
// collage (ámbar, turquesa, coral) se oscurecen para pasar contraste AA.
const INK_OVER_PAPER: Record<string, string> = { "#F2B134": "#8A5A00", "#2A9D8F": "#1D6E64", "#E8826F": "#B5452F" };
export const categoryInk = (category?: string | null) => {
  const { bg } = categorySwatch(category);
  return INK_OVER_PAPER[bg] ?? bg;
};

const RECORTE_FONTS = ["font-recorte", "font-recorte-mono", "font-recorte-script"] as const;

/** Etiqueta "recortada" del collage: color sólido, sombra de tinta y un giro leve. */
export function CutoutTag({
  children,
  swatch,
  size = "md",
  tilt,
  font: fontProp,
  className,
}: {
  children: ReactNode;
  swatch?: Swatch;
  size?: "sm" | "md" | "lg";
  tilt?: number;
  font?: "serif" | "mono" | "script";
  className?: string;
}) {
  const label = typeof children === "string" ? children : "";
  const s = swatch ?? categorySwatch(label);
  const font = fontProp
    ? ({ serif: "font-recorte", mono: "font-recorte-mono", script: "font-recorte-script" } as const)[fontProp]
    : RECORTE_FONTS[hash(label) % RECORTE_FONTS.length];
  const angle = tilt ?? ((hash(label) % 7) - 3);
  const sizes = {
    sm: font === "font-recorte-mono" ? "text-[10px] px-2 py-1" : "text-sm px-2.5 py-0.5",
    md: font === "font-recorte-mono" ? "text-xs px-2.5 py-1.5" : "text-lg px-3 py-0.5",
    lg: font === "font-recorte-mono" ? "text-base px-3.5 py-2.5" : "text-2xl md:text-3xl px-4 py-1",
  };
  return (
    <span
      className={cn("inline-block shadow-sello whitespace-nowrap leading-tight", font, font === "font-recorte-mono" && "uppercase", sizes[size], className)}
      style={{ background: s.bg, color: s.fg, transform: `rotate(${angle}deg)` }}
    >
      {children}
    </span>
  );
}

/** Rama de coral / neurona de los carteles. Solo decorativa. */
export function CoralBranch({ className, style, color = "#E8826F" }: { className?: string; style?: CSSProperties; color?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 200" className={cn("pointer-events-none", className)} style={style} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round">
      <path d="M100 200 C100 160 96 140 80 120 M80 120 C70 108 52 104 40 90 M80 120 C84 100 78 84 64 70 M100 160 C112 140 128 132 140 112 M140 112 C150 98 166 92 176 76 M140 112 C138 92 146 78 152 60 M64 70 C58 60 50 54 42 50 M64 70 C68 58 66 46 60 36 M152 60 C150 48 156 40 162 32 M152 60 C164 56 172 50 178 42 M40 90 C30 86 22 80 16 70 M176 76 C184 74 190 68 194 60" />
      {[[42, 50], [60, 36], [162, 32], [178, 42], [16, 70], [194, 60]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3} fill={color} stroke="none" />
      ))}
    </svg>
  );
}

/** Talón de boleto con la fecha (día grande, mes y opcionalmente la hora). */
export function DateStub({
  day,
  month,
  weekday,
  time,
  swatch,
  className,
}: {
  day: string;
  month: string;
  weekday?: string;
  time?: string;
  swatch: Swatch;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center shrink-0 border-r-[3px] border-dashed border-papel-claro", className)}
      style={{ background: swatch.bg, color: swatch.fg }}
    >
      {weekday && <span className="text-[11px] font-bold tracking-[0.14em] uppercase">{weekday}</span>}
      <span className="font-display font-semibold text-4xl leading-none">{day}</span>
      <span className="text-[11px] font-bold tracking-[0.14em] uppercase">{month}</span>
      {time && <span className="font-fecha italic text-base mt-0.5">{time}</span>}
    </div>
  );
}
