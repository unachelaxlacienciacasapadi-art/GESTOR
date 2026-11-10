import React, { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Mail, Phone, Instagram, Search, User, Building2, LayoutGrid, List as ListIcon } from "lucide-react";
import { cn, normalizeText } from "../lib/utils";
import { Talk } from "../types/talk";

type Props = {
  talks: Talk[];
};

type SpeakerTalk = {
  id: number;
  title: string;
  status?: string;
  scheduled_date?: string | null;
  created_at?: string;
  role: "principal" | "co";
};

type SpeakerEntry = {
  key: string;
  name: string;
  photo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  social_media?: string | null;
  facebook_url?: string | null;
  institution?: string | null;
  bio?: string | null;
  talks: SpeakerTalk[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  scheduled: "Agendada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-[#FFCC00]/20 text-[#FFCC00] border border-[#FFCC00]/30",
  approved: "bg-[#00FFCC]/20 text-[#00FFCC] border border-[#00FFCC]/30",
  rejected: "bg-[#FF3366]/20 text-[#FF3366] border border-[#FF3366]/30",
  scheduled: "bg-[#9933FF]/20 text-[#9933FF] border border-[#9933FF]/30",
  completed: "bg-[#333333] text-[#A0A0A0] border border-[#444444]",
  cancelled: "bg-[#FF8A33]/15 text-[#FF8A33] border border-[#FF8A33]/30",
};

const normalize = normalizeText;

type Person = Omit<SpeakerEntry, "key" | "talks">;

const TITLE_PREFIX = /^(?:(?:dra?|mtr[ao]|lic|ing|psc?|psic|prof|biol?|arq)\.?|m\.?\s*en\s*c\.?)\s+/i;

// "Dra. Karina Pizarro" y "Karina Pizarro" son la misma persona.
const personKey = (name: string) => normalize(name.replace(TITLE_PREFIX, "")).replace(/\s+/g, " ");

// speaker_2_name puede traer varios nombres: "Dra. A y Dra. B".
const splitNames = (raw: string) =>
  raw.split(/\s*,\s*|\s+y\s+(?=(?:dra?|mtr[ao])\.\s)/i).map((n) => n.trim()).filter(Boolean);

// Al fusionar charlas duplicadas, el contacto del co-ponente quedó en admin_notes
// como "Co-ponente: Nombre — email — teléfono (fusionado desde charla #N)".
const coSpeakerContacts = (notes?: string | null) => {
  const contacts = new Map<string, { email?: string; phone?: string }>();
  for (const line of (notes || "").split("\n")) {
    const m = line.match(/^Co-ponente:\s*(.+?)\s+—\s+(.*?)\s*(?:\(fusionado.*)?$/);
    if (!m) continue;
    const parts = m[2].split(/\s+—\s+/);
    contacts.set(personKey(m[1]), {
      email: parts.find((p) => p.includes("@")),
      phone: parts.find((p) => !p.includes("@") && /\d{7,}/.test(p.replace(/\D/g, ""))),
    });
  }
  return contacts;
};

const peopleInTalk = (talk: Talk): { person: Person; role: "principal" | "co" }[] => {
  const people: { person: Person; role: "principal" | "co" }[] = [];
  const main = (talk.speaker_name || "").trim();
  if (main) {
    people.push({
      role: "principal",
      person: {
        name: main,
        photo_url: talk.speaker_photo_url || null,
        email: talk.email || null,
        phone: talk.phone || null,
        social_media: talk.social_media || null,
        facebook_url: talk.facebook_url || null,
        institution: talk.institution || null,
        bio: talk.speaker_bio || null,
      },
    });
  }
  const coNames = splitNames(talk.speaker_2_name || "");
  const contacts = coSpeakerContacts(talk.admin_notes);
  for (const name of coNames) {
    const contact = contacts.get(personKey(name));
    people.push({
      role: "co",
      person: {
        name,
        // Foto y bio de speaker_2 solo son confiables si hay un único co-ponente.
        photo_url: coNames.length === 1 ? talk.speaker_2_photo_url || null : null,
        bio: coNames.length === 1 ? talk.speaker_2_bio || null : null,
        email: contact?.email || null,
        phone: contact?.phone || null,
        institution: talk.institution || null,
      },
    });
  }
  return people;
};

const formatTalkDate = (t: SpeakerTalk) => {
  const raw = t.scheduled_date || t.created_at;
  if (!raw) return "Sin fecha";
  try {
    const parsed = parseISO(raw.replace(" ", "T"));
    if (isNaN(parsed.getTime())) return "Sin fecha";
    const label = t.scheduled_date ? "" : "Propuesta: ";
    return label + format(parsed, "dd MMM yyyy", { locale: es });
  } catch {
    return "Sin fecha";
  }
};

const StatusPill = ({ status }: { status?: string }) => (
  <span
    className={cn(
      "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
      STATUS_CLASS[status || ""] || "bg-[#333333] text-[#A0A0A0] border border-[#444444]"
    )}
  >
    {STATUS_LABEL[status || ""] || status || "?"}
  </span>
);

const ContactLines = ({ speaker }: { speaker: SpeakerEntry }) => (
  <div className="space-y-1">
    {speaker.email && (
      <p className="text-xs text-[#E0E0E0] flex items-center gap-2 truncate">
        <Mail className="w-3.5 h-3.5 text-[#A0A0A0] shrink-0" />
        <a href={`mailto:${speaker.email}`} className="hover:text-[#00FFCC] truncate">{speaker.email}</a>
      </p>
    )}
    {speaker.phone && (
      <p className="text-xs text-[#E0E0E0] flex items-center gap-2">
        <Phone className="w-3.5 h-3.5 text-[#A0A0A0] shrink-0" />
        <a href={`tel:${speaker.phone}`} className="hover:text-[#00FFCC]">{speaker.phone}</a>
      </p>
    )}
    {(speaker.social_media || speaker.facebook_url) && (
      <p className="text-xs text-[#E0E0E0] flex items-center gap-2 truncate">
        <Instagram className="w-3.5 h-3.5 text-[#A0A0A0] shrink-0" />
        <a
          href={speaker.social_media || speaker.facebook_url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#00FFCC] truncate"
        >
          Ver redes
        </a>
      </p>
    )}
    {!speaker.email && !speaker.phone && !speaker.social_media && !speaker.facebook_url && (
      <p className="text-xs text-[#666666] italic">Sin datos de contacto</p>
    )}
  </div>
);

const TalksList = ({ talks }: { talks: SpeakerTalk[] }) => (
  <div className="space-y-1.5">
    {talks.map((t) => (
      <div key={t.id} className="flex items-center justify-between gap-2">
        <span className="text-xs text-white truncate flex-1" title={t.title}>{t.title}</span>
        {t.role === "co" && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#9933FF] shrink-0">Co-ponente</span>
        )}
        <span className="text-[10px] text-[#A0A0A0] shrink-0 whitespace-nowrap">{formatTalkDate(t)}</span>
        <StatusPill status={t.status} />
      </div>
    ))}
  </div>
);

export default function AdminSpeakersDirectory({ talks }: Props) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Los ponentes en talks ya vienen ordenados por created_at DESC desde el backend,
  // así que el primer registro que encontramos para cada clave es el más reciente.
  const speakers = useMemo(() => {
    const entries: SpeakerEntry[] = [];
    const byEmail = new Map<string, SpeakerEntry>();
    const byName = new Map<string, SpeakerEntry>();

    for (const talk of talks) {
      for (const { person, role } of peopleInTalk(talk)) {
        const email = (person.email || "").trim().toLowerCase();
        const nameKey = personKey(person.name);
        let entry = (email && byEmail.get(email)) || byName.get(nameKey);

        if (!entry) {
          entry = { ...person, key: nameKey, talks: [] };
          entries.push(entry);
        } else {
          for (const field of ["photo_url", "email", "phone", "social_media", "facebook_url", "institution", "bio"] as const) {
            entry[field] = entry[field] || person[field] || null;
          }
        }
        if (email) byEmail.set(email, entry);
        byName.set(nameKey, entry);

        if (!entry.talks.some((t) => t.id === talk.id)) {
          entry.talks.push({
            id: talk.id,
            title: talk.title,
            status: talk.status,
            scheduled_date: talk.scheduled_date,
            created_at: talk.created_at,
            role,
          });
        }
      }
    }

    return entries.sort((a, b) => personKey(a.name).localeCompare(personKey(b.name), "es"));
  }, [talks]);

  const filtered = useMemo(() => {
    const q = normalize(search);
    if (!q) return speakers;
    return speakers.filter(
      (s) =>
        normalize(s.name).includes(q) ||
        normalize(s.institution || "").includes(q) ||
        normalize(s.email || "").includes(q)
    );
  }, [speakers, search]);

  return (
    <div className="bg-[#141414] rounded-2xl shadow-lg border border-[#333333] p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-white">Directorio de Ponentes</h2>
          <p className="text-xs text-[#A0A0A0] mt-1">
            {speakers.length} ponente{speakers.length === 1 ? "" : "s"} registrado{speakers.length === 1 ? "" : "s"}, generado a partir de las propuestas recibidas.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#A0A0A0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, institución o email..."
              className="w-full pl-9 pr-3 py-2 bg-[#0A0A0A] border border-[#333333] rounded-lg focus:ring-1 focus:ring-[#00FFCC] focus:border-[#00FFCC] outline-none text-white text-sm"
            />
          </div>
          <div className="flex bg-[#0A0A0A] rounded-lg border border-[#333333] p-1 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Ver en tarjetas"
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "grid" ? "bg-[#9933FF] text-white" : "text-[#A0A0A0] hover:text-white"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Ver en lista"
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "list" ? "bg-[#9933FF] text-white" : "text-[#A0A0A0] hover:text-white"
              )}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-[#A0A0A0] text-sm italic">
          {speakers.length === 0 ? "Aún no hay ponentes registrados." : "Ningún ponente coincide con la búsqueda."}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((speaker) => (
            <div key={speaker.key} className="bg-[#0A0A0A] p-4 rounded-xl border border-[#333333] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  {speaker.photo_url ? (
                    <img
                      src={speaker.photo_url}
                      alt={speaker.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#333333] shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-[#A0A0A0]" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{speaker.name}</h3>
                    {speaker.institution && (
                      <p className="text-[10px] font-bold text-[#00FFCC] uppercase tracking-wider flex items-center gap-1 truncate">
                        <Building2 className="w-3 h-3 shrink-0" /> {speaker.institution}
                      </p>
                    )}
                  </div>
                </div>

                {speaker.bio && <p className="text-xs text-[#A0A0A0] italic mb-3 line-clamp-3">"{speaker.bio}"</p>}

                <div className="mb-3">
                  <ContactLines speaker={speaker} />
                </div>
              </div>

              <div className="pt-3 border-t border-[#222222]">
                <p className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">
                  {speaker.talks.length} charla{speaker.talks.length === 1 ? "" : "s"}
                </p>
                <TalksList talks={speaker.talks} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#333333] text-[#A0A0A0] text-xs uppercase tracking-wider">
                <th className="p-3">Ponente</th>
                <th className="p-3">Contacto</th>
                <th className="p-3">Charlas</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((speaker) => (
                <tr key={speaker.key} className="border-b border-[#222222] align-top hover:bg-[#1A1A1A]">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {speaker.photo_url ? (
                        <img
                          src={speaker.photo_url}
                          alt={speaker.name}
                          className="w-9 h-9 rounded-full object-cover border border-[#333333] shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-[#A0A0A0]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{speaker.name}</p>
                        {speaker.institution && (
                          <p className="text-[10px] font-bold text-[#00FFCC] uppercase tracking-wider truncate">{speaker.institution}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 min-w-[180px]">
                    <ContactLines speaker={speaker} />
                  </td>
                  <td className="p-3 min-w-[260px]">
                    <TalksList talks={speaker.talks} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
