import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, Mic } from "lucide-react";
import { Link } from "react-router-dom";

interface NextTalkCardProps {
  talk: any | null;
}

const safeFormat = (dateString: string | null | undefined, formatStr: string) => {
  if (!dateString) return "";
  try {
    const parsed = parseISO(dateString.replace(' ', 'T'));
    if (isNaN(parsed.getTime())) return "";
    return format(parsed, formatStr, { locale: es });
  } catch { return ""; }
};

export default function NextTalkCard({ talk }: NextTalkCardProps) {
  if (!talk) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#333333] rounded-3xl">
        <div className="w-16 h-16 rounded-full bg-[#9933FF]/10 flex items-center justify-center mb-4">
          <Mic className="w-8 h-8 text-[#9933FF]" />
        </div>
        <h3 className="text-xl font-serif font-bold text-white mb-2">Próximamente nuevas charlas</h3>
        <p className="text-[#A0A0A0] text-sm mb-6 max-w-sm">
          Estamos organizando las próximas sesiones. ¿Tienes algo que compartir?
        </p>
        <Link
          to="/registro"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#9933FF] text-white text-sm font-bold rounded-full hover:bg-[#8822EE] transition-colors shadow-[0_0_15px_rgba(153,51,255,0.3)]"
        >
          <Mic className="w-4 h-4" />
          Proponer una charla
        </Link>
      </div>
    );
  }

  const gcalStart = safeFormat(talk.scheduled_date, "yyyyMMdd'T'HHmmss'Z'");
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(talk.title)}&dates=${gcalStart}/${gcalStart}&details=${encodeURIComponent(talk.abstract || "")}&location=${encodeURIComponent("Casa Padi")}`;

  return (
    <div className="bg-gradient-to-r from-[#141414] to-[#0A0A0A] p-1 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(0,255,204,0.15)] group hover:shadow-[0_0_40px_rgba(0,255,204,0.25)] transition-all duration-500">
      <div className="bg-[#050505] rounded-[22px] flex flex-col md:flex-row overflow-hidden relative">
        {/* Image */}
        <div className="w-full md:w-2/5 relative overflow-hidden h-48 md:h-auto border-b md:border-b-0 md:border-r border-[#333333]">
          {talk.speaker_photo_url ? (
            <img
              src={talk.speaker_photo_url}
              alt={`${talk.speaker_name} - Próxima Charla`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full min-h-[12rem] bg-[#1A1A1A] flex items-center justify-center">
              <Calendar className="w-16 h-16 text-[#333333]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent md:bg-gradient-to-l md:from-[#050505] md:via-transparent opacity-90 pointer-events-none" />
          <div className="absolute top-4 left-4 bg-[#00FFCC] text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide shadow-[0_0_15px_rgba(0,255,204,0.3)]">
            <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            PRÓXIMA CHARLA
          </div>
        </div>

        {/* Info */}
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-center text-left">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-[#333333] text-[#A0A0A0] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {talk.category || "General"}
            </span>
            <span className="text-[#00FFCC] text-sm font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {safeFormat(talk.scheduled_date, "HH:mm")} hrs
            </span>
          </div>

          <h3 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight mb-2">
            {talk.title}
          </h3>
          <p className="text-lg text-[#E0E0E0] font-medium mb-4">{talk.speaker_name}</p>
          <p className="text-sm text-[#A0A0A0] line-clamp-2 md:line-clamp-3 mb-6 leading-relaxed">
            {talk.abstract}
          </p>

          <div className="mt-auto flex flex-col sm:flex-row items-center gap-4 justify-between border-t border-[#333333] pt-5">
            <div className="flex items-center gap-2 text-[#E0E0E0] text-sm flex-1 font-medium bg-[#141414] px-4 py-2 rounded-xl">
              <Calendar className="w-4 h-4 text-[#FF3366]" />
              {safeFormat(talk.scheduled_date, "EEEE d 'de' MMMM")}
            </div>
            <a
              href={gcalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2 bg-white text-black text-sm font-bold rounded-xl hover:bg-[#F0F0F0] transition-colors whitespace-nowrap"
            >
              <Calendar className="w-4 h-4" />
              Añadir al Calendario
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
