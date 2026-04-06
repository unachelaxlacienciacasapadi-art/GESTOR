import React, { useState, useEffect } from "react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, MapPin, Clock, Image as ImageIcon, X, ChevronLeft, ChevronRight, MonitorPlay } from "lucide-react";

type Talk = {
  id: number;
  title: string;
  abstract: string;
  speaker_name: string;
  speaker_bio: string;
  speaker_photo_url: string | null;
  status: "pending" | "approved" | "rejected" | "scheduled" | "completed";
  scheduled_date: string | null;
  category?: string;
  summary?: string | null;
  transmission_url?: string | null;
  event_photos?: string | null;
  created_at: string;
};

export default function Cartelera() {
  const [upcoming, setUpcoming] = useState<Talk[]>([]);
  const [past, setPast] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPastTalk, setSelectedPastTalk] = useState<Talk | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const openModal = (talk: Talk) => {
    setSelectedPastTalk(talk);
    setFeedbackRating(0);
    setFeedbackComment("");
    setFeedbackSubmitted(false);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPastTalk || feedbackRating === 0) return;
    
    try {
      await fetch(`/api/talks/${selectedPastTalk.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment }),
      });
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error("Failed to submit feedback", error);
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const safeFormatDate = (dateString: string | null | undefined, formatStr: string) => {
    if (!dateString) return "";
    try {
      const parsed = parseISO(dateString);
      if (isNaN(parsed.getTime())) return "";
      return format(parsed, formatStr, { locale: es });
    } catch (e) {
      return "";
    }
  };

  const getCalendarLink = (talk: Talk) => {
    if (!talk.scheduled_date) return "#";
    try {
      const startDate = new Date(talk.scheduled_date);
      if (isNaN(startDate.getTime())) return "#";
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      
      const formatForCalendar = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(talk.title)}&dates=${formatForCalendar(startDate)}/${formatForCalendar(endDate)}&details=${encodeURIComponent(talk.abstract)}&location=Casa+Padi,+Pachuca`;
    } catch (e) {
      return "#";
    }
  };

  const getTalksForDay = (date: Date) => {
    return [...filteredUpcoming, ...filteredPast].filter(talk => {
      if (!talk.scheduled_date) return false;
      try {
        const parsed = parseISO(talk.scheduled_date);
        if (isNaN(parsed.getTime())) return false;
        return isSameDay(parsed, date);
      } catch (e) {
        return false;
      }
    });
  };

  useEffect(() => {
    const fetchTalks = async () => {
      try {
        const res = await fetch("/api/talks");
        const data: Talk[] = await res.json();
        
        const now = new Date().getTime();

        const scheduled = data.filter(t => 
          t.status === "scheduled" && 
          t.scheduled_date && 
          new Date(t.scheduled_date).getTime() >= now
        );
        
        const pastFromDate = data.filter(t => 
          t.status === "scheduled" && 
          t.scheduled_date && 
          new Date(t.scheduled_date).getTime() < now
        );
        
        const officiallyCompleted = data.filter(t => t.status === "completed");
        const completed = [...pastFromDate, ...officiallyCompleted];
        
        // Sort upcoming by date ascending
        scheduled.sort((a, b) => new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime());
        
        setUpcoming(scheduled);
        setPast(completed);
      } catch (error) {
        console.error("Failed to fetch talks", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTalks();
  }, []);

  const filterTalks = (talks: Talk[]) => {
    return talks.filter(talk => {
      const matchesSearch = talk.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            talk.speaker_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "Todas" || (talk.category || 'General') === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const filteredUpcoming = filterTalks(upcoming);
  const filteredPast = filterTalks(past);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#FF3366]/30 border-t-[#FF3366] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-white">Cartelera</h1>
        <p className="text-sm md:text-base text-[#A0A0A0] max-w-xl mx-auto">
          Descubre las próximas charlas de "Una chela por la ciencia" y acompáñanos a aprender algo nuevo.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex bg-[#141414] rounded-full p-1 shadow-lg border border-[#333333]">
          <button
            onClick={() => setViewMode("list")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              viewMode === "list" ? "bg-[#00FFCC] text-black shadow-[0_0_10px_rgba(0,255,204,0.4)]" : "text-[#A0A0A0] hover:text-white"
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              viewMode === "calendar" ? "bg-[#00FFCC] text-black shadow-[0_0_10px_rgba(0,255,204,0.4)]" : "text-[#A0A0A0] hover:text-white"
            }`}
          >
            Calendario
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#141414] border border-[#333333] rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-[#00FFCC] transition-colors appearance-none"
          >
            <option value="Todas">Todas las categorías</option>
            <option value="General">General</option>
            <option value="Biología">Biología</option>
            <option value="Física">Física</option>
            <option value="Química">Química</option>
            <option value="Tecnología">Tecnología</option>
            <option value="Medio Ambiente">Medio Ambiente</option>
          </select>
          
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar charla o ponente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414] border border-[#333333] rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#00FFCC] transition-colors"
            />
            <svg className="w-4 h-4 text-[#A0A0A0] absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <>
          <section className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2 border-b border-[#333333] pb-3">
          <Calendar className="w-6 h-6 text-[#00FFCC]" />
          Próximas Charlas
        </h2>

        {filteredUpcoming.length === 0 ? (
          <div className="bg-[#141414] rounded-2xl p-8 text-center border border-[#333333] shadow-lg">
            <p className="text-[#A0A0A0] text-sm md:text-base">
              Aún no hay charlas programadas. ¡Anímate a proponer una!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredUpcoming.map((talk) => (
              <div key={talk.id} className="bg-[#141414] rounded-2xl overflow-hidden shadow-lg border border-[#333333] flex flex-col transition-all duration-300 hover:border-[#00FFCC]/50 hover:shadow-[0_0_20px_rgba(0,255,204,0.15)] group hover:-translate-y-1">
                <div className="bg-[#00FFCC]/10 text-[#00FFCC] p-4 flex justify-between items-start border-b border-[#00FFCC]/20">
                  <div>
                    <p className="font-bold text-sm">
                      {safeFormatDate(talk.scheduled_date, "EEEE d 'de' MMMM")}
                    </p>
                    <p className="text-[#00FFCC]/80 flex items-center gap-1 mt-1 text-xs">
                      <Clock className="w-3 h-3" />
                      {safeFormatDate(talk.scheduled_date, "HH:mm")} hrs
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-[#00FFCC]/20 px-2.5 py-1 rounded-full text-xs font-medium">
                      Entrada Libre
                    </div>
                    {talk.category && (
                      <div className="bg-[#333333] text-[#A0A0A0] px-2.5 py-1 rounded-full text-[10px] font-medium border border-[#444444]">
                        {talk.category}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-xl font-serif font-bold text-white mb-3 leading-tight group-hover:text-[#00FFCC] transition-colors">
                    {talk.title}
                  </h3>
                  
                  <div className="flex items-center gap-3 mb-4">
                    {talk.speaker_photo_url ? (
                      <img
                        src={talk.speaker_photo_url}
                        alt={talk.speaker_name}
                        className="w-10 h-10 rounded-full object-cover border border-[#333333]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#222222] border border-[#333333] flex items-center justify-center">
                        <span className="text-[#A0A0A0] font-bold text-sm">
                          {talk.speaker_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-[#E0E0E0]">{talk.speaker_name}</p>
                      <p className="text-xs text-[#A0A0A0] line-clamp-1">{talk.speaker_bio}</p>
                    </div>
                  </div>

                  <p className="text-sm text-[#A0A0A0] line-clamp-3 mb-5 flex-1">
                    {talk.abstract}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-[#333333]">
                    <div className="flex items-center gap-1.5 text-[#00FFCC] text-xs font-medium">
                      <MapPin className="w-4 h-4" />
                      Casa Padi, Pachuca
                    </div>
                    <div className="flex items-center gap-3">
                      <a 
                        href={getCalendarLink(talk)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#00FFCC] hover:text-[#00E6B8] text-xs font-medium transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        Añadir
                      </a>
                      {talk.transmission_url && (
                        <a 
                          href={talk.transmission_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#FF3366] hover:text-[#FF1A53] text-xs font-medium transition-colors"
                        >
                          <MonitorPlay className="w-4 h-4" />
                          Ver en vivo
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {filteredPast.length > 0 && (
        <section className="space-y-6 pt-6">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2 border-b border-[#333333] pb-3">
            <Clock className="w-6 h-6 text-[#FFCC00]" />
            Charlas Pasadas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredPast.map((talk) => (
              <div key={talk.id} className="bg-[#141414] rounded-xl p-5 border border-[#333333] shadow-lg hover:border-[#FFCC00]/50 hover:shadow-[0_0_15px_rgba(255,204,0,0.1)] transition-all duration-300 flex flex-col group hover:-translate-y-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-xs text-[#FFCC00] font-bold">
                        {safeFormatDate(talk.scheduled_date, "MMMM yyyy")}
                      </p>
                      {talk.category && (
                        <span className="bg-[#333333] text-[#A0A0A0] px-2 py-0.5 rounded-full text-[9px] font-medium border border-[#444444]">
                          {talk.category}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-white text-sm line-clamp-2">{talk.title}</h3>
                  </div>
                  {talk.speaker_photo_url ? (
                    <img
                      src={talk.speaker_photo_url}
                      alt={talk.speaker_name}
                      className="w-10 h-10 rounded-full object-cover border border-[#333333] shrink-0 ml-3"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#222222] border border-[#333333] flex items-center justify-center shrink-0 ml-3">
                      <span className="text-[#A0A0A0] font-bold text-sm">
                        {talk.speaker_name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#A0A0A0] mb-4">{talk.speaker_name}</p>
                <button 
                  onClick={() => openModal(talk)}
                  className="mt-auto text-xs font-medium text-[#FFCC00] hover:text-[#FFCC00]/80 transition-colors flex items-center gap-1"
                >
                  <ImageIcon className="w-3 h-3" />
                  Ver fotos y resumen
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      </>
      ) : (
        <section className="space-y-6">
          <div className="bg-[#141414] rounded-2xl border border-[#333333] shadow-lg overflow-hidden">
            <div className="p-4 border-b border-[#333333] flex justify-between items-center bg-[#0A0A0A]">
              <button onClick={prevMonth} className="p-2 hover:bg-[#1A1A1A] rounded-full text-[#A0A0A0] hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-serif font-bold text-white capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: es })}
              </h2>
              <button onClick={nextMonth} className="p-2 hover:bg-[#1A1A1A] rounded-full text-[#A0A0A0] hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-7 gap-px bg-[#333333]">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="bg-[#0A0A0A] py-2 text-center text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">
                      {day}
                    </div>
                  ))}
                  
                  {/* Add empty cells for the first week */}
                  {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-[#141414] min-h-[100px]" />
                  ))}
                  
                  {daysInMonth.map(date => {
                    const dayTalks = getTalksForDay(date);
                    const isCurrentMonth = isSameMonth(date, currentMonth);
                    const today = isToday(date);
                    
                    return (
                      <div 
                        key={date.toISOString()} 
                        className={`min-h-[100px] p-2 bg-[#141414] transition-colors ${
                          !isCurrentMonth ? 'opacity-50' : ''
                        } ${today ? 'ring-1 ring-inset ring-[#00FFCC]/50 bg-[#00FFCC]/5' : ''}`}
                      >
                        <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                          today ? 'bg-[#00FFCC] text-black' : 'text-[#A0A0A0]'
                        }`}>
                          {format(date, 'd')}
                        </div>
                        
                        <div className="space-y-1">
                          {dayTalks.map(talk => (
                            <button
                              key={talk.id}
                              onClick={() => openModal(talk)}
                              className={`w-full text-left text-[10px] p-1.5 rounded border transition-colors line-clamp-2 ${
                                talk.status === 'completed' 
                                  ? 'bg-[#FFCC00]/10 border-[#FFCC00]/30 text-[#FFCC00] hover:bg-[#FFCC00]/20' 
                                  : 'bg-[#00FFCC]/10 border-[#00FFCC]/30 text-[#00FFCC] hover:bg-[#00FFCC]/20'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="font-bold truncate">{safeFormatDate(talk.scheduled_date, "HH:mm")}</div>
                                {talk.category && (
                                  <div className="text-[8px] opacity-80 truncate ml-1">{talk.category}</div>
                                )}
                              </div>
                              <div className="truncate mt-0.5">{talk.title}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Add empty cells for the last week */}
                  {Array.from({ length: 6 - daysInMonth[daysInMonth.length - 1].getDay() }).map((_, i) => (
                    <div key={`empty-end-${i}`} className="bg-[#141414] min-h-[100px]" />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-6 text-xs text-[#A0A0A0]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00FFCC]/20 border border-[#00FFCC]/50" />
              <span>Próximas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FFCC00]/20 border border-[#FFCC00]/50" />
              <span>Pasadas</span>
            </div>
          </div>
        </section>
      )}

      {/* Modal para Detalles de Charla */}
      {selectedPastTalk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] rounded-2xl shadow-2xl border border-[#333333] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-[#333333]">
              <h3 className="text-lg font-serif font-bold text-white">Detalles de la Charla</h3>
              <button 
                onClick={() => setSelectedPastTalk(null)}
                className="text-[#A0A0A0] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-sm text-[#FFCC00] font-bold">
                    {safeFormatDate(selectedPastTalk.scheduled_date, "EEEE d 'de' MMMM, yyyy")}
                  </p>
                  {selectedPastTalk.category && (
                    <span className="bg-[#333333] text-[#A0A0A0] px-2.5 py-0.5 rounded-full text-[10px] font-medium border border-[#444444]">
                      {selectedPastTalk.category}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-serif font-bold text-white mb-4 leading-tight">{selectedPastTalk.title}</h2>
                
                <div className="flex items-center gap-3 mb-6">
                  {selectedPastTalk.speaker_photo_url ? (
                    <img
                      src={selectedPastTalk.speaker_photo_url}
                      alt={selectedPastTalk.speaker_name}
                      className="w-12 h-12 rounded-full object-cover border border-[#333333]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#222222] border border-[#333333] flex items-center justify-center">
                      <span className="text-[#A0A0A0] font-bold text-lg">
                        {selectedPastTalk.speaker_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-sm text-[#E0E0E0]">{selectedPastTalk.speaker_name}</p>
                    <p className="text-xs text-[#A0A0A0]">{selectedPastTalk.speaker_bio}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#A0A0A0] uppercase tracking-wider">
                  {selectedPastTalk.summary ? "Resumen del Evento" : "Resumen de la Charla"}
                </h4>
                <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#333333] text-[#E0E0E0] text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedPastTalk.summary || selectedPastTalk.abstract}
                </div>
              </div>

              {selectedPastTalk.transmission_url && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-[#A0A0A0] uppercase tracking-wider">Transmisión</h4>
                  <a 
                    href={selectedPastTalk.transmission_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-[#1A1A1A] hover:bg-[#222222] p-4 rounded-xl border border-[#333333] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#FF3366]/10 flex items-center justify-center group-hover:bg-[#FF3366]/20 transition-colors">
                      <MonitorPlay className="w-5 h-5 text-[#FF3366]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-[#FF3366] transition-colors">Ver Grabación del Evento</p>
                      <p className="text-xs text-[#A0A0A0]">
                        {(() => {
                          try {
                            return new URL(selectedPastTalk.transmission_url!).hostname;
                          } catch (e) {
                            return "Enlace externo";
                          }
                        })()}
                      </p>
                    </div>
                  </a>
                </div>
              )}

              {selectedPastTalk.status === "completed" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-[#A0A0A0] uppercase tracking-wider">Fotos del Evento</h4>
                  {selectedPastTalk.event_photos ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(() => {
                        try {
                          const photos = JSON.parse(selectedPastTalk.event_photos);
                          return photos.map((url: string, i: number) => (
                            <img key={i} src={url} alt={`Event photo ${i+1}`} className="w-full h-48 object-cover rounded-xl border border-[#333333]" />
                          ));
                        } catch (e) {
                          return null;
                        }
                      })()}
                    </div>
                  ) : (
                    <div className="bg-[#0A0A0A] p-8 rounded-xl border border-[#333333] flex flex-col items-center justify-center text-center">
                      <ImageIcon className="w-12 h-12 text-[#333333] mb-3" />
                      <p className="text-[#A0A0A0] text-sm">
                        Las fotos de este evento se subirán pronto.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedPastTalk.status === "completed" && (
                <div className="space-y-4 pt-6 border-t border-[#333333]">
                  <h4 className="text-sm font-bold text-[#A0A0A0] uppercase tracking-wider">¿Qué te pareció la charla?</h4>
                  {feedbackSubmitted ? (
                    <div className="bg-[#00FFCC]/10 border border-[#00FFCC]/30 rounded-xl p-4 text-center">
                      <p className="text-[#00FFCC] font-bold">¡Gracias por tu opinión!</p>
                    </div>
                  ) : (
                    <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className={`p-1 transition-colors ${feedbackRating >= star ? 'text-[#FFCC00]' : 'text-[#333333] hover:text-[#A0A0A0]'}`}
                          >
                            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
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
                      <button
                        type="submit"
                        disabled={feedbackRating === 0}
                        className="bg-[#00FFCC] text-black px-6 py-2 rounded-xl font-bold hover:bg-[#00E6B8] transition-colors disabled:opacity-50 text-sm"
                      >
                        Enviar
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
