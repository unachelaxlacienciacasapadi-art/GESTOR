// PhotoGalleryGrid.tsx
// NOW: Curated static images from assets folder.
// FUTURE: Uncomment the dynamic section below to load event_photos from the API.

import galeria3Img from "../../assets/galeria3.jpeg";
import galeria1Img from "../../assets/galeria1.jpeg";
import galeria4Img from "../../assets/galeria4.jpeg";
import galeria5Img from "../../assets/galeria5.jpeg";
import memorias1Img from "../../assets/memorias1.jpeg";
import gale2Img from "../../assets/gale2.png.jpeg";

// ── STATIC DATA ──────────────────────────────
const GALLERY = [
  { src: galeria3Img, alt: "Una noche de ciencia en Casa Pädi", className: "col-span-2 row-span-2", label: { text: "Casa Pädi", color: "text-[#FF3366]", border: "border-[#FF3366]/30", bg: "bg-[#FF3366]/10", caption: "Una noche de ciencia" }, hoverBorder: "hover:border-[#FF3366]/50 hover:shadow-[0_0_25px_rgba(255,51,102,0.2)]", style: { aspectRatio: "1.5" } },
  { src: galeria1Img, alt: "Sesión en Casa Pädi", className: "", hoverBorder: "hover:border-[#00FFCC]/50 hover:shadow-[0_0_20px_rgba(0,255,204,0.2)]", style: {} },
  { src: galeria4Img, alt: "Ambiente y comunidad", className: "", hoverBorder: "hover:border-[#9933FF]/50 hover:shadow-[0_0_20px_rgba(153,51,255,0.2)]", style: {} },
  { src: galeria5Img, alt: "Comunidad Casa Pädi", className: "", hoverBorder: "hover:border-[#FFCC00]/50 hover:shadow-[0_0_20px_rgba(255,204,0,0.2)]", style: {} },
  { src: memorias1Img, alt: "Memorias de charlas", className: "", hoverBorder: "hover:border-[#FF3366]/50 hover:shadow-[0_0_20px_rgba(255,51,102,0.2)]", style: {} },
  { src: gale2Img, alt: "Comunidad científica", className: "col-span-2", label: { text: "Comunidad", color: "text-[#00FFCC]", border: "border-[#00FFCC]/30", bg: "bg-[#00FFCC]/10", caption: "Mentes curiosas" }, hoverBorder: "hover:border-[#00FFCC]/50 hover:shadow-[0_0_25px_rgba(0,255,204,0.2)]", style: { height: "180px", objectFit: "cover" as const } },
];
// ─────────────────────────────────────────────

// FUTURE DYNAMIC VERSION:
// import { useState, useEffect } from "react";
// const [eventPhotos, setEventPhotos] = useState([]);
// useEffect(() => {
//   fetch('/api/talks?hasPhotos=true&limit=10')
//     .then(r => r.json())
//     .then(talks => {
//       const photos = talks
//         .filter(t => t.event_photos)
//         .flatMap(t => JSON.parse(t.event_photos));
//       setEventPhotos(photos);
//     });
// }, []);

export default function PhotoGalleryGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {GALLERY.map((item, i) => (
        <div
          key={i}
          className={`group relative overflow-hidden rounded-2xl border border-[#333333] transition-all duration-500 ${item.className} ${item.hoverBorder}`}
          style={item.style && !("objectFit" in item.style) ? item.style : {}}
        >
          {item.label && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10" />
          )}
          <img
            src={item.src}
            alt={item.alt}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${item.className.includes("row-span-2") ? "" : "aspect-square"}`}
            style={item.style && "objectFit" in item.style ? { height: (item.style as any).height, objectFit: (item.style as any).objectFit } : {}}
          />
          {!item.label && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
          )}
          {item.label && (
            <div className="absolute bottom-4 left-4 z-20 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-400">
              <span className={`text-xs font-bold ${item.label.color} ${item.label.bg} backdrop-blur-md px-2 py-1 rounded-full border ${item.label.border}`}>
                {item.label.text}
              </span>
              <p className="text-white font-serif text-base mt-1">{item.label.caption}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
