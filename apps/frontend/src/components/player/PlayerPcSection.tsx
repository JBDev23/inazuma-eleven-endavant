"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  TrendingUp,
  X,
  type LucideIcon,
  Target,
  Sparkles,
  Zap,
  Heart,
  CircleDot,
  Shield,
  Wind,
  Battery,
  Flame,
} from "lucide-react";
import {
  PC_COST_PER_STAT,
  PC_STAT_BONUS_MAX,
  PC_STAT_BONUS_MAX_GP_TP,
  buildSpendPcPreview,
  getStatsAtLevel,
  applyStatBonuses,
  hasStatBonuses,
  canIncreaseAnyStatBonus,
  canIncreaseStatBonus,
  getMaxPcBonusForStat,
  type StatKey,
  type PlayerStats,
} from "@inazuma/shared";
import { api, getApiErrorMessage } from "@/services/api";
import { ResourceCostBadge } from "@/components/economy/ResourceCostBadge";

const STAT_OPTIONS: Array<{ key: StatKey; label: string; icon: LucideIcon }> = [
  { key: "gp", label: "GP", icon: Target },
  { key: "tp", label: "TP", icon: Sparkles },
  { key: "kick", label: "Tiro", icon: Zap },
  { key: "body", label: "Físico", icon: Heart },
  { key: "control", label: "Control", icon: CircleDot },
  { key: "guard", label: "Defensa", icon: Shield },
  { key: "speed", label: "Velocidad", icon: Wind },
  { key: "stamina", label: "Resistencia", icon: Battery },
  { key: "guts", label: "Determinación", icon: Flame },
];

interface PlayerPcSectionProps {
  player: {
    id: number;
    name: string;
    level: number;
    baseStats: PlayerStats;
    maxStats: PlayerStats;
    statBonuses?: Partial<Record<StatKey, number>>;
  };
  availablePc: number;
  clubId: string;
  enablePcSpend?: boolean;
  onSpendComplete?: (updated: {
    statBonuses: Partial<Record<StatKey, number>>;
    marketPrice: number;
  }) => void;
}

