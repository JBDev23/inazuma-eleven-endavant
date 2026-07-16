"use client";

import { motion } from "framer-motion";
import { ArrowUp, CloudOff, Loader2, RefreshCw, Sparkles, Star, TrendingUp, Wifi } from "lucide-react";
import type { MatchXpResult, MatchWinnerRewards } from "@inazuma/shared";
import { getXpRequiredForLevel } from "@inazuma/shared";

interface MatchXpSummaryProps {
  matchXp: MatchXpResult | null;
  loading: boolean;
  error: string | null;
  applied: boolean;
  pending?: boolean;
  isOnline?: boolean;
  isRetrying?: boolean;
  onRetry?: () => void;
  winnerRewards: MatchWinnerRewards | null;
  homeTeamName: string;
  awayTeamName: string;
  homeClubId: string;
  awayClubId: string;
}

function XpBar({
  level,
  experience,
  previousLevel,
  previousExperience,
}: {
  level: number;
  experience: number;
  previousLevel: number;
  previousExperience: number;
}) {
  const required = getXpRequiredForLevel(level);
  const pct = required > 0 ? Math.min(100, (experience / required) * 100) : 100;
  const prevRequired = getXpRequiredForLevel(previousLevel);
  const prevPct =
    prevRequired > 0 ? Math.min(100, (previousExperience / prevRequired) * 100) : 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <span>Nvl {level}</span>
        <span className="tabular-nums">
          {experience}
          {required > 0 ? ` / ${required}` : ""} XP
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden relative">
        <div
          className="absolute inset-y-0 left-0 bg-slate-600/40 rounded-full"
          style={{ width: `${prevPct}%` }}
        />
        <motion.div
          className="absolute inset-y-0 left-0 bg-linear-to-r from-violet-500 to-fuchsia-400 rounded-full"
          initial={{ width: `${prevPct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function MatchXpSummary({
  matchXp,
  loading,
  error,
  applied,
  pending = false,
  isOnline = true,
  isRetrying = false,
  onRetry,
  winnerRewards,
  homeTeamName,
  awayTeamName,
  homeClubId,
  awayClubId,
}: MatchXpSummaryProps) {
  if (loading) {
    return (
      <section className="rounded-3xl border border-violet-500/30 bg-violet-950/20 p-6 flex items-center justify-center gap-3 text-violet-200">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-bold uppercase tracking-widest">Calculando recompensas...</span>
      </section>
    );
  }

  const showPendingBanner = pending && !applied;
  const showError = error && !applied;

  if (showError && !matchXp) {
    return (
      <section className="rounded-3xl border border-red-500/30 bg-red-950/20 p-6 space-y-4">
        <div className="flex items-start gap-3 text-red-300 text-sm">
          <CloudOff className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={!isOnline || isRetrying}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black uppercase tracking-widest text-sm bg-red-900/40 border border-red-500/40 text-red-200 hover:bg-red-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRetrying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isOnline ? "Reintentar subida" : "Sin conexión"}
          </button>
        )}
      </section>
    );
  }

  if (!matchXp || matchXp.players.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-center text-slate-500 text-sm">
        No hay jugadores con participación para repartir XP.
      </section>
    );
  }

  const isPachanga = matchXp.format === "4v4";
  const sorted = [...matchXp.players].sort((a, b) => b.totalXp - a.totalXp);
  const winnerName =
    winnerRewards?.clubId === homeClubId
      ? homeTeamName
      : winnerRewards?.clubId === awayClubId
        ? awayTeamName
        : null;

  return (
    <section className="rounded-3xl border-2 border-violet-500/40 bg-linear-to-br from-violet-950/40 to-slate-900/80 p-6 space-y-5">
      {showPendingBanner && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 space-y-3">
          <div className="flex items-start gap-3">
            <CloudOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-amber-200">
                Resultado guardado localmente
              </p>
              <p className="text-xs text-amber-200/70 mt-1">
                {isOnline
                  ? "Pendiente de subir a la base de datos."
                  : "Se subirá automáticamente cuando vuelva la conexión."}
              </p>
              {error && <p className="text-xs text-amber-300/80 mt-1">{error}</p>}
            </div>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={!isOnline || isRetrying}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-black uppercase tracking-widest text-xs bg-amber-500/20 border border-amber-500/40 text-amber-200 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRetrying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isOnline ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <CloudOff className="w-4 h-4" />
              )}
              {isRetrying
                ? "Subiendo..."
                : isOnline
                  ? "Subir ahora"
                  : "Esperando conexión..."}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-violet-200">
              Recompensas de experiencia
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {isPachanga
              ? `Pachanga · Sesión ${matchXp.session} · ×${matchXp.pachangaMultiplier ?? "?"} · ${matchXp.minXp}–${matchXp.maxXp} XP`
              : `Sesión ${matchXp.session} · ${matchXp.minXp}–${matchXp.maxXp} XP por ranking`}
          </p>
        </div>
        {applied && (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
            XP aplicada
          </span>
        )}
        {showPendingBanner && (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-300">
            Pendiente
          </span>
        )}
      </div>

      {winnerRewards && winnerName && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-black text-amber-200">
            Recompensa al ganador: {winnerName}
          </p>
          <p className="text-sm font-black text-amber-300 tabular-nums">
            +{winnerRewards.pp} PP · +{winnerRewards.yens} YE
          </p>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((player, index) => {
          const isHome = player.side === "home";
          return (
            <motion.div
              key={player.playerId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`w-1 h-12 rounded-full shrink-0 ${isHome ? "bg-blue-500" : "bg-red-500"}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-white truncate">{player.playerName}</p>
                    {player.leveledUp && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-300">
                        <ArrowUp className="w-3 h-3" />
                        +{player.levelsGained} nivel{player.levelsGained > 1 ? "es" : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {isHome ? homeTeamName : awayTeamName}
                    {!isPachanga && player.performanceRank > 0 && (
                      <span className="text-violet-400 ml-2">
                        · Ranking #{player.performanceRank}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-violet-300 tabular-nums">+{player.totalXp}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">XP total</p>
                </div>
              </div>

              {!isPachanga && (
                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="rounded-xl bg-slate-950/60 px-2 py-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Turnos</p>
                    <p className="text-sm font-black text-slate-200 tabular-nums">{player.turnsOnField}</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/60 px-2 py-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Mínimo</p>
                    <p className="text-sm font-black text-blue-300 tabular-nums">+{player.baseXp}</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/60 px-2 py-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Bono</p>
                    <p className="text-sm font-black text-amber-300 tabular-nums">+{player.bonusXp}</p>
                  </div>
                </div>
              )}

              <XpBar
                level={player.newLevel}
                experience={player.newExperience}
                previousLevel={player.previousLevel}
                previousExperience={player.previousExperience}
              />

              {!isPachanga && (
                <p className="text-[10px] text-slate-600 mt-2 flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Puntos rendimiento: {player.performanceScore}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-600 flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        El ranking usa duelos, goles, paradas, posesión y portería a cero. En empate: peso del rol → nivel más bajo → Valor → suerte.
      </p>
    </section>
  );
}
