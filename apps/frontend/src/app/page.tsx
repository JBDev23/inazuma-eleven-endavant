import Link from "next/link";
import { Zap, GitMerge, Store, ShieldAlert, ArrowRight, Nfc, Flag, Coins } from "lucide-react";

const MATCH_REFEREE_URL =
  process.env.NEXT_PUBLIC_MATCH_REFEREE_URL ?? "http://localhost:3001";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* CABECERA */}
        <header className="mb-12 border-b border-slate-800 pb-6">
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider flex items-center gap-4">
            <Zap className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" size={48} fill="currentColor" />
            Inazuma Transfer Market
          </h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-3">
            Hub Central del Proyecto
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          
            {/* Tarjeta para ir al Editor */}
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-blue-900/50 hover:bg-slate-800/50 transition-all group flex flex-col shadow-xl">
              <div className="w-12 h-12 bg-blue-950/50 rounded-xl flex items-center justify-center border border-blue-900/50 mb-6 group-hover:scale-110 transition-transform">
                <GitMerge className="text-blue-500" size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-3">
                Constructor
              </h2>
              <p className="mb-8 text-slate-400 font-medium flex-1 text-sm leading-relaxed">
                Añade jugadores y crea las conexiones requeridas en el árbol para poder ficharlos.
              </p>
              <Link 
                href="/editor" 
                className="flex items-center justify-between bg-blue-600 text-white px-5 py-3 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]"
              >
                Abrir Editor <ArrowRight size={18} />
              </Link>
            </div>

          {/* Tarjeta para ir al Mercado */}
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-yellow-900/50 hover:bg-slate-800/50 transition-all group flex flex-col shadow-xl">
            <div className="w-12 h-12 bg-yellow-950/50 rounded-xl flex items-center justify-center border border-yellow-900/50 mb-6 group-hover:scale-110 transition-transform">
              <Store className="text-yellow-500" size={24} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-3">
              Mercado
            </h2>
            <p className="mb-8 text-slate-400 font-medium flex-1 text-sm leading-relaxed">
              Vista de usuario para simular fichajes siguiendo el árbol y gestionando el presupuesto.
            </p>
            <Link 
              href="/market" 
              className="flex items-center justify-between bg-yellow-500 text-slate-950 px-5 py-3 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)]"
            >
              Ir al Mercado <ArrowRight size={18} />
            </Link>
          </div>

          {/* Tarjeta para ir al Admin */}
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-red-900/50 hover:bg-slate-800/50 transition-all group flex flex-col shadow-xl">
            <div className="w-12 h-12 bg-red-950/50 rounded-xl flex items-center justify-center border border-red-900/50 mb-6 group-hover:scale-110 transition-transform">
              <ShieldAlert className="text-red-500" size={24} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-3">
              God Mode
            </h2>
            <p className="mb-8 text-slate-400 font-medium flex-1 text-sm leading-relaxed">
              Panel de Administración Absoluta. Gestiona jugadores, economía y clubes de usuarios.
            </p>
            <Link 
              href="/admin" 
              className="flex items-center justify-between bg-red-600 text-white px-5 py-3 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_25px_rgba(220,38,38,0.4)]"
            >
              Administración <ArrowRight size={18} />
            </Link>
          </div>

          {/* Tarjeta para sincronizar pulsera NFC */}
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-cyan-900/50 hover:bg-slate-800/50 transition-all group flex flex-col shadow-xl">
            <div className="w-12 h-12 bg-cyan-950/50 rounded-xl flex items-center justify-center border border-cyan-900/50 mb-6 group-hover:scale-110 transition-transform">
              <Nfc className="text-cyan-400" size={24} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-3">
              Pulsera NFC
            </h2>
            <p className="mb-8 text-slate-400 font-medium flex-1 text-sm leading-relaxed">
              Descarga las monedas cargadas offline en tu pulsera al mercado del juego.
            </p>
            <Link
              href="/nfc"
              className="flex items-center justify-between bg-cyan-500 text-slate-950 px-5 py-3 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]"
            >
              Sincronizar <ArrowRight size={18} />
            </Link>
          </div>

          {/* Tarjeta de Recursos por Equipo */}
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-amber-900/50 hover:bg-slate-800/50 transition-all group flex flex-col shadow-xl">
            <div className="w-12 h-12 bg-amber-950/50 rounded-xl flex items-center justify-center border border-amber-900/50 mb-6 group-hover:scale-110 transition-transform">
              <Coins className="text-amber-400" size={24} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-3">
              Recursos
            </h2>
            <p className="mb-8 text-slate-400 font-medium flex-1 text-sm leading-relaxed">
              Vista global de recursos de todos los equipos en formato grid a pantalla completa.
            </p>
            <Link
              href="/resources"
              className="flex items-center justify-between bg-amber-500 text-slate-950 px-5 py-3 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]"
            >
              Ver Recursos <ArrowRight size={18} />
            </Link>
          </div>

          {/* Tarjeta para el Árbitro de Partido */}
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-orange-900/50 hover:bg-slate-800/50 transition-all group flex flex-col shadow-xl">
            <div className="w-12 h-12 bg-orange-950/50 rounded-xl flex items-center justify-center border border-orange-900/50 mb-6 group-hover:scale-110 transition-transform">
              <Flag className="text-orange-400" size={24} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-3">
              Árbitro
            </h2>
            <p className="mb-8 text-slate-400 font-medium flex-1 text-sm leading-relaxed">
              Gestiona partidos 11v11 y pachangas, duelos, sustituciones y sincroniza XP al mercado.
            </p>
            <a
              href={MATCH_REFEREE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-orange-500 text-slate-950 px-5 py-3 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-orange-400 transition-all shadow-[0_0_15px_rgba(249,115,22,0.2)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)]"
            >
              Abrir Árbitro <ArrowRight size={18} />
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}