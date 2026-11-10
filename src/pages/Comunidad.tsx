import React, { useState, useEffect, useMemo } from "react";
import { Users, Lightbulb, Award, ThumbsUp, Send, Search, QrCode, Ticket, Star, Mic, Check } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import SpeakerAvatar from "../components/SpeakerAvatar";
import { CoralBranch, categoryInk, categorySwatch } from "../components/brand";
import { cn, normalizeText, parseTalkDate } from "../lib/utils";

interface Suggestion {
  id: number;
  topic: string;
  description: string;
  category?: string;
  votes: number;
  created_at: string;
}

interface Speaker {
  speaker_name: string;
  speaker_bio: string;
  speaker_photo_url: string | null;
  institution?: string | null;
  talk_count: number;
  last_talk_date?: string | null;
}

interface Checkin {
  id: number;
  talk_id: number;
  title: string;
  scheduled_date: string;
  created_at: string;
}

type Tab = "suggestions" | "speakers" | "passport";

const SUGGESTION_CATEGORIES = ["General", "Ciencia", "Salud", "Sociedad", "Medio Ambiente", "Tecnología", "Arte y Cultura", "Gastronomía"];

const VOTED_KEY = "chelaxlaciencia:voted-suggestions";

const readVoted = (): number[] => {
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const fmt = (value: string | null | undefined, pattern: string) => {
  const d = parseTalkDate(value);
  return d ? format(d, pattern, { locale: es }) : "";
};

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "suggestions", label: "Propón un tema", icon: Lightbulb },
  { id: "speakers", label: "Ponentes", icon: Users },
  { id: "passport", label: "Pasaporte", icon: Award },
];

