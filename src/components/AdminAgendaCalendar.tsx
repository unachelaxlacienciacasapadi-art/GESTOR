import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2, Save, X, Edit3, Clock } from "lucide-react";
import { formatDriveUrl } from "../lib/utils";

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
};

type Props = {
  talks: Talk[];
  updateTalk: (id: number, updates: Partial<Talk>) => Promise<void>;
  updateStatus: (id: number, status: string, scheduled_date?: string) => Promise<void>;
  deleteTalk: (id: number) => Promise<void>;
  createTalk: (talk: Partial<Talk>) => Promise<void>;
};

export default function AdminAgendaCalendar({ talks, updateTalk, updateStatus, deleteTalk, createTalk }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Modals state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTalk, setEditingTalk] = useState<Talk | null>(null);

  // Forms state
  const [selectedPendingTalk, setSelectedPendingTalk] = useState<number | "NEW">("");
  const [newTalkTitle, setNewTalkTitle] = useState("");
  const [newTalkSpeaker, setNewTalkSpeaker] = useState("");
  const [timeInput, setTimeInput] = useState("18:00");
  
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSpeakerName, setEditSpeakerName] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [editTime, setEditTime] = useState("");

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

  const getTalksForDay = (date: Date) => {
    return talks.filter(talk => {
      if ((talk.status !== "scheduled" && talk.status !== "completed") || !talk.scheduled_date) return false;
      try {
        const parsed = parseISO(talk.scheduled_date);
        return isSameDay(parsed, date);
      } catch (e) {
        return false;
      }
    });
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const dayTalks = getTalksForDay(date);
    if (dayTalks.length === 0) {
      // Abre modal de crear/asignar
      setSelectedPendingTalk("");
      setNewTalkTitle("");
      setNewTalkSpeaker("");
      setTimeInput("18:00");
      setShowAssignModal(true);
    } else {
      // Abre el primero si ya hay, o podrías permitir elegir si hay varios. Aquí abrimos modal de edición.
      openEditor(dayTalks[0]);
    }
  };

  const openEditor = (talk: Talk) => {
    setEditingTalk(talk);
    setEditTitle(talk.title);
    setEditCategory(talk.category || "");
    setEditSpeakerName(talk.speaker_name);
    setEditPhotoUrl(talk.speaker_photo_url || "");
    setEditTime(safeFormatDate(talk.scheduled_date, "HH:mm"));
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar esta charla de la agenda y de la base de datos?")) {
      await deleteTalk(id);
      setShowEditModal(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    
    // YYYY-MM-DDTHH:MM formatting for the backend
    const combinedDateString = format(selectedDate, "yyyy-MM-dd") + "T" + timeInput;
    const isoDate = new Date(combinedDateString).toISOString();

    if (selectedPendingTalk === "NEW") {
      await createTalk({
        title: newTalkTitle || "Espacio Disponible",
        speaker_name: newTalkSpeaker || "Por Confirmar",
        status: "scheduled",
        scheduled_date: isoDate
      });
    } else if (selectedPendingTalk) {
      await updateStatus(Number(selectedPendingTalk), "scheduled", isoDate);
    }
    
    setShowAssignModal(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTalk) return;

    let isoDate = editingTalk.scheduled_date;
    if (editingTalk.scheduled_date && editTime) {
      const existingDate = parseISO(editingTalk.scheduled_date);
      const combinedDateString = format(existingDate, "yyyy-MM-dd") + "T" + editTime;
      isoDate = new Date(combinedDateString).toISOString();
    }
    
    await updateTalk(editingTalk.id, {
      title: editTitle,
      category: editCategory,
      speaker_name: editSpeakerName,
      speaker_photo_url: formatDriveUrl(editPhotoUrl),
    });

    if (isoDate !== editingTalk.scheduled_date) {
      await updateStatus(editingTalk.id, editingTalk.status, isoDate || undefined);
    }

    setShowEditModal(false);
    setEditingTalk(null);
  };

  // Extract pending/approved talks for the dropdown
  const pendingOrApprovedTalks = talks.filter(t => t.status === "pending" || t.status === "approved");

  return (
    <div className="space-y-6 animate-fade-in relative z-10 w-full">
      <div className="bg-[#141414] rounded-2xl border border-[#333333] shadow-lg overflow-hidden w-full">
        <div className="p-4 border-b border-[#333333] flex justify-between items-center bg-[#0A0A0A]">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#00FFCC]" />
              Calendario General
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-[#1A1A1A] rounded-full text-[#A0A0A0] hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-serif font-bold text-white capitalize min-w-[150px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-[#1A1A1A] rounded-full text-[#A0A0A0] hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <div className="grid grid-cols-7 gap-px bg-[#333333]">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="bg-[#0A0A0A] py-3 text-center text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">
                  {day}
                </div>
              ))}
              
              {/* Padding empty cells */}
              {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-[#141414] min-h-[140px]" />
              ))}
              
              {daysInMonth.map(date => {
                const dayTalks = getTalksForDay(date);
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const today = isToday(date);
                
                return (
                  <div 
                    key={date.toISOString()} 
                    onClick={() => handleDayClick(date)}
                    className={`min-h-[140px] p-2 bg-[#1A1A1A] hover:bg-[#222222] transition-colors cursor-pointer group ${
                      !isCurrentMonth ? 'opacity-40' : ''
                    } ${today ? 'ring-1 ring-inset ring-[#00FFCC]/50 bg-[#00FFCC]/5' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                       <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          today ? 'bg-[#00FFCC] text-black' : 'text-[#A0A0A0]'
                        }`}>
                          {format(date, 'd')}
                        </div>
                        {dayTalks.length === 0 && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4 text-[#A0A0A0]" />
                          </div>
                        )}
                    </div>
                    
                    <div className="space-y-1">
                      {dayTalks.map(talk => (
                        <div
                          key={talk.id}
                          className={`w-full text-left p-2 rounded-lg border transition-all shadow-sm ${
                            talk.status === 'completed' 
                              ? 'bg-[#333333]/50 border-[#444444] text-[#A0A0A0] hover:border-[#666666]' 
                              : 'bg-[#9933FF]/10 border-[#9933FF]/30 text-[#E0E0E0] hover:border-[#9933FF]/60 hover:bg-[#9933FF]/20'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold opacity-80 uppercase tracking-wider">
                            <Clock className="w-3 h-3" />
                            {safeFormatDate(talk.scheduled_date, "HH:mm")}
                          </div>
                          <div className="text-[11px] font-bold line-clamp-2 leading-tight">
                            {talk.title}
                          </div>
                          {talk.speaker_name && (
                            <div className="text-[10px] mt-1 text-[#A0A0A0] truncate">
                              {talk.speaker_name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Padding empty cells end */}
              {Array.from({ length: 6 - daysInMonth[daysInMonth.length - 1].getDay() }).map((_, i) => (
                <div key={`empty-end-${i}`} className="bg-[#141414] min-h-[140px]" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ASIGNAR / CREAR CHARLA MODAL */}
      {showAssignModal && selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#141414] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#333333] w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-5 border-b border-[#333333] bg-[#0A0A0A]">
              <h3 className="text-lg font-serif font-bold text-white">Agendar Evento</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-[#A0A0A0] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-5">
              <div className="bg-[#00FFCC]/10 p-3 rounded-xl border border-[#00FFCC]/20 text-center">
                <p className="text-[#00FFCC] font-bold font-serif text-lg">
                  {format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Asignar una Charla Existente</label>
                <select 
                  className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-xl text-white text-sm outline-none focus:border-[#00FFCC]"
                  value={selectedPendingTalk}
                  onChange={(e) => setSelectedPendingTalk(e.target.value === "NEW" ? "NEW" : Number(e.target.value))}
                >
                  <option value="" disabled>-- Selecciona una propuesta --</option>
                  <option value="NEW">+ Añadir Evento Vacío Temporal</option>
                  {pendingOrApprovedTalks.map(t => (
                    <option key={t.id} value={t.id}>[{t.status === "approved" ? "A" : "P"}] {t.title} - {t.speaker_name}</option>
                  ))}
                </select>
              </div>

              {selectedPendingTalk === "NEW" && (
                <div className="space-y-4 p-4 border border-[#333333] rounded-xl bg-[#0A0A0A]">
                  <div>
                    <label className="block text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Título de Espacio</label>
                    <input 
                      type="text" placeholder="Ej. Espacio Disponible" value={newTalkTitle} onChange={e => setNewTalkTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#141414] border border-[#333333] rounded-lg text-white text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Nombre Ponente</label>
                    <input 
                      type="text" placeholder="Ej. Por Definir" value={newTalkSpeaker} onChange={e => setNewTalkSpeaker(e.target.value)}
                      className="w-full px-3 py-2 bg-[#141414] border border-[#333333] rounded-lg text-white text-sm" 
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Hora de Inicio</label>
                <input 
                  type="time" 
                  value={timeInput} 
                  onChange={(e) => setTimeInput(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-xl text-white text-sm outline-none focus:border-[#00FFCC]" 
                  required
                />
              </div>

              <div className="pt-4 border-t border-[#333333] flex justify-end gap-3">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-5 py-2 text-sm font-bold text-[#A0A0A0] hover:text-white">Cancelar</button>
                <button type="submit" disabled={!selectedPendingTalk} className="bg-[#00FFCC] text-black px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#00E6B8] disabled:opacity-50">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingTalk && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#141414] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#333333] w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-5 border-b border-[#333333] bg-[#0A0A0A]">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#9933FF]" />
                Propiedades del Evento
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-[#A0A0A0] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Hora (solo hora, el día es fijo aquí)</label>
                <input 
                  type="time" 
                  value={editTime} 
                  onChange={(e) => setEditTime(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-xl focus:ring-1 focus:ring-[#9933FF] focus:border-[#9933FF] outline-none text-white text-sm" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Título de la Charla</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-xl focus:ring-1 focus:ring-[#9933FF] outline-none text-white text-sm" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Categoría</label>
                  <input 
                    type="text" 
                    value={editCategory} 
                    onChange={(e) => setEditCategory(e.target.value)} 
                    className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-xl outline-none text-white text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Artista / Ponente</label>
                  <input 
                    type="text" 
                    value={editSpeakerName} 
                    onChange={(e) => setEditSpeakerName(e.target.value)} 
                    className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-xl outline-none text-white text-sm" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Enlace de Drive / URL de Póster</label>
                <input 
                  type="text" 
                  value={editPhotoUrl} 
                 onChange={(e) => setEditPhotoUrl(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-xl text-white text-sm font-mono text-xs" 
                 placeholder="Pegar enlace de Google Drive o URL..."
                />
              </div>

              <div className="pt-4 border-t border-[#333333] flex justify-between items-center mt-6">
                <button 
                  type="button" 
                  onClick={() => handleDelete(editingTalk.id)}
                  className="px-4 py-2 flex items-center gap-2 text-sm font-bold text-[#FF3366] bg-[#FF3366]/10 hover:bg-[#FF3366]/20 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2 text-sm font-bold text-[#A0A0A0] hover:text-white">Cancelar</button>
                  <button type="submit" className="bg-[#9933FF] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#7A29CC]">Guardar Cambios</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
