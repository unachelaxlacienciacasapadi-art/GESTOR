import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface TalkForShare {
  title: string;
  speaker_name: string;
  scheduled_date: string | null;
  abstract?: string;
  category?: string;
  flyer_image_url?: string | null;
}

interface WhatsAppShareButtonProps {
  talk: TalkForShare;
  variant?: "default" | "compact" | "icon-only";
  className?: string;
}

// WhatsApp SVG icon (no external dependency needed)
function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function generateWhatsAppMessage(talk: TalkForShare): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://chelaxlaciencia.com";

  let dateStr = "";
  let timeStr = "";
  if (talk.scheduled_date) {
    try {
      const parsed = parseISO(talk.scheduled_date.replace(" ", "T"));
      if (!isNaN(parsed.getTime())) {
        // Formatear con timezone explícito de México
        dateStr = new Intl.DateTimeFormat('es-MX', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'America/Mexico_City'
        }).format(parsed);
        
        timeStr = new Intl.DateTimeFormat('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Mexico_City',
          hour12: false
        }).format(parsed);
      }
    } catch {}
  }

  const excerpt = talk.abstract
    ? talk.abstract.substring(0, 120).trimEnd() + (talk.abstract.length > 120 ? "..." : "")
    : "";

  const message =
    `🔬 *Una Chela por la Ciencia* 🍺\n\n` +
    `¡Acompáñame a esta charla en Casa Pädi!\n\n` +
    `📌 *${talk.title}*\n` +
    `🎤 ${talk.speaker_name}\n` +
    (dateStr ? `📅 ${dateStr}\n` : "") +
    (timeStr ? `⏰ ${timeStr} hrs\n` : "") +
    (talk.category ? `📚 ${talk.category}\n` : "") +
    (excerpt ? `\n${excerpt}\n` : "") +
    `\n¿Te animas? Más info 👇\n${baseUrl}/cartelera\n\n` +
    `#DivulgaciónCientífica #Pachuca #CasaPädi` +
    (talk.flyer_image_url ? `\n\n🖼️ *Ver flyer:* ${talk.flyer_image_url}` : "");

  return encodeURIComponent(message);
}

export default function WhatsAppShareButton({
  talk,
  variant = "default",
  className = "",
}: WhatsAppShareButtonProps) {
  const handleShare = () => {
    const msg = generateWhatsAppMessage(talk);
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60";

  if (variant === "icon-only") {
    return (
      <button
        type="button"
        onClick={handleShare}
        title="Compartir por WhatsApp"
        className={`${baseStyles} w-8 h-8 rounded-full bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366] hover:text-white hover:shadow-[0_0_12px_rgba(37,211,102,0.4)] ${className}`}
      >
        <WhatsAppIcon className="w-3.5 h-3.5" />
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleShare}
        className={`${baseStyles} px-3 py-1.5 text-xs rounded-full bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366] hover:text-white hover:shadow-[0_0_12px_rgba(37,211,102,0.4)] ${className}`}
      >
        <WhatsAppIcon className="w-3.5 h-3.5" />
        Compartir
      </button>
    );
  }

  // default: full-width / prominent
  return (
    <button
      type="button"
      onClick={handleShare}
      className={`${baseStyles} w-full px-5 py-2.5 text-sm rounded-xl bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366] hover:text-white hover:shadow-[0_0_15px_rgba(37,211,102,0.35)] ${className}`}
    >
      <WhatsAppIcon className="w-4 h-4" />
      Invitar a alguien
    </button>
  );
}
