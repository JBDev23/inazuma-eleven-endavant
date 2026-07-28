"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, UserCircle2, Presentation, Loader2 } from "lucide-react";
import type { ClubResources, Coach, Formation } from "@inazuma/shared";
import { canAffordResource, getDisplayModifiers, STAT_KEYS, YE_XP_PER_POINT } from "@inazuma/shared";
import { ResourceCostBadge } from "@/components/economy/ResourceCostBadge";
import { FormationPreviewCard } from "@/components/tactics/FormationPreviewCard";
import { CoachLevelYeSection } from "@/components/coach/CoachLevelYeSection";
import { api } from "@/services/api";

type CoachWithFormations = Coach & { formations?: Formation[] };

interface CoachMarketModalProps {
  coach: Coach;
  onClose: () => void;
  onBuy?: (coachId: number) => void;
  onSell?: (coachId: number) => void;
  isLoading?: boolean;
  resources?: ClubResources;
  readOnly?: boolean;
  isActiveCoach?: boolean;
  canSell?: boolean;
  clubId?: string;
  onYeRedeemComplete?: (updated: { level: number; experience: number }) => void | Promise<void>;
  /** Vista de solo lectura en el panel admin (sin compra/venta) */
  status?: "market" | "owned" | "admin";
  teamName?: string;
  ownerLabel?: string;
}

const STAT_LABELS: Record<string, string> = {
  gp: "GP",
  tp: "TP",
  kick: "Tiro",
  body: "Cuerpo",
  control: "Control",
  guard: "Defensa",
  speed: "Velocidad",
  stamina: "Resistencia",
  guts: "Espíritu",
};

