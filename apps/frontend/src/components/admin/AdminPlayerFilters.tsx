"use client";

import { Search, FilterX } from "lucide-react";
import { Team } from "@inazuma/shared";

export interface PlayerFilterState {
  search: string;
  position: string;
  element: string;
  ownerStatus: string;
  teamName: string;
  season: string;
}

interface AdminPlayerFiltersProps {
  filters: PlayerFilterState;
  setFilters: (filters: PlayerFilterState) => void;
  clubs: any[]; // Sustituye "any" por tu tipo de Club
  totalResults: number;
  teams: Team[];
  seasons: number[];
}

export const INITIAL_FILTERS: PlayerFilterState = {
  search: "",
  position: "all",
  element: "all",
  ownerStatus: "all",
  teamName: "all",
  season: "all",
};

const POSITIONS = ["FW", "MF", "DF", "GK"];
const ELEMENTS = ["Earth", "Fire", "Wind", "Wood", "Neutral"];

export default function AdminPlayerFilters({ filters, setFilters, clubs, totalResults, teams, seasons }: AdminPlayerFiltersProps) {
  
  const handleChange = (key: keyof PlayerFilterState, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const hasActiveFilters = 
    filters.search !== "" || 
    filters.position !== "all" || 
    filters.element !== "all" || 
    filters.ownerStatus !== "all" ||
    filters.teamName !== "all" ||
    filters.season !== "all";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-t-2xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
      
      {/* Fila 1: Buscador y Contador */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o apodo..."
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="shrink-0 bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl flex items-center justify-center">
          <span className="text-xs sm:text-sm font-black text-slate-400 whitespace-nowrap">
            {totalResults} RESULTADOS
          </span>
        </div>
      </div>

      {/* Fila 2: Filtros Selectores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:flex 2xl:flex-row gap-3">

        {/* Filtro: Equipo (Lore) */}
        <select 
          value={filters.teamName}
          onChange={(e) => handleChange("teamName", e.target.value)}
          className="flex-1 min-w-[150px] bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-bold text-slate-300 focus:border-blue-500 focus:outline-hidden appearance-none"
        >
          <option value="all">Cualquier Equipo (Lore)</option>
          {teams.map(team => (
            <option key={team.id} value={team.name}>{team.name}</option>
          ))}
        </select>
        
        {/* Filtro: Temporada */}
        <select
          value={filters.season}
          onChange={(e) => handleChange("season", e.target.value)}
          className="flex-1 min-w-[120px] bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-bold text-slate-300 focus:border-blue-500 focus:outline-hidden appearance-none"
        >
          <option value="all">Todas las Temporadas</option>
          {seasons.map((season) => (
            <option key={season} value={String(season)}>
              Temporada {season}
            </option>
          ))}
        </select>

        {/* Filtro: Posición */}
        <select 
          value={filters.position}
          onChange={(e) => handleChange("position", e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-bold text-slate-300 focus:border-blue-500 focus:outline-hidden appearance-none"
        >
          <option value="all">Todas las Posiciones</option>
          {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
        </select>

        {/* Filtro: Elemento */}
        <select 
          value={filters.element}
          onChange={(e) => handleChange("element", e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-bold text-slate-300 focus:border-blue-500 focus:outline-hidden appearance-none"
        >
          <option value="all">Todos los Elementos</option>
          {ELEMENTS.map(elem => <option key={elem} value={elem}>{elem}</option>)}
        </select>

        {/* Filtro: Estado / Propietario */}
        <select 
          value={filters.ownerStatus}
          onChange={(e) => handleChange("ownerStatus", e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-bold text-slate-300 focus:border-blue-500 focus:outline-hidden appearance-none"
        >
          <option value="all">Cualquier Estado</option>
          <option value="free">Agentes Libres (Mercado)</option>
          <option value="locked">Bloqueados (Sin dueño ni mercado)</option>
          <optgroup label="Equipos de Usuarios">
            {clubs.map(club => (
              <option key={club.id} value={club.id}>{club.name}</option>
            ))}
          </optgroup>
        </select>

        {/* Botón: Limpiar Filtros */}
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="shrink-0 flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-950/50 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-900/50 p-2.5 rounded-lg transition-colors text-sm font-bold"
            title="Limpiar filtros"
          >
            <FilterX size={18} />
          </button>
        )}
      </div>

    </div>
  );
}