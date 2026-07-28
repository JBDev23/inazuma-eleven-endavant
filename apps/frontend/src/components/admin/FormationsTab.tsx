"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Edit2,
  Plus,
  Trash2,
  LayoutGrid,
  Users,
  FilterX,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import type { Formation, FormationType } from "@inazuma/shared";
import { formatFormationLines } from "@/lib/formation-field";
import AdminFormationModal from "./AdminFormationModal";
import AdminFormationAssignmentModal from "./AdminFormationAssignmentModal";
import { FormationPreviewCard } from "@/components/tactics/FormationPreviewCard";
import { MarketRequestState } from "@/components/market/MarketRequestState";

interface FormationFilterState {
  search: string;
  type: string;
  playerCount: string;
}

const INITIAL_FILTERS: FormationFilterState = {
  search: "",
  type: "ALL",
  playerCount: "ALL",
};

const TYPE_LABELS: Record<FormationType, string> = {
  OFFENSIVE: "Ofensiva",
  DEFENSIVE: "Defensiva",
  BALANCED: "Equilibrada",
};

const TYPE_BADGE_CLASS: Record<FormationType, string> = {
  OFFENSIVE: "text-red-400 bg-red-950/30 border-red-900",
  DEFENSIVE: "text-blue-400 bg-blue-950/30 border-blue-900",
  BALANCED: "text-emerald-400 bg-emerald-950/30 border-emerald-900",
};