export default function Comunidad() {
  const [activeTab, setActiveTab] = useState<Tab>("suggestions");

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [voted, setVoted] = useState<number[]>(readVoted);

  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [speakersLoaded, setSpeakersLoaded] = useState(false);
  const [speakerQuery, setSpeakerQuery] = useState("");

  const [passportEmail, setPassportEmail] = useState("");
  const [passportData, setPassportData] = useState<{ count: number; checkins: Checkin[] } | null>(null);
  const [passportLoading, setPassportLoading] = useState(false);

  useEffect(() => {
    fetchSuggestions();
    fetch("/api/speakers")
      .then((res) => res.json())
      .then((data) => setSpeakers(Array.isArray(data) ? data : []))
      .catch((error) => console.error("Error fetching speakers:", error))
      .finally(() => setSpeakersLoaded(true));
  }, []);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch("/api/suggestions");
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleAddSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: newTopic.trim(), description: newDescription.trim(), category: newCategory }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "No se pudo enviar tu propuesta.");
      }
      setNewTopic("");
      setNewDescription("");
      setNewCategory("General");
      fetchSuggestions();
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "No se pudo enviar tu propuesta.");
    } finally {
      setSending(false);
    }
  };

  // El servidor limita votos por IP; esto además evita votar dos veces el mismo tema desde este navegador.
  const handleVote = async (id: number) => {
    if (voted.includes(id)) return;
    const next = [...voted, id];
    setVoted(next);
    try {
      localStorage.setItem(VOTED_KEY, JSON.stringify(next));
    } catch {
      /* almacenamiento no disponible: el voto se cuenta igual */
    }
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, votes: s.votes + 1 } : s)));
    try {
      await fetch(`/api/suggestions/${id}/vote`, { method: "POST" });
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleCheckPassport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passportEmail.trim()) return;
    setPassportLoading(true);
    try {
      const res = await fetch(`/api/passport/${encodeURIComponent(passportEmail.trim().toLowerCase())}`);
      setPassportData(await res.json());
    } catch (error) {
      console.error("Error fetching passport:", error);
    } finally {
      setPassportLoading(false);
    }
  };

  const sortedSuggestions = useMemo(() => [...suggestions].sort((a, b) => b.votes - a.votes), [suggestions]);
  const totalVotes = suggestions.reduce((n, s) => n + (s.votes || 0), 0);
  const totalTalks = speakers.reduce((n, s) => n + (s.talk_count || 0), 0);

  const filteredSpeakers = useMemo(() => {
    const q = normalizeText(speakerQuery);
    if (!q) return speakers;
    return speakers.filter(
      (s) => normalizeText(s.speaker_name).includes(q) || normalizeText(s.institution).includes(q) || normalizeText(s.speaker_bio).includes(q)
    );
  }, [speakers, speakerQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-10">
      {/* Encabezado */}
      <header className="grid md:grid-cols-[1.4fr_1fr] gap-8 items-end relative">
        <CoralBranch className="absolute -right-6 -top-10 w-48 h-48 rotate-[200deg] opacity-80 hidden md:block" />
        <div className="space-y-4 relative">
          <h1 className="font-display font-medium text-[48px] md:text-[72px] leading-[0.95] tracking-[-0.03em] text-chela">
            La ciencia se arma entre todos
          </h1>
          <p className="text-lg text-tinta-suave max-w-xl">
            Propón los temas que quieres escuchar, conoce a quienes han compartido su investigación con nosotros y sigue tu historial de asistencia.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 relative">
          {[
            { value: speakers.length, label: "ponentes", color: "#C42A5E" },
            { value: totalTalks, label: "charlas", color: "#2E6F40" },
            { value: suggestions.length, label: suggestions.length === 1 ? "tema propuesto" : "temas propuestos", color: "#B5452F" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-papel-claro border-2 border-tinta px-4 py-3">
              <p className="font-display font-semibold text-3xl" style={{ color: stat.color }}>{speakersLoaded ? stat.value : "–"}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-gris">{stat.label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Pestañas */}
      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Secciones de comunidad">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2 min-h-12 px-5 rounded-full text-[15px] font-bold whitespace-nowrap border-2 border-tinta transition-colors",
                active ? "bg-tinta text-papel" : "bg-transparent text-tinta hover:bg-crema"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* PROPÓN UN TEMA */}
      {activeTab === "suggestions" && (
        <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-start">
          <form onSubmit={handleAddSuggestion} className="lg:sticky lg:top-24 bg-papel-claro p-6 rounded-[24px] border-2 border-tinta shadow-sello-lg space-y-4">
            <div>
              <h2 className="font-display font-semibold text-2xl">¿De qué quieres que hablemos?</h2>
              <p className="text-sm text-tinta-suave mt-1">Los temas más votados nos ayudan a buscar ponentes.</p>
            </div>
            <div>
              <label htmlFor="tema" className="block text-xs font-bold uppercase tracking-wide mb-1.5">Tema</label>
              <input
                id="tema"
                type="text"
                placeholder="Ej. agujeros negros, salud mental, IA…"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                maxLength={120}
                className="w-full bg-papel border-2 border-tinta rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chela"
                required
              />
            </div>
            <fieldset>
              <legend className="block text-xs font-bold uppercase tracking-wide mb-2">Área</legend>
              <div className="flex flex-wrap gap-2">
                {SUGGESTION_CATEGORIES.map((cat) => {
                  const swatch = categorySwatch(cat);
                  const active = newCategory === cat;
                  return (
                    <button
                      type="button"
                      key={cat}
                      aria-pressed={active}
                      onClick={() => setNewCategory(cat)}
                      className="min-h-9 px-3 rounded-full text-xs font-bold border-2 transition-colors"
                      style={active ? { background: swatch.bg, color: swatch.fg, borderColor: swatch.bg } : { borderColor: "#D9CFBD", color: "#1F1D1A" }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div>
              <label htmlFor="por-que" className="block text-xs font-bold uppercase tracking-wide mb-1.5">¿Por qué te interesa? <span className="font-normal normal-case text-gris">(opcional)</span></label>
              <textarea
                id="por-que"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                maxLength={400}
                className="w-full bg-papel border-2 border-tinta rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chela h-24 resize-none"
              />
            </div>
            {sendError && <p role="alert" className="text-sm font-bold text-coral-oscuro">{sendError}</p>}
            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 min-h-12 rounded-full bg-ambar text-tinta font-bold shadow-sello disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {sending ? "Enviando…" : "Enviar propuesta"}
            </button>
          </form>

          <section className="space-y-3" aria-labelledby="temas">
            <div className="flex items-end justify-between gap-3">
              <h2 id="temas" className="font-display font-semibold text-2xl">Temas propuestos</h2>
              <span className="text-sm text-gris">
                {suggestions.length} {suggestions.length === 1 ? "tema" : "temas"} · {totalVotes} {totalVotes === 1 ? "voto" : "votos"}
              </span>
            </div>
            {sortedSuggestions.map((sugg, idx) => {
              const hasVoted = voted.includes(sugg.id);
              return (
                <article key={sugg.id} className="bg-papel-claro p-4 rounded-2xl border border-borde flex items-center gap-4">
                  <span className="w-8 text-center font-display font-semibold text-2xl text-gris">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-lg">{sugg.topic}</h3>
                      {sugg.category && <span className="text-xs font-bold" style={{ color: categoryInk(sugg.category) }}>{sugg.category}</span>}
                    </div>
                    {sugg.description && <p className="text-tinta-suave mt-1 text-sm line-clamp-2">{sugg.description}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVote(sugg.id)}
                    disabled={hasVoted}
                    aria-label={hasVoted ? `Ya votaste por ${sugg.topic}` : `Votar por ${sugg.topic}`}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-2xl min-w-[64px] min-h-[60px] border-2 transition-colors",
                      hasVoted ? "bg-chela border-chela text-papel" : "bg-papel border-tinta text-tinta hover:bg-ambar"
                    )}
                  >
                    {hasVoted ? <Check className="w-4 h-4" /> : <ThumbsUp className="w-4 h-4" />}
                    <span className="font-bold">{sugg.votes}</span>
                  </button>
                </article>
              );
            })}
            {suggestions.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-borde p-10 text-center">
                <Lightbulb className="w-10 h-10 text-borde mx-auto mb-3" />
                <p className="text-tinta-suave">Aún no hay temas propuestos. ¡Abre la conversación!</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* PONENTES */}
      {activeTab === "speakers" && (
        <section className="space-y-6" aria-labelledby="ponentes">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 id="ponentes" className="font-display font-semibold text-3xl">Quienes han compartido su ciencia</h2>
              <p className="text-tinta-suave mt-1">Investigadoras, estudiantes y divulgadores que se han subido al escenario de Casa Pädi.</p>
            </div>
            <label className="flex items-center gap-2.5 min-h-12 px-4 rounded-full bg-papel-claro border-2 border-tinta sm:w-72 focus-within:ring-2 focus-within:ring-chela">
              <Search className="w-4 h-4 text-gris shrink-0" aria-hidden="true" />
              <span className="sr-only">Buscar ponente</span>
              <input
                type="search"
                value={speakerQuery}
                onChange={(e) => setSpeakerQuery(e.target.value)}
                placeholder="Busca un nombre o institución"
                className="w-full bg-transparent outline-none text-[15px] placeholder:text-gris"
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSpeakers.map((speaker) => (
              <article key={speaker.speaker_name} className="bg-papel-claro rounded-[22px] p-5 border border-borde hover:border-tinta hover:shadow-sello transition-all flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <SpeakerAvatar name={speaker.speaker_name} photoUrl={speaker.speaker_photo_url} className="w-16 h-16" textClassName="text-lg" />
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold leading-snug line-clamp-2">{speaker.speaker_name}</h3>
                    {speaker.institution && <p className="text-xs font-bold text-coral-oscuro line-clamp-1 mt-0.5">{speaker.institution}</p>}
                  </div>
                </div>
                {speaker.speaker_bio && <p className="text-sm text-tinta-suave line-clamp-3">{speaker.speaker_bio}</p>}
                <div className="flex items-center justify-between text-sm mt-auto pt-3 border-t border-borde">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Star className="w-4 h-4 fill-ambar text-ambar-oscuro" aria-hidden="true" />
                    {speaker.talk_count} {speaker.talk_count === 1 ? "charla" : "charlas"}
                  </span>
                  {speaker.last_talk_date && <span className="font-fecha italic text-base text-gris first-letter:uppercase">{fmt(speaker.last_talk_date, "MMMM yyyy")}</span>}
                </div>
              </article>
            ))}
          </div>

          {speakersLoaded && filteredSpeakers.length === 0 && <p className="text-center text-tinta-suave py-8">Ningún ponente coincide con la búsqueda.</p>}

          <div className="rounded-[24px] bg-ambar border-2 border-tinta shadow-sello-lg p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-display font-semibold text-xl">¿Tienes algo que contar?</p>
              <p className="text-tinta">Tu investigación, tu tesis o ese tema que te apasiona caben aquí.</p>
            </div>
            <Link to="/registro" className="inline-flex items-center gap-2 min-h-12 px-6 rounded-full bg-tinta text-papel font-bold whitespace-nowrap hover:bg-noche transition-colors">
              Proponer una charla <Mic className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* PASAPORTE */}
      {activeTab === "passport" && (
        <section className="max-w-2xl mx-auto bg-papel-claro rounded-[28px] border-2 border-tinta shadow-sello-lg p-6 md:p-10" aria-labelledby="pasaporte">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ambar border-2 border-tinta mb-4">
              <QrCode className="w-8 h-8" aria-hidden="true" />
            </div>
            <h2 id="pasaporte" className="font-display font-semibold text-3xl mb-2">Pasaporte científico</h2>
            <p className="text-tinta-suave">
              Acumula 5 asistencias y gana una chela o mercancía oficial. Consulta tu historial con el correo que registraste en la barra.
            </p>
          </div>

          <form onSubmit={handleCheckPassport} className="flex gap-2 mb-8">
            <label htmlFor="pasaporte-email" className="sr-only">Correo electrónico</label>
            <input
              id="pasaporte-email"
              type="email"
              placeholder="tu@correo.com"
              value={passportEmail}
              onChange={(e) => setPassportEmail(e.target.value)}
              className="flex-1 bg-papel border-2 border-tinta rounded-full px-5 min-h-12 focus:outline-none focus:ring-2 focus:ring-chela"
              required
            />
            <button type="submit" disabled={passportLoading} aria-label="Consultar pasaporte" className="min-h-12 px-5 rounded-full bg-chela text-papel font-bold disabled:opacity-50">
              <Search className="w-5 h-5" />
            </button>
          </form>

          {passportData && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-baseline mb-3">
                  <p className="font-bold">Tu progreso</p>
                  <p className="font-display font-semibold text-chela">{Math.min(passportData.count, 5)} / 5</p>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const stamped = i < passportData.count;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "aspect-square rounded-full border-2 flex items-center justify-center",
                          stamped ? "border-tinta bg-coral rotate-[-8deg]" : "border-dashed border-borde"
                        )}
                      >
                        {stamped ? <Check className="w-6 h-6" /> : <span className="text-sm text-gris font-bold">{i + 1}</span>}
                      </div>
                    );
                  })}
                </div>
                {passportData.count >= 5 && (
                  <div className="mt-4 bg-ambar border-2 border-tinta rounded-2xl p-4 flex items-center gap-3">
                    <Ticket className="w-8 h-8 shrink-0" aria-hidden="true" />
                    <p><span className="font-bold">¡Meta alcanzada!</span> Muestra esta pantalla en la barra para reclamar tu recompensa.</p>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-gris mb-3">Historial</h3>
                <div className="space-y-2">
                  {passportData.checkins.map((checkin) => (
                    <div key={checkin.id} className="flex items-center justify-between bg-papel p-3 rounded-xl border border-borde">
                      <span className="line-clamp-1">{checkin.title}</span>
                      <span className="text-sm text-gris whitespace-nowrap ml-4">{fmt(checkin.scheduled_date, "d MMM yyyy") || "—"}</span>
                    </div>
                  ))}
                  {passportData.checkins.length === 0 && (
                    <p className="text-tinta-suave text-center py-4">Aún no hay asistencias con este correo. Pide que te registren en tu próxima visita.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
