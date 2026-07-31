"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Edit2, Map, RefreshCw, Search, Shield } from "lucide-react";
import Link from "next/link";
import { api, getApiErrorMessage } from "@/services/api";
import type { Team } from "@inazuma/shared";
import { MarketRequestState } from "@/components/market/MarketRequestState";
import AdminLoreTeamModal from "./AdminLoreTeamModal";

type TypeFilter = "ALL" | "CLUB" | "CENTRAL";

export default function LoreTeamsTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      const teamsData = await api.teams.list();
      setTeams(teamsData ?? []);
    } catch (error) {
      console.error("Error cargando equipos del lore:", error);
      setLoadError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTeams = useMemo(() => {
    const lower = searchTerm.toLowerCase().trim();
    return teams.filter((team) => {
      if (typeFilter !== "ALL" && team.type !== typeFilter) return false;
      if (!lower) return true;
      return (
        team.name.toLowerCase().includes(lower) ||
        team.slug.toLowerCase().includes(lower)
      );
    });
  }, [teams, searchTerm, typeFilter]);

  const centralCount = teams.filter((t) => t.type === "CENTRAL").length;

  const handleToggleType = async (team: Team) => {
    const nextType = team.type === "CENTRAL" ? "CLUB" : "CENTRAL";
    setTogglingId(team.id);
    setActionError(null);
    try {
      const updated = await api.teams.update(team.id, { type: nextType });
      setTeams((prev) =>
        prev.map((t) => (t.id === team.id ? { ...t, ...updated, type: nextType } : t)),
      );
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Error al cambiar el tipo del equipo."));
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveTeam = async (teamId: number, data: Partial<Pick<Team, "name" | "slug" | "type">>) => {
    try {
      const updated = await api.teams.update(teamId, data);
      setTeams((prev) =>
        prev.map((t) => (t.id === teamId ? { ...t, ...updated } : t)),
      );
      setEditingTeam(null);
      setActionError(null);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Error al guardar el equipo."));
      throw error;
    }
  };

  if (isLoading) {
    return (
      <MarketRequestState
        title="Cargando equipos del lore..."
        loadingLabel="Sincronizando facciones y centrales."
        accentClassName="text-amber-500"
      />
    );
  }

  if (loadError) {
    return (
      <MarketRequestState
        title="No se pudieron cargar los equipos"
        error={loadError}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
          {([
            { id: "ALL", label: "Todos" },
            { id: "CLUB", label: "Clubs" },
            { id: "CENTRAL", label: "Centrales" },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTypeFilter(id)}
              className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${
                typeFilter === id
                  ? id === "CENTRAL"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-700 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={loadData}
          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-bold transition-colors border border-slate-700"
        >
          <RefreshCw size={16} /> Recargar
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-widest text-slate-500">
        <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          {teams.length} equipos
        </span>
        <span className="bg-amber-950/40 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg">
          {centralCount} centrales
        </span>
        <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          {filteredTeams.length} visibles
        </span>
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

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800">
                <th className="p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Equipo</th>
                <th className="hidden sm:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Slug</th>
                <th className="p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Tipo</th>
                <th className="p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 font-bold">
                    No hay equipos que coincidan con el filtro.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team) => {
                  const isCentral = team.type === "CENTRAL";
                  const isToggling = togglingId === team.id;
                  return (
                    <tr key={team.id} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="p-3 sm:p-4">
                        <div className="min-w-0">
                          <p className="font-black text-white text-base sm:text-lg truncate">{team.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono sm:hidden truncate">{team.slug}</p>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell p-3 sm:p-4">
                        <span className="text-xs font-mono text-slate-400">{team.slug}</span>
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleToggleType(team)}
                          title={isCentral ? "Cambiar a club" : "Marcar como central"}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider border transition-colors disabled:opacity-50 ${
                            isCentral
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25"
                              : "bg-slate-950 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
                          }`}
                        >
                          <Shield size={12} />
                          {isToggling ? "..." : isCentral ? "Central" : "Club"}
                        </button>
                      </td>
                      <td className="p-3 sm:p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/editor/${team.id}`}
                            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            title="Abrir editor de mapa"
                          >
                            <Map size={16} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setEditingTeam(team)}
                            className="p-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg transition-colors"
                            title="Editar equipo"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTeam && (
        <AdminLoreTeamModal
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSave={handleSaveTeam}
        />
      )}
    </div>
  );
}
