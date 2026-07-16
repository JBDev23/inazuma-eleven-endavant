"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DuelResolution } from "@inazuma/shared";
import {
  Crown,
  Flame,
  Goal,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  TriangleAlert,
  Zap,
} from "lucide-react";
import type { MatchSide } from "@/lib/match-turn";
import { formatFoulRatePercent, formatDuelMultiplier, formatDuelStatValue, isNeutralMultiplier } from "@inazuma/shared";
import { getActionLabel, type DuelActionPick, formatActionPickSummary } from "@/lib/duel-actions";
import {
  getDuelEffectsSummary,
  getDuelWinnerLabel,
} from "@/lib/resolve-match-duel";
import { BurningPhaseTurnDots } from "@/components/BurningPhaseIndicator";

const RESOLVE_ANIMATION_MS = 4200;
const GOAL_ANIMATION_MS = 2600;
const FOUL_ANIMATION_MS = 2400;

const CONFETTI_COLORS = [
  "bg-emerald-400",
  "bg-amber-400",
  "bg-white",
  "bg-cyan-400",
  "bg-lime-300",
];

function GoalConfetti() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: `${8 + ((i * 37) % 84)}%`,
    delay: (i % 7) * 0.08,
    duration: 1.4 + (i % 5) * 0.2,
    size: i % 3 === 0 ? "w-2.5 h-2.5" : "w-1.5 h-1.5",
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    drift: i % 2 === 0 ? -30 : 30,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className={`absolute rounded-full ${p.size} ${p.color}`}
          style={{ left: p.left, top: "18%" }}
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [0, -120, -220],
            x: [0, p.drift],
            scale: [0, 1.2, 0.6],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

