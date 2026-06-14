import React, { useState } from "react";
import { parseISO, format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, MapPin, MonitorPlay, Calendar, Edit3, X, Save } from "lucide-react";
import { formatDriveUrl } from "../lib/utils";
import { Talk } from "../types/talk";

type Props = {
  talks: Talk[];
  updateTalk: (id: number, updates: Partial<Talk>) => Promise<void>;
  updateStatus: (id: number, status: string, scheduled_date?: string) => Promise<void>;
};

export default function AdminCarteleraPreview({ talks, updateTalk, updateStatus }: Props) {
  const [editingTalk, setEditingTalk] = useState<Talk | null>(null);

  // Form state for inline editing
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSpeakerName, setEditSpeakerName] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [editDate, setEditDate] = useState("");

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

  const openEditor = (talk: Talk) => {
    setEditingTalk(talk);
    setEditTitle(talk.title);
    setEditCategory(talk.category || "");
    setEditSpeakerName(talk.speaker_name);
    setEditPhotoUrl(talk.speaker_photo_url || "");
    // slice(0,16) to fit "YYYY-MM-DDThh:mm" format for datetime-local
    setEditDate(talk.scheduled_date ? talk.scheduled_date.slice(0, 16) : "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTalk) return;

    // We can update both the regular fields and the scheduled_date
    const isoDate = editDate ? new Date(editDate).toISOString() : editingTalk.scheduled_date;
    
    // First update the base fields
    await updateTalk(editingTalk.id, {
      title: editTitle,
      category: editCategory,
      speaker_name: editSpeakerName,
      speaker_photo_url: formatDriveUrl(editPhotoUrl),
    });

    // Then update status if date changed
    if (isoDate !== editingTalk.scheduled_date) {
      await updateStatus(editingTalk.id, editingTalk.status, isoDate || undefined);
    }

    setEditingTalk(null);
  };

  // Only show scheduled/completed in exactly the order they will appear publicly
  const visibleTalks = talks
    .filter((t) => t.status === "scheduled" || t.status === "completed")
    .sort((a, b) => new Date(a.scheduled_date || Date.now() * 2).getTime() - new Date(b.scheduled_date || Date.now() * 2).getTime());

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex items-center justify-between bg-[#141414] p-6 rounded-2xl shadow-lg border border-[#333333]">
        <div>
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <MonitorPlay className="w-5 h-5 text-[#00FFCC]" />
            Cartelera Pública Interactiva
          </h2>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Esta es la vista exacta que tendrán tus clientes. Pasa el cursor sobre cualquier charla para editarla en tiempo real.
          </p>
        </div>
        <div className="bg-[#00FFCC]/10 text-[#00FFCC] px-4 py-2 rounded-full text-xs font-bold border border-[#00FFCC]/20 flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,204,0.15)]">
          <div className="w-2 h-2 rounded-full bg-[#00FFCC] animate-pulse"></div>
          EN DIRECTO
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleTalks.map((talk) => (
          <div 
            key={talk.id} 
            className="group relative bg-[#141414] rounded-2xl overflow-hidden shadow-lg border border-[#333333] flex flex-col transition-all duration-300 hover:border-[#00FFCC]/50 hover:shadow-[0_0_20px_rgba(0,255,204,0.15)]"
          >
            {/* Overlay Editable */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center">
              <button 
                onClick={() => openEditor(talk)}
                className="bg-[#00FFCC] text-black px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(0,255,204,0.4)] hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Editar Charla
              </button>
            </div>

            <div className="bg-[#00FFCC]/10 text-[#00FFCC] p-4 flex justify-between items-start border-b border-[#00FFCC]/20">
              <div>
                <p className="font-bold text-sm">
                  {talk.scheduled_date ? safeFormatDate(talk.scheduled_date, "EEEE d 'de' MMMM") : "Sin Fecha"}
                </p>
                <p className="text-[#00FFCC]/80 flex items-center gap-1 mt-1 text-xs">
                  <Clock className="w-3 h-3" />
                  {talk.scheduled_date ? safeFormatDate(talk.scheduled_date, "HH:mm") + " hrs" : "-"} 
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    talk.status === 'completed' ? 'bg-[#333333] text-[#A0A0A0]' : 'bg-[#9933FF]/20 text-[#9933FF]'
                }`}>
                  {talk.status === 'completed' ? 'Completado' : 'Agendada'}
                </span>
                {talk.category && (
                  <div className="bg-[#333333] text-[#A0A0A0] px-2.5 py-1 rounded-full text-[10px] font-medium border border-[#444444]">
                    {talk.category}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-lg font-serif font-bold text-white mb-3 leading-tight">{talk.title}</h3>
              
              <div className="flex items-center gap-3 mb-4">
                {talk.speaker_photo_url ? (
                  <img src={talk.speaker_photo_url} alt="Ponente" className="w-10 h-10 rounded-full object-cover border border-[#333333]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#222222] border border-[#333333] flex items-center justify-center">
                    <span className="text-[#A0A0A0] font-bold text-sm text-center">N/D</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#E0E0E0] truncate">{talk.speaker_name}</p>
                </div>
              </div>

              <div className="mt-auto pt-3 border-t border-[#333333] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#00FFCC] text-xs font-medium">
                  <MapPin className="w-4 h-4" />
                  Casa Padi
                </div>
                <div className="text-xs font-mono text-[#A0A0A0]">#{String(talk.id).padStart(4, '0')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {visibleTalks.length === 0 && (
        <div className="text-center p-12 bg-[#141414] rounded-2xl border border-[#333333]">
          <Calendar className="w-12 h-12 text-[#333333] mx-auto mb-4" />
          <p className="text-[#A0A0A0]">Aún no hay charlas aprobadas para la cartelera.</p>
        </div>
      )}

      {/* Editor Modal */}
      {editingTalk && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#141414] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#333333] w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-5 border-b border-[#333333] bg-[#0A0A0A]">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#00FFCC]" />
                Edición Rápida
              </h3>
              <button onClick={() => setEditingTalk(null)} className="text-[#A0A0A0] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Día y Hora del Evento</label>
                <input 
                  type="datetime-local" 
                  value={editDate} 
                  onChange={(e) => setEditDate(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-xl focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] outline-none text-white text-sm" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Título de la Charla</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-xl focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] outline-none text-white text-sm" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Categoría</label>
                  <input 
                    type="text" 
                    value={editCategory} 
                    onChange={(e) => setEditCategory(e.target.value)} 
                    className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-xl focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] outline-none text-white text-sm" 
                    placeholder="Ej: Biología"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Artista / Ponente</label>
                  <input 
                    type="text" 
                    value={editSpeakerName} 
                    onChange={(e) => setEditSpeakerName(e.target.value)} 
                    className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-xl focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] outline-none text-white text-sm" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">URL Fotografía / Póster</label>
                <input 
                  type="text" 
                  value={editPhotoUrl} 
                  onChange={(e) => setEditPhotoUrl(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-xl focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] outline-none text-white text-sm font-mono text-xs" 
                  placeholder="/assets/miposter.jpg"
                />
                <p className="text-[10px] text-[#A0A0A0] mt-1">Escribe una ruta relativa (ej. /assets/xyz.jpg) si la subiste al código fuente.</p>
              </div>

              <div className="pt-4 border-t border-[#333333] flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingTalk(null)}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-[#A0A0A0] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-[#00FFCC] text-black px-6 py-2 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(0,255,204,0.3)] hover:bg-[#00E6B8] transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
