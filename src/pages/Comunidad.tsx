import React, { useState, useEffect } from 'react';
import { Users, Lightbulb, Award, ThumbsUp, Send, Search, QrCode, Ticket, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

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
  speaker_photo_url: string;
  talk_count: number;
}

interface Checkin {
  id: number;
  talk_id: number;
  title: string;
  scheduled_date: string;
  created_at: string;
}

export default function Comunidad() {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'speakers' | 'passport'>('suggestions');
  
  // Suggestions State
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  
  // Speakers State
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  
  // Passport State
  const [passportEmail, setPassportEmail] = useState('');
  const [passportData, setPassportData] = useState<{count: number, checkins: Checkin[]} | null>(null);
  const [passportLoading, setPassportLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'suggestions') fetchSuggestions();
    if (activeTab === 'speakers') fetchSpeakers();
  }, [activeTab]);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/api/suggestions');
      const data = await res.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const fetchSpeakers = async () => {
    try {
      const res = await fetch('/api/speakers');
      const data = await res.json();
      setSpeakers(data);
    } catch (error) {
      console.error("Error fetching speakers:", error);
    }
  };

  const handleAddSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    
    try {
      await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: newTopic, description: newDescription, category: newCategory }),
      });
      setNewTopic('');
      setNewDescription('');
      setNewCategory('General');
      fetchSuggestions();
    } catch (error) {
      console.error("Error adding suggestion:", error);
    }
  };

  const handleVote = async (id: number) => {
    try {
      await fetch(`/api/suggestions/${id}/vote`, { method: 'POST' });
      fetchSuggestions();
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

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

  const handleCheckPassport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passportEmail.trim()) return;
    
    setPassportLoading(true);
    try {
      const res = await fetch(`/api/passport/${encodeURIComponent(passportEmail)}`);
      const data = await res.json();
      setPassportData(data);
    } catch (error) {
      console.error("Error fetching passport:", error);
    } finally {
      setPassportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Comunidad <span className="text-[#00FFCC]">Chela por la Ciencia</span>
          </h1>
          <p className="text-xl text-[#A0A0A0] max-w-2xl mx-auto">
            Participa, propón temas, conoce a nuestros divulgadores y gana recompensas por tu asistencia.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
              activeTab === 'suggestions' 
                ? 'bg-[#00FFCC] text-black shadow-[0_0_20px_rgba(0,255,204,0.3)]' 
                : 'bg-[#141414] text-[#A0A0A0] hover:text-white border border-[#333333]'
            }`}
          >
            <Lightbulb className="w-5 h-5" />
            Sugerencias
          </button>
          <button
            onClick={() => setActiveTab('speakers')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
              activeTab === 'speakers' 
                ? 'bg-[#FF3366] text-white shadow-[0_0_20px_rgba(255,51,102,0.3)]' 
                : 'bg-[#141414] text-[#A0A0A0] hover:text-white border border-[#333333]'
            }`}
          >
            <Users className="w-5 h-5" />
            Hall of Fame
          </button>
          <button
            onClick={() => setActiveTab('passport')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
              activeTab === 'passport' 
                ? 'bg-[#FFCC00] text-black shadow-[0_0_20px_rgba(255,204,0,0.3)]' 
                : 'bg-[#141414] text-[#A0A0A0] hover:text-white border border-[#333333]'
            }`}
          >
            <Award className="w-5 h-5" />
            Pasaporte
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-[#141414] rounded-3xl border border-[#333333] p-6 md:p-10 shadow-2xl">
          
          {/* SUGGESTIONS TAB */}
          {activeTab === 'suggestions' && (
            <div className="space-y-10">
              <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-[#333333]">
                <h2 className="text-2xl font-serif font-bold text-white mb-2">¿De qué quieres que hablemos?</h2>
                <p className="text-[#A0A0A0] mb-6">Propón un tema o vota por las ideas de la comunidad.</p>
                
                <form onSubmit={handleAddSuggestion} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="text"
                      placeholder="Ej. Agujeros Negros, Inteligencia Artificial..."
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      className="flex-1 bg-[#1A1A1A] border border-[#333333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00FFCC] transition-colors"
                      required
                    />
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="bg-[#1A1A1A] border border-[#333333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00FFCC] transition-colors appearance-none sm:w-48"
                    >
                      <option value="General">General</option>
                      <option value="Biología">Biología</option>
                      <option value="Física">Física</option>
                      <option value="Química">Química</option>
                      <option value="Tecnología">Tecnología</option>
                      <option value="Medio Ambiente">Medio Ambiente</option>
                    </select>
                  </div>
                  <div>
                    <textarea
                      placeholder="¿Por qué te gustaría este tema? (Opcional)"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-[#333333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00FFCC] transition-colors h-24 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-[#00FFCC] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#00E6B8] transition-colors"
                  >
                    <Send className="w-5 h-5" />
                    Enviar Propuesta
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4">Propuestas de la Comunidad</h3>
                {suggestions.map((sugg) => (
                  <div key={sugg.id} className="bg-[#1A1A1A] p-5 rounded-xl border border-[#333333] flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-bold text-[#00FFCC]">{sugg.topic}</h4>
                        {sugg.category && (
                          <span className="bg-[#333333] text-[#A0A0A0] px-2 py-0.5 rounded-full text-[10px] font-medium border border-[#444444]">
                            {sugg.category}
                          </span>
                        )}
                      </div>
                      {sugg.description && <p className="text-[#A0A0A0] mt-1 text-sm">{sugg.description}</p>}
                    </div>
                    <button
                      onClick={() => handleVote(sugg.id)}
                      className="flex flex-col items-center justify-center bg-[#222222] hover:bg-[#333333] border border-[#444444] rounded-lg p-3 min-w-[60px] transition-colors"
                    >
                      <ThumbsUp className="w-5 h-5 text-[#00FFCC] mb-1" />
                      <span className="font-bold text-white">{sugg.votes}</span>
                    </button>
                  </div>
                ))}
                {suggestions.length === 0 && (
                  <p className="text-[#A0A0A0] text-center py-8">Aún no hay propuestas. ¡Sé el primero!</p>
                )}
              </div>
            </div>
          )}

          {/* SPEAKERS TAB */}
          {activeTab === 'speakers' && (
            <div>
              <h2 className="text-2xl font-serif font-bold text-white mb-8 text-center">Hall of Fame de Divulgadores</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {speakers.map((speaker, idx) => (
                  <div key={idx} className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#333333] flex flex-col items-center text-center hover:border-[#FF3366]/50 transition-colors">
                    {speaker.speaker_photo_url ? (
                      <img src={speaker.speaker_photo_url} alt={speaker.speaker_name} className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-[#FF3366]" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-[#222222] border-2 border-[#FF3366] flex items-center justify-center mb-4">
                        <span className="text-3xl font-bold text-[#A0A0A0]">{speaker.speaker_name.charAt(0)}</span>
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-white mb-1">{speaker.speaker_name}</h3>
                    <div className="flex items-center gap-1 text-[#FFCC00] mb-3">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold text-sm">{speaker.talk_count} {speaker.talk_count === 1 ? 'Charla' : 'Charlas'}</span>
                    </div>
                    <p className="text-sm text-[#A0A0A0] line-clamp-3">{speaker.speaker_bio}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASSPORT TAB */}
          {activeTab === 'passport' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#FFCC00]/10 mb-4">
                  <QrCode className="w-10 h-10 text-[#FFCC00]" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-white mb-2">Pasaporte Científico</h2>
                <p className="text-[#A0A0A0]">
                  Revisa tu historial de asistencia. ¡Acumula 5 asistencias y gana una chela gratis o mercancía oficial!
                </p>
              </div>

              <form onSubmit={handleCheckPassport} className="flex gap-2 mb-10">
                <input
                  type="email"
                  placeholder="Ingresa tu correo electrónico"
                  value={passportEmail}
                  onChange={(e) => setPassportEmail(e.target.value)}
                  className="flex-1 bg-[#1A1A1A] border border-[#333333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFCC00] transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={passportLoading}
                  className="bg-[#FFCC00] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#E6B800] transition-colors disabled:opacity-50"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>

              {passportData && (
                <div className="bg-[#0A0A0A] rounded-2xl border border-[#333333] p-8">
                  <div className="flex items-center justify-between mb-8 pb-8 border-b border-[#333333]">
                    <div>
                      <h3 className="text-xl font-bold text-white">Tu Progreso</h3>
                      <p className="text-[#A0A0A0] text-sm">{passportEmail}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black text-[#FFCC00]">{passportData.count}</div>
                      <div className="text-xs text-[#A0A0A0] uppercase tracking-wider font-bold">Asistencias</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-8">
                    <div className="flex justify-between text-xs font-bold text-[#A0A0A0] mb-2">
                      <span>0</span>
                      <span className="text-[#FFCC00]">Meta: 5</span>
                    </div>
                    <div className="h-4 bg-[#222222] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#FFCC00] to-[#FF9900] transition-all duration-1000"
                        style={{ width: `${Math.min((passportData.count / 5) * 100, 100)}%` }}
                      />
                    </div>
                    {passportData.count >= 5 && (
                      <div className="mt-4 bg-[#FFCC00]/10 border border-[#FFCC00]/30 rounded-lg p-4 flex items-center gap-3">
                        <Ticket className="w-8 h-8 text-[#FFCC00]" />
                        <div>
                          <p className="text-[#FFCC00] font-bold">¡Felicidades! Has alcanzado la meta.</p>
                          <p className="text-sm text-white">Muestra esta pantalla en la barra en tu próxima visita para reclamar tu recompensa.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <h4 className="font-bold text-white mb-4">Historial de Asistencia</h4>
                  <div className="space-y-3">
                    {passportData.checkins.map((checkin, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-[#1A1A1A] p-3 rounded-lg border border-[#333333]">
                        <span className="text-sm text-white font-medium line-clamp-1">{checkin.title}</span>
                        <span className="text-xs text-[#A0A0A0] whitespace-nowrap ml-4">
                          {checkin.scheduled_date ? safeFormatDate(checkin.scheduled_date, "dd MMM yyyy") : 'Fecha desconocida'}
                        </span>
                      </div>
                    ))}
                    {passportData.checkins.length === 0 && (
                      <p className="text-[#A0A0A0] text-sm text-center py-4">Aún no tienes asistencias registradas.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
