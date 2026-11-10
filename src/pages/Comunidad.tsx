import React, { useState, useEffect, useMemo } from "react";
import { Users, Lightbulb, Award, ThumbsUp, Send, Search, QrCode, Ticket, Star, Mic, Check } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import SpeakerAvatar, { getAccentColor } from "../components/SpeakerAvatar";
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

const SUGGESTION_CATEGORIES = [
  "General", "Ciencia", "Salud", "Sociedad", "Medio Ambiente", "Tecnología", "Arte y Cultura", "Gastronomía",
];

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

const TABS: { id: Tab; label: string; icon: typeof Users; color: string }[] = [
  { id: "suggestions", label: "Propón un tema", icon: Lightbulb, color: "#00FFCC" },
  { id: "speakers", label: "Ponentes", icon: Users, color: "#FF3366" },
  { id: "passport", label: "Pasaporte", icon: Award, color: "#FFCC00" },
];

export default function Comunidad() {
  const [activeTab, setActiveTab] = useState<Tab>("suggestions");

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [sending, setSending] = useState(false);
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
    try {
      await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: newTopic.trim(), description: newDescription.trim(), category: newCategory }),
      });
      setNewTopic("");
      setNewDescription("");
      setNewCategory("General");
      fetchSuggestions();
    } catch (error) {
      console.error("Error adding suggestion:", error);
    } finally {
      setSending(false);
    }
  };

  // El backend no limita votos por persona; esto solo evita votos repetidos
  // accidentales desde el mismo navegador.
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
    <div className="max-w-6xl mx-auto py-6 space-y-10">
      {/* Encabezado */}
      <header className="relative overflow-hidden rounded-3xl border border-[#333333] bg-gradient-to-br from-[#141414] via-[#0F0F0F] to-[#141414] px-6 py-10 md:px-12 md:py-14">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#FF3366]/20 blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[#00FFCC]/15 blur-[90px] pointer-events-none" />
        <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF3366]/10 border border-[#FF3366]/30 text-[#FF3366] text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" /> Comunidad
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight">
              La ciencia se arma <span className="text-[#00FFCC]">entre todos</span>
            </h1>
            <p className="text-[#A0A0A0] max-w-lg">
              Propón los temas que quieres escuchar, conoce a quienes han compartido su investigación con nosotros y sigue tu historial de asistencia.
            </p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-1 gap-3">
            {[
              { value: speakers.length, label: "ponentes", color: "#FF3366" },
              { value: totalTalks, label: "charlas compartidas", color: "#00FFCC" },
              { value: suggestions.length, label: "temas propuestos", color: "#FFCC00" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-black/30 border border-[#333333] px-4 py-3 md:flex md:items-baseline md:gap-3">
                <p className="text-2xl md:text-3xl font-serif font-bold" style={{ color: stat.color }}>
                  {speakersLoaded ? stat.value : "–"}
                </p>
                <p className="text-[11px] md:text-xs text-[#A0A0A0] uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Pestañas */}
      <nav className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" aria-label="Secciones de comunidad">
        {TABS.map(({ id, label, icon: Icon, color }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border",
                active ? "text-black" : "bg-[#141414] text-[#A0A0A0] hover:text-white border-[#333333]"
              )}
              style={active ? { background: color, borderColor: color, boxShadow: `0 0 20px ${color}4D` } : undefined}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* PROPÓN UN TEMA */}
      {activeTab === "suggestions" && (
        <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
          <form onSubmit={handleAddSuggestion} className="lg:sticky lg:top-24 bg-[#141414] p-6 rounded-2xl border border-[#333333] space-y-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-white">¿De qué quieres que hablemos?</h2>
              <p className="text-sm text-[#A0A0A0] mt-1">Los temas más votados nos ayudan a buscar ponentes.</p>
            </div>
            <input
              type="text"
              placeholder="Ej. Agujeros negros, salud mental, IA..."
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              maxLength={120}
              className="w-full bg-[#0A0A0A] border border-[#333333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00FFCC] transition-colors"
              required
            />
            <div className="flex flex-wrap gap-2">
              {SUGGESTION_CATEGORIES.map((cat) => {
                const color = getAccentColor(cat);
                const active = newCategory === cat;
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className="px-3 py-1 rounded-full text-xs font-bold border transition-colors"
                    style={
                      active
                        ? { background: `${color}26`, borderColor: color, color }
                        : { borderColor: "#333333", color: "#A0A0A0" }
                    }
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            <textarea
              placeholder="¿Por qué te interesa? (opcional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              maxLength={400}
              className="w-full bg-[#0A0A0A] border border-[#333333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00FFCC] transition-colors h-24 resize-none"
            />
            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 bg-[#00FFCC] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#00E6B8] transition-colors disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {sending ? "Enviando..." : "Enviar propuesta"}
            </button>
          </form>

          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <h3 className="text-lg font-bold text-white">Temas propuestos</h3>
              <span className="text-xs text-[#A0A0A0]">
                {suggestions.length} {suggestions.length === 1 ? "tema" : "temas"} · {totalVotes} {totalVotes === 1 ? "voto" : "votos"}
              </span>
            </div>
            {sortedSuggestions.map((sugg, idx) => {
              const color = getAccentColor(sugg.category || "General");
              const hasVoted = voted.includes(sugg.id);
              return (
                <div key={sugg.id} className="bg-[#141414] p-4 rounded-2xl border border-[#333333] flex items-center gap-4">
                  <span className="w-8 text-center text-lg font-serif font-bold text-[#666666]">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-white">{sugg.topic}</h4>
                      {sugg.category && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ color, borderColor: `${color}55` }}>
                          {sugg.category}
                        </span>
                      )}
                    </div>
                    {sugg.description && <p className="text-[#A0A0A0] mt-1 text-sm line-clamp-2">{sugg.description}</p>}
                  </div>
                  <button
                    onClick={() => handleVote(sugg.id)}
                    disabled={hasVoted}
                    aria-label={hasVoted ? "Ya votaste por este tema" : `Votar por ${sugg.topic}`}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[60px] border transition-colors",
                      hasVoted
                        ? "bg-[#00FFCC]/10 border-[#00FFCC]/40 text-[#00FFCC]"
                        : "bg-[#0A0A0A] border-[#333333] text-white hover:border-[#00FFCC]/60"
                    )}
                  >
                    {hasVoted ? <Check className="w-4 h-4 mb-0.5" /> : <ThumbsUp className="w-4 h-4 mb-0.5 text-[#00FFCC]" />}
                    <span className="font-bold text-sm">{sugg.votes}</span>
                  </button>
                </div>
              );
            })}
            {suggestions.length === 0 && (
              <div className="bg-[#141414] rounded-2xl border border-dashed border-[#333333] p-10 text-center">
                <Lightbulb className="w-10 h-10 text-[#333333] mx-auto mb-3" />
                <p className="text-[#A0A0A0] text-sm">Aún no hay temas propuestos. ¡Abre la conversación!</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* PONENTES */}
      {activeTab === "speakers" && (
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-serif font-bold text-white">Quienes han compartido su ciencia</h2>
              <p className="text-sm text-[#A0A0A0] mt-1">Investigadoras, estudiantes y divulgadores que se han subido al escenario de Casa Pädi.</p>
            </div>
            <div className="relative sm:w-64">
              <Search className="w-4 h-4 text-[#A0A0A0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={speakerQuery}
                onChange={(e) => setSpeakerQuery(e.target.value)}
                placeholder="Buscar ponente o institución"
                className="w-full bg-[#141414] border border-[#333333] rounded-full pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#FF3366] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpeakers.map((speaker) => (
              <article
                key={speaker.speaker_name}
                className="bg-[#141414] rounded-2xl p-5 border border-[#333333] hover:border-[#FF3366]/40 transition-colors flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <SpeakerAvatar name={speaker.speaker_name} photoUrl={speaker.speaker_photo_url} className="w-14 h-14" textClassName="text-base" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-white leading-snug line-clamp-2">{speaker.speaker_name}</h3>
                    {speaker.institution && <p className="text-[11px] text-[#9933FF] line-clamp-1 mt-0.5">{speaker.institution}</p>}
                  </div>
                </div>
                {speaker.speaker_bio && <p className="text-sm text-[#A0A0A0] line-clamp-3">{speaker.speaker_bio}</p>}
                <div className="flex items-center justify-between text-xs mt-auto pt-3 border-t border-[#262626]">
                  <span className="flex items-center gap-1 text-[#FFCC00] font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {speaker.talk_count} {speaker.talk_count === 1 ? "charla" : "charlas"}
                  </span>
                  {speaker.last_talk_date && (
                    <span className="text-[#A0A0A0] first-letter:uppercase">{fmt(speaker.last_talk_date, "MMMM yyyy")}</span>
                  )}
                </div>
              </article>
            ))}
          </div>

          {speakersLoaded && filteredSpeakers.length === 0 && (
            <p className="text-center text-sm text-[#A0A0A0] py-8">Ningún ponente coincide con la búsqueda.</p>
          )}

          <div className="rounded-2xl border border-[#FFCC00]/30 bg-[#FFCC00]/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white">¿Tienes algo que contar?</p>
              <p className="text-sm text-[#A0A0A0]">Tu investigación, tu tesis o ese tema que te apasiona caben aquí.</p>
            </div>
            <Link to="/registro" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFCC00] text-black text-sm font-bold hover:bg-[#E6B800] transition-colors whitespace-nowrap">
              Proponer una charla <Mic className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* PASAPORTE */}
      {activeTab === "passport" && (
        <section className="max-w-2xl mx-auto bg-[#141414] rounded-3xl border border-[#333333] p-6 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FFCC00]/10 border border-[#FFCC00]/30 mb-4">
              <QrCode className="w-8 h-8 text-[#FFCC00]" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">Pasaporte científico</h2>
            <p className="text-[#A0A0A0] text-sm">
              Acumula 5 asistencias y gana una chela o mercancía oficial. Consulta tu historial con el correo que registraste en la barra.
            </p>
          </div>

          <form onSubmit={handleCheckPassport} className="flex gap-2 mb-8">
            <input
              type="email"
              placeholder="tu@correo.com"
              value={passportEmail}
              onChange={(e) => setPassportEmail(e.target.value)}
              className="flex-1 bg-[#0A0A0A] border border-[#333333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFCC00] transition-colors"
              required
            />
            <button
              type="submit"
              disabled={passportLoading}
              aria-label="Consultar pasaporte"
              className="bg-[#FFCC00] text-black px-5 py-3 rounded-xl font-bold hover:bg-[#E6B800] transition-colors disabled:opacity-50"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          {passportData && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-baseline mb-3">
                  <p className="text-sm text-[#A0A0A0]">Tu progreso</p>
                  <p className="text-sm font-bold text-[#FFCC00]">
                    {Math.min(passportData.count, 5)} / 5
                  </p>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const stamped = i < passportData.count;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "aspect-square rounded-xl border-2 border-dashed flex items-center justify-center transition-colors",
                          stamped ? "border-[#FFCC00] bg-[#FFCC00]/15" : "border-[#333333]"
                        )}
                      >
                        {stamped ? <Check className="w-6 h-6 text-[#FFCC00]" /> : <span className="text-xs text-[#444444] font-bold">{i + 1}</span>}
                      </div>
                    );
                  })}
                </div>
                {passportData.count >= 5 && (
                  <div className="mt-4 bg-[#FFCC00]/10 border border-[#FFCC00]/30 rounded-xl p-4 flex items-center gap-3">
                    <Ticket className="w-8 h-8 text-[#FFCC00] shrink-0" />
                    <p className="text-sm text-white">
                      <span className="text-[#FFCC00] font-bold">¡Meta alcanzada!</span> Muestra esta pantalla en la barra para reclamar tu recompensa.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-3">Historial</h4>
                <div className="space-y-2">
                  {passportData.checkins.map((checkin) => (
                    <div key={checkin.id} className="flex items-center justify-between bg-[#0A0A0A] p-3 rounded-xl border border-[#262626]">
                      <span className="text-sm text-white line-clamp-1">{checkin.title}</span>
                      <span className="text-xs text-[#A0A0A0] whitespace-nowrap ml-4">{fmt(checkin.scheduled_date, "dd MMM yyyy") || "—"}</span>
                    </div>
                  ))}
                  {passportData.checkins.length === 0 && (
                    <p className="text-[#A0A0A0] text-sm text-center py-4">
                      Aún no hay asistencias con este correo. Pide que te registren en tu próxima visita.
                    </p>
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
