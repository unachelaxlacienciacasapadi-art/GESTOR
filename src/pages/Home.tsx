import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, Mic, Sparkles, Camera, Calendar, Users, Coffee, BookOpen, MapPin, X } from "lucide-react";
import { cn } from "../lib/utils";

import { HomeTabs, TabPanel } from "../components/Tabs";
import NextTalkCard from "../components/home/NextTalkCard";
import UpcomingTalksCarousel from "../components/home/UpcomingTalksCarousel";
import PhotoGalleryGrid from "../components/home/PhotoGalleryGrid";
import CasaPadiCard from "../components/home/CasaPadiCard";

import gale1Img from "../assets/gale1.png.jpeg";
import ambienteImg from "../assets/ambiente.jpeg";
import conocimientoImg from "../assets/conocimiento.jpeg";
import comunidadImg from "../assets/comunidad.jpeg";
import memoriasImg from "../assets/memorias.jpeg";

const TABS = [
  { value: "proximas", label: <span>🎤 Próximas & Comunidad</span> },
  { value: "galeria", label: <span>📸 Galería</span> },
  { value: "info", label: <span>ℹ️ Casa Pädi</span> },
];

const safeFormat = (d: string | null | undefined, f: string) => {
  if (!d) return "";
  try {
    const parsed = parseISO(d.replace(" ", "T"));
    if (isNaN(parsed.getTime())) return "";

    // Forzar siempre a America/Mexico_City para evitar desfases UTC/Local
    if (f === "HH:mm") {
      return new Intl.DateTimeFormat('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Mexico_City'
      }).format(parsed);
    }

    return format(parsed, f, { locale: es });
  } catch { return ""; }
};

const INFO_CARDS = [
  { img: ambienteImg, title: "Ambiente Relajado", desc: "Disfruta de ciencia accesible mientras tomas tu bebida favorita en un entorno acogedor.", color: "#FF3366" },
  { img: conocimientoImg, title: "Conocimiento", desc: "Charlas impartidas por estudiantes y divulgadores apasionados por compartir su saber.", color: "#00FFCC" },
  { img: comunidadImg, title: "Comunidad", desc: "Conecta con mentes curiosas, expande tu red y haz nuevos amigos en Pachuca.", color: "#FFCC00" },
  { img: memoriasImg, title: "Memorias", desc: "Revive los mejores momentos de nuestras charlas a través de nuestras galerías de fotos.", color: "#9933FF" },
];

