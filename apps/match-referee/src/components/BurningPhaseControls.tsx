"use client";

import { Flame } from "lucide-react";
import {
  BURNING_PHASE_DURATION_TURNS,
  canOfferFuryPhaseButton,
  getBurningPhaseTurnsRemaining,
  isSideInBurningPhase,
} from "@inazuma/shared";
import { useMatchStore } from "@/store/useMatchStore";
import { BurningPhaseTurnDots } from "@/components/BurningPhaseIndicator";

export function BurningPhaseControls() {
  const matchStatus = useMatchStore((state) => state.matchStatus);
  const currentTurn = useMatchStore((state) => state.currentTurn);
  const totalTurns = useMatchStore((state) => state.totalTurns);
  const halfTimeCompleted = useMatchStore((state) => state.halfTimeCompleted);
  const homeScore = useMatchStore((state) => state.homeScore);
  const awayScore = useMatchStore((state) => state.awayScore);
  const homeTeam = useMatchStore((state) => state.homeTeam);
  const awayTeam = useMatchStore((state) => state.awayTeam);
  const burningPhaseActive = useMatchStore((state) => state.burningPhaseActive);
  const burningPhaseUsed = useMatchStore((state) => state.burningPhaseUsed);
  const activateBurningPhase = useMatchStore((state) => state.activateBurningPhase);

  if (matchStatus !== "PLAYING" || !homeTeam || !awayTeam) return null;

  const sides = (["home", "away"] as const).map((side) => {
    const team = side === "home" ? homeTeam : awayTeam;
    const active = isSideInBurningPhase(side, burningPhaseActive, currentTurn);
    const turnsRemaining = getBurningPhaseTurnsRemaining(side, burningPhaseActive, currentTurn);
    const canActivate = canOfferFuryPhaseButton({
      side,
      currentTurn,
      totalTurns,
      halfTimeCompleted,
      homeScore,
      awayScore,
      burningPhaseActive,
      burningPhaseUsed,
    });

    return { side, team, active, turnsRemaining, canActivate };
  });

  const visible = sides.some((entry) => entry.active || entry.canActivate);
  if (!visible) return null;

  const handleActivate = (side: "home" | "away") => {
    const result = activateBurningPhase(side);
    if (!result.success) {
      window.alert(result.error);
    }
  };

  return (
    <div className="w-full flex flex-wrap justify-center gap-2 pt-2 border-t border-slate-800">
      {sides.map(({ side, team, active, turnsRemaining, canActivate }) => {
        if (!active && !canActivate) return null;

        const isHome = side === "home";
        const tone = isHome
          ? "border-blue-500/40 bg-blue-950/30 text-blue-200"
          : "border-red-500/40 bg-red-950/30 text-red-200";
        const activeTone = isHome
          ? "border-orange-400/60 bg-linear-to-r from-orange-500/25 via-blue-950/50 to-orange-500/10 text-orange-100 shadow-[0_0_24px_rgba(249,115,22,0.35)]"
          : "border-orange-400/60 bg-linear-to-r from-orange-500/25 via-red-950/50 to-orange-500/10 text-orange-100 shadow-[0_0_24px_rgba(249,115,22,0.35)]";

        if (active) {
          return (
            <span
              key={side}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest animate-pulse ${activeTone}`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>{team.name}: Furor</span>
              <BurningPhaseTurnDots remaining={turnsRemaining} />
              <span className="text-orange-200/90 tabular-nums">
                {turnsRemaining}/{BURNING_PHASE_DURATION_TURNS}
              </span>
            </span>
          );
        }

        return (
          <button
            key={side}
            type="button"
            onClick={() => handleActivate(side)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 ${tone}`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            {team.name}: Activar Furor ({BURNING_PHASE_DURATION_TURNS}T)
          </button>
        );
      })}
    </div>
  );
}