export default function FormationsTab() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FormationFilterState>(INITIAL_FILTERS);
  const [editingFormation, setEditingFormation] = useState<Formation | Partial<Formation> | null>(
    null,
  );
  const [assigningFormation, setAssigningFormation] = useState<Formation | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      const data = await api.formations.getAll();
      setFormations(data ?? []);
    } catch (error) {
      console.error("Error cargando formaciones:", error);
      setLoadError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredFormations = useMemo(() => {
    return formations.filter((f) => {
      if (filters.search && !f.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.type !== "ALL" && f.type !== filters.type) return false;
      if (filters.playerCount !== "ALL" && f.playerCount !== parseInt(filters.playerCount, 10)) {
        return false;
      }
      return true;
    });
  }, [formations, filters]);

  const handleChangeFilter = (key: keyof FormationFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const hasActiveFilters =
    filters.search !== "" || filters.type !== "ALL" || filters.playerCount !== "ALL";

  const handleSaveFormation = async (formationData: Partial<Formation>) => {
    try {
      if (formationData.id) {
        const { id, ...updatedData } = formationData;
        await api.formations.update(id, updatedData);
      } else {
        await api.formations.create(formationData as Omit<Formation, "id">);
      }
      setEditingFormation(null);
      setActionError(null);
      loadData();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Error al guardar la formación."));
    }
  };

  const handleDeleteFormation = async (formationId: number, formationName: string) => {
    const ok = window.confirm(
      `¿Eliminar la formación "${formationName}"? Fallará si algún club la está usando.`,
    );
    if (!ok) return;

    try {
      await api.formations.delete(formationId);
      setActionError(null);
      loadData();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Error al eliminar la formación."));
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 shadow-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="relative flex-1 min-w-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar formación por nombre..."
              value={filters.search}
              onChange={(e) => handleChangeFilter("search", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:border-orange-500 focus:outline-hidden transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-stretch gap-2 sm:gap-3">
            <div className="flex-1 sm:flex-none bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl flex items-center justify-center min-w-[120px]">
              <span className="text-xs sm:text-sm font-black text-slate-400 whitespace-nowrap">
                {filteredFormations.length} RESULTADOS
              </span>
            </div>

            <button
              onClick={loadData}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-3 rounded-xl transition-colors font-bold border border-slate-700"
              aria-label="Recargar"
            >
              <RefreshCw size={18} />
            </button>

            <button
              onClick={() => setEditingFormation({})}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 sm:px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(234,88,12,0.3)] transition-colors border border-orange-500/50"
            >
              <Plus size={18} /> Nueva
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <select
            value={filters.type}
            onChange={(e) => handleChangeFilter("type", e.target.value)}
            className="flex-1 min-w-[140px] bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-bold text-slate-300 focus:border-orange-500 focus:outline-hidden appearance-none"
          >
            <option value="ALL">Cualquier tipo</option>
            <option value="OFFENSIVE">Ofensiva</option>
            <option value="DEFENSIVE">Defensiva</option>
            <option value="BALANCED">Equilibrada</option>
          </select>

          <select
            value={filters.playerCount}
            onChange={(e) => handleChangeFilter("playerCount", e.target.value)}
            className="flex-1 min-w-[140px] bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-bold text-slate-300 focus:border-orange-500 focus:outline-hidden appearance-none"
          >
            <option value="ALL">Cualquier modo</option>
            <option value="11">11 vs 11</option>
            <option value="4">4 vs 4</option>
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
              title="Cargando formaciones..."
              loadingLabel="Sincronizando catálogo táctico."
              accentClassName="text-orange-500"
              className="w-full min-h-[260px] bg-transparent"
            />
          ) : loadError ? (
            <MarketRequestState
              title="No se pudo cargar el catálogo"
              error={loadError}
              onRetry={loadData}
              className="w-full min-h-[260px] bg-transparent"
            />
          ) : (
            <table className="w-full min-w-[640px] lg:min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800">
                  <th className="p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Formación
                  </th>
                  <th className="hidden lg:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Vista previa
                  </th>
                  <th className="hidden sm:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">
                    Líneas
                  </th>
                  <th className="hidden md:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">
                    Modo
                  </th>
                  <th className="hidden md:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">
                    Tipo
                  </th>
                  <th className="hidden lg:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">
                    Precio
                  </th>
                  <th className="p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredFormations.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-[140px]">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-orange-400 shrink-0">
                          <LayoutGrid size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-white truncate">{f.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            ID: {f.id}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                            <span className="text-[10px] font-black font-mono text-orange-300">
                              {formatFormationLines(f.positions, f.playerCount)}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded border ${TYPE_BADGE_CLASS[f.type]}`}
                            >
                              {TYPE_LABELS[f.type]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="hidden lg:table-cell p-3 sm:p-4 max-w-[220px]">
                      <FormationPreviewCard formation={f} />
                    </td>

                    <td className="hidden sm:table-cell p-3 sm:p-4 text-center">
                      <span className="text-sm font-black font-mono tracking-wider text-white">
                        {formatFormationLines(f.positions, f.playerCount)}
                      </span>
                    </td>

                    <td className="hidden md:table-cell p-3 sm:p-4 text-center">
                      <span className="text-xs font-bold text-slate-300 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                        {f.playerCount}v{f.playerCount}
                      </span>
                    </td>

                    <td className="hidden md:table-cell p-3 sm:p-4 text-center">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${TYPE_BADGE_CLASS[f.type]}`}
                      >
                        {TYPE_LABELS[f.type]}
                      </span>
                    </td>

                    <td className="hidden lg:table-cell p-3 sm:p-4 text-center">
                      {f.price === 0 ? (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded-md border border-emerald-900">
                          Gratis
                        </span>
                      ) : (
                        <span className="text-yellow-500 font-black tabular-nums bg-yellow-950/20 border border-yellow-900/30 px-2 py-1 rounded-md">
                          {f.price} PP
                        </span>
                      )}
                    </td>

                    <td className="p-3 sm:p-4 text-right">
                      <div className="flex justify-end gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setAssigningFormation(f)}
                          className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                          aria-label={`Asignar clubes a ${f.name}`}
                          title="Asignar a clubes"
                        >
                          <Users size={16} />
                        </button>
                        <button
                          onClick={() => setEditingFormation(f)}
                          className="p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors shadow-[0_0_10px_rgba(234,88,12,0.3)]"
                          aria-label={`Editar ${f.name}`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteFormation(f.id, f.name)}
                          className="p-2 bg-slate-700 hover:bg-red-600 text-white rounded-lg transition-colors"
                          aria-label={`Eliminar ${f.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!isLoading && !loadError && filteredFormations.length === 0 && (
          <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
            No se han encontrado formaciones.
          </div>
        )}
      </div>

      {actionError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="font-black uppercase tracking-wide text-red-300">Accion no completada</p>
            <p className="mt-1 text-red-100/90">{actionError}</p>
          </div>
        </div>
      )}

      {editingFormation && (
        <AdminFormationModal
          formation={editingFormation}
          onClose={() => setEditingFormation(null)}
          onSave={handleSaveFormation}
        />
      )}

      {assigningFormation && (
        <AdminFormationAssignmentModal
          mode="formation"
          formation={assigningFormation}
          onClose={() => setAssigningFormation(null)}
        />
      )}
    </div>
  );
}