export default function CoachMarketModal({
  coach,
  onClose,
  onBuy,
  onSell,
  isLoading = false,
  resources,
  readOnly = false,
  isActiveCoach = false,
  canSell = true,
  clubId,
  onYeRedeemComplete,
  status,
  teamName,
  ownerLabel,
}: CoachMarketModalProps) {
  const isAdmin = status === "admin";
  const isOwnedView = readOnly && !isAdmin;
  const displayName = coach.nickname ? `${coach.nickname} (${coach.name})` : coach.name;
  const [liveLevel, setLiveLevel] = useState(coach.level);
  const [liveExperience, setLiveExperience] = useState(coach.experience);
  const [xpPerYe, setXpPerYe] = useState(YE_XP_PER_POINT);

  useEffect(() => {
    setLiveLevel(coach.level);
    setLiveExperience(coach.experience);
  }, [coach.id, coach.level, coach.experience]);

  useEffect(() => {
    if (!isOwnedView || !clubId || !resources) return;

    let cancelled = false;

    void api.gameSettings
      .get()
      .then((settings) => {
        if (cancelled) return;
        const sessionConfig = settings.sessionConfigs.find(
          (config) => config.session === settings.currentSession,
        );
        setXpPerYe(sessionConfig?.coachXpPerYe ?? YE_XP_PER_POINT);
      })
      .catch(() => {
        if (!cancelled) {
          setXpPerYe(YE_XP_PER_POINT);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clubId, isOwnedView, resources]);

  const liveCoach = useMemo(
    () => ({ ...coach, level: liveLevel, experience: liveExperience }),
    [coach, liveLevel, liveExperience],
  );
  const modifiers = getDisplayModifiers(liveCoach);
  const canAfford = resources ? canAffordResource(resources, coach.price, "pp") : false;
  const sellPrice = Math.floor(coach.price / 2);

  const formations = (coach as CoachWithFormations).formations ?? [];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`bg-slate-900 border-2 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
          isAdmin ? "border-white/30" : "border-purple-500/40"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`relative p-6 flex flex-col items-center shrink-0 ${
          isAdmin ? "bg-linear-to-b from-slate-800/80 to-slate-900" : "bg-linear-to-b from-purple-950/50 to-slate-900"
        }`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="w-28 h-28 rounded-2xl bg-slate-950 border border-purple-500/30 flex items-center justify-center mb-4 overflow-hidden">
            {coach.spriteUrl ? (
              <img src={coach.spriteUrl} alt={displayName} className="w-full h-full object-contain" />
            ) : (
              <UserCircle2 size={56} className="text-purple-400" />
            )}
          </div>

          <h2 className="text-xl font-black text-white uppercase tracking-wider text-center">{displayName}</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Nv. {liveLevel} · Temporada {coach.season}
          </p>
        </div>

        <div className="p-6 border-t border-slate-800 overflow-y-auto flex-1 scrollbar-hide">
          {isAdmin && (
            <div className="mb-6 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Datos admin</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 font-bold">ID</span>
                  <p className="text-white font-mono">{coach.id}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">Precio</span>
                  <p className="text-yellow-400 font-black">{coach.price} PP</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">Equipo (lore)</span>
                  <p className="text-slate-200 font-bold">{teamName ?? "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">Estado</span>
                  <p className="text-slate-200 font-bold">{ownerLabel ?? "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">XP</span>
                  <p className="text-white font-mono">{liveExperience}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">Agente libre</span>
                  <p className="text-white font-bold">{coach.isFreeAgent ? "Sí" : "No"}</p>
                </div>
              </div>
            </div>
          )}

          {isOwnedView && clubId && resources && (
            <CoachLevelYeSection
              coach={{
                id: coach.id,
                name: coach.name,
                level: liveLevel,
                experience: liveExperience,
              }}
              availableYe={resources.yens}
              clubId={clubId}
              enableYeRedeem
              xpPerYe={xpPerYe}
              onRedeemComplete={async (updated) => {
                setLiveLevel(updated.level);
                setLiveExperience(updated.experience);
                await onYeRedeemComplete?.(updated);
              }}
            />
          )}

          {/* SECCIÓN MODIFICADORES */}
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
              Bonificaciones tácticas
            </p>
            <div className="grid grid-cols-3 gap-2">
              {STAT_KEYS.map((key) => {
                const value = modifiers[key];
                const isBoost = value > 1;
                const isNerf = value < 1;
                return (
                  <div
                    key={key}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-center"
                  >
                    <p className="text-[9px] font-black uppercase text-slate-500">{STAT_LABELS[key]}</p>
                    <p
                      className={`text-sm font-black tabular-nums ${
                        isBoost ? "text-emerald-400" : isNerf ? "text-red-400" : "text-slate-300"
                      }`}
                    >
                      ×{value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN FORMACIONES QUE DESBLOQUEA */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Presentation size={14} className="text-purple-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Tácticas que desbloquea
              </p>
            </div>
            
            {formations.length > 0 ? (
              <div className="flex flex-col gap-2">
                {formations.map((formation) => (
                  <FormationPreviewCard key={formation.id} formation={formation} />
                ))}
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500 italic">No incluye formaciones exclusivas.</p>
              </div>
            )}
          </div>

          {/* BOTONES DE ACCIÓN */}
          {isAdmin ? null : isOwnedView ? (
            <div className="flex flex-col items-center gap-3">
              {isActiveCoach && (
                <span className="text-xs font-black uppercase px-4 py-2 rounded-xl border bg-purple-500/10 text-purple-300 border-purple-500/40 w-full text-center">
                  Entrenador activo
                </span>
              )}
              <div className="w-full p-4 rounded-xl font-black uppercase text-center text-sm border-2 border-purple-500/40 text-purple-300 bg-purple-500/10">
                ✓ Entrenador en propiedad
              </div>
              {canSell ? (
                <button
                  type="button"
                  disabled={isLoading || !onSell}
                  onClick={() => onSell?.(coach.id)}
                  className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-white text-sm font-black uppercase p-4 rounded-xl transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(30,41,59,0.5)] disabled:opacity-50 disabled:cursor-wait"
                >
                  <span className="inline-flex items-center gap-2">
                    {isLoading && <Loader2 size={16} className="animate-spin" />}
                    {isLoading ? "Procesando..." : "Liberar por"}
                  </span>
                  <ResourceCostBadge
                    amount={sellPrice}
                    resource="pp"
                    size="md"
                    className="bg-white/10! text-white! border-white/20!"
                  />
                </button>
              ) : (
                <p className="text-[10px] text-amber-400/90 font-bold uppercase tracking-widest text-center px-2">
                  Es tu único entrenador. Ficha otro antes de liberarlo.
                </p>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={!canAfford || isLoading || !onBuy}
              onClick={() => onBuy?.(coach.id)}
              className={`w-full flex flex-col items-center justify-center gap-2 text-sm font-black uppercase p-4 rounded-xl transition-all
                ${canAfford && !isLoading
                  ? "bg-purple-600 hover:bg-purple-500 text-white hover:scale-[1.02]"
                  : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                }`}
            >
              <span className="inline-flex items-center gap-2">
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? "Procesando..." : "Fichar entrenador"}
              </span>
              <ResourceCostBadge
                amount={coach.price}
                resource="pp"
                size="md"
                className={canAfford ? "bg-white/20! text-white! border-white/20!" : ""}
              />
              {resources && !canAfford && (
                <span className="text-[10px] normal-case tracking-normal font-bold text-slate-500">
                  Te faltan {coach.price - resources.pp} PP
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}