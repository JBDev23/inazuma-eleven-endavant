"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Minus, Plus, Sparkles, X } from "lucide-react";
import {
  buildPeRedemptionPreview,
  getXpRequiredForLevel,
  MAX_PLAYER_LEVEL,
  PE_XP_PER_POINT,
} from "@inazuma/shared";
import { api, getApiErrorMessage } from "@/services/api";
import { ResourceCostBadge } from "@/components/economy/ResourceCostBadge";

interface PlayerLevelPeSectionProps {
  player: { id: number; name: string; level: number; experience: number };
  availablePe: number;
  clubId: string;
  enablePeRedeem?: boolean;
  onRedeemComplete?: (updated: { level: number; experience: number }) => void;
}

export function PlayerLevelBar({
  level,
  experience,
}: {
  level: number;
  experience: number;
}) {
  return <LevelBar level={level} experience={experience} />;
}

function LevelBar({
  level,
  experience,
  previewLevel,
  previewExperience,
  showPreview,
}: {
  level: number;
  experience: number;
  previewLevel?: number;
  previewExperience?: number;
  showPreview?: boolean;
}) {
  const isMaxLevel = level >= MAX_PLAYER_LEVEL;
  const xpRequired = getXpRequiredForLevel(level);
  const pct = isMaxLevel ? 100 : Math.min(100, Math.round((experience / xpRequired) * 100));

  const previewIsMax = (previewLevel ?? level) >= MAX_PLAYER_LEVEL;
  const previewXpRequired = getXpRequiredForLevel(previewLevel ?? level);
  const previewPct = previewIsMax
    ? 100
    : Math.min(100, Math.round(((previewExperience ?? experience) / previewXpRequired) * 100));

  const displayLevel = showPreview && previewLevel != null ? previewLevel : level;
  const displayXp = showPreview && previewExperience != null ? previewExperience : experience;
  const displayXpRequired = showPreview ? previewXpRequired : xpRequired;
  const displayIsMax = showPreview ? previewIsMax : isMaxLevel;
  const levelsGained = showPreview && previewLevel != null ? previewLevel - level : 0;
  const leveledUpInPreview = levelsGained > 0;
  const showLevelTransition = showPreview && leveledUpInPreview;

  return (
    <div className="w-full flex items-center gap-4 bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50 shadow-inner">
      <div
        className={`relative flex items-center justify-center h-14 rounded-lg border-2 shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.5)]
          ${showLevelTransition ? "min-w-[4.5rem] w-auto px-2 overflow-visible" : "w-14 overflow-hidden"}
          ${displayIsMax ? "bg-yellow-950/50 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]" : showLevelTransition ? "bg-violet-950/50 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.4)]" : "bg-emerald-950/50 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"}`}
      >
        <div
          className={`absolute inset-0 bg-linear-to-br opacity-30 ${displayIsMax ? "from-yellow-500" : showPreview && levelsGained > 0 ? "from-violet-500" : "from-emerald-500"} to-transparent`}
        />
        <div className="flex flex-col items-center leading-none relative z-10">
          <span
            className={`text-[9px] font-black uppercase tracking-widest ${displayIsMax ? "text-yellow-500" : showPreview && levelsGained > 0 ? "text-violet-400" : "text-emerald-500"}`}
          >
            {displayIsMax ? "Max" : "Lvl"}
          </span>
          <span className="text-xl font-black text-white drop-shadow-md tabular-nums">
            {showLevelTransition ? (
              <span className="flex items-center gap-0.5 text-sm whitespace-nowrap">
                <span className="text-slate-500">{level}</span>
                <span className="text-violet-400 text-xs">→</span>
                <span className="text-violet-200">{displayLevel}</span>
              </span>
            ) : (
              displayLevel
            )}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1.5 justify-center min-w-0">
        <div className="flex justify-between items-end gap-2">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider shrink-0">
            Experiencia
          </span>
          <span className="text-[10px] font-black text-slate-500 tabular-nums uppercase text-right">
            {displayIsMax ? (
              <span className="text-yellow-500">Nivel Máximo</span>
            ) : (
              <>
                <span className={showPreview && levelsGained > 0 ? "text-violet-300" : "text-white"}>
                  {displayXp}
                </span>
                {" / "}
                {displayXpRequired} XP
                {showPreview && levelsGained > 0 && (
                  <span className="text-emerald-400 ml-1.5">+{levelsGained}</span>
                )}
              </>
            )}
          </span>
        </div>

        <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative shadow-inner">
          {!displayIsMax && !leveledUpInPreview && (
            <div
              className="absolute top-0 bottom-0 left-0 bg-linear-to-r from-emerald-700 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          )}
          {showPreview && !previewIsMax && (leveledUpInPreview || previewPct > pct) && (
            <div
              className="absolute top-0 bottom-0 left-0 bg-linear-to-r from-violet-600 to-violet-400 transition-all duration-500 ease-out"
              style={{ width: `${previewPct}%` }}
            />
          )}
          {displayIsMax && (
            <div className="absolute inset-0 bg-linear-to-r from-yellow-600 to-yellow-400 w-full" />
          )}
          <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

export function PlayerLevelPeSection({
  player,
  availablePe,
  clubId,
  enablePeRedeem = false,
  onRedeemComplete,
}: PlayerLevelPeSectionProps) {
  const isMaxLevel = player.level >= MAX_PLAYER_LEVEL;
  const canRedeem = enablePeRedeem && availablePe > 0 && !isMaxLevel;

  const [peCount, setPeCount] = useState(1);
  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
    setStep("idle");
    setPeCount(1);
  }, [player.id]);

  const closePanel = () => {
    if (isProcessing) return;
    setIsOpen(false);
    setStep("idle");
    setPeCount(1);
  };

  const preview = useMemo(() => {
    if (!isOpen || !canRedeem || peCount <= 0) return null;
    return buildPeRedemptionPreview(
      Array.from({ length: peCount }, () => ({ playerId: player.id })),
      [player],
      availablePe,
      PE_XP_PER_POINT,
    );
  }, [isOpen, canRedeem, peCount, player, availablePe]);

  const playerPreview = preview?.players[0];
  const hasBlockingWarning = preview?.warnings.some(
    (w) => w.includes("No tienes suficientes PE") || w.includes("no pertenece"),
  );

  const adjustPe = (delta: number) => {
    setPeCount((prev) => Math.max(1, Math.min(availablePe, prev + delta)));
    setStep("idle");
  };

  const handleRedeem = async () => {
    try {
      setIsProcessing(true);
      setActionError(null);
      const allocations = Array.from({ length: peCount }, () => ({ playerId: player.id }));
      await api.market.redeemPe(clubId, allocations);
      onRedeemComplete?.({
        level: playerPreview?.newLevel ?? player.level,
        experience: playerPreview?.newXp ?? player.experience,
      });
      setStep("idle");
      setPeCount(1);
      setIsOpen(false);
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, "Error al canjear PE."));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mb-6 space-y-3">
      {actionError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="font-black uppercase tracking-wide text-red-300">Accion no completada</p>
            <p className="mt-1">{actionError}</p>
          </div>
        </div>
      )}
      <LevelBar
        level={player.level}
        experience={player.experience}
        previewLevel={playerPreview?.newLevel}
        previewExperience={playerPreview?.newXp}
        showPreview={isOpen && canRedeem && peCount > 0}
      />

      {canRedeem && !isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-violet-500/30 bg-violet-950/10 text-violet-300 hover:bg-violet-950/30 hover:border-violet-500/50 font-black uppercase text-[11px] tracking-wider transition-colors"
        >
          <Sparkles size={14} />
          Subir nivel con PE
          <ResourceCostBadge amount={availablePe} resource="pe" size="sm" />
          <ChevronDown size={14} className="text-violet-500" />
        </button>
      )}

      {canRedeem && isOpen && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={16} className="text-violet-400 shrink-0" />
              <span className="text-xs font-black uppercase text-violet-300 tracking-wider">
                Canjear PE
              </span>
              <ResourceCostBadge amount={availablePe} resource="pe" size="sm" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-slate-500">
                {PE_XP_PER_POINT} XP / PE
              </span>
              <button
                type="button"
                onClick={closePanel}
                disabled={isProcessing}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-40"
                title="Cerrar"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustPe(-1)}
                disabled={peCount <= 1 || isProcessing || step === "confirm"}
                className="w-9 h-9 rounded-lg border border-slate-600 bg-slate-900 text-slate-300 hover:border-violet-500 hover:text-violet-300 disabled:opacity-40 transition-colors flex items-center justify-center"
              >
                <Minus size={16} />
              </button>
              <div className="text-center min-w-[4rem]">
                <p className="text-2xl font-black text-white tabular-nums">{peCount}</p>
                <p className="text-[9px] font-black uppercase text-slate-500">PE</p>
              </div>
              <button
                type="button"
                onClick={() => adjustPe(1)}
                disabled={peCount >= availablePe || isProcessing || step === "confirm"}
                className="w-9 h-9 rounded-lg border border-slate-600 bg-slate-900 text-slate-300 hover:border-violet-500 hover:text-violet-300 disabled:opacity-40 transition-colors flex items-center justify-center"
              >
                <Plus size={16} />
              </button>
            </div>

            {playerPreview && (
              <div className="text-right">
                <p className="text-sm font-black text-violet-300 tabular-nums">
                  +{playerPreview.xpGained} XP
                </p>
                {playerPreview.levelsGained > 0 && (
                  <p className="text-[10px] font-black uppercase text-emerald-400">
                    Sube {playerPreview.levelsGained} nivel
                    {playerPreview.levelsGained > 1 ? "es" : ""}
                  </p>
                )}
              </div>
            )}
          </div>

          {preview?.warnings.map((warning) => (
            <div
              key={warning}
              className="flex items-start gap-2 text-xs text-amber-300 bg-amber-950/30 border border-amber-500/30 rounded-lg px-3 py-2"
            >
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          ))}

          {step === "idle" ? (
            <button
              type="button"
              onClick={() => setStep("confirm")}
              disabled={isProcessing || hasBlockingWarning || !playerPreview}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-black uppercase text-sm p-3 rounded-xl transition-all"
            >
              <Sparkles size={16} />
              Canjear {peCount} PE
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-center text-slate-400 font-bold">
                ¿Confirmar canje de {peCount} PE (+{playerPreview?.xpGained ?? 0} XP)?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => (step === "confirm" ? setStep("idle") : closePanel())}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-400 font-black uppercase text-xs hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRedeem}
                  disabled={isProcessing || hasBlockingWarning}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    "Canjeando..."
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
