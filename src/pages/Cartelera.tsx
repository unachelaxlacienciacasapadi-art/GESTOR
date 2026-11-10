import React, { useState, useEffect, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, MapPin, Clock, Image as ImageIcon, X, ChevronLeft, ChevronRight, MonitorPlay, Search, Archive, Sparkles, Mic, Users } from "lucide-react";
import { Link } from "react-router-dom";
import WhatsAppShareButton from "../components/WhatsAppShareButton";
import SpeakerAvatar, { getAccentColor } from "../components/SpeakerAvatar";
import { Talk } from "../types/talk";
import { cn, normalizeText, parseTalkDate, startOfToday } from "../lib/utils";

const fmt = (value: string | null | undefined, pattern: string) => {
  const d = parseTalkDate(value);
  return d ? format(d, pattern, { locale: es }) : "";
};

const pad = (n: number) => String(n).padStart(2, "0");

// Fechas sin "Z" + ctz: Google Calendar las interpreta como hora de CDMX sin
// importar la zona horaria del navegador de quien la agrega.
const getCalendarLink = (talk: Talk) => {
  const start = parseTalkDate(talk.scheduled_date);
  if (!start) return "#";
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const stamp = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: talk.title,
    dates: `${stamp(start)}/${stamp(end)}`,
    ctz: "America/Mexico_City",
    details: talk.description_short || talk.abstract || "",
    location: "Casa Pädi, Av. Piracantos 1507, Col. Alborada, Pachuca",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const speakerLine = (talk: Talk) =>
  [talk.speaker_name, talk.speaker_2_name].filter(Boolean).join(" y ");

const blurb = (talk: Talk) => talk.description_short || talk.abstract || "";

const CategoryChip = ({ category, className }: { category?: string; className?: string }) => {
  if (!category) return null;
  const color = getAccentColor(category);
  return (
    <span
      className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", className)}
      style={{ color, borderColor: `${color}55`, background: `${color}14` }}
    >
      {category}
    </span>
  );
};

const DateBlock = ({ value, accent }: { value?: string | null; accent: string }) => (
  <div
    className="flex flex-col items-center justify-center rounded-xl border w-16 h-16 shrink-0"
    style={{ borderColor: `${accent}55`, background: `${accent}12`, color: accent }}
  >
    <span className="text-[10px] font-bold uppercase tracking-wider leading-none">{fmt(value, "MMM")}</span>
    <span className="text-2xl font-serif font-bold leading-none mt-1">{fmt(value, "d")}</span>
  </div>
);

export default function Cartelera() {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);
  const [eventPhotos, setEventPhotos] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/talks")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setTalks(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Failed to fetch talks", error);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const openModal = (talk: Talk) => {
    setSelectedTalk(talk);
    setEventPhotos([]);
    setFeedbackRating(0);
    setFeedbackComment("");
    setFeedbackSubmitted(false);
    // Las fotos del evento no vienen en el listado (pueden pesar varios MB).
    fetch(`/api/talks/${talk.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((detail) => {
        if (!detail?.event_photos) return;
        try {
          const photos = JSON.parse(detail.event_photos);
          if (Array.isArray(photos)) setEventPhotos(photos);
        } catch {
          /* event_photos con formato inválido: se ignora */
        }
      })
      .catch(console.error);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTalk || feedbackRating === 0) return;
    try {
      await fetch(`/api/talks/${selectedTalk.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment }),
      });
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error("Failed to submit feedback", error);
    }
  };

  const todayStart = startOfToday();
  const isPastTalk = (talk: Talk) => (parseTalkDate(talk.scheduled_date)?.getTime() ?? Infinity) < todayStart;

  const categories = useMemo(
    () => Array.from(new Set(talks.map((t) => t.category || "General"))).sort((a, b) => a.localeCompare(b, "es")),
    [talks]
  );

  const filtered = useMemo(() => {
    const q = normalizeText(searchQuery);
    return talks.filter((talk) => {
      const matchesSearch =
        !q ||
        normalizeText(talk.title).includes(q) ||
        normalizeText(speakerLine(talk)).includes(q) ||
        normalizeText(talk.institution).includes(q);
      const matchesCategory = selectedCategory === "Todas" || (talk.category || "General") === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [talks, searchQuery, selectedCategory]);

  const upcoming = useMemo(
    () =>
      filtered
        .filter((t) => !isPastTalk(t))
        .sort((a, b) => (parseTalkDate(a.scheduled_date)?.getTime() ?? 0) - (parseTalkDate(b.scheduled_date)?.getTime() ?? 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, todayStart]
  );

  const pastByMonth = useMemo(() => {
    const past = filtered
      .filter(isPastTalk)
      .sort((a, b) => (parseTalkDate(b.scheduled_date)?.getTime() ?? 0) - (parseTalkDate(a.scheduled_date)?.getTime() ?? 0));
    const groups: { key: string; label: string; talks: Talk[] }[] = [];
    for (const talk of past) {
      const key = fmt(talk.scheduled_date, "yyyy-MM");
      let group = groups.find((g) => g.key === key);
      if (!group) {
        group = { key, label: fmt(talk.scheduled_date, "MMMM yyyy"), talks: [] };
        groups.push(group);
      }
      group.talks.push(talk);
    }
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, todayStart]);

  const pastCount = pastByMonth.reduce((n, g) => n + g.talks.length, 0);
  const speakerCount = useMemo(
    () => new Set(talks.map((t) => normalizeText(t.speaker_name))).size,
    [talks]
  );

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const getTalksForDay = (date: Date) =>
    filtered.filter((talk) => {
      const d = parseTalkDate(talk.scheduled_date);
      return d ? isSameDay(d, date) : false;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#FF3366]/30 border-t-[#FF3366] rounded-full animate-spin" />
      </div>
    );
  }

  const [featured, ...restUpcoming] = upcoming;
  const isFiltering = searchQuery.trim() !== "" || selectedCategory !== "Todas";

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-10">
      {/* Encabezado */}
      <div className="text-center space-y-4">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FFCC]/10 border border-[#00FFCC]/30 text-[#00FFCC] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Miércoles de ciencia · Casa Pädi
        </span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">Cartelera</h1>
        <p className="text-sm md:text-base text-[#A0A0A0] max-w-xl mx-auto">
          Charlas de divulgación con entrada libre, una chela en la mano y mucha curiosidad.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {[
            { icon: Calendar, label: "próximas", value: talks.length - talks.filter(isPastTalk).length, color: "#00FFCC" },
            { icon: Archive, label: "realizadas", value: talks.filter(isPastTalk).length, color: "#FFCC00" },
            { icon: Users, label: "ponentes", value: speakerCount, color: "#FF3366" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141414] border border-[#333333] text-xs text-[#A0A0A0]">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <span className="font-bold text-white">{value}</span> {label}
            </div>
          ))}
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex bg-[#141414] rounded-full p-1 border border-[#333333] self-center md:self-auto">
          {(["list", "calendar"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                viewMode === mode ? "bg-[#00FFCC] text-black shadow-[0_0_10px_rgba(0,255,204,0.4)]" : "text-[#A0A0A0] hover:text-white"
              )}
            >
              {mode === "list" ? "Lista" : "Calendario"}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#141414] border border-[#333333] rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-[#00FFCC] transition-colors"
          >
            <option value="Todas">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-[#A0A0A0] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar charla, ponente o institución..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414] border border-[#333333] rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#00FFCC] transition-colors"
            />
          </div>
        </div>
      </div>

      {loadError && (
        <div className="bg-[#FF3366]/10 border border-[#FF3366]/30 rounded-2xl p-6 text-center text-sm text-[#FF3366]">
          No pudimos cargar la cartelera. Revisa tu conexión e inténtalo de nuevo.
        </div>
      )}

      {viewMode === "list" ? (
        <>
          {/* Próximas */}
          <section className="space-y-5">
            <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[#00FFCC]" />
              Próximas charlas
            </h2>

            {!featured ? (
              <div className="bg-[#141414] rounded-2xl p-10 text-center border border-dashed border-[#333333] space-y-4">
                <Mic className="w-10 h-10 text-[#333333] mx-auto" />
                <p className="text-[#A0A0A0] text-sm">
                  {isFiltering ? "Ninguna charla próxima coincide con tu búsqueda." : "Aún no hay charlas programadas."}
                </p>
                {!isFiltering && (
                  <Link to="/registro" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFCC00] text-black text-sm font-bold hover:bg-[#E6B800] transition-colors">
                    Proponer una charla <Mic className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Destacada: la siguiente charla */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openModal(featured)}
                  onKeyDown={(e) => {
                    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      openModal(featured);
                    }
                  }}
                  className="w-full text-left cursor-pointer bg-gradient-to-br from-[#00FFCC]/10 via-[#141414] to-[#141414] rounded-3xl border border-[#00FFCC]/30 overflow-hidden grid md:grid-cols-[260px_1fr] hover:border-[#00FFCC]/60 hover:shadow-[0_0_30px_rgba(0,255,204,0.12)] transition-all group"
                >
                  <div className="relative h-56 md:h-full bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
                    {featured.flyer_image_url || featured.speaker_photo_url ? (
                      <img
                        src={featured.flyer_image_url || featured.speaker_photo_url || ""}
                        alt={featured.speaker_name}
                        className="w-full h-full object-cover object-[center_30%] group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <SpeakerAvatar name={featured.speaker_name || ""} className="w-32 h-32" textClassName="text-4xl" />
                    )}
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#00FFCC] text-black text-[10px] font-bold uppercase tracking-wider">
                      La siguiente
                    </span>
                  </div>
                  <div className="p-6 md:p-8 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <DateBlock value={featured.scheduled_date} accent="#00FFCC" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#00FFCC] first-letter:uppercase">{fmt(featured.scheduled_date, "EEEE d 'de' MMMM")}</p>
                        <p className="text-xs text-[#A0A0A0] flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" /> {fmt(featured.scheduled_date, "HH:mm")} hrs · Entrada libre
                        </p>
                        <CategoryChip category={featured.category} className="inline-block mt-2" />
                      </div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight group-hover:text-[#00FFCC] transition-colors">
                      {featured.title}
                    </h3>
                    <div>
                      <p className="text-sm font-bold text-[#E0E0E0]">{speakerLine(featured)}</p>
                      {featured.institution && <p className="text-xs text-[#9933FF] mt-0.5">{featured.institution}</p>}
                    </div>
                    {blurb(featured) && <p className="text-sm text-[#A0A0A0] line-clamp-3">{blurb(featured)}</p>}
                    <div className="flex flex-wrap items-center gap-3 pt-3 mt-auto border-t border-[#333333]" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={getCalendarLink(featured)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-[#E0E0E0] transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Añadir al calendario
                      </a>
                      <WhatsAppShareButton talk={featured} variant="compact" />
                      {featured.transmission_url && (
                        <a href={featured.transmission_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#FF3366] text-xs font-bold">
                          <MonitorPlay className="w-4 h-4" /> Ver en vivo
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {restUpcoming.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {restUpcoming.map((talk) => {
                      const accent = getAccentColor(talk.category || "General");
                      return (
                        <button
                          key={talk.id}
                          onClick={() => openModal(talk)}
                          className="text-left bg-[#141414] rounded-2xl border border-[#333333] p-5 flex flex-col gap-4 hover:border-[#00FFCC]/40 hover:-translate-y-0.5 transition-all group"
                        >
                          <div className="flex items-start gap-4">
                            <DateBlock value={talk.scheduled_date} accent={accent} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-[#A0A0A0] first-letter:uppercase">
                                  {fmt(talk.scheduled_date, "EEEE")} · {fmt(talk.scheduled_date, "HH:mm")} hrs
                                </p>
                                <CategoryChip category={talk.category} />
                              </div>
                              <h3 className="text-lg font-serif font-bold text-white leading-snug mt-1 line-clamp-3 group-hover:text-[#00FFCC] transition-colors">
                                {talk.title}
                              </h3>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-auto">
                            <SpeakerAvatar name={talk.speaker_name || ""} photoUrl={talk.speaker_photo_url} className="w-9 h-9" textClassName="text-xs" />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#E0E0E0] line-clamp-1">{speakerLine(talk)}</p>
                              {talk.institution && <p className="text-[11px] text-[#A0A0A0] line-clamp-1">{talk.institution}</p>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Archivo */}
          {pastCount > 0 && (
            <section className="space-y-6 pt-4">
              <div className="flex items-end justify-between gap-4 border-b border-[#333333] pb-3">
                <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                  <Archive className="w-6 h-6 text-[#FFCC00]" />
                  Archivo de charlas
                </h2>
                <span className="text-xs text-[#A0A0A0]">{pastCount} realizadas</span>
              </div>

              {pastByMonth.map((group) => (
                <div key={group.key} className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFCC00]/80 capitalize">
                    {group.label} <span className="text-[#555555]">· {group.talks.length}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.talks.map((talk) => (
                      <button
                        key={talk.id}
                        onClick={() => openModal(talk)}
                        className="text-left bg-[#111111] rounded-xl p-4 border border-[#2A2A2A] hover:border-[#FFCC00]/40 hover:bg-[#141414] transition-all flex gap-3 group"
                      >
                        <SpeakerAvatar name={talk.speaker_name || ""} photoUrl={talk.speaker_photo_url} className="w-11 h-11" textClassName="text-xs" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-[#A0A0A0] first-letter:uppercase">{fmt(talk.scheduled_date, "EEEE d 'de' MMMM")}</p>
                          <h4 className="font-serif font-bold text-white text-sm leading-snug line-clamp-2 mt-0.5 group-hover:text-[#FFCC00] transition-colors">
                            {talk.title}
                          </h4>
                          <p className="text-[11px] text-[#A0A0A0] line-clamp-1 mt-1">{speakerLine(talk)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      ) : (
        <section className="space-y-4">
          <div className="bg-[#141414] rounded-2xl border border-[#333333] overflow-hidden">
            <div className="p-4 border-b border-[#333333] flex justify-between items-center bg-[#0A0A0A]">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-[#1A1A1A] rounded-full text-[#A0A0A0] hover:text-white transition-colors" aria-label="Mes anterior">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-serif font-bold text-white capitalize">{format(currentMonth, "MMMM yyyy", { locale: es })}</h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-[#1A1A1A] rounded-full text-[#A0A0A0] hover:text-white transition-colors" aria-label="Mes siguiente">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[700px] grid grid-cols-7 gap-px bg-[#333333]">
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                  <div key={day} className="bg-[#0A0A0A] py-2 text-center text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">{day}</div>
                ))}
                {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-[#141414] min-h-[100px]" />
                ))}
                {daysInMonth.map((date) => {
                  const dayTalks = getTalksForDay(date);
                  const today = isToday(date);
                  return (
                    <div
                      key={date.toISOString()}
                      className={cn(
                        "min-h-[100px] p-2 bg-[#141414]",
                        !isSameMonth(date, currentMonth) && "opacity-50",
                        today && "ring-1 ring-inset ring-[#00FFCC]/50 bg-[#00FFCC]/5"
                      )}
                    >
                      <div className={cn("text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full", today ? "bg-[#00FFCC] text-black" : "text-[#A0A0A0]")}>
                        {format(date, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayTalks.map((talk) => (
                          <button
                            key={talk.id}
                            onClick={() => openModal(talk)}
                            className={cn(
                              "w-full text-left text-[10px] p-1.5 rounded border transition-colors",
                              isPastTalk(talk)
                                ? "bg-[#FFCC00]/10 border-[#FFCC00]/30 text-[#FFCC00] hover:bg-[#FFCC00]/20"
                                : "bg-[#00FFCC]/10 border-[#00FFCC]/30 text-[#00FFCC] hover:bg-[#00FFCC]/20"
                            )}
                          >
                            <div className="font-bold">{fmt(talk.scheduled_date, "HH:mm")}</div>
                            <div className="line-clamp-2 mt-0.5">{talk.title}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {Array.from({ length: 6 - daysInMonth[daysInMonth.length - 1].getDay() }).map((_, i) => (
                  <div key={`empty-end-${i}`} className="bg-[#141414] min-h-[100px]" />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 text-xs text-[#A0A0A0]">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#00FFCC]/20 border border-[#00FFCC]/50" /> Próximas</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FFCC00]/20 border border-[#FFCC00]/50" /> Realizadas</div>
          </div>
        </section>
      )}

      {/* Modal de detalle */}
      {selectedTalk && (() => {
        const past = isPastTalk(selectedTalk);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedTalk(null)}>
            <div className="bg-[#141414] rounded-2xl shadow-2xl border border-[#333333] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b border-[#333333]">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full", past ? "bg-[#FFCC00]/15 text-[#FFCC00]" : "bg-[#00FFCC]/15 text-[#00FFCC]")}>
                  {past ? "Charla realizada" : "Próxima charla"}
                </span>
                <div className="flex items-center gap-3">
                  {!past && <WhatsAppShareButton talk={selectedTalk} variant="compact" />}
                  <button onClick={() => setSelectedTalk(null)} className="text-[#A0A0A0] hover:text-white transition-colors" aria-label="Cerrar">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <p className={cn("text-sm font-bold first-letter:uppercase", past ? "text-[#FFCC00]" : "text-[#00FFCC]")}>
                      {fmt(selectedTalk.scheduled_date, "EEEE d 'de' MMMM, yyyy · HH:mm")} hrs
                    </p>
                    <CategoryChip category={selectedTalk.category} />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-white mb-5 leading-tight">{selectedTalk.title}</h2>

                  <div className="space-y-3">
                    {[
                      { name: selectedTalk.speaker_name, photo: selectedTalk.speaker_photo_url, bio: selectedTalk.speaker_bio },
                      { name: selectedTalk.speaker_2_name, photo: selectedTalk.speaker_2_photo_url, bio: selectedTalk.speaker_2_bio },
                    ]
                      .filter((s) => s.name)
                      .map((s) => (
                        <div key={s.name} className="flex items-start gap-3">
                          <SpeakerAvatar name={s.name || ""} photoUrl={s.photo} className="w-12 h-12" />
                          <div>
                            <p className="font-bold text-sm text-[#E0E0E0]">{s.name}</p>
                            {s.bio && <p className="text-xs text-[#A0A0A0] mt-0.5">{s.bio}</p>}
                          </div>
                        </div>
                      ))}
                    {selectedTalk.institution && <p className="text-xs text-[#9933FF]">{selectedTalk.institution}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">
                    {past && (selectedTalk.recap_summary || selectedTalk.summary) ? "Resumen del evento" : "De qué trata"}
                  </h4>
                  <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#333333] text-[#E0E0E0] text-sm leading-relaxed whitespace-pre-wrap">
                    {(past && (selectedTalk.recap_summary || selectedTalk.summary)) || selectedTalk.abstract}
                  </div>
                </div>

                {!past && (
                  <div className="flex flex-wrap gap-3">
                    <a href={getCalendarLink(selectedTalk)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-[#E0E0E0] transition-colors">
                      <Calendar className="w-3.5 h-3.5" /> Añadir al calendario
                    </a>
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#A0A0A0]">
                      <MapPin className="w-4 h-4 text-[#00FFCC]" /> Casa Pädi, Av. Piracantos 1507, Pachuca
                    </span>
                  </div>
                )}

                {selectedTalk.transmission_url && (
                  <a
                    href={selectedTalk.transmission_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-[#1A1A1A] hover:bg-[#222222] p-4 rounded-xl border border-[#333333] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#FF3366]/10 flex items-center justify-center">
                      <MonitorPlay className="w-5 h-5 text-[#FF3366]" />
                    </div>
                    <p className="text-sm font-bold text-white group-hover:text-[#FF3366] transition-colors">
                      {past ? "Ver grabación del evento" : "Ver transmisión en vivo"}
                    </p>
                  </a>
                )}

                {past && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">Fotos del evento</h4>
                    {eventPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {eventPhotos.map((url, i) => (
                          <img key={i} src={url} alt={`Foto ${i + 1} del evento`} loading="lazy" className="w-full h-40 object-cover rounded-xl border border-[#333333]" />
                        ))}
                      </div>
                    ) : (
                      <div className="bg-[#0A0A0A] p-6 rounded-xl border border-dashed border-[#333333] flex items-center gap-3 text-sm text-[#A0A0A0]">
                        <ImageIcon className="w-6 h-6 text-[#444444] shrink-0" />
                        Las fotos de esta charla se subirán pronto.
                      </div>
                    )}
                  </div>
                )}

                {past && (
                  <div className="space-y-3 pt-5 border-t border-[#333333]">
                    <h4 className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">¿Fuiste? ¿Qué te pareció?</h4>
                    {feedbackSubmitted ? (
                      <div className="bg-[#00FFCC]/10 border border-[#00FFCC]/30 rounded-xl p-4 text-center">
                        <p className="text-[#00FFCC] font-bold">¡Gracias por tu opinión!</p>
                      </div>
                    ) : (
                      <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFeedbackRating(star)}
                              aria-label={`${star} estrellas`}
                              className={cn("p-1 transition-colors", feedbackRating >= star ? "text-[#FFCC00]" : "text-[#333333] hover:text-[#A0A0A0]")}
                            >
                              <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                            </button>
                          ))}
                        </div>
                        <textarea
                          placeholder="Déjanos un comentario (opcional)"
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-[#333333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00FFCC] transition-colors h-20 resize-none text-sm"
                        />
                        <button type="submit" disabled={feedbackRating === 0} className="bg-[#00FFCC] text-black px-6 py-2 rounded-xl font-bold hover:bg-[#00E6B8] transition-colors disabled:opacity-50 text-sm">
                          Enviar
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