function GoalCelebration({
  goalSide,
  homeTeamName,
  awayTeamName,
  scorerName,
}: {
  goalSide: MatchSide;
  homeTeamName: string;
  awayTeamName: string;
  scorerName: string;
}) {
  const teamName = goalSide === "home" ? homeTeamName : awayTeamName;
  const teamColor =
    goalSide === "home"
      ? "text-blue-300 border-blue-400/40 bg-blue-500/10"
      : "text-red-300 border-red-400/40 bg-red-500/10";

  return (
    <motion.div
      key="goal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="relative overflow-hidden rounded-3xl border-2 border-emerald-400/50 bg-emerald-950/40 py-14 px-6 text-center"
    >
      <motion.div
        className="absolute inset-0 bg-emerald-500/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0.2] }}
        transition={{ duration: 1.2 }}
      />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.35)_0%,transparent_70%)]"
        animate={{ scale: [0.8, 1.15, 1], opacity: [0.4, 1, 0.6] }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      />
      <GoalConfetti />

      <motion.div
        className="relative z-10 mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-emerald-400/60 bg-emerald-500/20 shadow-[0_0_60px_rgba(16,185,129,0.55)]"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          scale: { type: "spring", stiffness: 220, damping: 12, delay: 0.1 },
          rotate: { duration: 0.5, ease: "easeOut", delay: 0.1 },
        }}
      >
        <Goal className="h-12 w-12 text-emerald-300" />
      </motion.div>

      <motion.p
        className="relative z-10 text-[10px] font-black uppercase tracking-[0.45em] text-emerald-300/80"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        Balón en la red
      </motion.p>

      <motion.h2
        className="relative z-10 mt-3 text-6xl font-black uppercase tracking-tighter text-emerald-300 md:text-8xl"
        style={{ textShadow: "0 0 50px rgba(16,185,129,0.75)" }}
        initial={{ opacity: 0, y: 36, scale: 0.4 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          delay: 0.35,
          opacity: { duration: 0.3, delay: 0.35 },
          y: { type: "spring", stiffness: 260, damping: 16, delay: 0.35 },
          scale: { type: "spring", stiffness: 260, damping: 12, delay: 0.35 },
        }}
      >
        ¡GOL!
      </motion.h2>

      <motion.div
        className={`relative z-10 mx-auto mt-6 inline-flex flex-col items-center gap-1 rounded-2xl border px-6 py-3 ${teamColor}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, type: "spring", stiffness: 200 }}
      >
        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
          Marca
        </p>
        <p className="text-xl font-black uppercase tracking-tight md:text-2xl">
          {teamName}
        </p>
        <p className="text-sm font-bold text-slate-300">{scorerName}</p>
      </motion.div>
    </motion.div>
  );
}

function FoulCelebration({
  foulSide,
  homeTeamName,
  awayTeamName,
  foulerName,
  foulAction,
  foulRate,
}: {
  foulSide: MatchSide;
  homeTeamName: string;
  awayTeamName: string;
  foulerName: string;
  foulAction: string;
  foulRate: number;
}) {
  const teamName = foulSide === "home" ? homeTeamName : awayTeamName;
  const teamColor =
    foulSide === "home"
      ? "text-blue-300 border-blue-400/40 bg-blue-500/10"
      : "text-red-300 border-red-400/40 bg-red-500/10";

  return (
    <motion.div
      key="foul"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="relative overflow-hidden rounded-3xl border-2 border-amber-400/60 bg-amber-950/50 py-14 px-6 text-center"
    >
      <motion.div
        className="absolute inset-0 bg-amber-500/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0.15, 0.6, 0.2] }}
        transition={{ duration: 1.4, times: [0, 0.15, 0.35, 0.55, 1] }}
      />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.35)_0%,transparent_70%)]"
        animate={{ scale: [0.85, 1.2, 1], opacity: [0.3, 1, 0.5] }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />

      <motion.div
        className="relative z-10 mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-400/70 bg-amber-500/25 shadow-[0_0_60px_rgba(245,158,11,0.55)]"
        initial={{ scale: 0, rotate: 12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          scale: { type: "spring", stiffness: 220, damping: 12, delay: 0.1 },
          rotate: { duration: 0.6, ease: "easeOut", delay: 0.1 },
        }}
      >
        <TriangleAlert className="h-12 w-12 text-amber-300" />
      </motion.div>

      <motion.p
        className="relative z-10 text-[10px] font-black uppercase tracking-[0.45em] text-amber-300/80"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        El árbitro pita
      </motion.p>

      <motion.h2
        className="relative z-10 mt-3 text-6xl font-black uppercase tracking-tighter text-amber-300 md:text-8xl"
        style={{ textShadow: "0 0 50px rgba(245,158,11,0.75)" }}
        initial={{ opacity: 0, y: 36, scale: 0.4 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          delay: 0.3,
          opacity: { duration: 0.3, delay: 0.3 },
          y: { type: "spring", stiffness: 260, damping: 16, delay: 0.3 },
          scale: { type: "spring", stiffness: 260, damping: 12, delay: 0.3 },
        }}
      >
        ¡Falta!
      </motion.h2>

      <motion.div
        className={`relative z-10 mx-auto mt-6 inline-flex flex-col items-center gap-1 rounded-2xl border px-6 py-3 ${teamColor}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, type: "spring", stiffness: 200 }}
      >
        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
          Comete falta
        </p>
        <p className="text-xl font-black uppercase tracking-tight md:text-2xl">
          {teamName}
        </p>
        <p className="text-sm font-bold text-slate-300">{foulerName}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200/80 mt-1">
          {foulAction} · {formatFoulRatePercent(foulRate)} riesgo
        </p>
      </motion.div>
    </motion.div>
  );
}

interface DuelResolutionViewProps {
  resolution: DuelResolution;
  debugText?: string;
  homeTeamName: string;
  awayTeamName: string;
  homePlayerName: string;
  awayPlayerName: string;
  homeAction: DuelActionPick;
  awayAction: DuelActionPick;
  goalkeeperAction?: DuelActionPick;
  goalkeeperPlayerName?: string;
  resolutionStep?: "standard" | "defender" | "goalkeeper";
  ballSide?: MatchSide;
  penaltyAreaShot?: {
    shotPower: number;
    defenderPower: number;
    residualPower: number;
    blockedByDefender: boolean;
    goalkeeperPhase?: boolean;
  };
  onConfirm: () => void;
  onContinueToGoalkeeper?: () => void;
  onRollback: () => void;
  foulNullify?: { label: string; onUse: () => void } | null;
}

