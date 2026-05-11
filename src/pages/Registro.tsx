import React, { useState, useRef } from "react";
import { Upload, Send, CheckCircle2, AlertCircle, FileDown, Printer, Share2, Download, Phone } from "lucide-react";
import { cn } from "../lib/utils";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

export default function Registro() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [folioId, setFolioId] = useState<number | null>(null);

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Could not get canvas context");
        
        let width = img.width;
        let height = img.height;
        const maxSize = 1000;
        
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject("Compression failed");
        }, "image/jpeg", 0.7);
      };
      img.onerror = reject;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setIsSubmitting(true);
    setSubmitStatus("idle");

    const formData = new FormData(form);
    const trap = formData.get("_trap");
    if (trap) { setSubmitStatus("success"); return; }
    const photoFile = formData.get("photo") as File;

    if (photoFile && photoFile.size > 0) {
      try {
        const compressedBlob = await compressImage(photoFile);
        formData.set("photo", compressedBlob, "photo.jpg");
      } catch (err) {
        console.warn("Compression failed, sending original", err);
      }
    }

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
      link.download = `Registro_CasaPadi_Folio_${folioId || '000'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating image", error);
    }
  };

  const shareWhatsApp = () => {
    const phone = "7717741409";
    const text = `¡Hola Casa Pädi! 🎉 Acabo de registrar mi propuesta de charla con el Folio: #${String(folioId).padStart(4, '0')}. ¡Quedo atento a su contacto! 👋`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
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
          <div className="mb-8 flex flex-col items-center space-y-8 relative z-10">
            <div className="flex flex-col items-center text-center space-y-4 no-print">
              <div className="w-16 h-16 bg-[#00FFCC]/20 rounded-full flex items-center justify-center border border-[#00FFCC]/30 animate-pulse">
                <CheckCircle2 className="w-8 h-8 text-[#00FFCC]" />
              </div>
              <h3 className="text-3xl font-serif font-bold text-white">¡Gracias por participar!</h3>
              <p className="text-[#A0A0A0] max-w-sm">
                Hemos recibido tu propuesta. Nuestro equipo la revisará y te contactará en los próximos días.
              </p>
            </div>

            {/* Next Steps Timeline */}
            <div className="w-full max-w-md bg-[#0A0A0A] border border-[#222222] rounded-2xl p-6 space-y-6 no-print">
              <h4 className="text-xs font-bold text-[#A0A0A0] uppercase tracking-widest text-center mb-2">¿Qué sigue ahora?</h4>
              
              <div className="space-y-6 relative">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-[#00FFCC] via-[#333333] to-[#333333]" />
                
                <div className="flex gap-4 relative">
                  <div className="w-6 h-6 rounded-full bg-[#00FFCC] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,255,204,0.5)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Envío recibido</p>
                    <p className="text-xs text-[#A0A0A0]">Tu folio #${String(folioId).padStart(4, '0')} ya está en nuestra base de datos.</p>
                  </div>
                </div>

                <div className="flex gap-4 relative">
                  <div className="w-6 h-6 rounded-full bg-[#333333] border border-[#444444] flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#FFCC00] animate-ping" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Revisión en proceso</p>
                    <p className="text-xs text-[#A0A0A0]">Revisaremos los detalles (1-3 días hábiles).</p>
                  </div>
                </div>

                <div className="flex gap-4 relative">
                  <div className="w-6 h-6 rounded-full bg-[#333333] border border-[#444444] flex items-center justify-center shrink-0">
                    <Phone className="w-3 h-3 text-[#A0A0A0]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Confirmación por WhatsApp/Correo</p>
                    <p className="text-xs text-[#A0A0A0]">Te avisaremos para definir la fecha de tu charla.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 w-full max-w-md no-print">
              <button
                onClick={shareWhatsApp}
                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] text-black rounded-full hover:bg-[#20bd5b] transition-all font-bold shadow-[0_4px_15px_rgba(37,211,102,0.3)]"
              >
                <Share2 className="w-4 h-4" />
                Confirmar vía WhatsApp
              </button>
              <button
                onClick={downloadImage}
                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 text-white border border-white/10 rounded-full hover:bg-white/10 transition-all font-medium"
              >
                <Download className="w-4 h-4 text-[#00FFCC]" />
                Guardar Folio (Imagen)
              </button>
            </div>

            {/* Guide Preview (What goes in the image) */}
            <div className="w-full max-w-2xl mt-8 overflow-hidden rounded-2xl border border-[#333333] shadow-2xl bg-[#0A0A0A] print-area">
              <div ref={guideRef} className="p-10 bg-[#0A0A0A] relative" style={{ backgroundColor: '#0A0A0A' }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FFCC] rounded-full mix-blend-screen filter blur-[120px] opacity-10" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-10 border-b border-[#222222] pb-6">
                    <div>
                      <h2 className="text-3xl font-serif font-bold text-white mb-2">Casa Pädi</h2>
                      <p className="text-[#00FFCC] font-medium tracking-[0.2em] uppercase text-xs">Una chela por la ciencia</p>
                    </div>
                    <div className="bg-[#141414] border border-[#222222] p-4 py-3 rounded-xl text-center min-w-[120px]">
                      <p className="text-[10px] text-[#A0A0A0] uppercase tracking-widest mb-1">Folio</p>
                      <p className="text-2xl font-mono font-bold text-[#FFCC00]">
                        #{String(folioId || '0').padStart(4, '0')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs uppercase tracking-widest text-[#A0A0A0] mb-4">Guía para el Ponente</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#141414]/50 p-5 rounded-2xl border border-[#222222]">
                          <p className="text-[#FF3366] font-bold text-sm mb-3">Siguientes Pasos</p>
                          <ul className="text-xs space-y-3 text-[#A0A0A0]">
                            <li className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF3366] mt-1 shrink-0" />
                              Espera nuestra llamada o mensaje en un lapso de 1 a 3 días.
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF3366] mt-1 shrink-0" />
                              Ten lista una presentación (PDF o PPT) de unos 20-30 min.
                            </li>
                          </ul>
                        </div>
                        <div className="bg-[#141414]/50 p-5 rounded-2xl border border-[#222222]">
                          <p className="text-[#00FFCC] font-bold text-sm mb-3">Recomendaciones</p>
                          <ul className="text-xs space-y-3 text-[#A0A0A0]">
                            <li className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFCC] mt-1 shrink-0" />
                              Mantén el lenguaje accesible y divertido.
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFCC] mt-1 shrink-0" />
                              Usa analogías y ejemplos de la vida diaria.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <p className="text-center font-serif text-xl text-white pt-6 border-t border-[#222222] italic">
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
            <input
              type="text"
              name="_trap"
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
            />
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
