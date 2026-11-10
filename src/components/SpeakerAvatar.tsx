import { useState } from "react";
import { cn } from "../lib/utils";
import { swatchFor } from "./brand";

const TITLE_PREFIX = /^(dra?|mtr[ao]|m\.?\s*en\s*c|lic|ing|psc?|psic|prof|biol?|arq)\.?\s+/i;

export const getInitials = (name: string) => {
  // Con varios ponentes en un mismo campo ("A y Dra. B") solo usamos al primero.
  const first = name.split(/\s+y\s+|,|&/i)[0].trim().replace(TITLE_PREFIX, "");
  const parts = first.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
};

/** Color de acento estable por texto (nombre o categoría). */
export const getAccentColor = (seed: string) => swatchFor(seed).bg;

type Props = {
  name: string;
  photoUrl?: string | null;
  className?: string;
  textClassName?: string;
  /** Aro de tinta como en los carteles. En listas muy densas puede desactivarse. */
  ring?: boolean;
};

export default function SpeakerAvatar({ name, photoUrl, className, textClassName, ring = true }: Props) {
  const [failed, setFailed] = useState(false);
  const ringClass = ring ? "border-[3px] border-tinta" : "border border-borde";

  if (photoUrl && !failed) {
    return (
      <img
        src={photoUrl}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={cn("rounded-full object-cover shrink-0 bg-crema", ringClass, className)}
      />
    );
  }

  const swatch = swatchFor(name);
  return (
    <div
      aria-label={name}
      className={cn("rounded-full flex items-center justify-center shrink-0 font-display font-semibold", ringClass, className)}
      style={{ background: swatch.bg, color: swatch.fg }}
    >
      <span className={cn("text-sm", textClassName)}>{getInitials(name)}</span>
    </div>
  );
}