export function PlayerPcSection({
  player,
  availablePc,
  clubId,
  enablePcSpend = false,
  onSpendComplete,
}: PlayerPcSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<StatKey | null>(null);
  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [liveBonuses, setLiveBonuses] = useState(player.statBonuses ?? {});

  const canSpend =
    enablePcSpend &&
    availablePc >= PC_COST_PER_STAT &&
    canIncreaseAnyStatBonus(liveBonuses);

  useEffect(() => {
    setLiveBonuses(player.statBonuses ?? {});
  }, [player.id, player.statBonuses]);

  useEffect(() => {
    setIsOpen(false);
    setStep("idle");
    setSelectedStat(null);
  }, [player.id]);

  const levelStats = getStatsAtLevel(player.baseStats, player.maxStats, player.level);
  const statsWithBonuses = applyStatBonuses(levelStats, liveBonuses);
  const hasBonuses = hasStatBonuses(liveBonuses);

  const preview = useMemo(() => {
    if (!isOpen || !canSpend || !selectedStat) return null;
    return buildSpendPcPreview(
      player.id,
      selectedStat,
      [{ id: player.id, name: player.name }],
      availablePc,
      liveBonuses,
      PC_COST_PER_STAT,
    );
  }, [isOpen, canSpend, selectedStat, player, availablePc, liveBonuses]);

  const hasBlockingWarning = (preview?.warnings.length ?? 0) > 0;

  const closePanel = () => {
    if (isProcessing) return;
    setIsOpen(false);
    setStep("idle");
    setSelectedStat(null);
  };

  const handleSpend = async () => {
    if (!selectedStat) return;
    try {
      setIsProcessing(true);
      setActionError(null);
      const result = await api.market.spendPc(clubId, player.id, selectedStat);
      setLiveBonuses(result.statBonuses);
      onSpendComplete?.({
        statBonuses: result.statBonuses,
        marketPrice: result.marketPrice,
      });
      setStep("idle");
      setSelectedStat(null);
      setIsOpen(false);
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, "Error al gastar PC."));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mb-6 space-y-3">
      {hasBonuses && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-1.5">
            <TrendingUp size={12} />
            Mejoras permanentes (PC)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {STAT_OPTIONS.filter(({ key }) => (liveBonuses[key] ?? 0) > 0).map(({ key, label }) => (
              <span
                key={key}
                className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/50"
              >
                {label} +{liveBonuses[key]}
              </span>
            ))}
          </div>
        </div>
      )}

      {actionError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="font-black uppercase tracking-wide text-red-300">Accion no completada</p>
            <p className="mt-1">{actionError}</p>
          </div>
        </div>
      )}

      {canSpend && !isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-amber-500/30 bg-amber-950/10 text-amber-300 hover:bg-amber-950/30 hover:border-amber-500/50 font-black uppercase text-[11px] tracking-wider transition-colors"
        >
          <TrendingUp size={14} />
          Mejorar stat con PC
          <ResourceCostBadge amount={availablePc} resource="pc" size="sm" />
          <ChevronDown size={14} className="text-amber-500" />
        </button>
      )}

      {canSpend && isOpen && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <TrendingUp size={16} className="text-amber-400 shrink-0" />
              <span className="text-xs font-black uppercase text-amber-300 tracking-wider">
                Gastar PC
              </span>
              <ResourceCostBadge amount={availablePc} resource="pc" size="sm" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-slate-500">
                +1 stat / {PC_COST_PER_STAT} PC
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

          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Elige la stat a mejorar (máx. +{PC_STAT_BONUS_MAX}, GP/TP +{PC_STAT_BONUS_MAX_GP_TP})
          </p>

          <div className="grid grid-cols-3 gap-1.5">
            {STAT_OPTIONS.map(({ key, label, icon: Icon }) => {
              const isSelected = selectedStat === key;
              const currentValue = statsWithBonuses[key];
              const bonus = liveBonuses[key] ?? 0;
              const maxBonus = getMaxPcBonusForStat(key);
              const atMax = !canIncreaseStatBonus(liveBonuses, key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (atMax) return;
                    setSelectedStat(key);
                    setStep("idle");
                  }}
                  disabled={isProcessing || step === "confirm" || atMax}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all disabled:opacity-50 ${
                    atMax
                      ? "border-slate-800 bg-slate-950/60 text-slate-600 cursor-not-allowed"
                      : isSelected
                        ? "border-amber-500 bg-amber-950/40 text-amber-200 ring-1 ring-amber-500/30"
                        : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-amber-700/50 hover:text-amber-300"
                  }`}
                >
                  <Icon size={14} className={isSelected ? "text-amber-400" : "text-slate-500"} />
                  <span className="text-[9px] font-black uppercase leading-tight">{label}</span>
                  <span className="text-xs font-black tabular-nums text-white">{currentValue}</span>
                  {atMax ? (
                    <span className="text-[8px] font-black uppercase text-slate-500">
                      MAX +{maxBonus}
                    </span>
                  ) : bonus > 0 ? (
                    <span className="text-[8px] font-bold text-amber-500">
                      +{bonus}/{maxBonus} PC
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {preview && selectedStat && (
            <div className="text-center py-2 border border-slate-700/50 rounded-lg bg-slate-900/40">
              <p className="text-xs font-bold text-slate-400">
                {STAT_OPTIONS.find((s) => s.key === selectedStat)?.label}:{" "}
                <span className="text-white tabular-nums">{statsWithBonuses[selectedStat]}</span>
                {" → "}
                <span className="text-amber-300 tabular-nums">
                  {statsWithBonuses[selectedStat] + 1}
                </span>
              </p>
            </div>
          )}

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
              disabled={isProcessing || hasBlockingWarning || !selectedStat}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black uppercase text-sm p-3 rounded-xl transition-all"
            >
              <TrendingUp size={16} />
              Mejorar +1 ({PC_COST_PER_STAT} PC)
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-center text-slate-400 font-bold">
                ¿Confirmar mejora permanente de{" "}
                {STAT_OPTIONS.find((s) => s.key === selectedStat)?.label} en {player.name}?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("idle")}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-400 font-black uppercase text-xs hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSpend}
                  disabled={isProcessing || hasBlockingWarning}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    "Aplicando..."
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
