import useEmblaCarousel from "embla-carousel-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, Mic } from "lucide-react";
import { Link } from "react-router-dom";
import { useCallback } from "react";
import { cn } from "../../lib/utils";

interface Props {
  talks: any[];
}

const safeFormat = (dateString: string | null | undefined, formatStr: string) => {
  if (!dateString) return "";
  try {
    const parsed = parseISO(dateString.replace(' ', 'T'));
    if (isNaN(parsed.getTime())) return "";
    return format(parsed, formatStr, { locale: es });
  } catch { return ""; }
};

export default function UpcomingTalksCarousel({ talks }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  if (!talks || talks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-[#333333] rounded-3xl mt-6">
        <div className="w-16 h-16 rounded-full bg-[#FFCC00]/10 flex items-center justify-center mb-4">
          <Mic className="w-8 h-8 text-[#FFCC00]" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No hay más charlas agendadas</h3>
        <p className="text-[#A0A0A0] text-sm mb-6 max-w-sm">
          ¿Tienes un tema apasionante que quieras compartir con la comunidad de Pachuca?
        </p>
        <Link
          to="/registro"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFCC00] text-black text-sm font-bold rounded-full hover:bg-[#E6B800] transition-colors"
        >
          <Mic className="w-4 h-4" />
          Proponer una charla
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Más charlas agendadas</h3>
        <div className="flex gap-2">
          <button
            onClick={scrollPrev}
            className="p-2 rounded-full bg-[#1A1A1A] border border-[#333333] text-[#A0A0A0] hover:text-white hover:bg-[#333333] transition-all"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollNext}
            className="p-2 rounded-full bg-[#1A1A1A] border border-[#333333] text-[#A0A0A0] hover:text-white hover:bg-[#333333] transition-all"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {talks.map((talk) => (
            <div
              key={talk.id}
              className="flex-shrink-0 w-[280px] sm:w-[320px] bg-[#141414] border border-[#333333] rounded-2xl overflow-hidden hover:border-[#9933FF]/50 hover:shadow-[0_0_20px_rgba(153,51,255,0.15)] transition-all duration-300 group"
            >
              <div className="h-36 bg-[#1A1A1A] relative overflow-hidden">
                {talk.speaker_photo_url ? (
                  <img
                    src={talk.speaker_photo_url}
                    alt={talk.speaker_name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#333333]">
                    <Calendar className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 text-xs font-bold text-[#9933FF] bg-[#9933FF]/10 px-2 py-1 rounded-full border border-[#9933FF]/30">
                  {talk.category || "General"}
                </span>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-bold text-white leading-snug mb-1 line-clamp-2">{talk.title}</h4>
                <p className="text-xs text-[#A0A0A0] mb-3">{talk.speaker_name}</p>
                <div className="flex items-center gap-1.5 text-xs text-[#00FFCC]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="capitalize">{safeFormat(talk.scheduled_date, "EEEE d 'de' MMMM")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
