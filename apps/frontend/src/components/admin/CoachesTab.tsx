"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, Edit2, Plus, Trash2, UserMinus, UserCircle2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import type { Coach, Team, UserClub } from "@inazuma/shared";

import AdminCoachModal from "./AdminCoachModal";
import CoachMarketModal from "@/components/coach/CoachMarketModal";
import { MarketRequestState } from "@/components/market/MarketRequestState";

export default function CoachesTab() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [userClubs, setUserClubs] = useState<UserClub[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [editingCoach, setEditingCoach] = useState<Coach | Partial<Coach> | null>(null);
  const [viewingCoach, setViewingCoach] = useState<Coach | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      const [coachesData, teamsData, userClubsData] = await Promise.all([
        api.coaches.getAll(),
        api.teams.list(),
        api.market.getUserClubs(),
      ]);

      setCoaches(coachesData ?? []);
      setTeams(teamsData ?? []);
      setUserClubs(userClubsData ?? []);
    } catch (error) {
      console.error("Error cargando entrenadores:", error);
      setLoadError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCoaches = useMemo(() => {
    const safeCoaches = coaches ?? [];
    if (!searchTerm) return safeCoaches;
    const lower = searchTerm.toLowerCase();
    const safeTeams = teams ?? [];
    const safeUserClubs = userClubs ?? [];

    return safeCoaches.filter((c) => {
      const teamName = safeTeams.find((t) => t.id === c.teamId)?.name ?? "";
      const ownerName = c.ownerId ? safeUserClubs.find((u) => u.id === c.ownerId)?.name ?? "" : "";

      return (
        c.name.toLowerCase().includes(lower) ||
        (c.nickname ?? "").toLowerCase().includes(lower) ||
        teamName.toLowerCase().includes(lower) ||
        ownerName.toLowerCase().includes(lower)
      );
    });
  }, [coaches, searchTerm, teams, userClubs]);

  const handleSaveCoach = async (updatedData: Partial<Coach>) => {
    try {
      const maybeId = (editingCoach as Coach | undefined)?.id;
      if (maybeId) {
        await api.coaches.update(maybeId, updatedData);
      } else {
        await api.coaches.create(updatedData);
      }
      setEditingCoach(null);
      setActionError(null);
      loadData();
    } catch (error) {
      console.error("Error al guardar el entrenador:", error);
      setActionError(getApiErrorMessage(error, "Error al guardar el entrenador."));
    }
  };

  const handleReleaseCoach = async (coachId: number, coachName: string) => {
    const ok = window.confirm(`¿Liberar al entrenador "${coachName}" y enviarlo a agentes libres?`);
    if (!ok) return;
    try {
      await api.coaches.release(coachId);
      setActionError(null);
      loadData();
    } catch (error) {
      console.error("Error al liberar el entrenador:", error);
      setActionError(getApiErrorMessage(error, "Error al liberar el entrenador."));
    }
  };

  const handleDeleteCoach = async (coachId: number, coachName: string) => {
    const ok = window.confirm(`¿Eliminar definitivamente al entrenador "${coachName}"? Esta acción puede fallar si está en uso.`);
    if (!ok) return;
    try {
      await api.coaches.delete(coachId);
      setActionError(null);
      loadData();
    } catch (error) {
      console.error("Error al eliminar el entrenador:", error);
      setActionError(getApiErrorMessage(error, "Error al eliminar el entrenador."));
    }
  };

  const getOwnerLabel = (coach: Coach) => {
    if (coach.ownerId) {
      return (userClubs ?? []).find((u) => u.id === coach.ownerId)?.name ?? `Club ${coach.ownerId}`;
    }
    if (coach.isFreeAgent) return "Agente libre";
    return "Bloqueado";
  };

  if (isLoading) {
    return (
      <MarketRequestState
        title="Cargando entrenadores..."
        loadingLabel="Sincronizando entrenadores, equipos y dueños del mercado."
        accentClassName="text-cyan-500"
      />
    );
  }

  if (loadError) {
    return (
      <MarketRequestState
        title="Cargando entrenadores..."
        error={loadError}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {actionError && (
        <div className="mb-2 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="font-black uppercase tracking-wide text-red-300">Accion no completada</p>
            <p className="mt-1 text-red-100/90">{actionError}</p>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            placeholder="Buscar entrenador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={loadData}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 sm:px-6 py-3 rounded-xl font-bold transition-colors border border-slate-700"
          >
            <RefreshCw size={16} /> <span className="sm:inline">Recargar</span>
          </button>
          <button
            onClick={() => setEditingCoach({})}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 px-4 sm:px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-colors border border-cyan-500/50"
          >
            <Plus size={18} /> Nuevo
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center text-cyan-400 font-black uppercase tracking-widest animate-pulse">
            Accediendo a la base de datos...
          </div>
        ) : (
          <table className="w-full min-w-[560px] lg:min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800">
                <th className="p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Entrenador</th>
                <th className="hidden md:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Equipo</th>
                <th className="hidden lg:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Temp.</th>
                <th className="hidden sm:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Nivel</th>
                <th className="hidden lg:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Precio</th>
                <th className="hidden sm:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Estado</th>
                <th className="p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCoaches.map((coach) => {
                const teamName = (teams ?? []).find((t) => t.id === coach.teamId)?.name ?? "Sin equipo";
                const ownerName =
                  coach.ownerId ? (userClubs ?? []).find((u) => u.id === coach.ownerId)?.name ?? `Club ${coach.ownerId}` : null;

                return (
                  <tr key={coach.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td
                      className="p-3 sm:p-4 cursor-pointer"
                      onClick={() => setViewingCoach(coach)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-[140px]">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 shrink-0">
                          {coach.spriteUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={coach.spriteUrl ?? ""} alt={coach.name} className="w-full h-full object-contain" />
                          ) : (
                            <UserCircle2 size={22} className="text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-white group-hover:text-cyan-400 transition-colors truncate">{coach.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase truncate">{coach.nickname ?? "—"}</p>
                          <div className="flex flex-wrap items-center gap-1 mt-1 sm:hidden">
                            <span className="text-[10px] font-black text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                              Nv.{coach.level}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 truncate max-w-[100px]">{teamName}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="hidden md:table-cell p-3 sm:p-4 text-center">
                      <span className="text-xs font-bold text-slate-300 bg-slate-950 px-3 py-1 rounded-md border border-slate-800">
                        {teamName}
                      </span>
                    </td>

                    <td className="hidden lg:table-cell p-3 sm:p-4 text-center text-sm font-mono">{coach.season}</td>
                    <td className="hidden sm:table-cell p-3 sm:p-4 text-center">
                      <span className="inline-flex items-center justify-center bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 px-2 py-1 rounded-md text-xs font-black tabular-nums">
                        Nv. {coach.level}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell p-3 sm:p-4 text-center">
                      <span className="text-yellow-500 font-black tabular-nums">{coach.price} PP</span>
                    </td>

                    <td className="hidden sm:table-cell p-3 sm:p-4 text-center">
                      {ownerName ? (
                        <span className="text-xs font-bold text-blue-400 bg-blue-950/30 px-2 py-1 rounded-md border border-blue-900">
                          {ownerName}
                        </span>
                      ) : coach.isFreeAgent ? (
                        <span className="text-xs font-bold text-yellow-400 bg-yellow-950/30 px-2 py-1 rounded-md border border-yellow-900">
                          Agente Libre
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                          Bloqueado
                        </span>
                      )}
                    </td>

                    <td className="p-3 sm:p-4 text-right">
                      <div className="flex justify-end gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCoach(coach);
                          }}
                          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                          title="Editar entrenador"
                        >
                          <Edit2 size={16} />
                        </button>

                        {!coach.isFreeAgent && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReleaseCoach(coach.id, coach.name);
                            }}
                            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg transition-colors shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                            title="Liberar entrenador"
                          >
                            <UserMinus size={16} />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCoach(coach.id, coach.name);
                          }}
                          className="p-2 bg-slate-700 hover:bg-red-600 text-white rounded-lg transition-colors"
                          title="Eliminar entrenador"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        </div>

        {!isLoading && filteredCoaches.length === 0 && (
          <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
            No se han encontrado entrenadores.
          </div>
        )}
      </div>

      {editingCoach && (teams ?? []).length > 0 && (
        <AdminCoachModal
          coach={editingCoach}
          teams={teams ?? []}
          userClubs={userClubs ?? []}
          onClose={() => setEditingCoach(null)}
          onSave={handleSaveCoach}
        />
      )}

      {viewingCoach && (
        <CoachMarketModal
          coach={viewingCoach}
          status="admin"
          teamName={(teams ?? []).find((t) => t.id === viewingCoach.teamId)?.name}
          ownerLabel={getOwnerLabel(viewingCoach)}
          onClose={() => setViewingCoach(null)}
        />
      )}
    </div>
  );
}

