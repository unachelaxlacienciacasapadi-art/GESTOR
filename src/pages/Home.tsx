import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, X } from "lucide-react";

import NextTalkCard from "../components/home/NextTalkCard";
import UpcomingTalksCarousel from "../components/home/UpcomingTalksCarousel";
import PhotoGalleryGrid from "../components/home/PhotoGalleryGrid";
import CasaPadiCard from "../components/home/CasaPadiCard";
import SpeakerAvatar from "../components/SpeakerAvatar";
import WhatsAppShareButton from "../components/WhatsAppShareButton";
import { CoralBranch, CutoutTag } from "../components/brand";
import { googleCalendarUrl, parseTalkDate } from "../lib/utils";
import { COLLABORATORS } from "../lib/casaPadi";

import heroImg from "../assets/charla-terraza.jpg";

const fmt = (value: string | null | undefined, pattern: string) => {
  const d = parseTalkDate(value);
  return d ? format(d, pattern, { locale: es }) : "";
};

// Temas reales que ya pasaron por el escenario, como invitación a proponer otros.
const PAST_TOPICS = ["Astronomía", "Microbiota", "Hongos", "Tanatología", "Aves de Hidalgo", "Zacahuil"];

export default function Home() {
  const [nextTalk, setNextTalk] = useState<any>(null);
  const [upcomingTalks, setUpcoming] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [subStatus, setSubStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [selectedTalk, setSelectedTalk] = useState<any>(null);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [scheduledCount, setScheduledCount] = useState<number>(0);

  useEffect(() => {
    fetch("/api/talks")
      .then((r) => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const todayStart = now.getTime();
        const currentYear = now.getFullYear();

        const dated = data
          .map((t) => ({ talk: t, time: parseTalkDate(t.scheduled_date)?.getTime() ?? null }))
          .filter((x): x is { talk: any; time: number } => x.time !== null);

        // "Próxima" vs "realizada" se decide por fecha, no por status.
        const upcoming = dated.filter((x) => x.time >= todayStart).sort((a, b) => a.time - b.time).map((x) => x.talk);

        setNextTalk(upcoming[0] ?? null);
        setUpcoming(upcoming.slice(1, 5));
        setScheduledCount(upcoming.length);
        setCompletedCount(dated.filter((x) => x.time < todayStart && new Date(x.time).getFullYear() === currentYear).length);
      })
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, []);

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setSubStatus("loading");
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubStatus("ok");
      form.reset();
    } catch {
      setSubStatus("error");
    }
  };

  return (
    <>
      {/* ── Portada ─────────────────────────────── */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 md:pt-14 pb-16 md:pb-24 grid gap-12 md:grid-cols-[1.15fr_1fr] items-center">
        <div className="flex flex-col gap-5 md:gap-6 relative z-10">
          <CutoutTag size="sm" tilt={-2} swatch={{ bg: "#2A9D8F", fg: "#1F1D1A" }} font="mono" className="self-start">
            Divulgación en Pachuca
          </CutoutTag>
          <h1 className="font-display font-medium text-[56px] sm:text-[76px] lg:text-[100px] leading-[0.92] tracking-[-0.035em] text-chela">
            Una chela x<br />la ciencia
          </h1>
          <p className="font-fecha italic font-semibold text-[26px] md:text-[34px] leading-tight">
            Cada miércoles · 7:00 pm · entrada libre
          </p>
          <p className="text-lg text-tinta-suave leading-relaxed max-w-xl">
            Investigadoras, estudiantes y divulgadores comparten lo que saben en la terraza de Casa Pädi. Tú pones la curiosidad; la chela, si se te antoja.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link to="/cartelera" className="inline-flex items-center min-h-[52px] px-7 rounded-full bg-chela text-papel font-bold hover:bg-chela-oscuro transition-colors">
              Ver cartelera
            </Link>
            <Link to="/registro" className="inline-flex items-center min-h-[52px] px-7 rounded-full border-2 border-tinta font-bold hover:bg-tinta hover:text-papel transition-colors">
              Quiero dar una charla
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md md:max-w-none">
          <CoralBranch className="absolute -right-14 -bottom-16 w-72 h-72" />
          <figure className="relative m-0 bg-papel-claro p-3 pb-12 rotate-2 rounded-md shadow-[0_18px_40px_rgba(31,29,26,0.18)]">
            <img src={heroImg} alt="Público en la terraza de Casa Pädi escuchando una charla frente a la proyección" fetchPriority="high" className="w-full h-72 md:h-[360px] object-cover rounded-sm" />
            <figcaption className="mt-3 font-fecha italic text-xl md:text-2xl">Un miércoles de charla en la terraza</figcaption>
          </figure>
          <div aria-hidden="true" className="absolute -top-4 left-[40%] w-28 h-7 bg-ambar/75 -rotate-3" />
          <img src="/assets/logo.webp" alt="" className="absolute -left-6 md:-left-12 -top-10 w-24 h-24 md:w-32 md:h-32 bg-papel rounded-full p-1.5 -rotate-12" />
        </div>
      </header>

      {/* ── Próxima charla y agenda ─────────────── */}
      <section aria-label="Próximas charlas" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {loaded ? (
          <>
            <NextTalkCard talk={nextTalk} onTalkClick={setSelectedTalk} />
            <UpcomingTalksCarousel talks={upcomingTalks} onTalkClick={setSelectedTalk} />
          </>
        ) : (
          <div className="h-80 rounded-[28px] bg-crema animate-pulse" aria-label="Cargando próximas charlas" />
        )}
      </section>

      {/* ── Cifras ──────────────────────────────── */}
      <section aria-label="Una chela x la ciencia en números" className="bg-noche text-papel relative overflow-hidden">
        <CoralBranch className="absolute -left-12 -top-10 w-64 h-64 opacity-50" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <p className="font-display font-semibold text-5xl md:text-6xl leading-none text-ambar">{completedCount}</p>
            <p className="mt-2">charlas realizadas en {new Date().getFullYear()}</p>
          </div>
          <div>
            <p className="font-display font-semibold text-5xl md:text-6xl leading-none text-coral">{scheduledCount}</p>
            <p className="mt-2">{scheduledCount === 1 ? "charla en la agenda" : "charlas en la agenda"}</p>
          </div>
          <div>
            <p className="font-fecha italic font-semibold text-4xl md:text-5xl leading-none">miércoles</p>
            <p className="mt-2">7:00 pm, terraza de Casa Pädi</p>
          </div>
          <div>
            <p className="font-display font-semibold text-5xl md:text-6xl leading-none text-[#4FC1B2]">$0</p>
            <p className="mt-2">la entrada siempre es libre</p>
          </div>
        </div>
      </section>

      {/* ── Proponer ────────────────────────────── */}
      <section aria-labelledby="proponer" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 grid gap-10 md:grid-cols-2 items-center">
        <div className="flex flex-col gap-5">
          <h2 id="proponer" className="font-display font-semibold text-4xl md:text-5xl leading-[1.05] tracking-tight">¿Tienes algo que contar?</h2>
          <p className="text-lg text-tinta-suave leading-relaxed">
            Tu tesis, tu laboratorio, ese tema que no te deja dormir. Elige un miércoles libre, cuéntanos de qué va y nosotros armamos el cartel.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/registro" className="inline-flex items-center min-h-[52px] px-7 rounded-full bg-ambar text-tinta font-bold shadow-sello hover:-translate-y-0.5 transition-transform">
              Proponer una charla
            </Link>
            <Link to="/comunidad" className="inline-flex items-center min-h-[52px] px-4 font-bold text-chela hover:underline underline-offset-4">
              Sugerir un tema →
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 justify-center content-center p-4" aria-label="Algunos temas que ya se han presentado">
          {PAST_TOPICS.map((topic) => (
            <CutoutTag key={topic} size="lg">{topic}</CutoutTag>
          ))}
        </div>
      </section>

      {/* ── Colaboración ────────────────────────── */}
      <section aria-labelledby="colaboracion" className="bg-crema">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 flex flex-col md:flex-row md:items-center gap-8 justify-between">
          <div className="max-w-xl">
            <h2 id="colaboracion" className="font-display font-semibold text-2xl md:text-3xl">Hecho en colaboración</h2>
            <p className="text-tinta-suave mt-2">Una chela x la ciencia es un programa de Casa Pädi que se arma junto con aliados que creen en la ciencia abierta y cercana.</p>
          </div>
          <ul className="flex flex-wrap items-center gap-4">
            <li className="flex items-center gap-3 bg-papel-claro border-2 border-tinta rounded-full pl-2 pr-5 py-2">
              <img src="/assets/logo.webp" alt="" className="w-11 h-11" />
              <span className="font-display font-semibold">Casa Pädi</span>
            </li>
            {COLLABORATORS.map((c) =>
              c.logo ? (
                <li key={c.name}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${c.name} en Instagram`}
                    className="block bg-white border-2 border-tinta rounded-2xl px-4 py-2 shadow-sello -rotate-1 hover:rotate-0 hover:-translate-y-0.5 transition-transform"
                  >
                    <img src={c.logo} alt={c.name} className="h-16 md:h-20 w-auto" loading="lazy" />
                  </a>
                </li>
              ) : (
                <li key={c.name} className="flex items-center bg-papel-claro border-2 border-tinta rounded-full px-5 py-2">
                  <span className="font-display font-semibold">{c.name}</span>
                </li>
              )
            )}
          </ul>
        </div>
      </section>

      {/* ── Galería ─────────────────────────────── */}
      <section aria-labelledby="galeria" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 id="galeria" className="font-display font-semibold text-3xl md:text-[34px] tracking-tight mb-8">La vida en Casa Pädi</h2>
        <PhotoGalleryGrid />
      </section>

      {/* ── Casa Pädi ───────────────────────────── */}
      <section aria-label="Casa Pädi" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <CasaPadiCard />
      </section>

      {/* ── Suscripción ─────────────────────────── */}
      <section aria-labelledby="suscribete" className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="bg-ambar rounded-[28px] border-2 border-tinta shadow-sello-lg p-7 md:p-10 flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div>
            <h2 id="suscribete" className="font-display font-semibold text-2xl md:text-3xl">No te pierdas ninguna charla</h2>
            <p className="text-tinta mt-1">Te avisamos de la cartelera y de los resúmenes de cada miércoles.</p>
          </div>
          {subStatus === "ok" ? (
            <p role="status" className="font-bold text-lg bg-papel-claro border-2 border-tinta rounded-full px-6 py-3">¡Listo! Ya estás en la lista.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <label htmlFor="newsletter-email" className="sr-only">Tu correo</label>
              <input
                id="newsletter-email"
                type="email"
                name="email"
                required
                placeholder="tu@correo.com"
                className="min-h-12 px-5 rounded-full bg-papel-claro border-2 border-tinta text-tinta placeholder:text-gris focus:outline-none focus:ring-2 focus:ring-chela sm:min-w-64"
              />
              <button type="submit" disabled={subStatus === "loading"} className="min-h-12 px-6 rounded-full bg-tinta text-papel font-bold hover:bg-noche transition-colors disabled:opacity-60">
                {subStatus === "loading" ? "Enviando…" : "Suscribirme"}
              </button>
            </form>
          )}
        </div>
        {subStatus === "error" && <p role="alert" className="text-coral-oscuro font-bold mt-3">No pudimos registrarte. Inténtalo de nuevo.</p>}
      </section>

      {/* ── Detalle de charla ───────────────────── */}
      {selectedTalk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/60 backdrop-blur-sm p-4" onClick={() => setSelectedTalk(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-titulo"
            className="relative max-w-2xl w-full bg-papel-claro border-2 border-tinta rounded-[28px] shadow-sello-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTalk(null)}
              className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full border-2 border-tinta bg-papel-claro hover:bg-tinta hover:text-papel transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-7 md:p-9 flex flex-col gap-5">
              {selectedTalk.category && <CutoutTag size="sm" className="self-start">{selectedTalk.category}</CutoutTag>}
              <h2 id="detalle-titulo" className="font-display font-medium text-3xl leading-tight text-chela pr-10">“{selectedTalk.title}”</h2>
              <p className="font-fecha italic font-semibold text-2xl first-letter:uppercase">
                {fmt(selectedTalk.scheduled_date, "EEEE d 'de' MMMM")} · {fmt(selectedTalk.scheduled_date, "h:mm aaa")}
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { name: selectedTalk.speaker_name, photo: selectedTalk.speaker_photo_url, bio: selectedTalk.speaker_bio },
                  { name: selectedTalk.speaker_2_name, photo: selectedTalk.speaker_2_photo_url, bio: selectedTalk.speaker_2_bio },
                ]
                  .filter((s) => s.name)
                  .map((s) => (
                    <div key={s.name} className="flex items-start gap-3">
                      <SpeakerAvatar name={s.name} photoUrl={s.photo} className="w-14 h-14" />
                      <div>
                        <p className="font-bold">{s.name}</p>
                        {s.bio && <p className="text-sm text-tinta-suave mt-0.5">{s.bio}</p>}
                      </div>
                    </div>
                  ))}
                {selectedTalk.institution && <p className="text-sm font-bold text-coral-oscuro">{selectedTalk.institution}</p>}
              </div>
              {selectedTalk.abstract && <p className="leading-relaxed text-tinta-suave whitespace-pre-wrap">{selectedTalk.abstract}</p>}
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={googleCalendarUrl(selectedTalk)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 min-h-12 px-6 rounded-full bg-chela text-papel font-bold hover:bg-chela-oscuro transition-colors"
                >
                  <Calendar className="w-4 h-4" /> Añadir al calendario
                </a>
                <WhatsAppShareButton talk={selectedTalk} className="w-auto" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
