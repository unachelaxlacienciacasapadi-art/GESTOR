import React, { forwardRef } from "react";
import { cn } from "../lib/utils";
import { Talk } from "../types/talk";

type Props = {
  talk: Talk;
  formatDate: (dateString: string | null | undefined, formatStr: string) => string;
};

type PosterSpeaker = {
  name: string;
  photo_url?: string | null;
};

// El título es lo único de longitud realmente variable en el póster; el resto
// de bloques (encabezado, fecha, footer) tiene alturas fijas. Escalamos la
// tipografía del título según su longitud para que quepa sin encimarse con
// las fotos ni desbordar el lienzo de tamaño fijo (400x500).
const getTitleFontSize = (title: string) => {
  const len = title.length;
  if (len > 140) return 15;
  if (len > 100) return 17;
  if (len > 70) return 20;
  if (len > 45) return 23;
  return 27;
};

const SpeakerBlock = ({
  speaker,
  photoSize,
  nameFontSize,
}: {
  speaker: PosterSpeaker;
  photoSize: number;
  nameFontSize: number;
}) => (
  <div className="flex flex-col items-center" style={{ width: photoSize + 20 }}>
    {speaker.photo_url ? (
      <img
        src={speaker.photo_url}
        alt={speaker.name}
        className="rounded-full object-cover border-black shrink-0"
        style={{ width: photoSize, height: photoSize, borderWidth: photoSize > 90 ? 5 : 3 }}
        crossOrigin="anonymous"
      />
    ) : (
      <div
        className="rounded-full bg-gray-300 border-black flex items-center justify-center shrink-0"
        style={{ width: photoSize, height: photoSize, borderWidth: photoSize > 90 ? 5 : 3 }}
      >
        <span className="text-black font-bold" style={{ fontSize: photoSize / 3 }}>
          {speaker.name.charAt(0)}
        </span>
      </div>
    )}
    <p
      className="text-black font-bold uppercase leading-tight text-center mt-1.5 line-clamp-2"
      style={{ fontSize: nameFontSize }}
    >
      {speaker.name}
    </p>
  </div>
);

const TalkPoster = forwardRef<HTMLDivElement, Props>(({ talk, formatDate }, ref) => {
  const speakers: PosterSpeaker[] = [{ name: talk.speaker_name, photo_url: talk.speaker_photo_url }];
  if (talk.speaker_2_name) {
    speakers.push({ name: talk.speaker_2_name, photo_url: talk.speaker_2_photo_url });
  }
  const hasTwoSpeakers = speakers.length === 2;
  // Con dos ponentes se reparte el mismo espacio vertical entre dos fotos y se
  // aprieta el resto de márgenes; sin esto el contenido se desborda del
  // lienzo fijo (400x500) y el pie de página termina cortado.
  const photoSize = hasTwoSpeakers ? 64 : 120;
  const nameFontSize = hasTwoSpeakers ? 11 : 13;

  return (
    <div
      id="poster-container"
      ref={ref}
      className="w-[400px] h-[500px] bg-[#F5F5F0] relative overflow-hidden shadow-2xl flex flex-col"
      style={{ width: "400px", height: "500px" }}
    >
      {/* Decorative coral element top right */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none" style={{ transform: "translate(20%, -20%)" }}>
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#E88D82" d="M45.7,-76.1C58.9,-69.3,69.1,-55.3,77.5,-40.8C85.9,-26.3,92.5,-11.3,91.3,3.1C90.1,17.5,81.1,31.3,71.1,43.4C61.1,55.5,50.1,65.9,37.1,72.7C24.1,79.5,9.1,82.7,-5.7,81.5C-20.5,80.3,-35.1,74.7,-47.9,66.1C-60.7,57.5,-71.7,45.9,-78.9,31.8C-86.1,17.7,-89.5,1.1,-86.3,-14.2C-83.1,-29.5,-73.3,-43.5,-60.9,-53.4C-48.5,-63.3,-33.5,-69.1,-19.3,-73.1C-5.1,-77.1,8.3,-79.3,22.1,-79.7C35.9,-80.1,50.1,-78.7,45.7,-76.1Z" transform="translate(100 100) scale(1.1)" />
        </svg>
      </div>

      {/* Decorative coral element bottom left */}
      <div className="absolute bottom-0 left-0 w-48 h-48 opacity-15 pointer-events-none" style={{ transform: "translate(-30%, 30%)" }}>
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#E88D82" d="M39.9,-65.7C54.1,-60.5,69.6,-53.8,80.3,-42.1C91,-30.4,96.9,-13.7,94.4,2C91.9,17.7,81,32.4,69.8,45.7C58.6,59,47.1,70.9,33.4,78.2C19.7,85.5,3.8,88.2,-11.1,86.1C-26,84,-40,77.1,-52.6,68.1C-65.2,59.1,-76.4,48,-82.1,34.5C-87.8,21,-88,5.1,-84.3,-9.6C-80.6,-24.3,-73,-37.8,-62.1,-48.6C-51.2,-59.4,-37,-67.5,-23.1,-71.9C-9.2,-76.3,4.4,-77,19.2,-74.6C34,-72.2,48,-66.7,39.9,-65.7Z" transform="translate(100 100) scale(1.1)" />
        </svg>
      </div>

      <div className="p-8 flex flex-col h-full relative z-10 w-full">
        {/* Header */}
        <div className={cn("text-center", hasTwoSpeakers ? "mb-4" : "mb-6")}>
          <h2 className="text-[#2E6F40] font-sans font-medium text-[42px] leading-[0.9] tracking-tight">
            Una chela x<br />la ciencia
          </h2>
        </div>

        {/* Content Area: título a la izquierda, foto(s) a la derecha */}
        <div className="flex gap-4 mb-auto">
          <div className="flex-1 flex flex-col min-w-0">
            <h1
              className="text-[#2E6F40] font-sans font-semibold leading-[1.15] tracking-tight"
              style={{ fontSize: getTitleFontSize(talk.title) }}
            >
              &ldquo;{talk.title}&rdquo;
            </h1>
          </div>

          <div className={cn("flex flex-col items-center shrink-0", hasTwoSpeakers ? "gap-1.5" : "gap-2")}>
            {speakers.map((speaker, i) => (
              <SpeakerBlock key={i} speaker={speaker} photoSize={photoSize} nameFontSize={nameFontSize} />
            ))}
          </div>
        </div>

        {/* Institución (opcional, compartida por los ponentes) */}
        {talk.institution && (
          <p className="text-black/70 text-[10px] uppercase tracking-wider text-center mb-2">
            {talk.institution}
          </p>
        )}

        {/* Date and Time */}
        <div className={cn("flex items-end gap-6", hasTwoSpeakers ? "mb-4" : "mb-8")}>
          <div className="font-serif italic text-black text-xl">
            {talk.scheduled_date ? formatDate(talk.scheduled_date, "EEEE d / MMMM / yyyy") : "Próximamente"}
          </div>
          <div className="font-serif italic text-black text-xl font-bold">
            {talk.scheduled_date ? formatDate(talk.scheduled_date, "h:mm a") : "7:00 pm"}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end mt-auto">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 flex items-center justify-center">
              <img src="/assets/logo.webp" alt="Una Chela por la Ciencia" className="max-w-full max-h-full object-contain" crossOrigin="anonymous" />
            </div>
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
  );
});

TalkPoster.displayName = "TalkPoster";

export default TalkPoster;
