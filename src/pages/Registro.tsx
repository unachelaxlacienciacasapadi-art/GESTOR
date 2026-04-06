import React, { useState, useRef } from "react";
import { Upload, Send, CheckCircle2, AlertCircle, FileDown, Printer, Share2, Download } from "lucide-react";
import { cn } from "../lib/utils";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

export default function Registro() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [folioId, setFolioId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setIsSubmitting(true);
    setSubmitStatus("idle");

    const formData = new FormData(form);

    try {
      const res = await fetch("/api/talks", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to submit");
      
      const data = await res.json();
      setFolioId(data.id);
      
      setSubmitStatus("success");
      form.reset();
      setPhotoPreview(null);
    } catch (error) {
      console.error(error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const guideRef = useRef<HTMLDivElement>(null);

  const downloadImage = async () => {
    if (!guideRef.current) return;
    try {
      const dataUrl = await toPng(guideRef.current, {
        cacheBust: true,
        backgroundColor: '#0A0A0A',
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `Guia_Ponentes_Folio_${folioId || '000'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating image", error);
    }
  };

  const printGuide = () => {
    window.print();
  };

  const shareWhatsApp = () => {
    const text = `¡Hola! He registrado mi propuesta de charla en Casa Padi. Mi folio de registro es: #${String(folioId).padStart(4, '0')}. ¡Nos vemos pronto para compartir ciencia y una buena chela!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-10 space-y-3">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-white">Proponer una Charla</h1>
        <p className="text-sm md:text-base text-[#A0A0A0]">
          Comparte tu investigación o tema científico favorito en un ambiente relajado.
        </p>
      </div>

      <div className="bg-[#141414] rounded-2xl shadow-lg border border-[#333333] p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFCC00] rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none" />
        
        {submitStatus === "success" && (
          <div className="mb-8 flex flex-col items-center space-y-6 relative z-10">
            <div className="flex items-center gap-3 text-[#00FFCC] no-print">
              <CheckCircle2 className="w-8 h-8" />
              <h3 className="text-2xl font-serif font-bold text-white">¡Propuesta enviada con éxito!</h3>
            </div>
            
            <p className="text-[#A0A0A0] text-center max-w-md no-print">
              Hemos recibido tu propuesta. A continuación, te presentamos la guía para ponentes. Puedes guardarla o compartirla.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3 w-full max-w-md no-print">
              <button
                onClick={downloadImage}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0A0A0A] text-white border border-[#333333] rounded-xl hover:bg-[#1A1A1A] hover:border-[#00FFCC] transition-all text-sm font-medium group"
              >
                <Download className="w-4 h-4 text-[#00FFCC] group-hover:scale-110 transition-transform" />
                Descargar
              </button>
              <button
                onClick={printGuide}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0A0A0A] text-white border border-[#333333] rounded-xl hover:bg-[#1A1A1A] hover:border-[#FF3366] transition-all text-sm font-medium group"
              >
                <Printer className="w-4 h-4 text-[#FF3366] group-hover:scale-110 transition-transform" />
                Imprimir
              </button>
              <button
                onClick={shareWhatsApp}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 rounded-xl hover:bg-[#25D366]/20 transition-all text-sm font-medium group"
              >
                <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                WhatsApp
              </button>
            </div>

            {/* Beautiful Guide Preview */}
            <div className="w-full max-w-2xl mt-4 overflow-hidden rounded-2xl border border-[#333333] shadow-2xl bg-[#0A0A0A] print-area">
              <div ref={guideRef} className="p-8 md:p-12 bg-[#0A0A0A] relative" style={{ backgroundColor: '#0A0A0A' }}>
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FFCC] rounded-full mix-blend-screen filter blur-[120px] opacity-10" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FF3366] rounded-full mix-blend-screen filter blur-[120px] opacity-10" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8 border-b border-[#333333] pb-6">
                    <div>
                      <h2 className="text-3xl font-serif font-bold text-white mb-2">Casa Padi</h2>
                      <p className="text-[#00FFCC] font-medium tracking-wide uppercase text-sm">Una chela por la ciencia</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#A0A0A0] uppercase tracking-wider mb-1">Folio de Registro</p>
                      <p className="text-2xl font-mono font-bold text-[#FF3366]">
                        #{String(folioId || '0').padStart(4, '0')}
                      </p>
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold text-white mb-6">Guía para Ponentes</h1>
                  
                  <div className="space-y-6 text-[#D0D0D0] text-sm md:text-base leading-relaxed">
                    <p className="text-lg font-medium text-white">
                      ¡Felicidades por animarte a compartir tu conocimiento!
                    </p>

                    <div className="bg-[#141414] p-5 rounded-xl border border-[#333333]">
                      <h3 className="text-[#00FFCC] font-bold mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00FFCC]" />
                        Recomendaciones para tu charla
                      </h3>
                      <ul className="space-y-2 ml-4 list-disc marker:text-[#333333]">
                        <li>Mantén un lenguaje accesible. Recuerda que el público no siempre es experto.</li>
                        <li>Usa analogías y ejemplos de la vida diaria.</li>
                        <li>La duración ideal es de 20 a 30 minutos, dejando tiempo para preguntas.</li>
                        <li>Si usas presentación, prioriza imágenes sobre texto.</li>
                      </ul>
                    </div>

                    <div className="bg-[#141414] p-5 rounded-xl border border-[#333333]">
                      <h3 className="text-[#FF3366] font-bold mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#FF3366]" />
                        Equipo disponible en Casa Padi
                      </h3>
                      <ul className="space-y-2 ml-4 list-disc marker:text-[#333333]">
                        <li>Proyector HD con conexión HDMI</li>
                        <li>Sistema de audio con micrófono inalámbrico</li>
                        <li>Computadora (Windows) con Office y lector de PDF</li>
                        <li>Puedes traer tu propia laptop si lo prefieres.</li>
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-[#333333]">
                      <h3 className="text-white font-bold mb-2">Siguientes pasos:</h3>
                      <p>
                        Revisaremos tu propuesta y nos pondremos en contacto contigo vía correo o WhatsApp para confirmar la fecha y afinar detalles.
                      </p>
                    </div>

                    <p className="text-center font-serif text-lg text-[#00FFCC] pt-4 italic">
                      "¡Nos vemos pronto para compartir ciencia y una buena chela!"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSubmitStatus("idle")}
              className="mt-8 text-sm text-[#A0A0A0] hover:text-white underline underline-offset-4 transition-colors no-print"
            >
              Enviar otra propuesta
            </button>
          </div>
        )}

        {submitStatus === "error" && (
          <div className="mb-8 p-4 bg-[#FF3366]/10 border border-[#FF3366]/30 rounded-xl flex items-start gap-3 text-[#FF3366] relative z-10">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">Ocurrió un error al enviar la propuesta. Por favor, intenta de nuevo.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={cn("space-y-8 relative z-10", submitStatus === "success" && "hidden")}>
          <div className="space-y-5">
            <h2 className="text-xl font-serif font-bold text-white border-b border-[#333333] pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF3366]" />
              Datos de la Charla
            </h2>
            
            <div className="space-y-1.5">
              <label htmlFor="title" className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">
                Título de la Charla
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-1 focus:ring-[#FF3366] focus:border-[#FF3366] focus:shadow-[0_0_15px_rgba(255,51,102,0.2)] transition-all outline-none text-white text-sm"
                placeholder="Ej. La física detrás de una buena taza de café"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="abstract" className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">
                Resumen (Abstract)
              </label>
              <textarea
                id="abstract"
                name="abstract"
                required
                rows={3}
                className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-1 focus:ring-[#FF3366] focus:border-[#FF3366] focus:shadow-[0_0_15px_rgba(255,51,102,0.2)] transition-all outline-none text-white text-sm resize-none"
                placeholder="Describe brevemente de qué tratará tu charla..."
              />
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="technical_needs" className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">
                Necesidades Técnicas Especiales
              </label>
              <textarea
                id="technical_needs"
                name="technical_needs"
                rows={2}
                className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-1 focus:ring-[#FF3366] focus:border-[#FF3366] focus:shadow-[0_0_15px_rgba(255,51,102,0.2)] transition-all outline-none text-white text-sm resize-none"
                placeholder="Contamos con proyector, audio y PC. ¿Necesitas algo más?"
              />
            </div>
          </div>

          <div className="space-y-5 pt-4">
            <h2 className="text-xl font-serif font-bold text-white border-b border-[#333333] pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFCC]" />
              Datos del Ponente
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="speaker_name" className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  id="speaker_name"
                  name="speaker_name"
                  required
                  className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] focus:shadow-[0_0_15px_rgba(0,255,204,0.2)] transition-all outline-none text-white text-sm"
                  placeholder="Tu nombre"
                />
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="social_media" className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">
                  Usuario en Redes Sociales
                </label>
                <input
                  type="text"
                  id="social_media"
                  name="social_media"
                  className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] focus:shadow-[0_0_15px_rgba(0,255,204,0.2)] transition-all outline-none text-white text-sm"
                  placeholder="@usuario (IG, X, etc.)"
                />
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] focus:shadow-[0_0_15px_rgba(0,255,204,0.2)] transition-all outline-none text-white text-sm"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">
                  Número de Contacto
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] focus:shadow-[0_0_15px_rgba(0,255,204,0.2)] transition-all outline-none text-white text-sm"
                  placeholder="10 dígitos"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="speaker_bio" className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">
                Biografía Breve
              </label>
              <textarea
                id="speaker_bio"
                name="speaker_bio"
                required
                rows={2}
                className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] focus:shadow-[0_0_15px_rgba(0,255,204,0.2)] transition-all outline-none text-white text-sm resize-none"
                placeholder="Estudiante de biología, apasionado por la divulgación..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">
                Foto de Perfil
              </label>
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#00FFCC] shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#0A0A0A] border border-dashed border-[#333333] flex items-center justify-center text-[#A0A0A0]">
                      <Upload className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="photo"
                    className="inline-flex items-center justify-center px-4 py-2 border border-[#333333] text-white text-sm font-medium rounded-lg hover:bg-[#222222] cursor-pointer transition-colors"
                  >
                    Seleccionar Imagen
                  </label>
                  <input
                    type="file"
                    id="photo"
                    name="photo"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <p className="mt-1.5 text-xs text-[#A0A0A0]">
                    Sube una foto clara para tu perfil (JPG, PNG).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium text-black bg-[#FFCC00] rounded-full hover:bg-[#E6B800] transition-all shadow-[0_0_15px_rgba(255,204,0,0.3)] hover:shadow-[0_0_25px_rgba(255,204,0,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  Enviar Propuesta
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
