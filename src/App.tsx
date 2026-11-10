import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation } from "react-router-dom";
import { Lock, Menu, X, MapPin, Phone, Mail, Facebook, Instagram } from "lucide-react";
import Home from "./pages/Home";
import Cartelera from "./pages/Cartelera";
import Registro from "./pages/Registro";
import Admin from "./pages/Admin";
import Comunidad from "./pages/Comunidad";
import { cn } from "./lib/utils";
import { CoralBranch } from "./components/brand";
import { CASA_PADI, COLLABORATORS } from "./lib/casaPadi";

const NAV_LINKS = [
  { to: "/cartelera", label: "Cartelera" },
  { to: "/comunidad", label: "Comunidad" },
];

function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-papel/90 backdrop-blur-md border-b border-borde" aria-label="Principal">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <img src="/assets/logo.webp" alt="" className="h-12 w-12 group-hover:rotate-[-8deg] transition-transform duration-300" />
          <span className="flex flex-col leading-tight">
            <span className="font-display font-semibold text-[17px] text-chela">Una chela x la ciencia</span>
            <span className="text-xs text-gris hidden sm:block">un programa de Casa Pädi</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "px-4 py-2.5 rounded-full text-[15px] font-bold transition-colors",
                  isActive ? "bg-chela text-papel" : "text-tinta hover:bg-crema"
                )
              }
            >
              {label}
            </NavLink>
          ))}
          <Link
            to="/registro"
            className="ml-2 inline-flex items-center min-h-11 px-5 rounded-full bg-ambar text-tinta font-bold text-[15px] shadow-sello hover:-translate-y-0.5 transition-transform"
          >
            Proponer charla
          </Link>
          <Link to="/admin" className="ml-1 p-2 text-borde hover:text-gris transition-colors rounded-full" aria-label="Acceso administrativo">
            <Lock className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          className="md:hidden w-12 h-12 rounded-full border-2 border-tinta flex items-center justify-center"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-borde bg-papel px-4 pb-5 pt-2 flex flex-col gap-1">
          {[{ to: "/", label: "Inicio" }, ...NAV_LINKS].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => cn("px-4 py-3 rounded-2xl font-bold", isActive ? "bg-chela text-papel" : "text-tinta")}
            >
              {label}
            </NavLink>
          ))}
          <Link to="/registro" className="mt-2 flex items-center justify-center min-h-12 rounded-full bg-ambar text-tinta font-bold shadow-sello">
            Proponer charla
          </Link>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-noche text-papel relative overflow-hidden">
      <CoralBranch className="absolute -right-10 -bottom-12 w-56 h-56 opacity-50" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="flex gap-4 items-start">
          <div className="w-20 h-20 rounded-full bg-papel flex items-center justify-center shrink-0">
            <img src="/assets/logo.webp" alt="" className="w-[72px] h-[72px]" />
          </div>
          <div>
            <p className="font-display font-semibold text-xl">Una chela x la ciencia</p>
            <p className="text-sm text-[#D8D2C4] mt-1 leading-relaxed">
              Divulgación científica con entrada libre, cada miércoles en Casa Pädi, centro cultural autogestivo de Pachuca.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm text-[#D8D2C4]">Con la colaboración de</span>
              {COLLABORATORS.map((c) =>
                c.logo ? (
                  <a
                    key={c.name}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${c.name} en Instagram`}
                    className="bg-white rounded-xl px-2.5 py-1.5 hover:ring-2 hover:ring-ambar transition-shadow"
                  >
                    <img src={c.logo} alt={c.name} className="h-10 w-auto" loading="lazy" />
                  </a>
                ) : (
                  <span key={c.name} className="font-bold text-ambar">{c.name}</span>
                )
              )}
            </div>
          </div>
        </div>
        <address className="not-italic text-[15px] space-y-2.5">
          <a href={CASA_PADI.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex gap-2.5 hover:text-ambar transition-colors">
            <MapPin className="w-4 h-4 mt-1 shrink-0 text-coral" /> {CASA_PADI.address}
          </a>
          <a href={`tel:${CASA_PADI.phone.replace(/\s/g, "")}`} className="flex gap-2.5 hover:text-ambar transition-colors">
            <Phone className="w-4 h-4 mt-1 shrink-0 text-coral" /> {CASA_PADI.phone}
          </a>
          <a href={`mailto:${CASA_PADI.email}`} className="flex gap-2.5 hover:text-ambar transition-colors break-all">
            <Mail className="w-4 h-4 mt-1 shrink-0 text-coral" /> {CASA_PADI.email}
          </a>
        </address>
        <div className="flex flex-col gap-2">
          <a href={CASA_PADI.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 py-1.5 font-bold text-ambar hover:text-papel transition-colors">
            <Facebook className="w-4 h-4" /> Facebook · Casa Pädi
          </a>
          <a href={CASA_PADI.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 py-1.5 font-bold text-ambar hover:text-papel transition-colors">
            <Instagram className="w-4 h-4" /> Instagram · @casa_padi
          </a>
        </div>
      </div>
    </footer>
  );
}

function Shell() {
  const location = useLocation();
  const isAdmin = location.pathname === "/admin";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#0F2016] text-[#F0F0F0] font-sans">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Admin />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-papel text-tinta font-sans flex flex-col selection:bg-ambar selection:text-tinta">
      <Navbar />
      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cartelera" element={<Cartelera />} />
          <Route path="/comunidad" element={<Comunidad />} />
          <Route path="/registro" element={<Registro />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
