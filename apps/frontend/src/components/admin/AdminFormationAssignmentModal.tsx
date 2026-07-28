"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Search, Star, UserCircle2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import type {
  Formation,
  FormationClubAssignment,
  FormationWithClubStatus,
  UserClub,
} from "@inazuma/shared";
import { formatFormationLines } from "@/lib/formation-field";
import { MarketRequestState } from "@/components/market/MarketRequestState";

type ClubModeProps = {
  mode: "club";
  club: UserClub;
  formation?: never;
};

type FormationModeProps = {
  mode: "formation";
  formation: Formation;
  club?: never;
};

type AdminFormationAssignmentModalProps = (ClubModeProps | FormationModeProps) & {
  onClose: () => void;
};

function isActive(formation: FormationWithClubStatus): boolean {
  return formation.isActive11 || formation.isActive4;
}

export default function AdminFormationAssignmentModal({
  mode,
  club,
  formation,
  onClose,
}: AdminFormationAssignmentModalProps) {
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const [clubFormations, setClubFormations] = useState<FormationWithClubStatus[]>([]);
  const [formationClubs, setFormationClubs] = useState<FormationClubAssignment[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      if (mode === "club") {
        const data = await api.market.getClubFormations(club.id);
        setClubFormations(data ?? []);
      } else {
        const data = await api.formations.getClubAssignments(formation.id);
        setFormationClubs(data ?? []);
      }
    } catch (error) {
      console.error("Error cargando asignaciones:", error);
      setLoadError(error);
    } finally {
      setIsLoading(false);
    }
  }, [mode, club, formation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredClubFormations = useMemo(() => {
    if (!search) return clubFormations;
    const lower = search.toLowerCase();
    return clubFormations.filter((f) => f.name.toLowerCase().includes(lower));
  }, [clubFormations, search]);

  const filteredFormationClubs = useMemo(() => {
    if (!search) return formationClubs;
    const lower = search.toLowerCase();
    return formationClubs.filter(
      (entry) =>
        entry.clubName.toLowerCase().includes(lower) || entry.clubId.toLowerCase().includes(lower),
    );
  }, [formationClubs, search]);

  const handleToggleClubFormation = async (formationId: number, ownedByClub: boolean) => {
    if (!club) return;

    const key = `formation-${formationId}`;
    setPendingKey(key);
    setActionError(null);
    try {
      if (ownedByClub) {
        await api.market.adminRevokeFormation(club.id, formationId);
      } else {
        await api.market.adminGrantFormation(club.id, formationId);
      }
      await loadData();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo actualizar la asignación."));
    } finally {
      setPendingKey(null);
    }
  };

  const handleToggleFormationClub = async (clubId: string, ownedByClub: boolean) => {
    if (!formation) return;

    const key = `club-${clubId}`;
    setPendingKey(key);
    setActionError(null);
    try {
      if (ownedByClub) {
        await api.market.adminRevokeFormation(clubId, formation.id);
      } else {
        await api.market.adminGrantFormation(clubId, formation.id);
      }
      await loadData();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo actualizar la asignación."));
    } finally {
      setPendingKey(null);
    }
  };

  const handleActivate = async (formationId: number) => {
    if (!club) return;

    const key = `activate-${formationId}`;
    setPendingKey(key);
    setActionError(null);
    try {
      await api.market.activateFormation(club.id, formationId);
      await loadData();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo activar la formación."));
    } finally {
      setPendingKey(null);
    }
  };

  const title =
    mode === "club"
      ? `Formaciones de ${club.name}`
      : `Clubes con ${formation.name}`;

  const subtitle =
    mode === "club"
      ? `ID: ${club.id}`
      : `${formatFormationLines(formation.positions, formation.playerCount)} · ${formation.playerCount}v${formation.playerCount}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm overflow-y-auto p-0 sm:p-4">
      <div className="bg-slate-900 border-2 border-orange-900/50 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[92dvh] sm:max-h-[85dvh] overflow-hidden shadow-2xl my-0 sm:my-auto flex flex-col">
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="min-w-0">
            <h3 className="font-black text-white uppercase truncate">{title}</h3>
            <p className="text-[10px] text-slate-500 font-mono truncate">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white shrink-0 ml-3">
            ✕
          </button>
        </div>

        <div className="p-4 border-b border-slate-800 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder={mode === "club" ? "Buscar formación..." : "Buscar club..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 focus:border-orange-500 focus:outline-hidden text-sm"
            />
          </div>
          <p className="mt-2 text-[10px] text-slate-500 leading-snug">
            Asigna formaciones al inventario del club sin coste en PP. Las desbloqueadas por entrenador
            aparecen marcadas y no se pueden quitar desde aquí.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <MarketRequestState
              title="Cargando asignaciones..."
              loadingLabel="Sincronizando datos."
              accentClassName="text-orange-500"
              className="min-h-[200px] bg-transparent"
            />
          ) : loadError ? (
            <MarketRequestState
              title="No se pudieron cargar las asignaciones"
              error={loadError}
              onRetry={loadData}
              className="min-h-[200px] bg-transparent"
            />
          ) : mode === "club" ? (
            <div className="space-y-2">
              {filteredClubFormations.map((f) => {
                const key = `formation-${f.id}`;
                const isPending = pendingKey === key || pendingKey === `activate-${f.id}`;
                const active = isActive(f);

                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3"
                  >
                    <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={f.ownedByClub}
                        disabled={isPending}
                        onChange={() => handleToggleClubFormation(f.id, f.ownedByClub)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-orange-500 focus:ring-orange-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">{f.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {formatFormationLines(f.positions, f.playerCount)} · {f.playerCount}v
                          {f.playerCount}
                        </p>
                      </div>
                    </label>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {f.unlockedByCoach && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-cyan-800 bg-cyan-950/40 text-cyan-300">
                          Entrenador
                        </span>
                      )}
                      {f.price === 0 && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-emerald-800 bg-emerald-950/40 text-emerald-300">
                          Gratis
                        </span>
                      )}
                      {active && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-orange-800 bg-orange-950/40 text-orange-300">
                          Activa
                        </span>
                      )}
                      {f.unlocked && !active && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleActivate(f.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-orange-600 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                          title="Activar formación"
                        >
                          <Star size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredClubFormations.length === 0 && (
                <p className="text-center text-slate-500 text-sm font-bold uppercase tracking-widest py-8">
                  Sin resultados
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFormationClubs.map((entry) => {
                const key = `club-${entry.clubId}`;
                const isPending = pendingKey === key;

                return (
                  <label
                    key={entry.clubId}
                    className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={entry.ownedByClub}
                      disabled={isPending}
                      onChange={() => handleToggleFormationClub(entry.clubId, entry.ownedByClub)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-orange-500 focus:ring-orange-500 shrink-0"
                    />
                    <div className="w-8 h-8 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center shrink-0">
                      <UserCircle2 size={18} className="text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-sm truncate">{entry.clubName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">ID: {entry.clubId}</p>
                    </div>
                  </label>
                );
              })}

              {filteredFormationClubs.length === 0 && (
                <p className="text-center text-slate-500 text-sm font-bold uppercase tracking-widest py-8">
                  Sin resultados
                </p>
              )}
            </div>
          )}
        </div>

        {actionError && (
          <div className="mx-4 mb-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2.5 text-sm text-red-100 shrink-0">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-red-100/90">{actionError}</p>
          </div>
        )}

        <div className="p-4 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold uppercase tracking-widest text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
