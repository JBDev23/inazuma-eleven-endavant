"use client";

import { useState } from "react";
import type { PlayerMoveWithProgress } from "@inazuma/shared";
import { getMoveTpCost } from "@/lib/duel-actions";
import {
  Activity,
  CircleDashed,
  Flame,
  Hand,
  Leaf,
  Minus,
  Mountain,
  Shield,
  Sparkles,
  Star,
  Target,
  Wind,
  Zap,
} from "lucide-react";

function getMoveElementStyle(element: string) {
  switch (element?.toLowerCase()) {
    case "fuego":
    case "fire":
      return {
        card: "border-red-500/40 bg-linear-to-br from-red-950/60 to-slate-950/80 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.15)]",
        glow: "shadow-[0_0_25px_rgba(239,68,68,0.35)]",
        icon: "text-red-400 bg-red-950/60 border-red-500/30",
      };
    case "bosque":
    case "wood":
      return {
        card: "border-emerald-500/40 bg-linear-to-br from-emerald-950/60 to-slate-950/80 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
        glow: "shadow-[0_0_25px_rgba(16,185,129,0.35)]",
        icon: "text-emerald-400 bg-emerald-950/60 border-emerald-500/30",
      };
    case "aire":
    case "wind":
      return {
        card: "border-sky-500/40 bg-linear-to-br from-sky-950/60 to-slate-950/80 text-sky-300 shadow-[0_0_20px_rgba(14,165,233,0.15)]",
        glow: "shadow-[0_0_25px_rgba(14,165,233,0.35)]",
        icon: "text-sky-400 bg-sky-950/60 border-sky-500/30",
      };
    case "montaña":
    case "earth":
      return {
        card: "border-amber-500/40 bg-linear-to-br from-amber-950/60 to-slate-950/80 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]",
        glow: "shadow-[0_0_25px_rgba(245,158,11,0.35)]",
        icon: "text-amber-400 bg-amber-950/60 border-amber-500/30",
      };
    default:
      return {
        card: "border-slate-600/40 bg-linear-to-br from-slate-900/80 to-slate-950/80 text-slate-300",
        glow: "shadow-[0_0_25px_rgba(148,163,184,0.2)]",
        icon: "text-slate-400 bg-slate-900/60 border-slate-600/30",
      };
  }
}

function MoveElementIcon({ element, size = 16 }: { element: string; size?: number }) {
  switch (element?.toLowerCase()) {
    case "fuego":
    case "fire":
      return <Flame size={size} />;
    case "bosque":
    case "wood":
      return <Leaf size={size} />;
    case "aire":
    case "wind":
      return <Wind size={size} />;
    case "montaña":
    case "earth":
      return <Mountain size={size} />;
    default:
      return <CircleDashed size={size} />;
  }
}

function MoveTypeIcon({ type, size = 12, className = "" }: { type: string; size?: number; className?: string }) {
  switch (type?.toUpperCase()) {
    case "SHOOT":
      return <Target size={size} className={className} />;
    case "DRIBBLE":
      return <Activity size={size} className={className} />;
    case "BLOCK":
      return <Shield size={size} className={className} />;
    case "CATCH":
      return <Hand size={size} className={className} />;
    case "SKILL":
      return <Sparkles size={size} className={className} />;
    default:
      return <Shield size={size} className={className} />;
  }
}

const MOVE_TYPE_LABELS: Record<string, string> = {
  SHOOT: "Tiro",
  DRIBBLE: "Regate",
  BLOCK: "Defensa",
  CATCH: "Parada",
  SKILL: "Habilidad",
};

function getEvolutionBadge(path: string, level: number) {
  if (level <= 1 || path === "NONE") return null;

  if (path === "SHIN") {
    if (level === 2) return { text: "Kai", style: "text-emerald-300 bg-emerald-950/50 border-emerald-500/30" };
    if (level >= 3) return { text: "Shin", style: "text-fuchsia-300 bg-fuchsia-950/50 border-fuchsia-500/30 shadow-[0_0_10px_rgba(217,70,239,0.25)]" };
  }

  if (path === "L_G") {
    if (level >= 5) return { text: `G${level}`, style: "text-amber-300 bg-amber-950/50 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.25)]" };
    return { text: `G${level}`, style: "text-sky-300 bg-sky-950/50 border-sky-500/30" };
  }

  return { text: `Nv.${level}`, style: "text-slate-300 bg-slate-800/80 border-slate-600/30" };
}

