"use client";

import { Flame } from "lucide-react";
import {
  BURNING_PHASE_DURATION_TURNS,
  getBurningPhaseTurnsRemaining,
  isSideInBurningPhase,
  type BurningPhaseSide,
  type BurningPhaseState,
} from "@inazuma/shared";

type BurningPhaseIndicatorProps = {
  side: BurningPhaseSide;
  burningPhaseActive: BurningPhaseState;
  currentTurn: number;
  variant?: "compact" | "badge";
};

function TurnDots({
  remaining,
  tone,
}: {
  remaining: number;
  tone: "blue" | "red";
}) {
  const activeClass =
    tone === "blue"
      ? "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]"
      : "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]";
  const inactiveClass = tone === "blue" ? "bg-blue-900/60" : "bg-red-900/60";

  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: BURNING_PHASE_DURATION_TURNS }).map((_, index) => (
        <span
          key={index}
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            index < remaining ? activeClass : inactiveClass
          }`}
        />
      ))}
    </span>
  );
}

export function BurningPhaseIndicator({
  side,
  burningPhaseActive,
  currentTurn,
  variant = "badge",
}: BurningPhaseIndicatorProps) {
  if (!isSideInBurningPhase(side, burningPhaseActive, currentTurn)) return null;

  const remaining = getBurningPhaseTurnsRemaining(side, burningPhaseActive, currentTurn);
  const isHome = side === "home";
  const tone = isHome ? "blue" : "red";

  if (variant === "compact") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider animate-pulse ${
          isHome
            ? "border-orange-400/50 bg-orange-500/15 text-orange-200"
            : "border-orange-400/50 bg-orange-500/15 text-orange-200"
        }`}
        title={`Fase de Furor · ${remaining} turno${remaining === 1 ? "" : "s"} restante${remaining === 1 ? "" : "s"}`}
      >
        <Flame className="w-3 h-3 text-orange-400 shrink-0" />
        <TurnDots remaining={remaining} tone={tone} />
      </span>
    );
  }

  return (
    <div
      className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl border animate-pulse ${
        isHome
          ? "border-orange-400/40 bg-linear-to-b from-orange-500/20 to-blue-950/40 shadow-[0_0_20px_rgba(249,115,22,0.25)]"
          : "border-orange-400/40 bg-linear-to-b from-orange-500/20 to-red-950/40 shadow-[0_0_20px_rgba(249,115,22,0.25)]"
      }`}
    >
      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-orange-300">
        <Flame className="w-3 h-3 text-orange-400" />
        Furor
      </span>
      <TurnDots remaining={remaining} tone={tone} />
      <span className="text-[8px] font-bold text-orange-200/80 tabular-nums">
        {remaining}T
      </span>
    </div>
  );
}

export function BurningPhaseTurnDots({
  remaining,
  className = "",
}: {
  remaining: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {Array.from({ length: BURNING_PHASE_DURATION_TURNS }).map((_, index) => (
        <span
          key={index}
          className={`w-2 h-2 rounded-full transition-all ${
            index < remaining
              ? "bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.9)] scale-110"
              : "bg-slate-700/80"
          }`}
        />
      ))}
    </span>
  );
}
