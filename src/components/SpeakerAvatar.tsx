import { useState } from "react";
import { cn } from "../lib/utils";

const PALETTE = ["#00FFCC", "#FF3366", "#FFCC00", "#9933FF", "#33A1FF", "#FF8A33"];

const TITLE_PREFIX = /^(dra?|mtr[ao]|m\.?\s*en\s*c|lic|ing|psc?|psic|prof|biol?|arq)\.?\s+/i;

export const getInitials = (name: string) => {
  // Con varios ponentes en un mismo campo ("A y Dra. B") solo usamos al primero.
  const first = name.split(/\s+y\s+|,|&/i)[0].trim().replace(TITLE_PREFIX, "");
  const parts = first.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
};

export const getAccentColor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

type Props = {
  name: string;
  photoUrl?: string | null;
  className?: string;
  textClassName?: string;
};

export default function SpeakerAvatar({ name, photoUrl, className, textClassName }: Props) {
  const [failed, setFailed] = useState(false);
  const color = getAccentColor(name);

  if (photoUrl && !failed) {
    return (
      <img
        src={photoUrl}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={cn("rounded-full object-cover border border-[#333333] shrink-0", className)}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={cn("rounded-full flex items-center justify-center shrink-0 font-bold border", className)}
      style={{
        background: `linear-gradient(135deg, ${color}33, ${color}0D)`,
        borderColor: `${color}55`,
        color,
      }}
    >
      <span className={cn("text-sm", textClassName)}>{getInitials(name)}</span>
    </div>
  );
}
