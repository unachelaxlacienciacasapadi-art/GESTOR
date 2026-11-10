import { MapPin, Phone, Mail, Facebook, Instagram, Palette, Coffee, Mic } from "lucide-react";
import { CASA_PADI } from "../../lib/casaPadi";

export default function CasaPadiCard() {
  return (
    <div className="bg-papel-claro border-2 border-tinta rounded-[28px] p-6 md:p-8 shadow-sello-lg grid gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="font-display font-semibold text-2xl">Casa Pädi</h3>
          <p className="text-tinta-suave mt-1">Centro cultural autogestivo en Pachuca. Aquí vive Una chela x la ciencia.</p>
        </div>
        <ul className="grid grid-cols-3 gap-3">
          {[
            { icon: Palette, label: "Clases de artes", color: "#C42A5E" },
            { icon: Coffee, label: "Cafetería y terraza", color: "#B5452F" },
            { icon: Mic, label: "Foro de conciertos", color: "#2C55C9" },
          ].map(({ icon: Icon, label, color }) => (
            <li key={label} className="flex flex-col items-center gap-2 p-3 bg-papel rounded-2xl text-center">
              <Icon className="w-5 h-5" style={{ color }} aria-hidden="true" />
              <span className="text-xs font-bold leading-tight">{label}</span>
            </li>
          ))}
        </ul>
        <address className="not-italic space-y-3 text-[15px]">
          <a href={CASA_PADI.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:text-chela">
            <MapPin className="w-4 h-4 mt-1 text-coral-oscuro shrink-0" />
            <span className="underline decoration-coral underline-offset-4">{CASA_PADI.address}</span>
          </a>
          <a href={`tel:${CASA_PADI.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 hover:text-chela">
            <Phone className="w-4 h-4 text-coral-oscuro shrink-0" /> {CASA_PADI.phone}
          </a>
          <a href={`mailto:${CASA_PADI.email}`} className="flex items-center gap-3 hover:text-chela break-all">
            <Mail className="w-4 h-4 text-coral-oscuro shrink-0" /> {CASA_PADI.email}
          </a>
        </address>
        <div className="flex flex-wrap gap-3">
          <a href={CASA_PADI.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 min-h-11 px-4 rounded-full border-2 border-tinta font-bold text-sm hover:bg-tinta hover:text-papel transition-colors">
            <Facebook className="w-4 h-4" /> Facebook
          </a>
          <a href={CASA_PADI.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 min-h-11 px-4 rounded-full border-2 border-tinta font-bold text-sm hover:bg-tinta hover:text-papel transition-colors">
            <Instagram className="w-4 h-4" /> Instagram
          </a>
        </div>
      </div>
      <div className="min-h-64 rounded-2xl overflow-hidden border-2 border-tinta">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3747.1643640228394!2d-98.76994192383824!3d20.12211998130833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d109003884b257%3A0x6a05e5d1645a274!2sCasa%20P%C3%A4di!5e0!3m2!1sen!2smx!4v1709088000000!5m2!1sen!2smx"
          width="100%"
          height="100%"
          style={{ border: 0, minHeight: "16rem" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Mapa de Casa Pädi"
        />
      </div>
    </div>
  );
}
