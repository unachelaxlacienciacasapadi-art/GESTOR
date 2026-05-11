import React, { useState, useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, Check, X, Clock, Download, Image as ImageIcon, Edit3, Coffee, Mail, Phone, Instagram, MonitorPlay, ArrowLeft, LogOut, Trash2 } from "lucide-react";
import { toPng } from 'html-to-image';
import { cn, formatDriveUrl } from "../lib/utils";
import logoImg from "../assets/logo.png";

import AdminAgendaCalendar from "../components/AdminAgendaCalendar";
import AdminCarteleraPreview from "../components/AdminCarteleraPreview";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type Talk = {
  id: number;
  title: string;
  abstract: string;
  speaker_name: string;
  speaker_bio: string;
  speaker_photo_url: string | null;
  email?: string;
  phone?: string;
  social_media?: string;
  technical_needs?: string;
  status: "pending" | "approved" | "rejected" | "scheduled" | "completed";
  scheduled_date: string | null;
  summary?: string | null;
  transmission_url?: string | null;
  event_photos?: string | null;
  category?: string;
  promo_email_sent?: number;
  created_at: string;
};

const AvailabilityManager = ({ token }: { token: string }) => {
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalReason, setModalReason] = useState("");
  const [modalTime, setModalTime] = useState("19:00");
  const [approvedTalksDates, setApprovedTalksDates] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resEx = await fetch('/api/admin/availability', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataEx = await resEx.json();
      setExceptions(dataEx.availability || []);

      const resTalks = await fetch('/api/talks?includeAll=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataTalks = await resTalks.json();
      const dates = dataTalks
        .filter((t: any) => t.status === 'approved' || t.status === 'scheduled')
        .flatMap((t: any) => [t.preferred_date_1, t.preferred_date_2, t.scheduled_date])
        .filter(Boolean)
        .map((d: string) => d.slice(0, 10));
      setApprovedTalksDates(dates);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const isWednesday = (date: Date) => date.getDay() === 3;

  const formatDateString = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const getTileClass = ({ date, view }: { date: Date, view: string }) => {
    if (view !== 'month') return "";
    
    const dateStr = formatDateString(date);
    const exception = exceptions.find(e => e.date.startsWith(dateStr));
    const hasTalk = approvedTalksDates.includes(dateStr);

    if (hasTalk) {
      return "!bg-[#333333]/50 !text-[#A0A0A0] !cursor-not-allowed"; 
    }

    if (exception) {
      return exception.is_available 
        ? "!bg-[#00FFCC]/20 !text-[#00FFCC] !border !border-[#00FFCC]/50" 
        : "!bg-[#FF3366]/20 !text-[#FF3366] !border !border-[#FF3366]/50"; 
    }

    if (isWednesday(date)) {
      return "!bg-[#FFCC00]/20 !text-[#FFCC00] !border !border-[#FFCC00]/50"; 
    }

    return "!text-[#E0E0E0] hover:!bg-[#333333]";
  };

  const handleDateClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
       alert("No puedes modificar fechas pasadas.");
       return;
    }

    const dateStr = formatDateString(date);
    const hasTalk = approvedTalksDates.includes(dateStr);
    
    if (hasTalk && isWednesday(date)) {
      alert("Esta fecha ya tiene una charla aprobada o agendada.");
      return;
    }

    setSelectedDate(date);
    setModalReason("");
    setModalTime("19:00");
    setShowModal(true);
  };

  const handleSaveException = async (isAvailable: boolean) => {
    if (!selectedDate) return;
    if (!modalReason.trim()) {
      alert("Debes proporcionar una razón.");
      return;
    }
    
    setIsSaving(true);
    const dateStr = formatDateString(selectedDate);
    
    try {
      await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          date: dateStr,
          time: modalTime.length === 5 ? `${modalTime}:00` : modalTime,
          is_available: isAvailable,
          reason: modalReason
        })
      });
      await fetchData();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Error al guardar excepción");
    }
    setIsSaving(false);
  };

  const handleDeleteException = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta excepción?")) return;
    try {
      await fetch(`/api/admin/availability/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchData();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Error al eliminar excepción");
    }
  };

  const formatearFecha = (isoDate: string) => {
    try {
      const fecha = new Date(isoDate);
      return new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Mexico_City'
      }).format(fecha);
    } catch (e) {
      return isoDate;
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        .react-calendar { background: #141414 !important; border: 1px solid #333333 !important; border-radius: 1rem; color: white !important; font-family: inherit !important; padding: 1rem; width: 100% !important; }
        .react-calendar__navigation button { color: white !important; min-width: 44px; background: none; font-size: 16px; margin-top: 8px; border-radius: 0.5rem; }
        .react-calendar__navigation button:hover, .react-calendar__navigation button:focus { background: #333333 !important; }
        .react-calendar__month-view__weekdays { text-transform: uppercase; font-weight: bold; font-size: 0.75em; color: #A0A0A0; padding-bottom: 0.5rem; }
        .react-calendar__month-view__days__day--neighboringMonth { color: #444444 !important; }
        .react-calendar__tile { padding: 0.75em 0.5em !important; border-radius: 0.5rem !important; margin: 2px !important; height: auto !important; transition: all 0.2s; }
        .react-calendar__tile:disabled { background-color: #0A0A0A !important; }
        .react-calendar__tile--now { background: #333333 !important; }
      `}</style>

      <div className="bg-[#141414] rounded-2xl shadow-lg border border-[#333333] p-6">
        <h2 className="text-xl font-serif font-bold text-white mb-4">Gestionar Disponibilidad de Fechas</h2>
        
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <span className="w-3 h-3 rounded-full bg-[#FFCC00]/20 border border-[#FFCC00]/50 block"></span> Miércoles Disponibles
          </div>
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <span className="w-3 h-3 rounded-full bg-[#00FFCC]/20 border border-[#00FFCC]/50 block"></span> Fechas Extra
          </div>
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <span className="w-3 h-3 rounded-full bg-[#FF3366]/20 border border-[#FF3366]/50 block"></span> Miércoles Bloqueados
          </div>
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <span className="w-3 h-3 rounded-full bg-[#333333]/50 block"></span> Ocupado (Aprobada)
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
             <div className="w-8 h-8 border-4 border-[#FFCC00]/30 border-t-[#FFCC00] rounded-full animate-spin" />
          </div>
        ) : (
          <Calendar
            onClickDay={handleDateClick}
            tileClassName={getTileClass}
            minDetail="month"
            next2Label={null}
            prev2Label={null}
          />
        )}
      </div>

      <div className="bg-[#141414] rounded-2xl shadow-lg border border-[#333333] p-6">
        <h3 className="text-lg font-bold text-white mb-4">Excepciones Activas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#333333] text-[#A0A0A0] text-xs uppercase tracking-wider">
                <th className="p-3">Fecha</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Razón</th>
                <th className="p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map(ex => (
                <tr key={ex.id} className="border-b border-[#222222] text-sm text-white hover:bg-[#1A1A1A]">
                  <td className="p-3 capitalize">{formatearFecha(`${ex.date}T${ex.time}`)}</td>
                  <td className="p-3">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                      ex.is_available ? "bg-[#00FFCC]/20 text-[#00FFCC]" : "bg-[#FF3366]/20 text-[#FF3366]"
                    )}>
                      {ex.is_available ? "Habilitada" : "Bloqueada"}
                    </span>
                  </td>
                  <td className="p-3 text-[#A0A0A0]">{ex.reason || "-"}</td>
                  <td className="p-3">
                    <button 
                      onClick={() => handleDeleteException(ex.id)}
                      className="text-[#FF3366] hover:text-white transition-colors text-xs"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {exceptions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-[#A0A0A0] text-sm italic">
                    No hay excepciones activas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] rounded-2xl shadow-2xl border border-[#333333] p-6 w-full max-w-md">
            <h3 className="text-xl font-serif font-bold text-white mb-4 capitalize">
              {formatearFecha(formatDateString(selectedDate) + 'T12:00:00')}
            </h3>
            
            {(() => {
              const dateStr = formatDateString(selectedDate);
              const existingEx = exceptions.find(e => e.date.startsWith(dateStr));
              
              if (existingEx) {
                return (
                  <div className="space-y-4">
                    <p className="text-sm text-[#A0A0A0]">
                      Esta fecha tiene una excepción activa: 
                      <strong className={existingEx.is_available ? "text-[#00FFCC] ml-1" : "text-[#FF3366] ml-1"}>
                        {existingEx.is_available ? "Habilitada" : "Bloqueada"}
                      </strong>
                    </p>
                    <p className="text-sm text-white bg-[#0A0A0A] p-3 rounded-lg border border-[#333333]">
                      Razón: {existingEx.reason || "Sin razón"}
                    </p>
                    <div className="flex gap-3 pt-4">
                      <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-[#333333] hover:bg-[#444444]">
                        Cerrar
                      </button>
                      <button onClick={() => handleDeleteException(existingEx.id)} className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-[#FF3366] hover:bg-[#FF1A53] shadow-[0_0_15px_rgba(255,51,102,0.3)]">
                        Eliminar Excepción
                      </button>
                    </div>
                  </div>
                );
              }

              const isWed = isWednesday(selectedDate);

              return (
                <div className="space-y-4">
                  <p className="text-sm text-[#E0E0E0]">
                    {isWed 
                      ? "¿Deseas bloquear este miércoles para que nadie pueda seleccionarlo?" 
                      : "¿Deseas habilitar esta fecha como una opción extra disponible?"}
                  </p>
                  
                  {!isWed && (
                    <div>
                      <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Hora</label>
                      <input 
                        type="time" 
                        value={modalTime}
                        onChange={e => setModalTime(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-[#00FFCC] outline-none text-white text-sm" 
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Razón / Evento *</label>
                    <input 
                      type="text" 
                      value={modalReason}
                      onChange={e => setModalReason(e.target.value)}
                      placeholder={isWed ? "Ej. Festivo nacional, vacaciones..." : "Ej. Evento especial de fin de semana"}
                      className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-[#00FFCC] outline-none text-white text-sm" 
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setShowModal(false)} disabled={isSaving} className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-[#333333] hover:bg-[#444444] disabled:opacity-50">
                      Cancelar
                    </button>
                    <button 
                      onClick={() => handleSaveException(!isWed)} 
                      disabled={isSaving}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50",
                        isWed ? "bg-[#FF3366] hover:bg-[#FF1A53] shadow-[0_0_15px_rgba(255,51,102,0.3)]" : "bg-[#00FFCC] text-black hover:bg-[#00CCAA] shadow-[0_0_15px_rgba(0,255,204,0.3)]"
                      )}
                    >
                      {isSaving ? "Guardando..." : isWed ? "Bloquear Miércoles" : "Habilitar Fecha"}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("adminToken");
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [talks, setTalks] = useState<Talk[]>([]);
  const [subscribers, setSubscribers] = useState<{id: number, email: string, created_at: string}[]>([]);
  const [contacts, setContacts] = useState<{id: number, name: string, type: string, contact_person: string, phone: string, social_media: string, notes: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "agenda" | "design" | "dashboard" | "availability">("dashboard");
  
  // Contacts Form Form
  const [showContactForm, setShowContactForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", type: "", contact_person: "", phone: "", social_media: "", notes: "" });
  const [isSavingContact, setIsSavingContact] = useState(false);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name) return;
    setIsSavingContact(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}` 
        },
        body: JSON.stringify(newContact),
      });
      if (res.status === 401 || res.status === 403) return handleLogout();
      fetchContacts();
      setShowContactForm(false);
      setNewContact({ name: "", type: "", contact_person: "", phone: "", social_media: "", notes: "" });
    } catch (error) {
      console.error("Failed to add contact", error);
    } finally {
      setIsSavingContact(false);
    }
  };

  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTalks();
      fetchSubscribers();
      fetchContacts();
    }
  }, [isAuthenticated]);

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("adminToken")}` }
      });
      if (res.status === 401 || res.status === 403) return handleLogout();
      const data = await res.json();
      setContacts(data);
    } catch (error) {
      console.error("Failed to fetch contacts", error);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const res = await fetch("/api/subscribers", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("adminToken")}` }
      });
      if (res.status === 401 || res.status === 403) return handleLogout();
      const data = await res.json();
      setSubscribers(data);
    } catch (error) {
      console.error("Failed to fetch subscribers", error);
    }
  };
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSpeakerName, setEditSpeakerName] = useState("");
  const [editSpeakerPhotoUrl, setEditSpeakerPhotoUrl] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editTransmissionUrl, setEditTransmissionUrl] = useState("");
  const [isEditingAll, setIsEditingAll] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);

  useEffect(() => {
    if (selectedTalk) {
      setEditTitle(selectedTalk.title || "");
      setEditCategory(selectedTalk.category || "General");
      setEditSpeakerName(selectedTalk.speaker_name || "");
      setEditSpeakerPhotoUrl(selectedTalk.speaker_photo_url || "");
      setEditSummary(selectedTalk.summary || "");
      setEditTransmissionUrl(selectedTalk.transmission_url || "");
      setIsEditingAll(false);
    }
  }, [selectedTalk]);

  const handleSaveDetails = async () => {
    if (!selectedTalk) return;
    setIsSavingDetails(true);
    await updateTalk(selectedTalk.id, { 
      title: editTitle,
      category: editCategory,
      speaker_name: editSpeakerName,
      speaker_photo_url: formatDriveUrl(editSpeakerPhotoUrl),
      summary: editSummary, 
      transmission_url: editTransmissionUrl 
    });
    setIsSavingDetails(false);
    setIsEditingAll(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("adminToken", data.token);
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || "Credenciales incorrectas");
      }
    } catch (error) {
      setLoginError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    setTalks([]);
    setSelectedTalk(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mb-6">
          <a href="/" className="inline-flex items-center gap-2 text-[#A0A0A0] hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Volver al sitio web
          </a>
        </div>
        <div className="bg-[#141414] p-8 rounded-2xl shadow-2xl border border-[#333333] w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl font-bold text-white mb-2">Casa Padi</h1>
            <p className="text-[#A0A0A0] text-sm">Panel de Administración</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#333333] rounded-xl focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] transition-all outline-none text-white"
                placeholder="Ingresa tu usuario"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#333333] rounded-xl focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] transition-all outline-none text-white"
                placeholder="••••••••"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 bg-[#FF3366]/10 border border-[#FF3366]/30 rounded-lg text-[#FF3366] text-sm text-center">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#00FFCC] text-black rounded-xl font-bold hover:bg-[#00CCAA] transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(0,255,204,0.3)]"
            >
              {isLoggingIn ? "Verificando..." : "Ingresar al Panel"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const safeFormatDate = (dateString: string | null | undefined, formatStr: string) => {
    if (!dateString) return "";
    try {
      const parsed = parseISO(dateString.replace(' ', 'T'));
      if (isNaN(parsed.getTime())) return "";
      return format(parsed, formatStr, { locale: es });
    } catch (e) {
      return "";
    }
  };

  const fetchTalks = async () => {
    try {
      const res = await fetch("/api/talks?includeAll=true");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTalks(data);
      } else {
        console.error("Expected array of talks, got:", data);
        setTalks([]);
      }
    } catch (error) {
      console.error("Failed to fetch talks", error);
      setTalks([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: Talk["status"], scheduled_date?: string) => {
    try {
      const body: any = { status };
      if (scheduled_date) body.scheduled_date = scheduled_date;

      const res = await fetch(`/api/talks/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        },
        body: JSON.stringify(body),
      });
      if (res.status === 401 || res.status === 403) return handleLogout();
      fetchTalks();
      if (selectedTalk?.id === id) {
        setSelectedTalk({ ...selectedTalk, status, scheduled_date: scheduled_date || null });
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const updateTalk = async (id: number, updates: Partial<Talk>) => {
    try {
      const res = await fetch(`/api/talks/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        },
        body: JSON.stringify(updates),
      });
      if (res.status === 401 || res.status === 403) return handleLogout();
      fetchTalks();
      if (selectedTalk?.id === id) {
        setSelectedTalk({ ...selectedTalk, ...updates });
      }
    } catch (error) {
      console.error("Failed to update talk", error);
    }
  };

  const deleteTalk = async (id: number) => {
    try {
      const res = await fetch(`/api/talks/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("adminToken")}` }
      });
      if (res.status === 401 || res.status === 403) return handleLogout();
      fetchTalks();
      if (selectedTalk?.id === id) setSelectedTalk(null);
    } catch (error) {
      console.error("Failed to delete talk", error);
    }
  };

  const createTalk = async (talkData: Partial<Talk>) => {
    try {
      await fetch(`/api/talks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(talkData),
      });
      fetchTalks();
    } catch (error) {
      console.error("Failed to create talk", error);
    }
  };

  // Filter talks based on active tab
  const filteredTalks = talks.filter(talk => {
    if (activeTab === "list") return talk.status === "pending" || talk.status === "rejected" || talk.status === "approved";
    if (activeTab === "calendar") return talk.status === "approved" || talk.status === "scheduled";
    if (activeTab === "design") return talk.status === "scheduled" || talk.status === "completed";
    if (activeTab === "dashboard" || activeTab === "agenda" || activeTab === "contacts") return false;
    return true;
  });

  if (activeTab === "calendar" || activeTab === "design" || activeTab === "agenda") {
    filteredTalks.sort((a, b) => new Date(a.scheduled_date || Date.now() * 2).getTime() - new Date(b.scheduled_date || Date.now() * 2).getTime());
  }

  // Handle tab change
  const handleTabChange = (tab: "list" | "calendar" | "design" | "dashboard" | "agenda" | "contacts" | "availability", keepSelection = false) => {
    setActiveTab(tab as any);
    if (!keepSelection) {
      setSelectedTalk(null); // Reset selection when changing tabs to avoid confusion
    }
  };

  const getPlaceholderText = () => {
    if (activeTab === "calendar") return "Elige una charla aprobada de la lista para asignarle una fecha y hora.";
    if (activeTab === "design") return "Elige una charla agendada de la lista para generar su póster promocional.";
    if (activeTab === "dashboard") return "Visualiza las métricas y suscriptores de la comunidad.";
    if (activeTab === "agenda") return "Visualiza y edita la cartelera general.";
    if (activeTab === "contacts") return "Directorio de contactos y artistas.";
    return "Elige una charla de la lista para ver sus detalles y gestionarla.";
  };

  const getPlaceholderTitle = () => {
    if (activeTab === "calendar") return "Agendar Charla";
    if (activeTab === "design") return "Generar Diseño";
    if (activeTab === "dashboard") return "Dashboard";
    if (activeTab === "agenda") return "Agenda General";
    if (activeTab === "contacts") return "Contactos";
    return "Selecciona una propuesta";
  };

  const downloadPoster = async () => {
    if (!posterRef.current) return;
    setIsGeneratingPoster(true);
    try {
      // Temporarily remove border radius and shadow for better capture
      const originalStyle = posterRef.current.style.cssText;
      posterRef.current.style.borderRadius = '0';
      posterRef.current.style.boxShadow = 'none';

      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        backgroundColor: '#0A0A0A',
        pixelRatio: 2,
        style: {
          transform: 'none',
        },
        filter: (node) => {
          // Filter out elements that might cause issues, if any
          return true;
        }
      });
      
      // Restore original styles
      posterRef.current.style.cssText = originalStyle;

      const link = document.createElement("a");
      link.download = `poster-${selectedTalk?.speaker_name.replace(/\s+/g, "-") || 'charla'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to generate poster", error);
      alert("Hubo un error al generar la imagen. Por favor, intenta de nuevo.");
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#9933FF]/30 border-t-[#9933FF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex justify-between items-center w-full md:w-auto">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <a href="/" className="flex items-center justify-center w-8 h-8 rounded-full bg-[#141414] border border-[#333333] text-[#A0A0A0] hover:text-white hover:bg-[#1A1A1A] transition-colors" title="Volver al sitio web">
                <ArrowLeft className="w-4 h-4" />
              </a>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">Panel de Administración</h1>
            </div>
            <p className="text-sm text-[#A0A0A0]">Gestiona las charlas de "Una chela por la ciencia"</p>
          </div>
          <button
            onClick={handleLogout}
            className="md:hidden p-2 text-[#A0A0A0] hover:text-white bg-[#141414] rounded-full border border-[#333333]"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <a
            href="/api/admin/backup"
            download
            className="flex items-center gap-2 px-4 py-2 text-[#00FFCC] bg-[#00FFCC]/10 hover:bg-[#00FFCC]/20 rounded-full border border-[#00FFCC]/30 transition-colors text-sm font-medium shrink-0"
            title="Descargar respaldo de la base de datos"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Respaldo</span>
          </a>
          <div className="flex bg-[#141414] rounded-full p-1 shadow-lg border border-[#333333] shrink-0">
          <button
            onClick={() => handleTabChange("list")}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-medium transition-all",
              activeTab === "list" ? "bg-[#9933FF] text-white shadow-[0_0_10px_rgba(153,51,255,0.4)]" : "text-[#A0A0A0] hover:text-white"
            )}
          >
            Solicitudes
          </button>
          <button
            onClick={() => handleTabChange("agenda")}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-medium transition-all",
              activeTab === "agenda" ? "bg-[#9933FF] text-white shadow-[0_0_10px_rgba(153,51,255,0.4)]" : "text-[#A0A0A0] hover:text-white"
            )}
          >
            Agenda
          </button>
          <button
            onClick={() => handleTabChange("design")}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-medium transition-all",
              activeTab === "design" ? "bg-[#9933FF] text-white shadow-[0_0_10px_rgba(153,51,255,0.4)]" : "text-[#A0A0A0] hover:text-white"
            )}
          >
            Diseño
          </button>
          <button
            onClick={() => handleTabChange("dashboard")}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-medium transition-all",
              activeTab === "dashboard" ? "bg-[#9933FF] text-white shadow-[0_0_10px_rgba(153,51,255,0.4)]" : "text-[#A0A0A0] hover:text-white"
            )}
          >
            Dashboard
          </button>
          <button
            onClick={() => handleTabChange("availability")}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1",
              activeTab === "availability" ? "bg-[#FFCC00] text-black shadow-[0_0_10px_rgba(255,204,0,0.4)]" : "text-[#A0A0A0] hover:text-white"
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Disponibilidad
          </button>
        </div>
        
        <button
          onClick={handleLogout}
          className="hidden md:flex items-center gap-2 px-4 py-2 text-[#A0A0A0] hover:text-white bg-[#141414] hover:bg-[#1A1A1A] rounded-full border border-[#333333] transition-colors text-sm font-medium shrink-0"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === "dashboard" ? (
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-[#141414] rounded-2xl shadow-lg border border-[#333333] p-6">
              <h2 className="text-xl font-serif font-bold text-white mb-4">Dashboard de Comunidad</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0A0A0A] p-6 rounded-xl border border-[#333333] flex flex-col items-center justify-center text-center">
                  <h3 className="text-sm font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Registros (Promo 5 QR)</h3>
                  <p className="text-4xl font-serif font-bold text-[#00FFCC]">{subscribers.length}</p>
                </div>
                
                <div className="bg-[#0A0A0A] p-6 rounded-xl border border-[#333333] flex flex-col items-center justify-center text-center">
                  <h3 className="text-sm font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Solicitudes Pendientes</h3>
                  <p className="text-4xl font-serif font-bold text-[#FFCC00]">{talks.filter(t => t.status === "pending").length}</p>
                </div>

                <div className="bg-[#0A0A0A] p-6 rounded-xl border border-[#333333] flex flex-col items-center justify-center text-center">
                  <h3 className="text-sm font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Aprobadas (A la espera de fecha)</h3>
                  <p className="text-4xl font-serif font-bold text-[#9933FF]">{talks.filter(t => t.status === "approved").length}</p>
                </div>
              </div>
            </div>
            
            {/* INICIO DE DIRECTORIO (antes CONTACTOS) */}
            <div className="bg-[#141414] rounded-2xl shadow-lg border border-[#333333] p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-serif font-bold text-white">Directorio de Contactos y Artistas</h2>
                <button 
                  onClick={() => setShowContactForm(!showContactForm)} 
                  className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto", 
                    showContactForm ? "bg-[#333333] text-white" : "bg-[#00FFCC] text-black shadow-[0_0_15px_rgba(0,255,204,0.3)] hover:bg-[#00CCAA]"
                  )}
                >
                  {showContactForm ? "Cancelar" : "+ Nuevo Contacto"}
                </button>
              </div>

              {showContactForm && (
                 <form onSubmit={handleSaveContact} className="bg-[#0A0A0A] p-6 rounded-xl border border-[#333333] mb-8 space-y-4">
                   <h3 className="text-lg font-bold text-white mb-2">Nuevo Contacto</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Nombre / Proyecto *</label>
                       <input type="text" required value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} className="w-full px-3 py-2 bg-[#141414] border border-[#333333] rounded-lg focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] outline-none text-white text-sm" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Especialidad o Tipo</label>
                       <input type="text" value={newContact.type} onChange={(e) => setNewContact({...newContact, type: e.target.value})} placeholder="Ej. Audiovisual, Teatro" className="w-full px-3 py-2 bg-[#141414] border border-[#333333] rounded-lg focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] outline-none text-white text-sm" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Persona de Contacto</label>
                       <input type="text" value={newContact.contact_person} onChange={(e) => setNewContact({...newContact, contact_person: e.target.value})} className="w-full px-3 py-2 bg-[#141414] border border-[#333333] rounded-lg focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] outline-none text-white text-sm" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Teléfono</label>
                       <input type="text" value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} className="w-full px-3 py-2 bg-[#141414] border border-[#333333] rounded-lg focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] outline-none text-white text-sm" />
                     </div>
                     <div className="md:col-span-2">
                       <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Redes Sociales (Link)</label>
                       <input type="url" value={newContact.social_media} onChange={(e) => setNewContact({...newContact, social_media: e.target.value})} className="w-full px-3 py-2 bg-[#141414] border border-[#333333] rounded-lg focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] outline-none text-white text-sm" />
                     </div>
                     <div className="md:col-span-2">
                       <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Notas / Observaciones</label>
                       <textarea value={newContact.notes} onChange={(e) => setNewContact({...newContact, notes: e.target.value})} className="w-full px-3 py-2 bg-[#141414] border border-[#333333] rounded-lg focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] outline-none text-white text-sm h-20 resize-none"></textarea>
                     </div>
                   </div>
                   <div className="flex justify-end pt-2">
                     <button type="submit" disabled={isSavingContact} className="bg-[#9933FF] text-white px-6 py-2 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(153,51,255,0.3)] hover:bg-[#7A29CC] transition-colors disabled:opacity-50">
                       {isSavingContact ? "Guardando..." : "Guardar Contacto"}
                     </button>
                   </div>
                 </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contacts.map(contact => (
                  <div key={contact.id} className="bg-[#0A0A0A] p-4 rounded-xl border border-[#333333] flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">{contact.name}</h3>
                      {contact.type && <p className="text-[10px] font-bold text-[#00FFCC] uppercase tracking-wider mb-2">{contact.type}</p>}
                      {contact.contact_person && <p className="text-xs text-[#A0A0A0] mb-1"><span className="font-bold">Contacto:</span> {contact.contact_person}</p>}
                      {contact.phone && <p className="text-xs text-[#A0A0A0] mb-1"><span className="font-bold">Teléfono:</span> {contact.phone}</p>}
                      {contact.social_media && (
                        <p className="text-xs text-[#A0A0A0] mb-1">
                          <span className="font-bold">Redes:</span> <a href={contact.social_media} target="_blank" rel="noopener noreferrer" className="text-[#9933FF] hover:underline">Link</a>
                        </p>
                      )}
                      {contact.notes && <p className="text-xs text-[#A0A0A0] mt-2 italic">"{contact.notes}"</p>}
                    </div>
                  </div>
                ))}
                {contacts.length === 0 && (
                  <div className="col-span-full p-8 text-center text-[#A0A0A0] text-sm italic">
                    No hay contactos registrados.
                  </div>
                )}
              </div>
            </div>
            {/* FIN DIRECTORIO */}
          </div>
        ) : activeTab === "availability" ? (
          <div className="lg:col-span-3">
            <AvailabilityManager token={localStorage.getItem("adminToken") || ""} />
          </div>
        ) : activeTab === "agenda" ? (
          <div className="lg:col-span-3">
            <AdminAgendaCalendar talks={talks} updateTalk={updateTalk} updateStatus={updateStatus} deleteTalk={deleteTalk} createTalk={createTalk} />
          </div>
        ) : (
          <>
            {/* Left Column - List */}
            <div className={cn("lg:col-span-1 space-y-4", selectedTalk ? "hidden lg:block" : "block")}>
          <div className="bg-[#141414] rounded-2xl shadow-lg border border-[#333333] overflow-hidden flex flex-col h-[calc(100vh-180px)]">
            <div className="p-4 border-b border-[#333333] bg-[#0A0A0A] flex justify-between items-center">
              <h2 className="font-serif font-bold text-white flex items-center gap-2 text-sm">
                {activeTab === "list" && <Clock className="w-4 h-4 text-[#9933FF]" />}
                {activeTab === "design" && <ImageIcon className="w-4 h-4 text-[#FF3366]" />}
                {activeTab === "list" ? "Propuestas" : "Agendadas"}
              </h2>
              {activeTab === "list" && (
                <button 
                  onClick={() => handleTabChange("agenda")}
                  className="text-xs bg-[#00FFCC] text-black px-2.5 py-1.5 rounded-full font-bold hover:bg-[#00CCAA] transition-colors"
                >
                  + Charla Manual
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
              {filteredTalks.map((talk) => (
                <button
                  key={talk.id}
                  onClick={() => setSelectedTalk(talk)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl transition-all border",
                    selectedTalk?.id === talk.id
                      ? "bg-[#9933FF]/10 border-[#9933FF]/50 shadow-sm"
                      : "bg-[#0A0A0A] border-transparent hover:border-[#333333] hover:bg-[#1A1A1A]"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                      talk.status === "pending" && "bg-[#FFCC00]/20 text-[#FFCC00] border border-[#FFCC00]/30",
                      talk.status === "approved" && "bg-[#00FFCC]/20 text-[#00FFCC] border border-[#00FFCC]/30",
                      talk.status === "rejected" && "bg-[#FF3366]/20 text-[#FF3366] border border-[#FF3366]/30",
                      talk.status === "scheduled" && "bg-[#9933FF]/20 text-[#9933FF] border border-[#9933FF]/30",
                      talk.status === "completed" && "bg-[#333333] text-[#A0A0A0] border border-[#444444]"
                    )}>
                      {talk.status === "pending" ? "Pendiente" : 
                       talk.status === "approved" ? "Aprobada" : 
                       talk.status === "rejected" ? "Rechazada" : 
                       talk.status === "scheduled" ? "Agendada" : "Completada"}
                    </span>
                    <span className="text-[10px] text-[#A0A0A0] flex items-center gap-2">
                      <span className="font-mono text-[#00FFCC]">#{String(talk.id).padStart(4, '0')}</span>
                      <span>{activeTab === "list" ? (talk.created_at ? safeFormatDate(talk.created_at, "dd MMM") : "N/A") : (talk.scheduled_date ? safeFormatDate(talk.scheduled_date, "dd MMM yyyy") : "Sin Fecha")}</span>
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm line-clamp-1">{talk.title}</h3>
                  <p className="text-xs text-[#A0A0A0] line-clamp-1 mt-1">{talk.speaker_name}</p>
                </button>
              ))}
              {filteredTalks.length === 0 && (
                <div className="p-8 text-center text-[#A0A0A0] text-sm italic">
                  No hay charlas en esta categoría.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Details / Actions */}
        <div className={cn("lg:col-span-2", !selectedTalk ? "hidden lg:block" : "block")}>
          {selectedTalk ? (
            <div className="bg-[#141414] rounded-2xl shadow-lg border border-[#333333] p-6 md:p-8 h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar relative">
              <button 
                onClick={() => setSelectedTalk(null)}
                className="lg:hidden mb-6 flex items-center gap-2 text-[#A0A0A0] hover:text-white text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a la lista
              </button>
              
              {activeTab === "design" ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-[#333333] pb-4">
                    <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-[#FF3366]" />
                      Generador de Post
                    </h2>
                    <button
                      onClick={downloadPoster}
                      disabled={isGeneratingPoster}
                      className="flex items-center gap-2 px-4 py-2 bg-[#FF3366] text-white rounded-full hover:bg-[#FF1A53] transition-colors text-xs font-medium shadow-[0_0_10px_rgba(255,51,102,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingPoster ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      {isGeneratingPoster ? "Generando..." : "Descargar Imagen"}
                    </button>
                  </div>

                  {/* Poster Preview Area */}
                  <div className="flex justify-center bg-[#0A0A0A] p-6 rounded-xl border border-[#333333] overflow-hidden">
                    <div
                      id="poster-container"
                      ref={posterRef}
                      className="w-[400px] h-[500px] bg-[#F5F5F0] relative overflow-hidden shadow-2xl flex flex-col"
                      style={{ width: '400px', height: '500px' }}
                    >
                      {/* Decorative coral element top right */}
                      <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none" style={{ transform: 'translate(20%, -20%)' }}>
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                          <path fill="#E88D82" d="M45.7,-76.1C58.9,-69.3,69.1,-55.3,77.5,-40.8C85.9,-26.3,92.5,-11.3,91.3,3.1C90.1,17.5,81.1,31.3,71.1,43.4C61.1,55.5,50.1,65.9,37.1,72.7C24.1,79.5,9.1,82.7,-5.7,81.5C-20.5,80.3,-35.1,74.7,-47.9,66.1C-60.7,57.5,-71.7,45.9,-78.9,31.8C-86.1,17.7,-89.5,1.1,-86.3,-14.2C-83.1,-29.5,-73.3,-43.5,-60.9,-53.4C-48.5,-63.3,-33.5,-69.1,-19.3,-73.1C-5.1,-77.1,8.3,-79.3,22.1,-79.7C35.9,-80.1,50.1,-78.7,45.7,-76.1Z" transform="translate(100 100) scale(1.1)" />
                        </svg>
                      </div>
                      
                      {/* Decorative coral element bottom left */}
                      <div className="absolute bottom-0 left-0 w-48 h-48 opacity-15 pointer-events-none" style={{ transform: 'translate(-30%, 30%)' }}>
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                          <path fill="#E88D82" d="M39.9,-65.7C54.1,-60.5,69.6,-53.8,80.3,-42.1C91,-30.4,96.9,-13.7,94.4,2C91.9,17.7,81,32.4,69.8,45.7C58.6,59,47.1,70.9,33.4,78.2C19.7,85.5,3.8,88.2,-11.1,86.1C-26,84,-40,77.1,-52.6,68.1C-65.2,59.1,-76.4,48,-82.1,34.5C-87.8,21,-88,5.1,-84.3,-9.6C-80.6,-24.3,-73,-37.8,-62.1,-48.6C-51.2,-59.4,-37,-67.5,-23.1,-71.9C-9.2,-76.3,4.4,-77,19.2,-74.6C34,-72.2,48,-66.7,39.9,-65.7Z" transform="translate(100 100) scale(1.1)" />
                        </svg>
                      </div>
                      
                      <div className="p-8 flex flex-col h-full relative z-10 w-full">
                        {/* Header */}
                        <div className="text-center mb-8">
                          <h2 className="text-[#2E6F40] font-sans font-medium text-[42px] leading-[0.9] tracking-tight">
                            Una chela x<br />la ciencia
                          </h2>
                        </div>
                        
                        {/* Content Area */}
                        <div className="flex gap-4 mb-auto">
                          {/* Left Column: Title and Bio */}
                          <div className="flex-1 flex flex-col">
                            <h1 className="text-[#2E6F40] font-sans font-medium text-[28px] leading-[1.1] tracking-tight mb-6">
                              {selectedTalk.title}
                            </h1>
                            <p className="text-black/80 text-[10px] uppercase leading-tight">
                              {selectedTalk.speaker_bio.substring(0, 200)}...
                            </p>
                          </div>
                          
                          {/* Right Column: Photo and Name */}
                          <div className="w-[140px] shrink-0 flex flex-col items-center">
                            {selectedTalk.speaker_photo_url ? (
                              <img
                                src={selectedTalk.speaker_photo_url}
                                alt={selectedTalk.speaker_name}
                                className="w-[120px] h-[120px] rounded-full object-cover border-[5px] border-black mb-3"
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <div className="w-[120px] h-[120px] rounded-full bg-gray-300 border-[5px] border-black flex items-center justify-center mb-3">
                                <span className="text-black font-bold text-4xl">
                                  {selectedTalk.speaker_name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <p className="text-black font-bold text-sm uppercase leading-tight text-center">
                              {selectedTalk.speaker_name}
                            </p>
                          </div>
                        </div>

                        {/* Date and Time */}
                        <div className="flex items-end gap-6 mb-8">
                          <div className="font-serif italic text-black text-xl">
                            {selectedTalk.scheduled_date 
                              ? safeFormatDate(selectedTalk.scheduled_date, "EEEE d / MMMM / yyyy")
                              : "Próximamente"}
                          </div>
                          <div className="font-serif italic text-black text-xl font-bold">
                            {selectedTalk.scheduled_date 
                              ? safeFormatDate(selectedTalk.scheduled_date, "h:mm a")
                              : "7:00 pm"}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-end mt-auto">
                          <div className="flex gap-4 items-center">
                            {/* Logo Una Chela por la Ciencia */}
                            <div className="w-16 h-16 flex items-center justify-center">
                              <img src={logoImg} alt="Una Chela por la Ciencia" className="max-w-full max-h-full object-contain" crossOrigin="anonymous" />
                            </div>
                            {/* Casa Padi text */}
                            <div className="flex flex-col">
                              <span className="text-black font-bold text-xs tracking-widest">CASA PÄDI</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-black text-[10px] uppercase tracking-wider">
                              AV. PIRACANTOS 1507, PACHUCA
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#333333] pb-5 gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-4">
                        <h2 className="text-2xl font-serif font-bold text-white mb-1.5 leading-tight">{selectedTalk.title}</h2>
                        <span className="font-mono text-[#00FFCC] text-xs bg-[#00FFCC]/10 px-2 py-1 rounded-md border border-[#00FFCC]/20 whitespace-nowrap">
                          Folio #{String(selectedTalk.id).padStart(4, '0')}
                        </span>
                      </div>
                      <p className="text-[#A0A0A0] text-sm flex items-center gap-2">
                        <span className="font-medium text-[#E0E0E0]">{selectedTalk.speaker_name}</span>
                        <span className="w-1 h-1 bg-[#FFCC00] rounded-full" />
                        <span className="text-xs">
                          {selectedTalk.created_at ? safeFormatDate(selectedTalk.created_at, "d 'de' MMM, yyyy") : "N/A"}
                        </span>
                      </p>
                    </div>
                    
                    <div className="flex gap-2 shrink-0">
                      {selectedTalk.status === "pending" && (
                        <>
                          <div className="flex items-center gap-2 mr-4">
                            <select
                              value={selectedTalk.category || "General"}
                              onChange={(e) => updateTalk(selectedTalk.id, { category: e.target.value })}
                              className="bg-[#141414] border border-[#333333] rounded-full px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00FFCC] transition-colors appearance-none"
                            >
                              <option value="General">General</option>
                              <option value="Biología">Biología</option>
                              <option value="Física">Física</option>
                              <option value="Química">Química</option>
                              <option value="Tecnología">Tecnología</option>
                              <option value="Medio Ambiente">Medio Ambiente</option>
                            </select>
                          </div>
                          <button
                            onClick={() => updateStatus(selectedTalk.id, "approved")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00FFCC]/20 text-[#00FFCC] border border-[#00FFCC]/50 rounded-full hover:bg-[#00FFCC]/30 transition-colors text-xs font-medium"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => updateStatus(selectedTalk.id, "rejected")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF3366]/10 text-[#FF3366] border border-[#FF3366]/30 rounded-full hover:bg-[#FF3366]/20 transition-colors text-xs font-medium"
                          >
                            <X className="w-3.5 h-3.5" />
                            Rechazar
                          </button>
                        </>
                      )}
                      {(selectedTalk.status === "pending" || selectedTalk.status === "rejected") && (
                        <button
                          onClick={() => {
                            if (window.confirm("¿Seguro que deseas eliminar esta propuesta?")) {
                              deleteTalk(selectedTalk.id);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF3366] text-white rounded-full hover:bg-[#FF1A53] transition-colors text-xs font-medium shadow-[0_0_10px_rgba(255,51,102,0.3)]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar
                        </button>
                      )}
                      
                      {selectedTalk.status === "scheduled" && (
                        <>
                          <button
                            onClick={() => handleTabChange("design", true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF3366] text-white rounded-full hover:bg-[#FF1A53] transition-colors text-xs font-medium shadow-[0_0_10px_rgba(255,51,102,0.3)]"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            Diseño
                          </button>
                          <button
                            onClick={() => updateStatus(selectedTalk.id, "completed")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00FFCC] text-black rounded-full hover:bg-[#00CCAA] transition-colors text-xs font-bold shadow-[0_0_10px_rgba(0,255,204,0.3)]"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Marcar Completada
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-5">
                      {selectedTalk.status === "completed" && (
                        <div>
                          <h3 className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-2 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-[#FFCC00]" />
                            Fotos del Evento
                          </h3>
                          <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#333333]">
                            <p className="text-sm text-[#A0A0A0] mb-4">Sube fotos del evento para mostrarlas en la cartelera.</p>
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*"
                              className="block w-full text-sm text-[#A0A0A0]
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-[#FFCC00] file:text-black
                                hover:file:bg-[#E6B800]
                                cursor-pointer"
                              onChange={async (e) => {
                                if (!e.target.files || e.target.files.length === 0) return;
                                const formData = new FormData();
                                Array.from(e.target.files).forEach((file: File) => {
                                  formData.append("photos", file);
                                });
                                
                                try {
                                  const res = await fetch(`/api/talks/${selectedTalk.id}/photos`, {
                                    method: "POST",
                                    body: formData,
                                  });
                                  if (res.ok) {
                                    fetchTalks();
                                    alert("Fotos subidas exitosamente");
                                  } else {
                                    alert("Error al subir fotos");
                                  }
                                } catch (error) {
                                  console.error("Error uploading photos", error);
                                  alert("Error al subir fotos");
                                }
                              }}
                            />
                            {selectedTalk.event_photos && (
                              <div className="mt-4 grid grid-cols-3 gap-2">
                                {(() => {
                                  try {
                                    const photos = JSON.parse(selectedTalk.event_photos);
                                    return photos.map((url: string, i: number) => (
                                      <img key={i} src={url} alt={`Event photo ${i+1}`} className="w-full h-24 object-cover rounded-lg border border-[#333333]" />
                                    ));
                                  } catch (e) {
                                    return null;
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedTalk.status === "approved" && (
                        <div>
                          <h3 className="text-xs font-bold text-[#00FFCC] uppercase tracking-wider mb-2 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-[#00FFCC]" />
                            Agendar Propuesta
                          </h3>
                          <div className="bg-[#0A0A0A] p-6 rounded-xl border border-[#00FFCC]/50 shadow-[0_0_15px_rgba(0,255,204,0.1)]">
                            <p className="text-sm text-[#E0E0E0] mb-4">Esta propuesta está aprobada. Selecciona una fecha y hora para agendarla oficialmente.</p>
                            <input
                              type="datetime-local"
                              className="w-full px-4 py-3 bg-[#141414] border border-[#333333] rounded-xl focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] transition-all outline-none text-white text-sm"
                              value={selectedTalk.scheduled_date ? selectedTalk.scheduled_date.slice(0, 16) : ""}
                              onChange={(e) => {
                                if (e.target.value) {
                                  const isoDate = new Date(e.target.value).toISOString();
                                  updateStatus(selectedTalk.id, "scheduled", isoDate);
                                }
                              }}
                            />
                            <p className="text-xs text-[#A0A0A0] mt-3 italic">
                              Al asignar la fecha, la charla se moverá a la categoría "Agendadas" en la sección de Diseño, y será visible en la Cartelera para el público.
                            </p>
                          </div>
                        </div>
                      )}
                      <div>
                        <h3 className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Resumen (Abstract)</h3>
                        <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#333333] text-[#E0E0E0] text-sm leading-relaxed">
                          {selectedTalk.abstract}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Biografía del Ponente</h3>
                        <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#333333] text-[#E0E0E0] text-sm leading-relaxed">
                          {selectedTalk.speaker_bio}
                        </div>
                      </div>
                      
                      {/* Contact Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#333333] space-y-3">
                          <h3 className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider border-b border-[#333333] pb-2">Contacto</h3>
                          {selectedTalk.email && (
                            <div className="flex items-center gap-2 text-sm text-[#E0E0E0]">
                              <Mail className="w-4 h-4 text-[#FFCC00]" />
                              <a href={`mailto:${selectedTalk.email}`} className="hover:text-[#FFCC00] transition-colors">{selectedTalk.email}</a>
                            </div>
                          )}
                          {selectedTalk.phone && (
                            <div className="flex items-center gap-2 text-sm text-[#E0E0E0]">
                              <Phone className="w-4 h-4 text-[#FFCC00]" />
                              <a href={`tel:${selectedTalk.phone}`} className="hover:text-[#FFCC00] transition-colors">{selectedTalk.phone}</a>
                            </div>
                          )}
                          {selectedTalk.social_media && (
                            <div className="flex items-center gap-2 text-sm text-[#E0E0E0]">
                              <Instagram className="w-4 h-4 text-[#FFCC00]" />
                              <span>{selectedTalk.social_media}</span>
                            </div>
                          )}
                        </div>
                        
                        {selectedTalk.technical_needs && (
                          <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#333333] space-y-2">
                            <h3 className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider border-b border-[#333333] pb-2 flex items-center gap-2">
                              <MonitorPlay className="w-4 h-4 text-[#FF3366]" />
                              Necesidades Técnicas
                            </h3>
                            <p className="text-sm text-[#E0E0E0]">{selectedTalk.technical_needs}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-5">
                      <div className="bg-[#141414] p-5 rounded-2xl border border-[#333333] space-y-4">
                        <div className="flex justify-between items-center border-b border-[#333333] pb-2">
                          <h3 className="text-sm font-bold text-[#00FFCC] uppercase tracking-wider flex items-center gap-2">
                            <Edit3 className="w-4 h-4" /> Edición Avanzada
                          </h3>
                          <button onClick={() => setIsEditingAll(!isEditingAll)} className="text-xs text-[#A0A0A0] hover:text-white underline">
                            {isEditingAll ? "Cancelar" : "Modificar Datos Base"}
                          </button>
                        </div>
                        
                        {isEditingAll && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Título de la Charla</label>
                              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-[#00FFCC] focus:border-[#00FFCC] outline-none text-white text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Categoría</label>
                              <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-[#00FFCC] outline-none text-white text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Nombres de Expositores</label>
                              <input type="text" value={editSpeakerName} onChange={(e) => setEditSpeakerName(e.target.value)} className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-[#00FFCC] outline-none text-white text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-1">Enlace de Drive / URL Foto</label>
                              <input type="text" value={editSpeakerPhotoUrl} onChange={(e) => setEditSpeakerPhotoUrl(e.target.value)} placeholder="Pegar enlace de Google Drive..." className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-[#00FFCC] outline-none text-white text-sm" />
                            </div>
                          </div>
                        )}

                        {(selectedTalk.status === "scheduled" || selectedTalk.status === "completed") && (
                          <>
                            <div>
                              <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Enlace de Transmisión</label>
                              <input type="url" value={editTransmissionUrl} onChange={(e) => setEditTransmissionUrl(e.target.value)} className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-[#00FFCC] outline-none text-white text-sm" placeholder="https://..." />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Resumen Final (Opcional)</label>
                              <textarea value={editSummary} onChange={(e) => setEditSummary(e.target.value)} className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-[#00FFCC] outline-none text-white text-sm min-h-[100px]" placeholder="Resumen..." />
                            </div>
                          </>
                        )}

                        <button onClick={handleSaveDetails} disabled={isSavingDetails} className="w-full py-2.5 bg-[#333333] hover:bg-[#444444] text-white rounded-lg font-bold transition-colors disabled:opacity-50 text-sm">
                          {isSavingDetails ? "Guardando..." : "Guardar Cambios"}
                        </button>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Foto / Portada</h3>
                        {selectedTalk.speaker_photo_url ? (
                          <img
                            src={selectedTalk.speaker_photo_url}
                            alt={selectedTalk.speaker_name}
                            className="w-full aspect-square object-cover rounded-xl border border-[#333333] shadow-md"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-[#0A0A0A] rounded-xl border border-[#333333] flex items-center justify-center text-[#333333]">
                            <ImageIcon className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                      
                      {selectedTalk.scheduled_date && (
                        <div className="bg-[#9933FF]/10 border border-[#9933FF]/30 p-5 rounded-xl shadow-lg relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-[#9933FF] rounded-full mix-blend-screen filter blur-[40px] opacity-20 pointer-events-none" />
                          <h3 className="text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#9933FF]">Fecha Programada</h3>
                          <p className="text-base font-serif font-bold text-white">
                            {safeFormatDate(selectedTalk.scheduled_date, "EEEE d 'de' MMMM")}
                          </p>
                          <p className="text-[#E0E0E0] text-sm mt-0.5 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#9933FF]" />
                            {safeFormatDate(selectedTalk.scheduled_date, "HH:mm")} hrs
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
              <div className="bg-[#141414] rounded-2xl shadow-lg border border-[#333333] h-[calc(100vh-180px)] flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#9933FF] rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none" />
                <div className="w-16 h-16 bg-[#0A0A0A] border border-[#333333] rounded-full flex items-center justify-center text-[#9933FF] mb-5 relative z-10">
                  {activeTab === "list" && <Coffee className="w-8 h-8" />}
                  {activeTab === "agenda" && <CalendarIcon className="w-8 h-8" />}
                  {activeTab === "design" && <ImageIcon className="w-8 h-8" />}
                </div>
                <h2 className="text-xl font-serif font-bold text-white mb-2 relative z-10">{getPlaceholderTitle()}</h2>
                <p className="text-[#A0A0A0] text-sm max-w-sm relative z-10">
                  {getPlaceholderText()}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  </div>
);
}
