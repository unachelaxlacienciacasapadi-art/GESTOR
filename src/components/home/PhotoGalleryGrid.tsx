import gale1Img from "../../assets/gale1.png.jpeg";
import galeria1Img from "../../assets/galeria1.jpeg";
import charlaPreguntasImg from "../../assets/charla-preguntas.jpg";
import galeria5Img from "../../assets/galeria5.jpeg";
import memorias1Img from "../../assets/memorias1.jpeg";
import gale2Img from "../../assets/gale2.png.jpeg";

const GALLERY = [
  { src: gale1Img, alt: "La barra de Casa Pädi al atardecer", caption: "La barra, antes de empezar", tilt: -1.5 },
  { src: galeria1Img, alt: "Batería y percusión en un concierto en el foro de Casa Pädi", caption: "Música en vivo en el foro", tilt: 1 },
  { src: charlaPreguntasImg, alt: "Ponente respondiendo preguntas del público durante una charla sobre la muerte", caption: "Preguntas del público", tilt: -0.5 },
  { src: galeria5Img, alt: "Público reunido frente al mural con luces de colores", caption: "La terraza se llena", tilt: 1.5 },
  { src: memorias1Img, alt: "Bartender preparando bebidas en la barra", caption: "Detrás de la barra", tilt: -1 },
  { src: gale2Img, alt: "Amigos riendo en una mesa frente al mural", caption: "Sobremesa entre amigos", tilt: 0.5 },
];

/** Fotos como impresiones pegadas: marco de papel, giro leve y pie en itálica. */
export default function PhotoGalleryGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {GALLERY.map((item) => (
        <figure
          key={item.caption}
          className="m-0 bg-papel-claro p-2 md:p-2.5 pb-3 shadow-[0_10px_24px_rgba(31,29,26,0.14)] hover:rotate-0 transition-transform duration-300"
          style={{ transform: `rotate(${item.tilt}deg)` }}
        >
          <img src={item.src} alt={item.alt} loading="lazy" decoding="async" className="w-full aspect-[4/3] object-cover" />
          <figcaption className="mt-2 font-fecha italic text-base md:text-xl leading-tight">{item.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
