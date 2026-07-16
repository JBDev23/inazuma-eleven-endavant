"use client";

import { useState, useMemo } from "react";
import { Search, Flame, Wind, Mountain, Leaf, Shield, Zap, Heart } from "lucide-react";
import { Player, Coach } from "@inazuma/shared";
import { getDisplayStats, getEffectiveStats, getStatModifierKind } from "@inazuma/shared";

// Mapeo de elementos para los iconos y colores del filtro
const ELEMENTS = [
  { id: "ALL", label: "Todos", color: "bg-slate-800" },
  { id: "Fire", label: "Fuego", color: "bg-orange-500/20 text-orange-400 border-orange-500", icon: Flame },
  { id: "Wind", label: "Aire", color: "bg-sky-500/20 text-sky-400 border-sky-500", icon: Wind },
  { id: "Wood", label: "Bosque", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500", icon: Leaf },
  { id: "Earth", label: "Montaña", color: "bg-amber-500/20 text-amber-400 border-amber-500", icon: Mountain },
];

const POSITIONS = ["ALL", "FW", "MF", "DF", "GK"];

interface PlayerGridProps {
  players: Player[];
  activeCoach?: Coach | null;
  // Usamos una función que renderiza el botón (así desde fuera decides si es Comprar o Vender)
  renderActionNode?: (player: Player) => React.ReactNode; 
  onPlayerClick?: (player: Player) => void;
}

export default function PlayerGrid({ players, activeCoach = null, renderActionNode, onPlayerClick }: PlayerGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [posFilter, setPosFilter] = useState("ALL");
  const [elementFilter, setElementFilter] = useState("ALL");

  // 🎯 Filtramos la lista dinámicamente sin mutar el array original
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPos = posFilter === "ALL" || p.position === posFilter;
      const matchElement = elementFilter === "ALL" || p.element === elementFilter;
      return matchName && matchPos && matchElement;
    });
  }, [players, searchTerm, posFilter, elementFilter]);

  const handlePlayerClick = (player: Player) => {
    if (onPlayerClick) {
      onPlayerClick(player);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* 🎯 BARRA DE FILTROS SUPERIOR */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Buscador de Texto */}
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar jugador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
        </div>

        {/* Filtros de Píldoras (Posición y Elemento) */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
          
          {/* Selector de Posición */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => setPosFilter(pos)}
                className={`px-3 py-1.5 rounded-md text-xs font-black uppercase transition-colors ${
                  posFilter === pos 
                    ? "bg-slate-800 text-white" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {pos === "ALL" ? "POS" : pos}
              </button>
            ))}
          </div>

          {/* Selector de Elemento */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            {ELEMENTS.map((el) => {
              const Icon = el.icon;
              const isActive = elementFilter === el.id;
              return (
                <button
                  key={el.id}
                  onClick={() => setElementFilter(el.id)}
                  title={el.label}
                  className={`px-3 py-1.5 rounded-md text-xs font-black uppercase flex items-center gap-1 transition-all ${
                    isActive ? el.color + " border shadow-inner" : "text-slate-500 hover:text-slate-300 transparent border border-transparent"
                  }`}
                >
                  {Icon && <Icon size={14} />}
                  <span className={Icon ? "hidden sm:inline" : ""}>
                    {el.id === "ALL" ? "ELM" : el.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🎯 CUADRÍCULA DE JUGADORES */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest border-2 border-dashed border-slate-800 rounded-2xl">
          No se encontraron jugadores
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredPlayers.map((player) => {
            const baseStats = getDisplayStats(player);
            const displayStats = getEffectiveStats(player, activeCoach);
            const statClass = (key: "kick" | "guard" | "body") => {
              const kind = getStatModifierKind(baseStats[key], displayStats[key]);
              if (kind === "boost") return "text-emerald-400";
              if (kind === "nerf") return "text-red-400";
              return "text-white";
            };
            return (
            <div key={player.id} onClick={() => handlePlayerClick(player)} className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col hover:border-slate-500 hover:shadow-xl transition-all group cursor-pointer">
              
              {/* Imagen del jugador */}
              <div className="h-32 bg-slate-950/50 flex items-center justify-center p-2 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
                <img 
                  src={player.spriteUrl || '/sprites/default.webp'} 
                  alt={player.name}
                  className="h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Info del jugador */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-black text-white uppercase text-lg mb-2 text-center tracking-wider truncate">
                  {player.name} - Lvl {player.level}
                </h3>
                
                <div className="flex justify-center gap-2 mb-4">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border border-slate-600 bg-slate-800 text-slate-300">
                    {player.position}
                  </span>
                  {player.element && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border border-slate-600 bg-slate-800 text-slate-300">
                      {player.element}
                    </span>
                  )}
                </div>

                {/* Minibarras de stats */}
                <div className="flex justify-between px-4 mb-2">
                   <div className="flex flex-col items-center">
                     <Zap size={22} className="text-yellow-400 mb-0.5" />
                     <span className={`text-base font-bold tabular-nums ${statClass("kick")}`}>{displayStats.kick}</span>
                   </div>
                   <div className="flex flex-col items-center">
                     <Shield size={22} className="text-blue-400 mb-0.5" />
                     <span className={`text-base font-bold tabular-nums ${statClass("guard")}`}>{displayStats.guard}</span>
                   </div>
                   <div className="flex flex-col items-center">
                     <Heart size={22} className="text-emerald-400 mb-0.5" />
                     <span className={`text-base font-bold tabular-nums ${statClass("body")}`}>{displayStats.body}</span>
                   </div>
                </div>

                {/* 🎯 BOTÓN DINÁMICO (Inyectado desde la página padre) */}
                <div className="mt-auto pt-2">
                  {renderActionNode && renderActionNode(player)}
                </div>
              </div>

            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}