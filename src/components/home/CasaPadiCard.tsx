import { MapPin, Phone, Mail, Facebook, Instagram, Star, Coffee, Mic } from "lucide-react";

export default function CasaPadiCard() {
  return (
    <div className="bg-[#141414] border border-[#333333] rounded-3xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative glow corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FFCC00]/10 to-transparent rounded-bl-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className="w-14 h-14 rounded-full bg-black border-2 border-[#FFCC00] flex items-center justify-center shadow-[0_0_15px_rgba(255,204,0,0.2)]">
          <span className="text-white font-serif font-bold text-lg">Pädi</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Casa Pädi</h3>
          <p className="text-sm text-[#A0A0A0]">Centro cultural autogestivo · Pachuca</p>
        </div>
      </div>

      {/* Services */}
      <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
        {[
          { icon: Star, label: "Clases de Artes" },
          { icon: Coffee, label: "Cafetería Terraza" },
          { icon: Mic, label: "Foro de Conciertos" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 p-3 bg-[#0A0A0A] border border-[#222222] rounded-xl text-center">
            <Icon className="w-4 h-4 text-[#FFCC00]" />
            <span className="text-xs text-[#E0E0E0] leading-tight">{label}</span>
          </div>
        ))}
      </div>

      <div className="h-px w-full bg-[#222222] mb-5 relative z-10" />

      {/* Location & Contact */}
      <div className="space-y-4 relative z-10">
        <a
          href="https://maps.app.goo.gl/kX7P2X4J9Y7Z8Z8Z8"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 text-sm text-[#A0A0A0] hover:text-white transition-colors group"
        >
          <MapPin className="w-4 h-4 mt-0.5 text-[#FF3366] flex-shrink-0 group-hover:scale-110 transition-transform" />
          <span className="group-hover:underline decoration-[#FF3366] underline-offset-4">
            Av. Piracantos 702, Parque de Poblamiento 2a Secc, 42088 Pachuca de Soto, Hgo.
          </span>
        </a>

        {/* Embedded Map — lazy loaded */}
        <div className="w-full h-36 rounded-xl overflow-hidden border border-[#333333]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3747.1643640228394!2d-98.76994192383824!3d20.12211998130833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d109003884b257%3A0x6a05e5d1645a274!2sCasa%20P%C3%A4di!5e0!3m2!1sen!2smx!4v1709088000000!5m2!1sen!2smx"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa de Casa Pädi"
          />
        </div>

        <div className="flex items-center gap-3 text-sm text-[#A0A0A0]">
          <Phone className="w-4 h-4 text-[#00FFCC] flex-shrink-0" />
          <span>+52 771 169 1313</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-[#A0A0A0]">
          <Mail className="w-4 h-4 text-[#9933FF] flex-shrink-0" />
          <span>casapadi.contacto@gmail.com</span>
        </div>

        {/* Social Links */}
        <div className="pt-3 border-t border-[#222222]">
          <p className="text-xs font-semibold text-white mb-3 uppercase tracking-wider">Síguenos</p>
          <div className="flex gap-3">
            <a
              href="https://www.facebook.com/share/1GtDBt3WoG/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 flex-1 py-2 px-3 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 rounded-lg text-sm text-white transition-all group"
            >
              <Facebook className="w-4 h-4 text-[#1877F2] group-hover:scale-110 transition-transform" />
              <span>Facebook</span>
            </a>
            <a
              href="https://www.instagram.com/casa_padi?igsh=aGppdWdxMThkeXhj"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 flex-1 py-2 px-3 bg-[#E1306C]/10 hover:bg-[#E1306C]/20 border border-[#E1306C]/30 rounded-lg text-sm text-white transition-all group"
            >
              <Instagram className="w-4 h-4 text-[#E1306C] group-hover:scale-110 transition-transform" />
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
