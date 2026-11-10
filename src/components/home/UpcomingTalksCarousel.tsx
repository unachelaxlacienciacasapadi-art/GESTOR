import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { categorySwatch } from "../brand";
import { parseTalkDate } from "../../lib/utils";

interface Props {
  talks: any[];
  onTalkClick?: (talk: any) => void;
}

const fmt = (value: string | null | undefined, pattern: string) => {
  const d = parseTalkDate(value);
  return d ? format(d, pattern, { locale: es }) : "";
};

const speakerLine = (talk: any) => [talk.speaker_name, talk.speaker_2_name].filter(Boolean).join(" y ");

/** "Lo que viene": cada charla como boleto, con talón de fecha en el color de su categoría. */
export default function UpcomingTalksCarousel({ talks, onTalkClick }: Props) {
  if (!talks || talks.length === 0) return null;

  return (
    <section aria-labelledby="lo-que-viene" className="mt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
        <h2 id="lo-que-viene" className="font-display font-semibold text-3xl md:text-[34px] tracking-tight">Lo que viene</h2>
        <Link to="/cartelera" className="font-bold text-chela hover:text-chela-oscuro underline-offset-4 hover:underline">
          Ver toda la cartelera →
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {talks.map((talk) => {
          const swatch = categorySwatch(talk.category);
          return (
            <button
              key={talk.id}
              type="button"
              onClick={() => onTalkClick?.(talk)}
              className="text-left bg-papel-claro border border-borde rounded-[18px] overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-sello transition-all"
            >
              <div
                className="px-4 py-3.5 flex items-baseline justify-between gap-2 border-b-[3px] border-dashed border-papel-claro"
                style={{ background: swatch.bg, color: swatch.fg }}
              >
                <span className="font-display font-semibold text-3xl leading-none">
                  {fmt(talk.scheduled_date, "d")} <span className="text-[15px] font-medium">{fmt(talk.scheduled_date, "MMM")}</span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider truncate">{talk.category || "General"}</span>
              </div>
              <div className="p-4 flex flex-col gap-2 flex-1">
                <h3 className="font-display font-semibold text-[17px] leading-snug line-clamp-3">{talk.title}</h3>
                <p className="text-sm text-tinta-suave mt-auto line-clamp-2">{speakerLine(talk)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
