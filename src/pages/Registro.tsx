import React, { useState, useRef, useEffect } from "react";
import { Upload, Send, CheckCircle2, AlertCircle, Share2, Download, Phone, Check } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toPng } from "html-to-image";
import { cn, parseTalkDate } from "../lib/utils";
import { CoralBranch } from "../components/brand";
import { CASA_PADI } from "../lib/casaPadi";

const fmt = (value: string, pattern: string) => {
  const d = parseTalkDate(value);
  return d ? format(d, pattern, { locale: es }) : value;
};

const inputClass =
  "w-full px-4 py-3 bg-papel border-2 border-tinta rounded-2xl text-tinta placeholder:text-gris focus:outline-none focus:ring-2 focus:ring-chela transition-shadow";

function Field({ id, label, hint, children }: { id?: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wide">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gris">{hint}</p>}
    </div>
  );
}

function SectionTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 font-display font-semibold text-xl md:text-2xl">
      <span className="w-9 h-9 rounded-full bg-tinta text-papel flex items-center justify-center text-base shrink-0">{n}</span>
      {children}
    </h2>
  );
}

export default function Registro() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [folioId, setFolioId] = useState<number | null>(null);
  const [availableDates, setAvailableDates] = useState<{ date: string; formatted: string }[]>([]);
  const [pickedDates, setPickedDates] = useState<string[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(true);

  useEffect(() => {
    fetch("/api/available-dates")
      .then((res) => res.json())
      .then((data) => setAvailableDates(data.availableDates || []))
      .catch((err) => console.error("Error fetching dates:", err))
      .finally(() => setIsLoadingDates(false));
  }, []);

  // Se eligen dos miércoles y se ordenan solos: la primera opción siempre es la más próxima.
  const togglePick = (date: string) => {
    setPickedDates((prev) => {
      if (prev.includes(date)) return prev.filter((d) => d !== date);
      const next = prev.length >= 2 ? [prev[1], date] : [...prev, date];
      return next.sort();
    });
  };

  const compressImage = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Could not get canvas context");
        let { width, height } = img;
        const maxSize = 1000;
        if (width > height && width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        } else if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject("Compression failed")), "image/jpeg", 0.7);
      };
      img.onerror = reject;
    });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setFormError(null);

    const formData = new FormData(form);
    if (formData.get("_trap")) {
      setSubmitStatus("success");
      return;
    }

    if (pickedDates.length < 2) {
      setFormError("Elige dos miércoles en los que podrías dar tu charla.");
      document.getElementById("fechas")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    formData.set("preferred_date_1", pickedDates[0]);
    formData.set("preferred_date_2", pickedDates[1]);

    setIsSubmitting(true);
    setSubmitStatus("idle");

    const photoFile = formData.get("photo") as File;
    if (photoFile && photoFile.size > 0) {
      try {
        formData.set("photo", await compressImage(photoFile), "photo.jpg");
      } catch (err) {
        console.warn("Compression failed, sending original", err);
      }
    }

    try {
      const res = await fetch("/api/talks", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        const fieldErrors = data.details?.fieldErrors as Record<string, string[]> | undefined;
        const first = fieldErrors && Object.entries(fieldErrors)[0];
        setFormError(first ? `Revisa el campo "${first[0]}": ${first[1][0]}` : data.error || "Revisa los datos del formulario.");
        setSubmitStatus("error");
        return;
      }
      setFolioId(data.id);
      setSubmitStatus("success");
      form.reset();
      setPhotoPreview(null);
      setPickedDates([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      setSubmitStatus("error");
      setFormError("No pudimos enviar tu propuesta. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return setPhotoPreview(null);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const guideRef = useRef<HTMLDivElement>(null);
  const folio = String(folioId ?? 0).padStart(4, "0");

  const downloadImage = async () => {
    if (!guideRef.current) return;
    try {
      const dataUrl = await toPng(guideRef.current, { cacheBust: true, backgroundColor: "#FBF8F2", pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `Registro_CasaPadi_Folio_${folio}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating image", error);
    }
  };

  const shareWhatsApp = () => {
    const phone = `52${CASA_PADI.phone.replace(/\D/g, "")}`;
    const text = `¡Hola Casa Pädi! Acabo de registrar mi propuesta de charla con el folio #${folio}. Quedo atenta/o a su contacto.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <header className="relative mb-10">
        <CoralBranch className="absolute -right-4 -top-8 w-40 h-40 rotate-[200deg] opacity-80 hidden sm:block" />
        <h1 className="relative font-display font-medium text-[48px] md:text-[68px] leading-[0.95] tracking-[-0.03em] text-chela">Proponer una charla</h1>
        <p className="relative mt-4 text-lg text-tinta-suave max-w-xl">
          Tu investigación, tu tesis o el tema que te apasiona, contado en la terraza de Casa Pädi un miércoles a las 7:00 pm.
        </p>
      </header>

      {submitStatus === "success" ? (
        <div className="space-y-8">
          <div className="bg-papel-claro rounded-[28px] border-2 border-tinta shadow-sello-lg p-7 md:p-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-chela text-papel flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="font-display font-semibold text-3xl">¡Gracias por proponer tu charla!</h2>
            <p className="text-tinta-suave max-w-md mx-auto">Recibimos tu propuesta. La revisaremos y te contactaremos en los próximos días.</p>

            <ol className="text-left max-w-md mx-auto space-y-4 pt-4">
              <li className="flex gap-3">
                <span className="w-8 h-8 rounded-full bg-chela text-papel flex items-center justify-center shrink-0"><Check className="w-4 h-4" /></span>
                <div><p className="font-bold">Envío recibido</p><p className="text-sm text-tinta-suave">Tu folio #{folio} ya está registrado.</p></div>
              </li>
              <li className="flex gap-3">
                <span className="w-8 h-8 rounded-full border-2 border-tinta flex items-center justify-center shrink-0 font-bold text-sm">2</span>
                <div><p className="font-bold">Revisión</p><p className="text-sm text-tinta-suave">Revisamos los detalles en 1 a 3 días hábiles.</p></div>
              </li>
              <li className="flex gap-3">
                <span className="w-8 h-8 rounded-full border-2 border-tinta flex items-center justify-center shrink-0"><Phone className="w-3.5 h-3.5" /></span>
                <div><p className="font-bold">Confirmación</p><p className="text-sm text-tinta-suave">Te escribimos por WhatsApp o correo para definir la fecha.</p></div>
              </li>
            </ol>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <button type="button" onClick={shareWhatsApp} className="inline-flex items-center gap-2 min-h-12 px-6 rounded-full bg-chela text-papel font-bold hover:bg-chela-oscuro transition-colors">
                <Share2 className="w-4 h-4" /> Confirmar por WhatsApp
              </button>
              <button type="button" onClick={downloadImage} className="inline-flex items-center gap-2 min-h-12 px-6 rounded-full border-2 border-tinta font-bold hover:bg-tinta hover:text-papel transition-colors">
                <Download className="w-4 h-4" /> Guardar folio (imagen)
              </button>
            </div>
          </div>

          {/* Lo que se guarda como imagen */}
          <div className="rounded-[28px] overflow-hidden border-2 border-tinta print-area">
            <div ref={guideRef} className="p-8 md:p-10 bg-papel-claro relative">
              <div className="flex justify-between items-start gap-4 mb-8 pb-6 border-b-2 border-tinta">
                <div className="flex items-center gap-4">
                  <img src="/assets/logo.webp" alt="" className="w-16 h-16" />
                  <div>
                    <p className="font-display font-semibold text-2xl text-chela">Una chela x la ciencia</p>
                    <p className="text-sm text-gris">Casa Pädi · Pachuca</p>
                  </div>
                </div>
                <div className="bg-ambar border-2 border-tinta rounded-2xl px-4 py-2 text-center shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Folio</p>
                  <p className="font-display font-semibold text-2xl">#{folio}</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="font-bold text-coral-oscuro mb-2">Siguientes pasos</p>
                  <ul className="text-sm space-y-2 text-tinta-suave list-disc pl-5">
                    <li>Espera nuestro mensaje en 1 a 3 días.</li>
                    <li>Prepara una presentación (PDF o PPT) de 20 a 30 minutos.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-chela mb-2">Recomendaciones</p>
                  <ul className="text-sm space-y-2 text-tinta-suave list-disc pl-5">
                    <li>Mantén el lenguaje accesible y divertido.</li>
                    <li>Usa analogías y ejemplos de la vida diaria.</li>
                  </ul>
                </div>
              </div>
              <p className="text-center font-fecha italic font-semibold text-2xl pt-8 mt-8 border-t-2 border-borde">
                ¡Nos vemos pronto para compartir ciencia y una buena chela!
              </p>
            </div>
          </div>

          <button type="button" onClick={() => setSubmitStatus("idle")} className="block mx-auto text-sm font-bold underline underline-offset-4 hover:text-chela">
            Enviar otra propuesta
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-papel-claro rounded-[28px] border-2 border-tinta shadow-sello-lg p-6 md:p-10 space-y-10" noValidate={false}>
          {formError && (
            <div role="alert" className="p-4 rounded-2xl border-2 border-coral-oscuro bg-papel flex items-start gap-3 text-coral-oscuro font-bold">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{formError}</p>
            </div>
          )}

          <section className="space-y-5">
            <SectionTitle n={1}>Tu charla</SectionTitle>
            <Field id="title" label="Título">
              <input type="text" id="title" name="title" required className={inputClass} placeholder="Ej. La física detrás de una buena taza de café" />
            </Field>
            <Field id="abstract" label="¿De qué trata?">
              <textarea id="abstract" name="abstract" required rows={4} className={cn(inputClass, "resize-none")} placeholder="Cuéntanos en pocas líneas qué vas a compartir y por qué es interesante." />
            </Field>
            <Field id="technical_needs" label="¿Necesitas algo especial?" hint="Contamos con proyector, audio y computadora.">
              <textarea id="technical_needs" name="technical_needs" rows={2} className={cn(inputClass, "resize-none")} placeholder="Opcional" />
            </Field>
          </section>

          <section className="space-y-4" id="fechas">
            <SectionTitle n={2}>Elige dos miércoles</SectionTitle>
            <p className="text-tinta-suave">Toca dos fechas que te acomoden; la más próxima será tu primera opción.</p>
            {isLoadingDates ? (
              <div className="h-24 rounded-2xl bg-crema animate-pulse" aria-label="Cargando fechas" />
            ) : availableDates.length === 0 ? (
              <p className="p-4 rounded-2xl border-2 border-dashed border-coral-oscuro text-coral-oscuro font-bold">
                No hay fechas libres por ahora. Escríbenos y buscamos un espacio.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" role="group" aria-label="Miércoles disponibles">
                {availableDates.slice(0, 12).map((d) => {
                  const order = pickedDates.indexOf(d.date);
                  const picked = order !== -1;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      aria-pressed={picked}
                      onClick={() => togglePick(d.date)}
                      className={cn(
                        "relative text-left rounded-2xl border-2 px-4 py-3 transition-all",
                        picked ? "bg-chela border-chela text-papel shadow-sello" : "bg-papel border-borde hover:border-tinta"
                      )}
                    >
                      {picked && (
                        <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-ambar text-tinta border-2 border-tinta text-xs font-bold flex items-center justify-center">
                          {order + 1}ª
                        </span>
                      )}
                      <span className={cn("block text-[11px] font-bold uppercase tracking-[0.12em]", picked ? "text-papel" : "text-gris")}>{fmt(d.date, "MMMM")}</span>
                      <span className="block font-display font-semibold text-3xl leading-none mt-0.5">{fmt(d.date, "d")}</span>
                      <span className="block font-fecha italic text-base mt-0.5">{fmt(d.date, "h:mm aaa")}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {pickedDates.length > 0 && (
              <p className="text-sm font-bold" aria-live="polite">
                1ª opción: <span className="first-letter:uppercase">{fmt(pickedDates[0], "EEEE d 'de' MMMM")}</span>
                {pickedDates[1] && <> · 2ª opción: {fmt(pickedDates[1], "EEEE d 'de' MMMM")}</>}
              </p>
            )}
          </section>

          <section className="space-y-5">
            <SectionTitle n={3}>Sobre ti</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="speaker_name" label="Nombre completo">
                <input type="text" id="speaker_name" name="speaker_name" required autoComplete="name" className={inputClass} placeholder="Como quieres que aparezca en el cartel" />
              </Field>
              <Field id="social_media" label="Usuario en redes">
                <input type="text" id="social_media" name="social_media" className={inputClass} placeholder="@usuario (opcional)" />
              </Field>
              <Field id="email" label="Correo electrónico">
                <input type="email" id="email" name="email" required autoComplete="email" className={inputClass} placeholder="tu@correo.com" />
              </Field>
              <Field id="phone" label="Teléfono / WhatsApp" hint="10 dígitos">
                <input type="tel" id="phone" name="phone" required autoComplete="tel" inputMode="numeric" className={inputClass} placeholder="771 000 0000" />
              </Field>
            </div>
            <Field id="speaker_bio" label="Biografía breve">
              <textarea id="speaker_bio" name="speaker_bio" required rows={3} className={cn(inputClass, "resize-none")} placeholder="Ej. Estudiante de doctorado en biología, me apasiona la divulgación." />
            </Field>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide">Foto para el cartel</p>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <img src={photoPreview} alt="Vista previa de tu foto" className="w-20 h-20 rounded-full object-cover border-[4px] border-tinta" />
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-tinta flex items-center justify-center text-gris">
                    <Upload className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <label htmlFor="photo" className="inline-flex items-center min-h-11 px-5 rounded-full border-2 border-tinta font-bold text-sm cursor-pointer hover:bg-tinta hover:text-papel transition-colors">
                    {photoPreview ? "Cambiar foto" : "Elegir foto"}
                  </label>
                  <input type="file" id="photo" name="photo" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
                  <p className="mt-1.5 text-xs text-gris">Una foto clara de tu cara, en JPG o PNG. Va en un círculo, como en los carteles.</p>
                </div>
              </div>
            </div>
          </section>

          <input type="text" name="_trap" autoComplete="off" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }} />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 min-h-14 rounded-full bg-ambar text-tinta text-lg font-bold shadow-sello hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:translate-y-0"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-tinta/30 border-t-tinta rounded-full animate-spin" aria-label="Enviando" />
            ) : (
              <>
                Enviar propuesta <Send className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
