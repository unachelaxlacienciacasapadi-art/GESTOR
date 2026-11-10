import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, MapPin, Mic } from "lucide-react";
import { Link } from "react-router-dom";
import WhatsAppShareButton from "../WhatsAppShareButton";
import SpeakerAvatar from "../SpeakerAvatar";
import { CutoutTag } from "../brand";
import { googleCalendarUrl, parseTalkDate } from "../../lib/utils";
import { CASA_PADI } from "../../lib/casaPadi";

interface NextTalkCardProps {
  talk: any | null;
  onTalkClick?: (talk: any) => void;
}

const fmt = (value: string | null | undefined, pattern: string) => {
  const d = parseTalkDate(value);
  return d ? format(d, pattern, { locale: es }) : "";
};

/** La próxima charla, presentada como su cartel: título entre comillas, retratos y fecha en itálica. */
export default function NextTalkCard({ talk, onTalkClick }: NextTalkCardProps) {
  if (!talk) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center border-2 border-dashed border-coral-oscuro rounded-[28px] gap-4">
        <Mic className="w-10 h-10 text-coral-oscuro" />
        <h3 className="font-display font-semibold text-2xl">Estamos armando las próximas charlas</h3>
        <p className="text-tinta-suave max-w-md">¿Tienes algo que contar? Este miércoles puede ser tuyo.</p>
        <Link to="/registro" className="inline-flex items-center min-h-12 px-6 rounded-full bg-ambar text-tinta font-bold shadow-sello">
          Proponer una charla
        </Link>
      </div>
    );
  }

  const speakers = [
    { name: talk.speaker_name, photo: talk.speaker_photo_url },
    ...(talk.speaker_2_name ? [{ name: talk.speaker_2_name, photo: talk.speaker_2_photo_url }] : []),
  ];

  return (
    <article className="bg-papel-claro rounded-[28px] border-2 border-tinta shadow-sello-lg flex flex-col-reverse md:flex-row overflow-hidden">
      <div className="flex-[1.6] p-7 md:p-11 flex flex-col gap-5 min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-bold tracking-[0.14em] uppercase bg-chela text-papel px-2.5 py-1 rounded-full">La que sigue</span>
          {talk.category && <CutoutTag size="sm">{talk.category}</CutoutTag>}
        </div>
        <button type="button" onClick={() => onTalkClick?.(talk)} className="text-left group">
          <h3 className="font-display font-medium text-[28px] md:text-[40px] leading-[1.12] text-chela tracking-tight group-hover:text-chela-oscuro">
            “{talk.title}”
          </h3>
        </button>
        <p className="font-fecha italic font-semibold text-[26px] md:text-[32px] leading-tight first-letter:uppercase">
          {fmt(talk.scheduled_date, "EEEE d 'de' MMMM")} · {fmt(talk.scheduled_date, "h:mm aaa")}
        </p>
        <p className="flex items-center gap-2 text-[15px] text-tinta-suave">
          <MapPin className="w-4 h-4 text-coral-oscuro shrink-0" /> Casa Pädi · {CASA_PADI.address}
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href={googleCalendarUrl(talk)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 min-h-12 px-6 rounded-full bg-chela text-papel font-bold text-[15px] hover:bg-chela-oscuro transition-colors"
          >
            <Calendar className="w-4 h-4" /> Añadir al calendario
          </a>
          <WhatsAppShareButton talk={talk} variant="default" className="w-auto" />
        </div>
      </div>

      <div className="flex-1 bg-crema px-6 py-8 md:py-10 flex md:flex-col items-center justify-center gap-6 md:gap-7">
        {speakers.map((s, i) => (
          <div key={s.name} className="flex flex-col items-center gap-2.5 text-center">
            <SpeakerAvatar
              name={s.name}
              photoUrl={s.photo}
              className={i === 0 ? "w-28 h-28 md:w-36 md:h-36 border-[5px]" : "w-24 h-24 md:w-28 md:h-28 border-[4px]"}
              textClassName={i === 0 ? "text-4xl" : "text-3xl"}
            />
            <p className="font-bold text-xs md:text-sm uppercase tracking-wide max-w-[200px] leading-snug">{s.name}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