function PenaltyAreaSubtractionPanel({
  shotPower,
  defenderPower,
  residualPower,
  blocked,
  animate,
}: {
  shotPower: number;
  defenderPower: number;
  residualPower: number;
  blocked: boolean;
  animate: boolean;
}) {
  const [displayResidual, setDisplayResidual] = useState(shotPower);

  useEffect(() => {
    if (!animate) {
      setDisplayResidual(residualPower);
      return;
    }

    const start = performance.now();
    const duration = 1200;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.round(shotPower - (shotPower - residualPower) * eased);
      setDisplayResidual(current);
      if (progress < 1) requestAnimationFrame(tick);
    };

    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, shotPower, residualPower]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 text-center space-y-3 ${
        blocked
          ? "border-red-500/40 bg-red-950/30"
          : "border-cyan-500/40 bg-cyan-950/30"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        Resta de poder
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap text-2xl md:text-3xl font-black tabular-nums">
        <span className="text-cyan-300">{shotPower}</span>
        <span className="text-slate-500">−</span>
        <span className="text-red-300">{defenderPower}</span>
        <span className="text-slate-500">=</span>
        <motion.span
          key={displayResidual}
          className={blocked ? "text-red-400" : "text-emerald-300"}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 0.35 }}
        >
          {displayResidual}
        </motion.span>
      </div>
      <p className={`text-sm font-bold ${blocked ? "text-red-300" : "text-emerald-300"}`}>
        {blocked
          ? "El defensor intercepta el tiro"
          : "El tiro supera al defensor"}
      </p>
    </motion.div>
  );
}

function PowerBar({
  side,
  power,
  targetPower,
  label,
  colorClass,
  isWinner,
}: {
  side: MatchSide;
  power: number;
  targetPower: number;
  label: string;
  colorClass: string;
  isWinner: boolean;
}) {
  const maxRef = Math.max(targetPower, 1);
  const pct = Math.min(100, Math.round((power / maxRef) * 100));

  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-500 ${
        isWinner
          ? "border-amber-400/60 bg-amber-500/10 ring-2 ring-amber-400/30 scale-[1.02]"
          : side === "home"
            ? "border-blue-500/30 bg-blue-950/30"
            : "border-red-500/30 bg-red-950/30"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className={`text-[10px] font-black uppercase tracking-widest ${colorClass}`}>
          {label}
        </p>
        {isWinner && <Crown className="w-4 h-4 text-amber-400 shrink-0" />}
      </div>
      <motion.p
        className="text-4xl md:text-5xl font-black tabular-nums text-white mb-3"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
      >
        {power}
      </motion.p>
      <div className="h-3 rounded-full bg-black/40 overflow-hidden border border-white/5">
        <motion.div
          className={`h-full rounded-full ${
            side === "home"
              ? "bg-linear-to-r from-blue-700 to-blue-400"
              : "bg-linear-to-r from-red-700 to-red-400"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.6, delay: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function BreakdownChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${
        highlight
          ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
          : "border-slate-700 bg-slate-900/80 text-slate-400"
      }`}
    >
      {label}: <span className="text-white">{value}</span>
    </span>
  );
}

