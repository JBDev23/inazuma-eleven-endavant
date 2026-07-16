"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, Hand, Shield, Sparkles, Target, Zap } from "lucide-react";
import { getMoveEvolutionLabel } from "@inazuma/shared";
import type { MatchMoveLevelUpEvent } from "@/lib/match-move-progress";

const SPARKLE_COLORS = [
  "bg-fuchsia-400",
  "bg-amber-300",
  "bg-violet-400",
  "bg-cyan-300",
  "bg-white",
];

function MoveTypeIcon({ type, className }: { type: string; className?: string }) {
  const props = { size: 28, className };
  switch (type?.toUpperCase()) {
    case "SHOOT":
      return <Target {...props} />;
    case "DRIBBLE":
      return <Activity {...props} />;
    case "BLOCK":
      return <Shield {...props} />;
    case "CATCH":
      return <Hand {...props} />;
    default:
      return <Zap {...props} />;
  }
}

function EvolutionSparkles() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: `${6 + ((i * 41) % 88)}%`,
    delay: (i % 6) * 0.07,
    duration: 1.3 + (i % 4) * 0.15,
    size: i % 3 === 0 ? "w-2.5 h-2.5" : "w-1.5 h-1.5",
    color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
    drift: i % 2 === 0 ? -24 : 24,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className={`absolute rounded-full ${p.size} ${p.color}`}
          style={{ left: p.left, top: "22%" }}
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [0, -90, -180],
            x: [0, p.drift],
            scale: [0, 1.3, 0.5],
            rotate: [0, 200, 360],
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

function LevelBadge({
  path,
  level,
  emphasis = false,
}: {
  path: MatchMoveLevelUpEvent["evolutionPath"];
  level: number;
  emphasis?: boolean;
}) {
  const label = getMoveEvolutionLabel(path, level) ?? `Nv.${level}`;
  const isMaxShin = path === "SHIN" && level >= 3;
  const isMaxLG = path === "L_G" && level >= 5;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl border-2 px-4 py-2 font-black uppercase tracking-widest ${
        emphasis
          ? isMaxShin || isMaxLG
            ? "border-fuchsia-400/70 bg-fuchsia-500/20 text-fuchsia-100 shadow-[0_0_40px_rgba(217,70,239,0.45)] text-lg"
            : "border-amber-400/70 bg-amber-500/15 text-amber-100 shadow-[0_0_30px_rgba(251,191,36,0.35)]"
          : "border-slate-600 bg-slate-900/80 text-slate-400 text-sm"
      }`}
    >
      {label}
    </span>
  );
}

function MoveLevelUpCard({ event }: { event: MatchMoveLevelUpEvent }) {
  const sideColor =
    event.side === "home"
      ? "border-blue-400/50 bg-blue-500/10"
      : "border-red-400/50 bg-red-500/10";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`relative overflow-hidden rounded-2xl border-2 ${sideColor} px-5 py-6 text-center`}
    >
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.22)_0%,transparent_72%)]"
        animate={{ scale: [0.85, 1.1, 1], opacity: [0.3, 0.9, 0.5] }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <EvolutionSparkles />

      <motion.div
        className="relative z-10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-200 shadow-[0_0_35px_rgba(217,70,239,0.4)]"
        animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 1.2, repeat: 2, ease: "easeInOut" }}
      >
        <MoveTypeIcon type={event.moveType} />
      </motion.div>

      <motion.p
        className="relative z-10 text-[10px] font-black uppercase tracking-[0.35em] text-fuchsia-300 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        ¡Dominio alcanzado!
      </motion.p>

      <motion.h3
        className="relative z-10 text-xl font-black uppercase text-white tracking-wide"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        {event.moveName}
      </motion.h3>

      <p className="relative z-10 mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
        {event.playerName}
      </p>

      <div className="relative z-10 mt-5 flex items-center justify-center gap-3">
        <LevelBadge path={event.evolutionPath} level={event.previousLevel} />
        <motion.div
          animate={{ x: [0, 4, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        >
          <Sparkles className="w-5 h-5 text-amber-300" />
        </motion.div>
        <LevelBadge path={event.evolutionPath} level={event.newLevel} emphasis />
      </div>

      {event.levelsGained > 1 && (
        <p className="relative z-10 mt-3 text-xs font-black uppercase tracking-widest text-amber-300">
          +{event.levelsGained} niveles
        </p>
      )}
    </motion.div>
  );
}

export function MoveLevelUpCelebration({
  events,
}: {
  events: MatchMoveLevelUpEvent[];
}) {
  if (events.length === 0) return null;

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={events.map((e) => `${e.playerId}-${e.moveId}-${e.newLevel}`).join("|")}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="space-y-3 overflow-hidden"
      >
        {events.map((event) => (
          <MoveLevelUpCard key={`${event.side}-${event.playerId}-${event.moveId}`} event={event} />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