export default function Home() {
  const [nextTalk, setNextTalk] = useState<any>(null);
  const [upcomingTalks, setUpcoming] = useState<any[]>([]);
  const [recentTalks, setRecentTalks] = useState<any[]>([]);
  const [totalUpcoming, setTotalUpcoming] = useState<number>(0);
  const [subStatus, setSubStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [selectedTalk, setSelectedTalk] = useState<any>(null);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [scheduledCount, setScheduledCount] = useState<number>(0);

  useEffect(() => {
    // Next upcoming scheduled talk
    fetch("/api/talks?includeAll=true")
      .then(r => r.json())
      .then(data => {
        const now = Date.now();
        const scheduled = (data as any[])
          .filter(t => t.status === "scheduled" && t.scheduled_date && new Date(t.scheduled_date).getTime() >= now)
          .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
        setNextTalk(scheduled[0] ?? null);
        setUpcoming(scheduled.slice(1, 6));
        setTotalUpcoming(scheduled.length);
        setCompletedCount((data as any[]).filter(t => t.status === "completed").length);
        setScheduledCount((data as any[]).filter(t => t.status === "scheduled").length);
      })
      .catch(console.error);

    // Recent completed talks for community tab
    fetch("/api/talks?recent=true")
      .then(r => r.json())
      .then(data => setRecentTalks(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubStatus("loading");
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
    try {
      await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubStatus("ok");
      e.currentTarget.reset();
    } catch {
      setSubStatus("error");
    }
  };

  return (
    <>
    <div className="flex flex-col min-h-screen">

      {/* ── HERO (50vh) ─────────────────────────────── */}
      <header className="relative h-[50vh] min-h-[380px] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img src={gale1Img} alt="Hero background" fetchPriority="high" decoding="async" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 backdrop-blur-[2px] bg-black/20" />
          <div className="absolute bottom-0 w-full h-32 bg-gradient-to-b from-transparent to-[#070707]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#9933FF]/5 via-transparent to-[#00FFCC]/1" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl mx-auto space-y-4">
          {/* Logo */}
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#FF3366] via-[#FFCC00] to-[#00FFCC] rounded-full blur-lg opacity-60 group-hover:opacity-90 transition duration-500" />
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-sm border border-white/20 relative">
              <img src="/assets/logo.webp" alt="Una chela por la ciencia" decoding="async" className="w-[82%] h-[82%] object-contain filter contrast-125 brightness-110 drop-shadow-2xl" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#141414] border border-[#333333] text-xs font-medium text-[#00FFCC] shadow-[0_0_15px_rgba(0,255,204,0.15)]">
            <Sparkles className="w-3 h-3" />
            Divulgación científica en Pachuca
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F0F0F0] to-[#A0A0A0] tracking-tight leading-tight">
            Una chela por la ciencia
          </h1>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-none justify-center pt-1">
            <Link to="/cartelera" className="inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#FF3366] to-[#FF1A53] rounded-full hover:from-[#FF1A53] hover:to-[#E60039] transition-all shadow-[0_0_20px_rgba(255,51,102,0.4)] hover:-translate-y-0.5 w-full sm:w-auto">
              Ver Cartelera <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/registro" className="inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-bold text-[#00FFCC] bg-[#141414] border border-[#00FFCC]/50 rounded-full hover:bg-[#00FFCC]/10 transition-all hover:-translate-y-0.5 w-full sm:w-auto">
              Proponer una Charla <Mic className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── TABS ────────────────────────────────────── */}
      <HomeTabs tabs={TABS} defaultValue="proximas">

        {/* TAB 1: Próximas & Comunidad */}
        <TabPanel tabValue="proximas">
          <NextTalkCard talk={nextTalk} onTalkClick={setSelectedTalk} />
          <UpcomingTalksCarousel talks={upcomingTalks} onTalkClick={setSelectedTalk} />

          {/* Sección Comunidad */}
          <div className="mt-12 bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] rounded-2xl p-8 border border-[#333333]">
            <h3 className="text-2xl font-serif font-bold text-white mb-6 text-center">
              🏛️ Únete a la Comunidad
            </h3>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#00FFCC] mb-2">
                  {completedCount}
                </div>
                <p className="text-sm text-[#A0A0A0]">Charlas realizadas en 2026</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#FFCC00] mb-2">
                  {scheduledCount}
                </div>
                <p className="text-sm text-[#A0A0A0]">Próximas charlas</p>
              </div>
            </div>

            {/* Newsletter form */}
            <div className="bg-gradient-to-r from-[#FF3366]/20 to-[#9933FF]/20 rounded-3xl p-8 border border-[#FF3366]/30 shadow-[0_0_30px_rgba(255,51,102,0.15)] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FF3366] to-[#9933FF] rounded-full mix-blend-screen filter blur-[80px] opacity-30 pointer-events-none translate-x-1/2 -translate-y-1/2" />
              <div className="flex-1 text-left relative z-10">
                <h2 className="text-2xl font-serif font-bold text-white mb-2">No te pierdas ninguna charla</h2>
                <p className="text-[#A0A0A0] text-sm">Suscríbete y recibe recordatorios, resúmenes y noticias de la comunidad.</p>
              </div>
              <div className="w-full md:w-auto relative z-10">
                {subStatus === "ok" ? (
                  <div className="px-8 py-3 bg-[#00FFCC]/10 border border-[#00FFCC]/30 rounded-full text-[#00FFCC] font-bold text-sm text-center">
                    ¡Gracias por suscribirte! 🎉
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                    <input type="email" name="email" required placeholder="Tu correo" className="bg-[#141414] border border-[#333333] text-white px-5 py-3 rounded-full focus:outline-none focus:border-[#FF3366] min-w-[200px] transition-colors text-sm" />
                    <button type="submit" disabled={subStatus === "loading"} className="bg-[#FF3366] text-white font-bold px-6 py-3 rounded-full hover:bg-[#E60039] transition-colors shadow-[0_0_15px_rgba(255,51,102,0.4)] whitespace-nowrap disabled:opacity-60 text-sm">
                      {subStatus === "loading" ? "Enviando..." : "Suscribirme"}
                    </button>
                  </form>
                )}
                {subStatus === "error" && (
                  <p className="text-[#FF3366] text-xs mt-2 text-center">Hubo un error. Inténtalo de nuevo.</p>
                )}
              </div>
            </div>
          </div>
        </TabPanel>

        {/* TAB 2: Galería */}
        <TabPanel tabValue="galeria">
          <div className="mb-6">
            <h2 className="text-2xl font-serif font-bold text-white">Nuestras Sesiones</h2>
            <p className="text-sm text-[#A0A0A0] mt-1">Momentos que nos definen</p>
          </div>
          <PhotoGalleryGrid />
        </TabPanel>

        {/* TAB 3: Info */}
        <TabPanel tabValue="info">
          <div className="mb-6">
            <h2 className="text-2xl font-serif font-bold text-white">¿Qué es Una Chela x la Ciencia?</h2>
            <p className="text-sm text-[#A0A0A0] mt-1">El espacio donde la curiosidad se encuentra con buena compañía</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {INFO_CARDS.map(({ img, title, desc, color }) => (
              <div key={title} className="bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] rounded-2xl border border-[#333333] overflow-hidden hover:border-opacity-60 transition-all duration-300 hover:-translate-y-1 group" style={{ "--accent": color } as any}>
                <div className="h-36 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent z-10" />
                  <img src={img} alt={title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-serif font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-[#A0A0A0] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Info de Casa Pädi - ubicación, contacto, redes */}
          <div className="mt-8">
            <CasaPadiCard />
          </div>
        </TabPanel>

      </HomeTabs>

    </div>

    {/* Talk Detail Modal */}
    {selectedTalk && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={() => setSelectedTalk(null)}
      >
        <div
          className="relative max-w-2xl w-full bg-[#111111] border border-[#333333] rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedTalk(null)}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-[#A0A0A0] hover:text-white hover:bg-[#333333] transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Speaker image */}
          {selectedTalk.speaker_photo_url && (
            <div className="h-56 sm:h-72 relative overflow-hidden flex-shrink-0">
              <img
                src={selectedTalk.speaker_photo_url}
                alt={selectedTalk.speaker_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
            </div>
          )}

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {selectedTalk.category && (
              <span className="inline-block bg-[#333333] text-[#A0A0A0] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                {selectedTalk.category}
              </span>
            )}

            <h2 className="text-2xl font-serif font-bold text-white mb-2 leading-tight">
              {selectedTalk.title}
            </h2>
            <p className="text-lg text-[#E0E0E0] font-medium">{selectedTalk.speaker_name}</p>
            {selectedTalk.speaker_2_name && (
              <p className="text-base text-[#A0A0A0]">{selectedTalk.speaker_2_name}</p>
            )}
            {selectedTalk.institution && (
              <p className="text-sm text-[#9933FF] mt-1">{selectedTalk.institution}</p>
            )}

            {selectedTalk.scheduled_date && (
              <div className="flex items-center gap-2 mt-4 text-sm text-[#00FFCC] bg-[#00FFCC]/5 border border-[#00FFCC]/20 px-4 py-2 rounded-xl">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="capitalize">
                  {safeFormat(selectedTalk.scheduled_date, "EEEE d 'de' MMMM 'de' yyyy")}
                  {" · "}
                  {safeFormat(selectedTalk.scheduled_date, "HH:mm")} hrs
                </span>
              </div>
            )}

            {selectedTalk.abstract && (
              <p className="text-sm text-[#A0A0A0] mt-4 leading-relaxed">
                {selectedTalk.abstract}
              </p>
            )}

            {/* WhatsApp invite button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  const date = safeFormat(selectedTalk.scheduled_date, "EEEE d 'de' MMMM");
                  const time = safeFormat(selectedTalk.scheduled_date, "HH:mm");
                  const dateStr = date && time ? `${date} a las ${time} hrs` : date || time || "";
                  const msg =
                    `🍺🔬 *${selectedTalk.title}*\n` +
                    `con ${selectedTalk.speaker_name}\n` +
                    (dateStr ? `📅 ${dateStr}\n` : "") +
                    `¡Te invito a una Chela por la Ciencia en Casa Pädi, Pachuca!\n` +
                    `👉 chelaxlaciencia.vercel.app`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
                }}
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 text-sm font-bold rounded-xl bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366] hover:text-white hover:shadow-[0_0_15px_rgba(37,211,102,0.35)] transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Invitar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