export function DuelResolutionView({
  resolution,
  debugText,
  homeTeamName,
  awayTeamName,
  homePlayerName,
  awayPlayerName,
  homeAction,
  awayAction,
  goalkeeperAction,
  goalkeeperPlayerName,
  resolutionStep = "standard",
  ballSide,
  penaltyAreaShot,
  onConfirm,
  onContinueToGoalkeeper,
  onRollback,
  foulNullify = null,
}: DuelResolutionViewProps) {
  const isDefenderStep = resolutionStep === "defender";
  const attackerSide = ballSide;
  const homeIsShooter = attackerSide === "home";
  const homeActionLabel = formatActionPickSummary(homeAction);
  const awayActionLabel = formatActionPickSummary(awayAction);
  const homeRoleLabel = isDefenderStep
    ? homeIsShooter
      ? "Tiro"
      : "Defensa"
    : null;
  const awayRoleLabel = isDefenderStep
    ? homeIsShooter
      ? "Defensa"
      : "Tiro"
    : null;

  const [phase, setPhase] = useState<"clash" | "foul" | "goal" | "result">("clash");
  const [displayHomePower, setDisplayHomePower] = useState(0);
  const [displayAwayPower, setDisplayAwayPower] = useState(0);

  const maxPower = Math.max(resolution.homePower, resolution.awayPower, 1);
  const winnerLabel = getDuelWinnerLabel(resolution, homeTeamName, awayTeamName);
  const effectLines = getDuelEffectsSummary(resolution, { penaltyAreaShot });
  const isGoal = resolution.effects.goalScored && resolution.effects.goalSide != null;
  const isFoul = resolution.foul != null;
  const goalSide = resolution.effects.goalSide;
  const foulSide = resolution.foul?.foulSide;
  const foulerName =
    foulSide === "home"
      ? homePlayerName
      : foulSide === "away"
        ? awayPlayerName
        : "";
  const goalScorerName =
    goalSide === "home"
      ? homePlayerName
      : goalSide === "away"
        ? awayPlayerName
        : "";

  useEffect(() => {
    const start = performance.now();
    const duration = 1400;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayHomePower(Math.round(resolution.homePower * eased));
      setDisplayAwayPower(Math.round(resolution.awayPower * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    const frame = requestAnimationFrame(tick);
    const clashTimer = setTimeout(() => {
      if (isFoul) setPhase("foul");
      else if (isGoal) setPhase("goal");
      else setPhase("result");
    }, RESOLVE_ANIMATION_MS);
    const foulTimer = isFoul
      ? setTimeout(() => {
          if (isGoal) setPhase("goal");
          else setPhase("result");
        }, RESOLVE_ANIMATION_MS + FOUL_ANIMATION_MS)
      : undefined;
    const goalTimer = isGoal
      ? setTimeout(
          () => setPhase("result"),
          RESOLVE_ANIMATION_MS +
            (isFoul ? FOUL_ANIMATION_MS : 0) +
            GOAL_ANIMATION_MS,
        )
      : undefined;

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(clashTimer);
      if (foulTimer) clearTimeout(foulTimer);
      if (goalTimer) clearTimeout(goalTimer);
    };
  }, [resolution, isGoal, isFoul]);

  const homeWins = resolution.winnerSide === "home";
  const awayWins = resolution.winnerSide === "away";
  const isDraw = resolution.winnerSide === "draw";

  return (
    <div className="flex flex-col gap-6 py-4 max-w-3xl mx-auto w-full">
      <AnimatePresence mode="wait">
        {phase === "clash" && (
          <motion.div
            key="clash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.8 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400/50"
              >
                <Swords className="w-8 h-8 text-amber-400" />
              </motion.div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-300 animate-pulse">
                {isDefenderStep ? "Tiro contra defensa" : "Resolviendo duelo"}
              </p>
              {resolution.burningPhase.home.active && (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 flex items-center justify-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400" />
                    Local en Fase de Furor
                  </p>
                  <BurningPhaseTurnDots remaining={resolution.burningPhase.home.turnsRemaining} />
                  <p className="text-[9px] font-bold text-orange-300/80 tabular-nums">
                    {resolution.burningPhase.home.turnsRemaining} turno
                    {resolution.burningPhase.home.turnsRemaining === 1 ? "" : "s"} restante
                    {resolution.burningPhase.home.turnsRemaining === 1 ? "" : "s"}
                  </p>
                </div>
              )}
              {resolution.burningPhase.away.active && (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-300 flex items-center justify-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400" />
                    Visitante en Fase de Furor
                  </p>
                  <BurningPhaseTurnDots remaining={resolution.burningPhase.away.turnsRemaining} />
                  <p className="text-[9px] font-bold text-orange-300/80 tabular-nums">
                    {resolution.burningPhase.away.turnsRemaining} turno
                    {resolution.burningPhase.away.turnsRemaining === 1 ? "" : "s"} restante
                    {resolution.burningPhase.away.turnsRemaining === 1 ? "" : "s"}
                  </p>
                </div>
              )}
              {resolution.isBurningPhase &&
                !resolution.burningPhase.home.active &&
                !resolution.burningPhase.away.active && (
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" /> Fase de furor activa
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-10 sm:gap-16 md:gap-20 relative sm:px-4">
              <motion.div
                className="relative z-20"
                animate={{ x: [0, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.3 }}
              >
                <PowerBar
                  side="home"
                  power={displayHomePower}
                  targetPower={maxPower}
                  label={homePlayerName}
                  colorClass="text-blue-400"
                  isWinner={homeWins}
                />
                <p className="mt-2 text-center text-xs text-slate-400 uppercase font-bold">
                  {homeRoleLabel && (
                    <span className="block text-[9px] text-cyan-400/80 mb-0.5">{homeRoleLabel}</span>
                  )}
                  {homeActionLabel}
                </p>
              </motion.div>

              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none hidden sm:block"
                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <div className="bg-slate-950 p-3 rounded-full border-4 border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.6)]">
                  <Zap className="w-8 h-8 text-amber-400 fill-amber-400/30" />
                </div>
              </motion.div>

              <motion.div
                className="relative z-20"
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.3 }}
              >
                <PowerBar
                  side="away"
                  power={displayAwayPower}
                  targetPower={maxPower}
                  label={awayPlayerName}
                  colorClass="text-red-400"
                  isWinner={awayWins}
                />
                <p className="mt-2 text-center text-xs text-slate-400 uppercase font-bold">
                  {awayRoleLabel && (
                    <span className="block text-[9px] text-red-400/80 mb-0.5">{awayRoleLabel}</span>
                  )}
                  {awayActionLabel}
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {phase === "foul" && foulSide && resolution.foul && (
          <FoulCelebration
            foulSide={foulSide}
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            foulerName={foulerName}
            foulAction={getActionLabel(resolution.foul.action)}
            foulRate={resolution.foul.foulRate}
          />
        )}

        {phase === "goal" && goalSide && (
          <GoalCelebration
            goalSide={goalSide}
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            scorerName={goalScorerName}
          />
        )}

        {phase === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-3">
              {isDefenderStep && penaltyAreaShot && (
                <PenaltyAreaSubtractionPanel
                  shotPower={penaltyAreaShot.shotPower}
                  defenderPower={penaltyAreaShot.defenderPower}
                  residualPower={penaltyAreaShot.residualPower}
                  blocked={penaltyAreaShot.blockedByDefender}
                  animate
                />
              )}

              {isFoul && resolution.foul ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 18 }}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-amber-400/60 bg-amber-500/15 shadow-[0_0_40px_rgba(245,158,11,0.35)]"
                >
                  <TriangleAlert className="w-7 h-7 text-amber-400" />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/80">
                      Falta confirmada
                    </p>
                    <p className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                      {foulerName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {getActionLabel(resolution.foul.action)} ·{" "}
                      {formatFoulRatePercent(resolution.foul.foulRate)}
                    </p>
                  </div>
                </motion.div>
              ) : isGoal && goalSide ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 18 }}
                  className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-emerald-400/60 bg-emerald-500/15 shadow-[0_0_40px_rgba(16,185,129,0.35)]`}
                >
                  <Goal className="w-7 h-7 text-emerald-400" />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">
                      Gol confirmado
                    </p>
                    <p className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                      {goalSide === "home" ? homeTeamName : awayTeamName}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16 }}
                  className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border-2 ${
                    isDraw
                      ? "border-slate-500 bg-slate-800/60"
                      : "border-amber-400 bg-amber-500/15 shadow-[0_0_40px_rgba(245,158,11,0.35)]"
                  }`}
                >
                  <Trophy className={`w-7 h-7 ${isDraw ? "text-slate-300" : "text-amber-400"}`} />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {isDraw ? "Resultado" : "Ganador"}
                    </p>
                    <p className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                      {isDraw ? "Empate" : winnerLabel}
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-center gap-6 text-2xl font-black tabular-nums">
                <span className={homeWins ? "text-amber-400" : "text-blue-400"}>
                  {resolution.homePower}
                </span>
                <span className="text-slate-600">—</span>
                <span className={awayWins ? "text-amber-400" : "text-red-400"}>
                  {resolution.awayPower}
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {(["home", "away"] as const).map((side) => {
                const breakdown =
                  side === "home" ? resolution.homeBreakdown : resolution.awayBreakdown;
                const team = side === "home" ? homeTeamName : awayTeamName;
                return (
                  <div
                    key={side}
                    className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-2"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Desglose {team}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <BreakdownChip label="E" value={formatDuelStatValue(breakdown.eStats)} />
                      <BreakdownChip
                        label="Elem"
                        value={`×${formatDuelMultiplier(breakdown.elementMultiplier)}`}
                        highlight={!isNeutralMultiplier(breakdown.elementMultiplier)}
                      />
                      {!isNeutralMultiplier(breakdown.tacticMultiplier) && (
                        <BreakdownChip
                          label="Táct"
                          value={`×${formatDuelMultiplier(breakdown.tacticMultiplier)}`}
                          highlight
                        />
                      )}
                      {breakdown.techniquePower != null && (
                        <BreakdownChip
                          label="Téc"
                          value={`+${breakdown.techniquePower}`}
                          highlight
                        />
                      )}
                      {breakdown.stabMultiplier != null && breakdown.stabMultiplier > 1 && (
                        <BreakdownChip label="STAB" value="×1.2" highlight />
                      )}
                      <BreakdownChip label="RNG" value={`+${breakdown.rng}`} />
                      {breakdown.furor > 0 && (
                        <BreakdownChip label="Furor" value={`+${breakdown.furor}`} highlight />
                      )}
                      {breakdown.weatherMultiplier != null &&
                        !isNeutralMultiplier(breakdown.weatherMultiplier) && (
                        <BreakdownChip
                          label="Clima"
                          value={`×${formatDuelMultiplier(breakdown.weatherMultiplier)}`}
                          highlight
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className={`rounded-2xl border p-4 space-y-2 ${
                isFoul
                  ? "border-amber-500/50 bg-amber-950/30"
                  : isGoal
                    ? "border-emerald-500/50 bg-emerald-950/30"
                    : "border-emerald-500/30 bg-emerald-950/20"
              }`}
            >
              <p
                className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                  isFoul ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {isFoul ? (
                  <TriangleAlert className="w-3.5 h-3.5" />
                ) : (
                  <Shield className="w-3.5 h-3.5" />
                )}
                Efectos al confirmar
              </p>
              <ul className="space-y-1.5">
                {effectLines.map((line) => (
                  <li
                    key={line}
                    className="text-sm text-slate-200 flex items-center gap-2"
                  >
                    {line.includes("GOL") ? (
                      <Goal className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : line.includes("Falta") ? (
                      <TriangleAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    )}
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {debugText && (
              <details className="rounded-xl border border-violet-500/30 bg-violet-950/20 overflow-hidden">
                <summary className="cursor-pointer px-4 py-3 text-[10px] font-black uppercase tracking-widest text-violet-400 hover:bg-violet-500/10 select-none">
                  Debug — desglose completo del duelo
                </summary>
                <pre className="px-4 pb-4 text-[11px] leading-relaxed text-violet-100/80 font-mono whitespace-pre-wrap overflow-x-auto max-h-80 overflow-y-auto">
                  {debugText}
                </pre>
              </details>
            )}

            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              {foulNullify && resolution.foul && (
                <button
                  type="button"
                  onClick={foulNullify.onUse}
                  className="sm:col-span-2 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 border-2 border-sky-500/50 bg-sky-950/50 text-sky-200 hover:border-sky-400"
                >
                  {foulNullify.label}
                </button>
              )}
              <button
                type="button"
                onClick={onRollback}
                className="py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 border-2 border-slate-600 bg-slate-800/80 text-slate-300 hover:border-red-400/50 hover:text-red-300 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Deshacer duelo
              </button>
              {onContinueToGoalkeeper ? (
                <button
                  type="button"
                  onClick={onContinueToGoalkeeper}
                  className="py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 bg-linear-to-r from-cyan-500 to-cyan-600 border-b-4 border-cyan-800 text-cyan-950 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2"
                >
                  <Goal className="w-4 h-4" />
                  Continuar al portero
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onConfirm}
                  className="py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 bg-linear-to-r from-emerald-500 to-emerald-600 border-b-4 border-emerald-800 text-emerald-950 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)]"
                >
                  Confirmar resultado
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
