import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Coffee, Calendar, Mic, Settings, Lock, Users } from "lucide-react";
import Home from "./pages/Home";
import Cartelera from "./pages/Cartelera";
import Registro from "./pages/Registro";
import Admin from "./pages/Admin";
import Comunidad from "./pages/Comunidad";
import logoPng from "./assets/logo.png";

function NavContent() {
  const location = useLocation();
  
  if (location.pathname === '/admin') {
    return null;
  }
  
  return (
    <nav className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-[#333333]/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative h-11 w-11 bg-white rounded-full p-0.5 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 group-hover:scale-110">
                <img src={logoPng} alt="Una Chela por la Ciencia" className="h-full w-full object-contain mix-blend-multiply scale-110" />
              </div>
              <span className="font-serif font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#A0A0A0] group-hover:to-white transition-colors hidden sm:block">Casa Padi</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              to="/cartelera" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                location.pathname === '/cartelera' 
                  ? 'bg-[#00FFCC]/10 text-[#00FFCC] shadow-[inset_0_0_10px_rgba(0,255,204,0.1)]' 
                  : 'text-[#A0A0A0] hover:text-[#00FFCC] hover:bg-[#141414]'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Cartelera</span>
            </Link>
            <Link 
              to="/comunidad" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                location.pathname === '/comunidad' 
                  ? 'bg-[#FF3366]/10 text-[#FF3366] shadow-[inset_0_0_10px_rgba(255,51,102,0.1)]' 
                  : 'text-[#A0A0A0] hover:text-[#FF3366] hover:bg-[#141414]'
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Comunidad</span>
            </Link>
            <Link 
              to="/registro" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                location.pathname === '/registro' 
                  ? 'bg-[#FFCC00]/10 text-[#FFCC00] shadow-[inset_0_0_10px_rgba(255,204,0,0.1)]' 
                  : 'text-[#A0A0A0] hover:text-[#FFCC00] hover:bg-[#141414]'
              }`}
            >
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Proponer Charla</span>
            </Link>
            <Link 
              to="/admin" 
              className="ml-2 p-1.5 text-[#1A1A1A] hover:text-[#9933FF] transition-colors rounded-full hover:bg-[#141414]"
              title="Acceso Administrativo"
            >
              <Lock className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0A0A0A] text-[#F0F0F0] font-sans selection:bg-[#FF3366] selection:text-white flex flex-col">
        <NavContent />

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cartelera" element={<Cartelera />} />
            <Route path="/comunidad" element={<Comunidad />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
