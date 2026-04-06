import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, Coffee, BookOpen, Users, Mic, Sparkles, Camera, MapPin, Phone, Mail, Facebook, Instagram, Star, Calendar, Clock, Info } from "lucide-react";

import gale1Img from "../assets/gale1.png.jpeg";
import gale2Img from "../assets/gale2.png.jpeg";
import logoImg from "../assets/logo.png";
import ambienteImg from "../assets/ambiente.jpeg";
import conocimientoImg from "../assets/conocimiento.jpeg";
import comunidadImg from "../assets/comunidad.jpeg";
import memoriasImg from "../assets/memorias.jpeg";
import galeria1Img from "../assets/galeria1.jpeg";
import galeria3Img from "../assets/galeria3.jpeg";
import galeria4Img from "../assets/galeria4.jpeg";
import galeria5Img from "../assets/galeria5.jpeg";
import memorias1Img from "../assets/memorias1.jpeg";

export default function Home() {
  const [nextTalk, setNextTalk] = useState<any>(null);

  useEffect(() => {
    fetch("/api/talks")
      .then(r => r.json())
      .then(data => {
        const now = new Date().getTime();
        const scheduled = data
          .filter((t: any) =>
            t.status === "scheduled" &&
            t.scheduled_date &&
            new Date(t.scheduled_date).getTime() >= now
          )
          .sort((a: any, b: any) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
        if (scheduled.length > 0) setNextTalk(scheduled[0]);
      })
      .catch(e => console.error(e));
  }, []);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12 py-8 relative overflow-hidden">
      {/* Hero glassmorphism background - gale1 */}
      <div className="absolute top-0 left-0 w-full h-[70vh] overflow-hidden pointer-events-none z-0">
        <img
          src={gale1Img}
          alt=""
          className="w-full h-full object-cover object-center"
        />
        {/* Frosted glass overlay */}
        <div className="absolute inset-0 backdrop-blur-[6px] bg-black/60" />
        {/* Gradient fade to page background */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-b from-transparent to-[#070707]" />
        {/* Ambient color glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#9933FF]/20 via-transparent to-[#00FFCC]/10" />
      </div>

      {/* Subtle atmospheric blobs from gale2 on sides */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 hidden lg:block">
        <div 
          className="absolute top-[60%] left-[-5%] w-[30%] h-[40%] bg-cover bg-center opacity-8 blur-3xl rounded-full mix-blend-screen"
          style={{ backgroundImage: `url(${gale2Img})` }}
        />
        <div 
          className="absolute top-[60%] right-[-5%] w-[30%] h-[40%] bg-cover bg-center opacity-8 blur-3xl rounded-full mix-blend-screen"
          style={{ backgroundImage: `url(${gale2Img})` }}
        />
      </div>

      <div className="space-y-6 max-w-3xl relative z-10">
        {/* Colorful background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-[#FF3366] to-[#FF9933] rounded-full mix-blend-screen filter blur-[120px] opacity-40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-[#00FFCC] to-[#3366FF] rounded-full mix-blend-screen filter blur-[120px] opacity-30 pointer-events-none translate-x-20 translate-y-10" />
        
        <div className="flex justify-center mb-8 relative z-10">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-[#FF3366] via-[#FFCC00] to-[#00FFCC] rounded-full blur-lg opacity-60 group-hover:opacity-100 transition duration-500"></div>
            {/* White circular container */}
            <div className="w-24 h-24 mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] rounded-full flex items-center justify-center p-2 relative">
              <div className="absolute inset-0 rounded-full border border-white/10" />
              <img src={logoImg} alt="Una chela por la ciencia" className="max-w-full max-h-full object-contain filter hue-rotate-15 contrast-125 brightness-110 drop-shadow-2xl" />
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#141414] border border-[#333333] text-xs font-medium text-[#00FFCC] relative z-10 shadow-[0_0_15px_rgba(0,255,204,0.15)] mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Divulgación científica en Pachuca</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F0F0F0] to-[#A0A0A0] tracking-tight leading-tight relative z-10">
          Una chela por la ciencia
        </h1>
        <p className="text-lg md:text-xl text-[#A0A0A0] font-light max-w-2xl mx-auto relative z-10 leading-relaxed">
          El espacio donde la curiosidad se encuentra con el aroma a café, buena compañía y mentes brillantes en <span className="text-white font-medium">Casa Padi</span>.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-5 justify-center relative z-10 w-full max-w-md sm:max-w-none px-4">
        <Link
          to="/cartelera"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-[#FF3366] to-[#FF1A53] rounded-full hover:from-[#FF1A53] hover:to-[#E60039] transition-all shadow-[0_0_20px_rgba(255,51,102,0.4)] hover:shadow-[0_0_30px_rgba(255,51,102,0.6)] transform hover:-translate-y-1 w-full sm:w-auto"
        >
          Ver Cartelera
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/registro"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-[#00FFCC] bg-[#141414] border border-[#00FFCC]/50 rounded-full hover:bg-[#00FFCC]/10 transition-all shadow-[0_0_15px_rgba(0,255,204,0.1)] hover:shadow-[0_0_25px_rgba(0,255,204,0.3)] transform hover:-translate-y-1 w-full sm:w-auto"
        >
          Proponer una Charla
          <Mic className="w-4 h-4" />
        </Link>
      </div>

      {/* NEXT TALK HIGHLIGHT */}
      {nextTalk && (
        <div className="w-full max-w-4xl relative z-20 px-4 mt-8 animate-slide-up">
          <div className="bg-gradient-to-r from-[#141414] to-[#0A0A0A] p-1 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(0,255,204,0.15)] group hover:shadow-[0_0_40px_rgba(0,255,204,0.25)] transition-all duration-500">
            <div className="bg-[#050505] rounded-[22px] flex flex-col md:flex-row overflow-hidden relative h-full">
              {/* Image Section */}
              <div className="w-full md:w-2/5 md:min-h-full relative overflow-hidden h-48 md:h-auto border-b md:border-b-0 md:border-r border-[#333333]">
                {nextTalk.speaker_photo_url ? (
                  <img src={nextTalk.speaker_photo_url} alt="Próxima Charla" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-[#333333]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent md:bg-gradient-to-l md:from-[#050505] md:via-transparent opacity-90 inline-block pointer-events-none" />
                <div className="absolute top-4 left-4 bg-[#00FFCC] text-black px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(0,255,204,0.3)] flex items-center gap-1.5 uppercase tracking-wide">
                  <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" /> PRÓXIMA CHARLA
                </div>
              </div>
              
              {/* Info Section */}
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-center text-left">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-[#333333] text-[#A0A0A0] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{nextTalk.category || "General"}</span>
                  <span className="text-[#00FFCC] text-sm font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {safeFormatDate(nextTalk.scheduled_date, "HH:mm")} hrs
                  </span>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight mb-2">
                  {nextTalk.title}
                </h3>
                <p className="text-lg text-[#E0E0E0] font-medium mb-4">{nextTalk.speaker_name}</p>
                
                <p className="text-sm text-[#A0A0A0] line-clamp-2 md:line-clamp-3 mb-6 leading-relaxed">
                  {nextTalk.abstract}
                </p>
                
                <div className="mt-auto flex flex-col sm:flex-row items-center gap-4 justify-between border-t border-[#333333] pt-5">
                  <div className="flex items-center gap-2 text-[#E0E0E0] text-sm flex-1 font-medium bg-[#141414] px-4 py-2 rounded-xl">
                    <Calendar className="w-4 h-4 text-[#FF3366]" />
                    {safeFormatDate(nextTalk.scheduled_date, "EEEE d 'de' MMMM")}
                  </div>
                  
                  <a 
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(nextTalk.title)}&dates=${safeFormatDate(nextTalk.scheduled_date, "yyyyMMdd'T'HHmmss'Z'")}/${safeFormatDate(nextTalk.scheduled_date, "yyyyMMdd'T'HHmmss'Z'")}&details=${encodeURIComponent(nextTalk.abstract)}&location=${encodeURIComponent("Casa Padi")}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2 bg-white text-black text-sm font-bold rounded-xl hover:bg-[#F0F0F0] transition-colors whitespace-nowrap"
                  >
                    <Calendar className="w-4 h-4" />
                    Añadir al Calendario
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 max-w-6xl w-full relative z-10 px-4">
        <div className="bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] rounded-3xl shadow-xl border border-[#333333] flex flex-col overflow-hidden hover:border-[#FF3366]/60 hover:shadow-[0_0_25px_rgba(255,51,102,0.15)] transition-all duration-300 group hover:-translate-y-2">
          <div className="w-full h-40 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent z-10"></div>
            <img src={ambienteImg} alt="Ambiente" className="w-full h-full object-cover transform min-h-[160px]" />
          </div>
          <div className="p-6 pt-4 flex flex-col items-center text-center space-y-3 relative z-20">
            <h3 className="text-xl font-serif font-bold text-white">Ambiente Relajado</h3>
            <p className="text-sm text-[#A0A0A0] leading-relaxed">Disfruta de ciencia accesible mientras tomas tu bebida favorita en un entorno acogedor.</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] rounded-3xl shadow-xl border border-[#333333] flex flex-col overflow-hidden hover:border-[#00FFCC]/60 hover:shadow-[0_0_25px_rgba(0,255,204,0.15)] transition-all duration-300 group hover:-translate-y-2">
          <div className="w-full h-40 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent z-10"></div>
            <img src={conocimientoImg} alt="Conocimiento" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="p-6 pt-4 flex flex-col items-center text-center space-y-3 relative z-20">
            <h3 className="text-xl font-serif font-bold text-white">Conocimiento</h3>
            <p className="text-sm text-[#A0A0A0] leading-relaxed">Charlas impartidas por estudiantes y divulgadores apasionados por compartir su saber.</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] rounded-3xl shadow-xl border border-[#333333] flex flex-col overflow-hidden hover:border-[#FFCC00]/60 hover:shadow-[0_0_25px_rgba(255,204,0,0.15)] transition-all duration-300 group hover:-translate-y-2">
          <div className="w-full h-40 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent z-10"></div>
            <img src={comunidadImg} alt="Comunidad" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="p-6 pt-4 flex flex-col items-center text-center space-y-3 relative z-20">
            <h3 className="text-xl font-serif font-bold text-white">Comunidad</h3>
            <p className="text-sm text-[#A0A0A0] leading-relaxed">Conecta con mentes curiosas, expande tu red y haz nuevos amigos en Pachuca.</p>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] rounded-3xl shadow-xl border border-[#333333] flex flex-col overflow-hidden hover:border-[#9933FF]/60 hover:shadow-[0_0_25px_rgba(153,51,255,0.15)] transition-all duration-300 group hover:-translate-y-2">
          <div className="w-full h-40 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent z-10"></div>
            <img src={memoriasImg} alt="Memorias" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="p-6 pt-4 flex flex-col items-center text-center space-y-3 relative z-20">
            <h3 className="text-xl font-serif font-bold text-white">Memorias</h3>
            <p className="text-sm text-[#A0A0A0] leading-relaxed">Revive los mejores momentos de nuestras charlas a través de nuestras galerías de fotos.</p>
          </div>
        </div>
      </div>

      {/* Photo Gallery Section */}
      <div className="w-full max-w-6xl mt-24 relative z-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-serif font-bold text-white">Nuestras Sesiones</h2>
            <p className="text-sm text-[#A0A0A0] mt-1">Momentos que nos definen</p>
          </div>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-[#333333] to-transparent ml-6" />
        </div>

        {/* Masonry-style grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Large featured image - spans 2 cols + 2 rows */}
          <div className="col-span-2 row-span-2 group relative overflow-hidden rounded-2xl border border-[#333333] hover:border-[#FF3366]/50 hover:shadow-[0_0_25px_rgba(255,51,102,0.2)] transition-all duration-500" style={{aspectRatio:'1.5'}}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10" />
            <img src={galeria3Img} alt="Charla Casa Padi" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute bottom-4 left-4 z-20 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-400">
              <span className="text-xs font-bold text-[#FF3366] bg-[#FF3366]/10 backdrop-blur-md px-2 py-1 rounded-full border border-[#FF3366]/30">Casa Pädi</span>
              <p className="text-white font-serif text-base mt-1">Una noche de ciencia</p>
            </div>
          </div>

          {/* Small images */}
          <div className="group relative overflow-hidden rounded-2xl border border-[#333333] hover:border-[#00FFCC]/50 hover:shadow-[0_0_20px_rgba(0,255,204,0.2)] transition-all duration-500">
            <img src={galeria1Img} alt="Sesión" className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-[#333333] hover:border-[#9933FF]/50 hover:shadow-[0_0_20px_rgba(153,51,255,0.2)] transition-all duration-500">
            <img src={galeria4Img} alt="Ambiente" className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-[#333333] hover:border-[#FFCC00]/50 hover:shadow-[0_0_20px_rgba(255,204,0,0.2)] transition-all duration-500">
            <img src={galeria5Img} alt="Comunidad" className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-[#333333] hover:border-[#FF3366]/50 hover:shadow-[0_0_20px_rgba(255,51,102,0.2)] transition-all duration-500">
            <img src={memorias1Img} alt="Memorias" className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
          </div>

          {/* Gale2 wide landscape */}
          <div className="col-span-2 group relative overflow-hidden rounded-2xl border border-[#333333] hover:border-[#00FFCC]/50 hover:shadow-[0_0_25px_rgba(0,255,204,0.2)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10" />
            <img src={gale2Img} alt="Comunidad científica" className="w-full h-full object-cover" style={{height:'180px', objectFit:'cover'}} />
            <div className="absolute bottom-4 left-4 z-20 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-400">
              <span className="text-xs font-bold text-[#00FFCC] bg-[#00FFCC]/10 backdrop-blur-md px-2 py-1 rounded-full border border-[#00FFCC]/30">Comunidad</span>
              <p className="text-white font-serif text-base mt-1">Mentes curiosas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Casa Pädi & Eventos Feed */}
      <div className="w-full max-w-6xl mt-24 relative z-10 px-4 mb-24 text-left">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-serif font-bold text-white">Nuestra Sede & Comunidad</h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-[#333333] to-transparent ml-6"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar: Casa Pädi Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#141414] border border-[#333333] rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FFCC00]/10 to-transparent rounded-bl-full pointer-events-none"></div>
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-16 h-16 rounded-full bg-black border-2 border-[#FFCC00] overflow-hidden flex items-center justify-center shadow-[0_0_15px_rgba(255,204,0,0.2)]">
                  <span className="text-white font-serif font-bold text-xl">Pädi</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Casa Pädi</h3>
                  <p className="text-sm text-[#A0A0A0]">Centro cultural autogestivo</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6 relative z-10">
                <div className="flex items-center gap-3 text-sm text-[#E0E0E0] hover:text-white transition-colors">
                  <Star className="w-4 h-4 text-[#FFCC00]" />
                  <span>Clases Artes</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#E0E0E0] hover:text-white transition-colors">
                  <Coffee className="w-4 h-4 text-[#FFCC00]" />
                  <span>Cafetería-Terraza</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#E0E0E0] hover:text-white transition-colors">
                  <Mic className="w-4 h-4 text-[#FFCC00]" />
                  <span>Foro para conciertos</span>
                </div>
              </div>

              <div className="h-[1px] w-full bg-[#333333] mb-6 relative z-10"></div>

              <div className="space-y-4 relative z-10">
                <a href="https://maps.app.goo.gl/kX7P2X4J9Y7Z8Z8Z8" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-sm text-[#A0A0A0] hover:text-white transition-colors group">
                  <MapPin className="w-4 h-4 mt-0.5 text-[#FF3366] flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:underline decoration-[#FF3366] underline-offset-4">Av Piracantos 702, Parque de Poblamiento 2a. Secc, 42088 Pachuca de Soto, Hgo.</span>
                </a>
                
                {/* Embedded Map */}
                <div className="w-full h-32 rounded-xl overflow-hidden border border-[#333333] mt-2 mb-4">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3747.1643640228394!2d-98.76994192383824!3d20.12211998130833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d109003884b257%3A0x6a05e5d1645a274!2sCasa%20P%C3%A4di!5e0!3m2!1sen!2smx!4v1709088000000!5m2!1sen!2smx" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={false} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Mapa de Casa Pädi"
                  ></iframe>
                </div>

                <div className="flex items-center gap-3 text-sm text-[#A0A0A0] hover:text-white transition-colors">
                  <Phone className="w-4 h-4 text-[#00FFCC] flex-shrink-0" />
                  <span>+52 771 169 1313</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#A0A0A0] hover:text-white transition-colors">
                  <Mail className="w-4 h-4 text-[#9933FF] flex-shrink-0" />
                  <span>casapadi.contacto@gmail.com</span>
                </div>
                
                <div className="pt-4 mt-2 border-t border-[#333333]">
                  <h4 className="text-sm font-semibold text-white mb-3">Síguenos en nuestras redes</h4>
                  <div className="flex gap-3">
                    <a href="https://www.facebook.com/share/1GtDBt3WoG/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 flex-1 py-2 px-3 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 rounded-lg text-sm text-white transition-all group">
                      <Facebook className="w-4 h-4 text-[#1877F2] group-hover:scale-110 transition-transform" />
                      <span>Facebook</span>
                    </a>
                    <a href="https://www.instagram.com/casa_padi?igsh=aGppdWdxMThkeXhj" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 flex-1 py-2 px-3 bg-[#E1306C]/10 hover:bg-[#E1306C]/20 border border-[#E1306C]/30 rounded-lg text-sm text-white transition-all group">
                      <Instagram className="w-4 h-4 text-[#E1306C] group-hover:scale-110 transition-transform" />
                      <span>Instagram</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Feed: Events */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#FF3366]" />
                Eventos en Casa Pädi
              </h3>
            </div>

            <div className="space-y-4">
              {/* Event 1 */}
              <div className="bg-gradient-to-r from-[#1A1A1A] to-[#0A0A0A] border border-[#333333] rounded-2xl p-4 flex flex-col sm:flex-row gap-6 hover:border-[#FF3366]/50 hover:shadow-[0_0_20px_rgba(255,51,102,0.15)] transition-all duration-300 group hover:-translate-y-1">
                <div className="w-full sm:w-28 h-28 rounded-xl bg-[#222222] flex-shrink-0 overflow-hidden relative border border-[#333333] group-hover:border-[#FF3366]/30 transition-colors">
                  <div className="absolute inset-0 flex items-center justify-center text-[#555555] group-hover:text-[#FF3366]/50 transition-colors">
                    <Calendar className="w-8 h-8" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-[#FF3366] text-sm font-bold mb-1">Sáb, 12 abr. 2025</div>
                  <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[#FF3366] transition-colors">Tour del Absurdo Prismatic Shapes en Pachuca</h4>
                  <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Mexico City, Mexico</span>
                  </div>
                </div>
              </div>

              {/* Event 2 */}
              <div className="bg-gradient-to-r from-[#1A1A1A] to-[#0A0A0A] border border-[#333333] rounded-2xl p-4 flex flex-col sm:flex-row gap-6 hover:border-[#00FFCC]/50 hover:shadow-[0_0_20px_rgba(0,255,204,0.15)] transition-all duration-300 group hover:-translate-y-1">
                <div className="w-full sm:w-28 h-28 rounded-xl bg-[#222222] flex-shrink-0 overflow-hidden relative border border-[#333333] group-hover:border-[#00FFCC]/30 transition-colors">
                  <div className="absolute inset-0 flex items-center justify-center text-[#555555] group-hover:text-[#00FFCC]/50 transition-colors">
                    <Calendar className="w-8 h-8" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-[#00FFCC] text-sm font-bold mb-1">Vie, 7 mar. 2025</div>
                  <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[#00FFCC] transition-colors">Malcriada + Linxes en Pachuca 💥</h4>
                  <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Casa Pädi</span>
                  </div>
                </div>
              </div>

              {/* Event 3 */}
              <div className="bg-gradient-to-r from-[#1A1A1A] to-[#0A0A0A] border border-[#333333] rounded-2xl p-4 flex flex-col sm:flex-row gap-6 hover:border-[#FFCC00]/50 hover:shadow-[0_0_20px_rgba(255,204,0,0.15)] transition-all duration-300 group hover:-translate-y-1">
                <div className="w-full sm:w-28 h-28 rounded-xl bg-[#222222] flex-shrink-0 overflow-hidden relative border border-[#333333] group-hover:border-[#FFCC00]/30 transition-colors">
                  <div className="absolute inset-0 flex items-center justify-center text-[#555555] group-hover:text-[#FFCC00]/50 transition-colors">
                    <Calendar className="w-8 h-8" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-[#FFCC00] text-sm font-bold mb-1">Vie, 21 feb. 2025</div>
                  <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[#FFCC00] transition-colors">Los Viejos+Octopoulpe+Tlaloc</h4>
                  <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Casa Pädi</span>
                  </div>
                </div>
              </div>

              {/* Event 4 */}
              <div className="bg-gradient-to-r from-[#1A1A1A] to-[#0A0A0A] border border-[#333333] rounded-2xl p-4 flex flex-col sm:flex-row gap-6 hover:border-[#9933FF]/50 hover:shadow-[0_0_20px_rgba(153,51,255,0.15)] transition-all duration-300 group hover:-translate-y-1">
                <div className="w-full sm:w-28 h-28 rounded-xl bg-[#222222] flex-shrink-0 overflow-hidden relative border border-[#333333] group-hover:border-[#9933FF]/30 transition-colors">
                  <div className="absolute inset-0 flex items-center justify-center text-[#555555] group-hover:text-[#9933FF]/50 transition-colors">
                    <Calendar className="w-8 h-8" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-[#9933FF] text-sm font-bold mb-1">Sáb, 1 feb. 2025</div>
                  <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[#9933FF] transition-colors">Javier Fuentes en Pachuca!!</h4>
                  <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Pachuca de Soto</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Posts Feed */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#00FFCC]" />
                  Actividades Recientes
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Post 1 */}
                <div className="bg-[#141414] border border-[#333333] rounded-2xl overflow-hidden shadow-lg group">
                  <div className="aspect-square bg-[#222222] relative overflow-hidden">
                    <img src={galeria1Img} alt="Charla de ciencia" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                      Una Chela por la Ciencia
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-[#E0E0E0] mb-2">¡Increíble sesión sobre astrofísica! Gracias a todos los que nos acompañaron a debatir sobre los misterios del universo con una buena chela. 🍻✨</p>
                    <div className="text-xs text-[#A0A0A0]">Hace 2 días</div>
                  </div>
                </div>

                {/* Post 2 */}
                <div className="bg-[#141414] border border-[#333333] rounded-2xl overflow-hidden shadow-lg group">
                  <div className="aspect-square bg-[#222222] relative overflow-hidden">
                    <img src={memorias1Img} alt="Comunidad Casa Pädi" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                      Casa Pädi
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-[#E0E0E0] mb-2">Tarde de café y buena compañía en nuestra terraza. El lugar perfecto para leer, trabajar o simplemente relajarte. ☕🌿</p>
                    <div className="text-xs text-[#A0A0A0]">Hace 5 días</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="w-full max-w-6xl mx-auto px-4 mt-20 relative z-10">
        <div className="bg-gradient-to-r from-[#FF3366]/20 to-[#9933FF]/20 rounded-3xl p-8 md:p-12 border border-[#FF3366]/30 shadow-[0_0_30px_rgba(255,51,102,0.15)] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FF3366] to-[#9933FF] rounded-full mix-blend-screen filter blur-[80px] opacity-30 pointer-events-none translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex-1 text-left relative z-10">
            <h2 className="text-3xl font-serif font-bold text-white mb-3">No te pierdas ninguna charla</h2>
            <p className="text-[#A0A0A0] text-lg max-w-xl">
              Suscríbete a nuestro boletín y recibe recordatorios de los próximos eventos, resúmenes y noticias de la comunidad.
            </p>
          </div>
          
          <div className="w-full md:w-auto relative z-10">
            <form 
              className="flex flex-col sm:flex-row gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                try {
                  await fetch('/api/subscribers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                  });
                  alert('¡Gracias por suscribirte!');
                  form.reset();
                } catch (err) {
                  alert('Hubo un error al suscribirte. Inténtalo de nuevo.');
                }
              }}
            >
              <input 
                type="email" 
                name="email"
                placeholder="Tu correo electrónico" 
                required
                className="bg-[#141414] border border-[#333333] text-white px-6 py-4 rounded-full focus:outline-none focus:border-[#FF3366] min-w-[250px] transition-colors"
              />
              <button 
                type="submit"
                className="bg-[#FF3366] text-white font-bold px-8 py-4 rounded-full hover:bg-[#E60039] transition-colors shadow-[0_0_15px_rgba(255,51,102,0.4)] whitespace-nowrap"
              >
                Suscribirme
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
