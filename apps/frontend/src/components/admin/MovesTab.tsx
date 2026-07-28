"use client";

import { useEffect, useState, useMemo } from "react";
import { AlertTriangle, Search, RefreshCw, Edit2, Plus, Zap, FilterX } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api"; 
import type { Move } from "@inazuma/shared"; 
import AdminMoveModal from "./AdminMoveModal";
import { MarketRequestState } from "@/components/market/MarketRequestState";

// 🎯 1. Definimos el estado de los filtros
interface MoveFilterState {
  search: string;
  type: string;
  element: string;
  evolution: string;
}

const INITIAL_FILTERS: MoveFilterState = {
  search: "",
  type: "ALL",
  element: "ALL",
  evolution: "ALL",
};

export default function MovesTab() {
  const [moves, setMoves] = useState<Move[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  
  // 🎯 2. Centralizamos los filtros en un solo estado
  const [filters, setFilters] = useState<MoveFilterState>(INITIAL_FILTERS);
  const [editingMove, setEditingMove] = useState<Move | Partial<Move> | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      const data = await api.moves.getAll();
      setMoves(data);
    } catch (error) {
      console.error("Error cargando técnicas:", error);
      setLoadError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // 🎯 3. Lógica de Filtrado Múltiple
  const filteredMoves = useMemo(() => {
    return moves.filter((m) => {
      // Filtro de Texto
      if (filters.search) {
        if (!m.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      }
      // Filtro de Clase/Tipo
      if (filters.type !== "ALL" && m.type !== filters.type) return false;
      // Filtro de Elemento
      if (filters.element !== "ALL" && m.element !== filters.element) return false;
      // Filtro de Evolución
      if (filters.evolution !== "ALL" && m.evolutionPath !== filters.evolution) return false;

      return true;
    });
  }, [moves, filters]);

  const handleChangeFilter = (key: keyof MoveFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const hasActiveFilters = 
    filters.search !== "" || 
    filters.type !== "ALL" || 
    filters.element !== "ALL" || 
    filters.evolution !== "ALL";

  const handleSaveMove = async (moveData: Partial<Move>) => {
    try {
      if ((moveData as any).id) {
        await api.moves.update((moveData as any).id, moveData);
      } else {
        await api.moves.create(moveData as Move);
      }
      setEditingMove(null);
      loadData();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Error al guardar la técnica."));
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* 🎯 4. PANEL DE FILTROS AVANZADOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 shadow-xl">
        
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Buscar técnica por nombre..."
              value={filters.search}
              onChange={(e) => handleChangeFilter("search", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:border-purple-500 focus:outline-hidden transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-stretch gap-2 sm:gap-3">
            <div className="flex-1 sm:flex-none bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl flex items-center justify-center min-w-[120px]">
              <span className="text-xs sm:text-sm font-black text-slate-400 whitespace-nowrap">
                {filteredMoves.length} RESULTADOS
              </span>
            </div>

            <button onClick={loadData} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-3 rounded-xl transition-colors font-bold border border-slate-700" aria-label="Recargar">
              <RefreshCw size={18} />
            </button>

            <button onClick={() => setEditingMove({})} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 sm:px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-colors border border-purple-500/50">
              <Plus size={18} /> Nueva
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select 
            value={filters.type} 
            onChange={(e) => handleChangeFilter("type", e.target.value)} 
            className="flex-1 min-w-[140px] bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-bold text-slate-300 focus:border-purple-500 focus:outline-hidden appearance-none"
          >
            <option value="ALL">Cualquier Clase</option>
            <option value="SHOOT">Tiro</option>
            <option value="DRIBBLE">Regate</option>
            <option value="BLOCK">Defensa</option>
            <option value="CATCH">Parada</option>
            <option value="SKILL">Pasiva</option>
          </select>

          <select 
            value={filters.element} 
            onChange={(e) => handleChangeFilter("element", e.target.value)} 
            className="flex-1 min-w-[140px] bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-bold text-slate-300 focus:border-purple-500 focus:outline-hidden appearance-none"
          >
            <option value="ALL">Cualquier Elemento</option>
            <option value="Fire">Fuego</option>
            <option value="Wood">Bosque</option>
            <option value="Mountain">Montaña</option>
            <option value="Wind">Aire</option>
            <option value="Neutral">Neutro</option>
          </select>

          <select 
            value={filters.evolution} 
            onChange={(e) => handleChangeFilter("evolution", e.target.value)} 
            className="flex-1 min-w-[180px] bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-bold text-slate-300 focus:border-purple-500 focus:outline-hidden appearance-none"
          >
            <option value="ALL">Cualquier Evolución</option>
            <option value="SHIN">Ruta SHIN (Normal/Kai/Shin)</option>
            <option value="L_G">Ruta L/G (Niveles 1-5)</option>
            <option value="NONE">Sin Evolución</option>
          </select>

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

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
        {isLoading ? (
          <MarketRequestState
            title="Cargando base de datos..."
            loadingLabel="Sincronizando técnicas."
            accentClassName="text-purple-500"
            className="w-full min-h-[260px] bg-transparent"
          />
        ) : loadError ? (
          <MarketRequestState
            title="No se pudo cargar la base de datos"
            error={loadError}
            onRetry={loadData}
            className="w-full min-h-[260px] bg-transparent"
          />
        ) : (
          <table className="w-full min-w-[560px] lg:min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800">
                <th className="p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Técnica</th>
                <th className="hidden sm:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Clase</th>
                <th className="hidden md:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Poder (Base - Máx)</th>
                <th className="hidden lg:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Costo TP</th>
                <th className="hidden md:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Evolución</th>
                <th className="p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredMoves.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-[140px]">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                        <Zap size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-white truncate">{m.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">ID: {m.id}</p>
                        <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded border border-slate-700 bg-slate-950 text-slate-300">{m.type}</span>
                          <span className="text-[10px] font-black text-purple-400">{m.basePower}→{m.maxPower}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell p-3 sm:p-4 text-center">
                    <span className="text-[10px] font-black uppercase px-2 py-1 rounded border border-slate-700 bg-slate-950 text-slate-300 mr-2">{m.type}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border border-slate-700 bg-slate-950 ${m.element === 'Fuego' ? 'text-red-400' : m.element === 'Bosque' ? 'text-green-400' : m.element === 'Aire' ? 'text-blue-400' : m.element === 'Montaña' ? 'text-amber-600' : 'text-slate-400'}`}>{m.element}</span>
                  </td>
                  <td className="hidden md:table-cell p-3 sm:p-4 text-center text-sm font-mono">
                    <span className="text-white">{m.basePower}</span> <span className="text-slate-600 mx-1">➔</span> <span className="text-purple-400 font-black">{m.maxPower}</span>
                  </td>
                  <td className="hidden lg:table-cell p-3 sm:p-4 text-center">
                    <span className="text-yellow-500 font-black tabular-nums bg-yellow-950/20 border border-yellow-900/30 px-2 py-1 rounded-md">{m.tpCost} ⚡</span>
                  </td>
                  <td className="hidden md:table-cell p-3 sm:p-4 text-center">
                    {m.evolutionPath !== "NONE" ? (
                      <span className="text-xs font-bold text-purple-400 bg-purple-950/30 px-2 py-1 rounded-md border border-purple-900">
                        {m.evolutionPath} <span className="text-slate-400 text-[10px]">({m.evolutionSpeed})</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-600 italic">No evoluciona</span>
                    )}
                  </td>
                  <td className="p-3 sm:p-4 text-right">
                    <button onClick={() => setEditingMove(m)} className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-[0_0_10px_rgba(147,51,234,0.3)]" aria-label={`Editar ${m.name}`}>
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
        
        {!isLoading && filteredMoves.length === 0 && (
          <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
            No se han encontrado técnicas.
          </div>
        )}
      </div>

      {actionError && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="font-black uppercase tracking-wide text-red-300">Accion no completada</p>
            <p className="mt-1 text-red-100/90">{actionError}</p>
          </div>
        </div>
      )}

      {editingMove && (
        <AdminMoveModal 
          move={editingMove} 
          onClose={() => setEditingMove(null)} 
          onSave={handleSaveMove} 
        />
      )}

    </div>
  );
}