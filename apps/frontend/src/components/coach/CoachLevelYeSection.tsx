"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Minus, Plus, Sparkles, X } from "lucide-react";
import {
  buildYeRedemptionPreview,
  getXpRequiredForLevel,
  MAX_COACH_LEVEL,
  YE_XP_PER_POINT,
} from "@inazuma/shared";
import { api, getApiErrorMessage } from "@/services/api";
import { ResourceCostBadge } from "@/components/economy/ResourceCostBadge";

interface CoachLevelYeSectionProps {
  coach: { id: number; name: string; level: number; experience: number };
  availableYe: number;
  clubId: string;
  enableYeRedeem?: boolean;
  xpPerYe?: number;
  onRedeemComplete?: (updated: { level: number; experience: number }) => void;
}

export function CoachLevelBar({
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
  const isMaxLevel = level >= MAX_COACH_LEVEL;
  const xpRequired = getXpRequiredForLevel(level, MAX_COACH_LEVEL);
  const pct = isMaxLevel ? 100 : Math.min(100, Math.round((experience / xpRequired) * 100));

  const previewIsMax = (previewLevel ?? level) >= MAX_COACH_LEVEL;
  const previewXpRequired = getXpRequiredForLevel(previewLevel ?? level, MAX_COACH_LEVEL);
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
          ${displayIsMax ? "bg-yellow-950/50 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]" : showLevelTransition ? "bg-emerald-950/50 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-purple-950/50 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]"}`}
      >
        <div
          className={`absolute inset-0 bg-linear-to-br opacity-30 ${displayIsMax ? "from-yellow-500" : showPreview && levelsGained > 0 ? "from-emerald-500" : "from-purple-500"} to-transparent`}
        />
        <div className="flex flex-col items-center leading-none relative z-10">
          <span
            className={`text-[9px] font-black uppercase tracking-widest ${displayIsMax ? "text-yellow-500" : showPreview && levelsGained > 0 ? "text-emerald-400" : "text-purple-400"}`}
          >
            {displayIsMax ? "Max" : "Lvl"}
          </span>
          <span className="text-xl font-black text-white drop-shadow-md tabular-nums">
            {showLevelTransition ? (
              <span className="flex items-center gap-0.5 text-sm whitespace-nowrap">
                <span className="text-slate-500">{level}</span>
                <span className="text-emerald-400 text-xs">→</span>
                <span className="text-emerald-200">{displayLevel}</span>
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
                <span className={showPreview && levelsGained > 0 ? "text-emerald-300" : "text-white"}>
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
              className="absolute top-0 bottom-0 left-0 bg-linear-to-r from-purple-700 to-purple-400 transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          )}
          {showPreview && !previewIsMax && (leveledUpInPreview || previewPct > pct) && (
            <div
              className="absolute top-0 bottom-0 left-0 bg-linear-to-r from-emerald-600 to-emerald-400 transition-all duration-500 ease-out"
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

export function CoachLevelYeSection({
  coach,
  availableYe,
  clubId,
  enableYeRedeem = false,
  xpPerYe = YE_XP_PER_POINT,
  onRedeemComplete,
}: CoachLevelYeSectionProps) {
  const isMaxLevel = coach.level >= MAX_COACH_LEVEL;
  const canRedeem = enableYeRedeem && availableYe > 0 && !isMaxLevel;

  const [yeCount, setYeCount] = useState(1);
  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
    setStep("idle");
    setYeCount(1);
  }, [coach.id]);

  const closePanel = () => {
    if (isProcessing) return;
    setIsOpen(false);
    setStep("idle");
    setYeCount(1);
  };

  const preview = useMemo(() => {
    if (!isOpen || !canRedeem || yeCount <= 0) return null;
    return buildYeRedemptionPreview(
      Array.from({ length: yeCount }, () => ({ coachId: coach.id })),
      [coach],
      availableYe,
      xpPerYe,
    );
  }, [isOpen, canRedeem, yeCount, coach, availableYe, xpPerYe]);

  const coachPreview = preview?.coaches[0];
  const hasBlockingWarning = preview?.warnings.some(
    (w) => w.includes("No tienes suficientes YE") || w.includes("no pertenece"),
  );

  const setAmount = (value: number) => {
    setYeCount(Math.max(1, Math.min(availableYe, value)));
    setStep("idle");
  };

  const adjustYe = (delta: number) => {
    setAmount(yeCount + delta);
  };

  const handleRedeem = async () => {
    try {
      setIsProcessing(true);
      setActionError(null);
      const allocations = Array.from({ length: yeCount }, () => ({ coachId: coach.id }));
      await api.market.redeemYe(clubId, allocations);
      onRedeemComplete?.({
        level: coachPreview?.newLevel ?? coach.level,
        experience: coachPreview?.newXp ?? coach.experience,
      });
      setStep("idle");
      setYeCount(1);
      setIsOpen(false);
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, "Error al canjear YE."));
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
        level={coach.level}
        experience={coach.experience}
        previewLevel={coachPreview?.newLevel}
        previewExperience={coachPreview?.newXp}
        showPreview={isOpen && canRedeem && yeCount > 0}
      />

      {canRedeem && !isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-emerald-500/30 bg-emerald-950/10 text-emerald-300 hover:bg-emerald-950/30 hover:border-emerald-500/50 font-black uppercase text-[11px] tracking-wider transition-colors"
        >
          <Sparkles size={14} />
          Subir nivel con YE
          <ResourceCostBadge amount={availableYe} resource="yens" size="sm" />
          <ChevronDown size={14} className="text-emerald-500" />
        </button>
      )}

      {canRedeem && isOpen && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={16} className="text-emerald-400 shrink-0" />
              <span className="text-xs font-black uppercase text-emerald-300 tracking-wider">
                Canjear YE
              </span>
              <ResourceCostBadge amount={availableYe} resource="yens" size="sm" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-slate-500">
                {xpPerYe} XP / YE
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

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustYe(-1)}
                  disabled={yeCount <= 1 || isProcessing || step === "confirm"}
                  className="w-9 h-9 rounded-lg border border-slate-600 bg-slate-900 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 disabled:opacity-40 transition-colors flex items-center justify-center"
                >
                  <Minus size={16} />
                </button>
                <div className="text-center min-w-[4rem]">
                  <p className="text-2xl font-black text-white tabular-nums">{yeCount}</p>
                  <p className="text-[9px] font-black uppercase text-slate-500">YE</p>
                </div>
                <button
                  type="button"
                  onClick={() => adjustYe(1)}
                  disabled={yeCount >= availableYe || isProcessing || step === "confirm"}
                  className="w-9 h-9 rounded-lg border border-slate-600 bg-slate-900 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 disabled:opacity-40 transition-colors flex items-center justify-center"
                >
                  <Plus size={16} />
                </button>
              </div>

              {coachPreview && (
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-300 tabular-nums">
                    +{coachPreview.xpGained} XP
                  </p>
                  {coachPreview.levelsGained > 0 && (
                    <p className="text-[10px] font-black uppercase text-emerald-400">
                      Sube {coachPreview.levelsGained} nivel
                      {coachPreview.levelsGained > 1 ? "es" : ""}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => adjustYe(n)}
                  disabled={yeCount >= availableYe || isProcessing || step === "confirm"}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900/60 text-slate-400 hover:border-emerald-700/50 hover:text-emerald-300 text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                >
                  +{n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(availableYe)}
                disabled={isProcessing || step === "confirm" || yeCount >= availableYe}
                className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900/60 text-slate-400 hover:border-emerald-700/50 hover:text-emerald-300 text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
              >
                Máx
              </button>
            </div>
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
              disabled={isProcessing || hasBlockingWarning || !coachPreview}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black uppercase text-sm p-3 rounded-xl transition-all"
            >
              <Sparkles size={16} />
              Canjear {yeCount} YE
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-center text-slate-400 font-bold">
                ¿Confirmar canje de {yeCount} YE (+{coachPreview?.xpGained ?? 0} XP)?
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
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-xs transition-colors disabled:opacity-50"
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