function TpPreviewBar({
  currentTp,
  maxTp,
  previewCost,
  previewMoveName,
}: {
  currentTp: number;
  maxTp: number;
  previewCost: number | null;
  previewMoveName: string | null;
}) {
  const afterTp = previewCost != null ? Math.max(0, currentTp - previewCost) : currentTp;
  const currentPct = maxTp > 0 ? Math.min(100, Math.round((currentTp / maxTp) * 100)) : 0;
  const afterPct = maxTp > 0 ? Math.min(100, Math.round((afterTp / maxTp) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-violet-500/25 bg-linear-to-br from-violet-950/50 via-slate-950/80 to-slate-950 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-400/20">
            <Sparkles className="w-4 h-4 text-violet-300" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-300/80">
              Reserva de TP
            </p>
            <p className="text-lg font-black tabular-nums leading-none mt-0.5">
              <span className="text-violet-200">{currentTp}</span>
              <span className="text-slate-500 text-sm font-bold"> / {maxTp}</span>
            </p>
          </div>
        </div>

        {previewCost != null && previewCost > 0 && (
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Tras usar
            </p>
            <p className="text-xl font-black tabular-nums text-violet-200 leading-none mt-0.5">
              {afterTp}
              <span className="text-sm text-red-400 font-bold ml-1.5">-{previewCost}</span>
            </p>
          </div>
        )}
      </div>

      <div className="relative h-3 rounded-full bg-slate-950/90 border border-slate-800 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-violet-700 to-violet-400 transition-all duration-500 ease-out"
          style={{ width: `${currentPct}%` }}
        />
        {previewCost != null && previewCost > 0 && afterPct < currentPct && (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-red-700/80 to-red-500/60 transition-all duration-500 ease-out"
            style={{ width: `${afterPct}%` }}
          />
        )}
      </div>

      <p className="text-[11px] text-slate-400">
        {previewMoveName && previewCost != null ? (
          <>
            <span className="font-bold text-violet-200">{previewMoveName}</span>
            {" "}consumirá{" "}
            <span className="font-black text-amber-300">{previewCost} TP</span>
            {afterTp === 0 && (
              <span className="text-red-400 font-bold"> · te dejará sin reserva</span>
            )}
          </>
        ) : (
          "Pasa el cursor o selecciona una técnica para previsualizar el gasto."
        )}
      </p>
    </div>
  );
}

interface SuperMoveSelectorProps {
  moves: PlayerMoveWithProgress[];
  selectedMoveId: number | null;
  onSelect: (moveId: number) => void;
  currentTp: number;
  maxTp: number;
  playerElement?: string;
}

export function SuperMoveSelector({
  moves,
  selectedMoveId,
  onSelect,
  currentTp,
  maxTp,
  playerElement,
}: SuperMoveSelectorProps) {
  const [hoveredMoveId, setHoveredMoveId] = useState<number | null>(null);

  const previewMove =
    moves.find((m) => m.id === (hoveredMoveId ?? selectedMoveId)) ?? null;

  if (moves.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-violet-500/20 bg-violet-950/20 p-6 text-center">
        <p className="text-sm text-slate-400">Este jugador no tiene supertécnicas desbloqueadas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-violet-400" />
        <p className="text-[10px] font-black uppercase tracking-widest text-violet-300">
          Elige supertécnica
        </p>
      </div>

      <TpPreviewBar
        currentTp={currentTp}
        maxTp={maxTp}
        previewCost={previewMove ? getMoveTpCost(previewMove) : null}
        previewMoveName={previewMove?.name ?? null}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {moves.map((move) => {
          const style = getMoveElementStyle(move.element);
          const isSelected = selectedMoveId === move.id;
          const isHovered = hoveredMoveId === move.id;
          const moveTpCost = getMoveTpCost(move);
          const canAfford = currentTp >= moveTpCost;
          const afterTp = Math.max(0, currentTp - moveTpCost);
          const evolution = getEvolutionBadge(move.evolutionPath, move.currentLevel);
          const hasStab =
            !!playerElement &&
            playerElement.toLowerCase() === move.element?.toLowerCase();

          return (
            <button
              key={move.id}
              type="button"
              disabled={!canAfford}
              onClick={() => onSelect(move.id)}
              onMouseEnter={() => setHoveredMoveId(move.id)}
              onMouseLeave={() => setHoveredMoveId(null)}
              className={`group relative rounded-2xl border p-4 text-left transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                style.card
              } ${
                isSelected
                  ? `ring-2 ring-violet-400/70 ring-offset-2 ring-offset-slate-950 scale-[1.02] ${style.glow}`
                  : isHovered && canAfford
                    ? "scale-[1.01] border-white/20"
                    : ""
              }`}
            >
              {!canAfford && (
                <div className="absolute inset-0 rounded-2xl bg-slate-950/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/80 px-3 py-1.5 rounded-full border border-red-500/30">
                    TP insuficiente
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`p-2 rounded-xl border shrink-0 ${style.icon}`}>
                    <MoveElementIcon element={move.element} size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-sm uppercase tracking-wide truncate leading-tight">
                      {move.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {evolution && (
                        <span
                          className={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${evolution.style}`}
                        >
                          {evolution.text}
                        </span>
                      )}
                      {hasStab && (
                        <span className="px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest text-cyan-300 bg-cyan-950/50 border-cyan-500/30">
                          STAB
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span className="shrink-0 px-2 py-1 rounded-lg bg-violet-500 text-violet-950 text-[9px] font-black uppercase tracking-widest">
                    Elegida
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl bg-black/25 border border-white/5 px-2 py-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">
                    <Target className="w-3 h-3" />
                    Poder
                  </div>
                  <p className="text-lg font-black tabular-nums leading-none">{move.basePower}</p>
                  <p className="text-[9px] opacity-50 mt-0.5">max {move.maxPower}</p>
                </div>
                <div className="rounded-xl bg-black/25 border border-white/5 px-2 py-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">
                    <MoveTypeIcon type={move.type} size={10} />
                    Tipo
                  </div>
                  <p className="text-[11px] font-black uppercase leading-none mt-1">
                    {MOVE_TYPE_LABELS[move.type] ?? move.type}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest opacity-70">
                  <Minus className="w-3 h-3 text-red-400" />
                  Coste TP
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-black tabular-nums ${
                    isSelected || isHovered
                      ? "bg-amber-500/20 border-amber-400/40 text-amber-200"
                      : "bg-black/30 border-white/10 text-slate-200"
                  }`}
                >
                  <span className="text-sm">{moveTpCost}</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {(isSelected || isHovered) && canAfford && (
                    <>
                      <span className="text-slate-500 text-xs">→</span>
                      <span className="text-violet-200 text-sm">{afterTp}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
