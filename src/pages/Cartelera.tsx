import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, MapPin, Image as ImageIcon, X, ChevronLeft, ChevronRight, MonitorPlay, Search } from "lucide-react";
import WhatsAppShareButton from "../components/WhatsAppShareButton";
import SpeakerAvatar from "../components/SpeakerAvatar";
import { CoralBranch, CutoutTag, categoryInk, categorySwatch } from "../components/brand";
import { Talk } from "../types/talk";
import { cn, googleCalendarUrl, normalizeText, parseTalkDate, startOfToday } from "../lib/utils";
import { CASA_PADI } from "../lib/casaPadi";

const fmt = (value: string | null | undefined, pattern: string) => {
  const d = parseTalkDate(value);
  return d ? format(d, pattern, { locale: es }) : "";
};

const speakerLine = (talk: Talk) => [talk.speaker_name, talk.speaker_2_name].filter(Boolean).join(" y ");
const blurb = (talk: Talk) => talk.description_short || talk.abstract || "";

type AgendaItem = { kind: "talk"; talk: Talk; time: number } | { kind: "free"; date: string; time: number };

export default function Cartelera() {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [freeDates, setFreeDates] = useState<string[]>([]);
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

    // Miércoles sin charla: se muestran como invitación a proponer.
    fetch("/api/available-dates")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.availableDates;
        if (Array.isArray(list)) setFreeDates(list.map((d: { date: string }) => d.date));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedTalk) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelectedTalk(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTalk]);

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
      const res = await fetch(`/api/talks/${selectedTalk.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment }),
      });
      if (res.ok) setFeedbackSubmitted(true);
    } catch (error) {
      console.error("Failed to submit feedback", error);
    }
  };

  const todayStart = startOfToday();
  const timeOf = (talk: Talk) => parseTalkDate(talk.scheduled_date)?.getTime() ?? 0;
  const isPastTalk = (talk: Talk) => (parseTalkDate(talk.scheduled_date)?.getTime() ?? Infinity) < todayStart;

  const categories = useMemo(
    () => Array.from(new Set(talks.map((t) => t.category || "General"))).sort((a, b) => a.localeCompare(b, "es")),
    [talks]
  );

  const filtered = useMemo(() => {
    const q = normalizeText(searchQuery);
    return talks.filter((talk) => {
      const matchesSearch =
        !q || normalizeText(talk.title).includes(q) || normalizeText(speakerLine(talk)).includes(q) || normalizeText(talk.institution).includes(q);
      const matchesCategory = selectedCategory === "Todas" || (talk.category || "General") === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [talks, searchQuery, selectedCategory]);

  const isFiltering = searchQuery.trim() !== "" || selectedCategory !== "Todas";

  // Agenda por mes: charlas próximas + miércoles libres (solo sin filtros, y
  // hasta el mes de la última charla agendada para no listar meses vacíos).
  const agendaByMonth = useMemo(() => {
    const items: AgendaItem[] = filtered.filter((t) => !isPastTalk(t)).map((talk) => ({ kind: "talk", talk, time: timeOf(talk) }));
    if (!isFiltering) {
      const lastTalk = Math.max(0, ...items.map((i) => i.time));
      const horizon = lastTalk ? endOfMonth(new Date(lastTalk)).getTime() : todayStart + 42 * 86400000;
      for (const date of freeDates) {
        const t = parseTalkDate(date)?.getTime();
        if (t && t >= todayStart && t <= horizon) items.push({ kind: "free", date, time: t });
      }
    }
    items.sort((a, b) => a.time - b.time);
    const groups: { key: string; month: string; year: string; items: AgendaItem[] }[] = [];
    for (const item of items) {
      const d = new Date(item.time);
      const key = format(d, "yyyy-MM");
      let group = groups.find((g) => g.key === key);
      if (!group) {
        group = { key, month: format(d, "MMMM", { locale: es }), year: format(d, "yyyy"), items: [] };
        groups.push(group);
      }
      group.items.push(item);
    }
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, freeDates, isFiltering, todayStart]);

  const firstTalk = agendaByMonth.flatMap((g) => g.items).find((i): i is Extract<AgendaItem, { kind: "talk" }> => i.kind === "talk");
  const nextTalkId = firstTalk?.talk.id ?? null;

  const pastByMonth = useMemo(() => {
    const past = filtered.filter(isPastTalk).sort((a, b) => timeOf(b) - timeOf(a));
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

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const getTalksForDay = (date: Date) =>
    filtered.filter((talk) => {
      const d = parseTalkDate(talk.scheduled_date);
      return d ? isSameDay(d, date) : false;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]" role="status" aria-label="Cargando cartelera">
        <div className="w-10 h-10 border-4 border-chela/20 border-t-chela rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-0">
      {/* Encabezado */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 md:pt-14 pb-8 relative">
        <CoralBranch className="absolute right-0 -top-6 w-56 h-56 md:w-72 md:h-72 rotate-[200deg] opacity-90" />
        <h1 className="relative font-display font-medium text-[56px] md:text-[88px] leading-[0.95] tracking-[-0.035em] text-chela">Cartelera</h1>
        <p className="relative mt-3 font-fecha italic font-semibold text-2xl md:text-[30px]">miércoles a las 7:00 pm, en la terraza de Casa Pädi</p>
      </header>

      {/* Controles */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div role="group" aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
          {["Todas", ...categories].map((cat) => {
            const active = selectedCategory === cat;
            const swatch = cat === "Todas" ? { bg: "#1F1D1A", fg: "#F3EDE1" } : categorySwatch(cat);
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedCategory(cat)}
                className="min-h-11 px-4 rounded-full border-2 font-bold text-sm transition-colors"
                style={
                  active
                    ? { background: swatch.bg, color: swatch.fg, borderColor: swatch.bg }
                    : { borderColor: cat === "Todas" ? "#1F1D1A" : swatch.bg, color: "#1F1D1A", background: "transparent" }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex items-center gap-2.5 min-h-12 px-4 rounded-full bg-papel-claro border-2 border-tinta sm:w-72 focus-within:ring-2 focus-within:ring-chela">
            <Search className="w-4 h-4 text-gris shrink-0" aria-hidden="true" />
            <span className="sr-only">Buscar charla</span>
            <input
              type="search"
              placeholder="Busca un tema o ponente"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-[15px] placeholder:text-gris"
            />
          </label>
          <div className="flex bg-papel-claro rounded-full p-1 border-2 border-tinta self-start">
            {(["list", "calendar"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={viewMode === mode}
                onClick={() => setViewMode(mode)}
                className={cn("min-h-10 px-5 rounded-full text-sm font-bold transition-colors", viewMode === mode ? "bg-chela text-papel" : "text-tinta hover:bg-crema")}
              >
                {mode === "list" ? "Lista" : "Calendario"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
          <p className="bg-papel-claro border-2 border-coral-oscuro rounded-2xl p-5 text-coral-oscuro font-bold">
            No pudimos cargar la cartelera. Revisa tu conexión e inténtalo de nuevo.
          </p>
        </div>
      )}

      {viewMode === "list" ? (
        <>
          {/* Agenda */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-12">
            {agendaByMonth.length === 0 && !loadError && (
              <div className="border-2 border-dashed border-coral-oscuro rounded-[24px] p-10 text-center space-y-4">
                <p className="font-display font-semibold text-xl">
                  {isFiltering ? "Ninguna charla próxima coincide con tu búsqueda." : "Aún no hay charlas programadas."}
                </p>
                {!isFiltering && (
                  <Link to="/registro" className="inline-flex items-center min-h-12 px-6 rounded-full bg-ambar text-tinta font-bold shadow-sello">
                    Proponer una charla
                  </Link>
                )}
              </div>
            )}

            {agendaByMonth.map((group) => (
              <section key={group.key} aria-labelledby={`mes-${group.key}`}>
                <h2 id={`mes-${group.key}`} className="flex items-baseline gap-3 mb-5">
                  <span className="font-display font-semibold text-3xl capitalize">{group.month}</span>
                  <span className="font-fecha italic text-2xl text-gris">{group.year}</span>
                </h2>
                <div className="flex flex-col gap-4">
                  {group.items.map((item) =>
                    item.kind === "free" ? (
                      <article key={item.date} className="flex border-2 border-dashed border-coral-oscuro rounded-[20px] overflow-hidden">
                        <div className="w-24 sm:w-28 shrink-0 flex flex-col items-center justify-center text-coral-oscuro py-4">
                          <span className="text-[11px] font-bold tracking-[0.14em] uppercase">{fmt(item.date, "EEE")}</span>
                          <span className="font-display font-semibold text-4xl leading-none">{fmt(item.date, "d")}</span>
                        </div>
                        <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="font-display font-semibold text-lg text-coral-oscuro">Miércoles libre</h3>
                            <p className="text-tinta-suave text-[15px]">Este espacio puede ser para tu charla.</p>
                          </div>
                          <Link to="/registro" className="self-start sm:self-auto inline-flex items-center min-h-11 px-5 rounded-full bg-ambar text-tinta font-bold text-sm shadow-sello whitespace-nowrap">
                            Proponer para esta fecha
                          </Link>
                        </div>
                      </article>
                    ) : (
                      <TalkTicket key={item.talk.id} talk={item.talk} isNext={item.talk.id === nextTalkId} onOpen={openModal} />
                    )
                  )}
                </div>
              </section>
            ))}
          </div>

          {/* Archivo */}
          {pastCount > 0 && (
            <section aria-labelledby="archivo" className="bg-noche text-papel relative overflow-hidden">
              <CoralBranch className="absolute -right-12 -bottom-16 w-72 h-72 opacity-40" />
              <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16">
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-8">
                  <h2 id="archivo" className="font-display font-semibold text-3xl md:text-4xl tracking-tight">Archivo de charlas</h2>
                  <p className="font-fecha italic text-2xl text-ambar">{pastCount} {pastCount === 1 ? "charla realizada" : "charlas realizadas"}</p>
                </div>
                <div className="space-y-8">
                  {pastByMonth.map((group) => (
                    <div key={group.key}>
                      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-coral mb-3 capitalize">{group.label}</h3>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {group.talks.map((talk) => (
                          <button
                            key={talk.id}
                            type="button"
                            onClick={() => openModal(talk)}
                            className="text-left flex gap-3 items-center p-4 rounded-2xl bg-papel/[0.07] border border-papel/20 hover:bg-papel/[0.12] hover:border-ambar/60 transition-colors"
                          >
                            <SpeakerAvatar name={talk.speaker_name || ""} photoUrl={talk.speaker_photo_url} className="w-12 h-12 border-papel" textClassName="text-xs" />
                            <div className="min-w-0">
                              <p className="text-[13px] text-[#D8D2C4] first-letter:uppercase">{fmt(talk.scheduled_date, "EEEE d 'de' MMMM")}</p>
                              <p className="font-display font-semibold text-[15px] leading-snug line-clamp-2 mt-0.5">{talk.title}</p>
                              <p className="text-[13px] text-[#D8D2C4] line-clamp-1 mt-0.5">{speakerLine(talk)}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-4" aria-label="Calendario de charlas">
          <div className="bg-papel-claro rounded-[24px] border-2 border-tinta overflow-hidden">
            <div className="p-4 border-b-2 border-tinta flex justify-between items-center">
              <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-11 h-11 rounded-full hover:bg-crema flex items-center justify-center" aria-label="Mes anterior">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-display font-semibold text-xl capitalize">{format(currentMonth, "MMMM yyyy", { locale: es })}</h2>
              <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-11 h-11 rounded-full hover:bg-crema flex items-center justify-center" aria-label="Mes siguiente">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[700px] grid grid-cols-7 gap-px bg-borde">
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                  <div key={day} className="bg-crema py-2 text-center text-xs font-bold uppercase tracking-wider">{day}</div>
                ))}
                {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-papel min-h-[100px]" />
                ))}
                {daysInMonth.map((date) => {
                  const dayTalks = getTalksForDay(date);
                  const today = isToday(date);
                  return (
                    <div key={date.toISOString()} className={cn("min-h-[100px] p-2 bg-papel-claro", !isSameMonth(date, currentMonth) && "opacity-50")}>
                      <div className={cn("text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full", today ? "bg-chela text-papel" : "text-gris")}>
                        {format(date, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayTalks.map((talk) => {
                          const swatch = categorySwatch(talk.category);
                          return (
                            <button
                              key={talk.id}
                              type="button"
                              onClick={() => openModal(talk)}
                              className={cn("w-full text-left text-[11px] p-1.5 rounded-md border-2 border-tinta font-bold", isPastTalk(talk) && "opacity-60")}
                              style={{ background: swatch.bg, color: swatch.fg }}
                            >
                              <span className="line-clamp-2">{talk.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {Array.from({ length: 6 - daysInMonth[daysInMonth.length - 1].getDay() }).map((_, i) => (
                  <div key={`empty-end-${i}`} className="bg-papel min-h-[100px]" />
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-gris text-center">Las charlas que ya pasaron aparecen atenuadas.</p>
        </section>
      )}

      {/* Detalle */}
      {selectedTalk &&
        (() => {
          const past = isPastTalk(selectedTalk);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tinta/60 backdrop-blur-sm" onClick={() => setSelectedTalk(null)}>
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="detalle-charla"
                className="bg-papel-claro rounded-[28px] border-2 border-tinta shadow-sello-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center px-6 py-4 border-b-2 border-tinta bg-crema">
                  <span className={cn("text-[11px] font-bold uppercase tracking-[0.14em] px-3 py-1 rounded-full", past ? "bg-tinta text-papel" : "bg-chela text-papel")}>
                    {past ? "Charla realizada" : "Próxima charla"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedTalk(null)}
                    className="w-11 h-11 rounded-full border-2 border-tinta flex items-center justify-center hover:bg-tinta hover:text-papel transition-colors"
                    aria-label="Cerrar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
                  <div className="space-y-4">
                    {selectedTalk.category && <CutoutTag size="sm">{selectedTalk.category}</CutoutTag>}
                    <h2 id="detalle-charla" className="font-display font-medium text-3xl leading-tight text-chela">“{selectedTalk.title}”</h2>
                    <p className="font-fecha italic font-semibold text-2xl first-letter:uppercase">
                      {fmt(selectedTalk.scheduled_date, "EEEE d 'de' MMMM, yyyy")} · {fmt(selectedTalk.scheduled_date, "h:mm aaa")}
                    </p>
                    <div className="space-y-3">
                      {[
                        { name: selectedTalk.speaker_name, photo: selectedTalk.speaker_photo_url, bio: selectedTalk.speaker_bio },
                        { name: selectedTalk.speaker_2_name, photo: selectedTalk.speaker_2_photo_url, bio: selectedTalk.speaker_2_bio },
                      ]
                        .filter((s) => s.name)
                        .map((s) => (
                          <div key={s.name} className="flex items-start gap-3">
                            <SpeakerAvatar name={s.name || ""} photoUrl={s.photo} className="w-14 h-14" />
                            <div>
                              <p className="font-bold">{s.name}</p>
                              {s.bio && <p className="text-sm text-tinta-suave mt-0.5">{s.bio}</p>}
                            </div>
                          </div>
                        ))}
                      {selectedTalk.institution && <p className="text-sm font-bold text-coral-oscuro">{selectedTalk.institution}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-gris">
                      {past && (selectedTalk.recap_summary || selectedTalk.summary) ? "Resumen del evento" : "De qué trata"}
                    </h3>
                    <p className="leading-relaxed whitespace-pre-wrap">{(past && (selectedTalk.recap_summary || selectedTalk.summary)) || selectedTalk.abstract}</p>
                  </div>

                  {!past && (
                    <div className="flex flex-wrap gap-3 items-center">
                      <a
                        href={googleCalendarUrl(selectedTalk)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 min-h-12 px-6 rounded-full bg-chela text-papel font-bold hover:bg-chela-oscuro transition-colors"
                      >
                        <Calendar className="w-4 h-4" /> Añadir al calendario
                      </a>
                      <WhatsAppShareButton talk={selectedTalk} variant="compact" />
                      <a href={CASA_PADI.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-tinta-suave hover:text-chela">
                        <MapPin className="w-4 h-4 text-coral-oscuro" /> Cómo llegar a Casa Pädi
                      </a>
                    </div>
                  )}

                  {selectedTalk.transmission_url && (
                    <a
                      href={selectedTalk.transmission_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-2xl border-2 border-tinta hover:bg-crema transition-colors"
                    >
                      <MonitorPlay className="w-6 h-6 text-magenta" />
                      <span className="font-bold">{past ? "Ver la grabación" : "Ver la transmisión en vivo"}</span>
                    </a>
                  )}

                  {past && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-gris">Fotos del evento</h3>
                      {eventPhotos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {eventPhotos.map((url, i) => (
                            <img key={i} src={url} alt={`Foto ${i + 1} de la charla`} loading="lazy" className="w-full h-40 object-cover rounded-xl border-2 border-tinta" />
                          ))}
                        </div>
                      ) : (
                        <p className="flex items-center gap-3 p-5 rounded-2xl border-2 border-dashed border-borde text-tinta-suave">
                          <ImageIcon className="w-5 h-5 shrink-0" /> Las fotos de esta charla se subirán pronto.
                        </p>
                      )}
                    </div>
                  )}

                  {past && (
                    <div className="space-y-3 pt-5 border-t-2 border-borde">
                      <h3 className="font-display font-semibold text-lg">¿Fuiste? ¿Qué te pareció?</h3>
                      {feedbackSubmitted ? (
                        <p role="status" className="bg-chela text-papel rounded-2xl p-4 font-bold text-center">¡Gracias por tu opinión!</p>
                      ) : (
                        <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                          <div className="flex items-center gap-1" role="radiogroup" aria-label="Calificación">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                role="radio"
                                aria-checked={feedbackRating === star}
                                onClick={() => setFeedbackRating(star)}
                                aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
                                className={cn("p-1 transition-colors", feedbackRating >= star ? "text-ambar-oscuro" : "text-borde hover:text-gris")}
                              >
                                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                              </button>
                            ))}
                          </div>
                          <label className="sr-only" htmlFor="feedback-comment">Comentario</label>
                          <textarea
                            id="feedback-comment"
                            placeholder="Déjanos un comentario (opcional)"
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            className="w-full bg-papel border-2 border-tinta rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chela h-24 resize-none"
                          />
                          <button type="submit" disabled={feedbackRating === 0} className="min-h-12 px-6 rounded-full bg-chela text-papel font-bold hover:bg-chela-oscuro disabled:opacity-50 transition-colors">
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

function TalkTicket({ talk, isNext, onOpen }: { talk: Talk; isNext: boolean; onOpen: (t: Talk) => void }) {
  const swatch = categorySwatch(talk.category);
  return (
    <article className={cn("flex bg-papel-claro rounded-[20px] overflow-hidden", isNext ? "border-2 border-tinta shadow-sello-lg" : "border border-borde")}>
      <div
        className="w-24 sm:w-28 shrink-0 flex flex-col items-center justify-center py-4 border-r-[3px] border-dashed border-papel-claro"
        style={{ background: swatch.bg, color: swatch.fg }}
      >
        <span className="text-[11px] font-bold tracking-[0.14em] uppercase">{fmt(talk.scheduled_date, "EEE")}</span>
        <span className="font-display font-semibold text-4xl leading-none">{fmt(talk.scheduled_date, "d")}</span>
        <span className="font-fecha italic text-base">{fmt(talk.scheduled_date, "h:mm aaa")}</span>
      </div>
      <button type="button" onClick={() => onOpen(talk)} className="flex-1 min-w-0 text-left p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-crema/50 transition-colors">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {isNext && <span className="text-[11px] font-bold uppercase tracking-[0.12em] bg-chela text-papel px-2.5 py-1 rounded-full">La siguiente</span>}
            <span className="text-[13px] font-bold" style={{ color: categoryInk(talk.category) }}>
              {talk.category || "General"}
            </span>
          </div>
          <h3 className="font-display font-semibold text-lg sm:text-[22px] leading-snug">{talk.title}</h3>
          <p className="text-[15px] text-tinta-suave">{speakerLine(talk)}</p>
          {isNext && blurb(talk) && <p className="text-sm text-tinta-suave line-clamp-2 mt-1">{blurb(talk)}</p>}
        </div>
        <div className="flex items-center shrink-0">
          <SpeakerAvatar name={talk.speaker_name || ""} photoUrl={talk.speaker_photo_url} className="w-14 h-14 sm:w-16 sm:h-16" />
          {talk.speaker_2_name && (
            <SpeakerAvatar name={talk.speaker_2_name} photoUrl={talk.speaker_2_photo_url} className="w-14 h-14 sm:w-16 sm:h-16 -ml-3" />
          )}
        </div>
      </button>
    </article>
  );
}
