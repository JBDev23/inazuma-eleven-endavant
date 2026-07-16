"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Crown,
  Flag,
  Goal,
  Home,
  RotateCcw,
  Sparkles,
  Swords,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import { useMatchStore } from "@/store/useMatchStore";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import {
  aggregatePlayerStats,
  aggregateTeamStats,
  findHighestPowerDuel,
  findMvp,
  getMatchResult,
  getPossessionPercent,
  type DuelRecord,
  type PlayerMatchStats,
} from "@/lib/match-stats";
import { ClubShield } from "@/components/ClubShield";
import { MatchXpSummary } from "@/components/postmatch/MatchXpSummary";
import type { MatchXpResult, MatchWinnerRewards } from "@inazuma/shared";

function formatDuration(startedAt: string | null, finishedAt: string | null): string {
  if (!startedAt || !finishedAt) return "—";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "blue" | "red" | "amber" | "emerald";
}) {
  const colors = {
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-200",
    red: "border-red-500/30 bg-red-500/10 text-red-200",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  };

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-center ${accent ? colors[accent] : "border-slate-700 bg-slate-900/60 text-slate-200"}`}
    >
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}

function PossessionBar({
  homePercent,
  homeName,
  awayName,
}: {
  homePercent: number;
  homeName: string;
  awayName: string;
}) {
  const awayPercent = 100 - homePercent;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-black uppercase tracking-widest">
        <span className="text-blue-300">{homeName}</span>
        <span className="text-slate-500">Posesión</span>
        <span className="text-red-300">{awayName}</span>
      </div>
      <div className="h-4 rounded-full overflow-hidden flex border border-slate-700 bg-slate-950">
        <div
          className="h-full bg-linear-to-r from-blue-600 to-blue-400 transition-all duration-700"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="h-full bg-linear-to-r from-red-500 to-red-400 transition-all duration-700"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
      <div className="flex justify-between text-sm font-black tabular-nums">
        <span className="text-blue-300">{homePercent}%</span>
        <span className="text-red-300">{awayPercent}%</span>
      </div>
    </div>
  );
}

function TeamStatsCard({
  side,
  teamName,
  shieldUrl,
  stats,
  isWinner,
}: {
  side: "home" | "away";
  teamName: string;
  shieldUrl?: string | null;
  stats: ReturnType<typeof aggregateTeamStats>;
  isWinner: boolean;
}) {
  const accent = side === "home" ? "blue" : "red";
  const border = side === "home" ? "border-blue-500/40" : "border-red-500/40";
  const glow = side === "home" ? "shadow-[0_0_30px_rgba(59,130,246,0.15)]" : "shadow-[0_0_30px_rgba(239,68,68,0.15)]";

  return (
    <div className={`rounded-3xl border-2 ${border} bg-slate-900/80 p-5 ${glow} relative overflow-hidden`}>
      {isWinner && (
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-300">
          <Trophy className="w-3 h-3" /> Ganador
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <ClubShield shieldUrl={shieldUrl} alt={teamName} className="w-8 h-8 object-contain shrink-0" />
        <h3 className="text-lg font-black uppercase tracking-wider text-white truncate pr-16">
          {teamName}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatPill label="Duelos ganados" value={`${stats.duelsWon}/${stats.duelsPlayed}`} accent={accent} />
        <StatPill label="Goles" value={stats.goals} accent={accent} />
        <StatPill label="Supers usados" value={stats.superMovesUsed} />
        <StatPill label="Poder total" value={stats.totalPower} />
        <StatPill label="Duelos campo" value={stats.fieldDuels} />
        <StatPill label="Duelos portería" value={stats.goalDuels} />
      </div>
    </div>
  );
}

function PlayerLeaderboard({
  players,
  homeName,
  awayName,
}: {
  players: PlayerMatchStats[];
  homeName: string;
  awayName: string;
}) {
  if (players.length === 0) {
    return (
      <p className="text-center text-slate-500 text-sm py-8">
        No hubo duelos registrados en este partido.
      </p>
    );
  }

  const top = players.slice(0, 8);

  return (
    <div className="space-y-2">
      {top.map((player, index) => {
        const isHome = player.side === "home";
        return (
          <div
            key={player.playerId}
            className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3"
          >
            <span className="w-7 text-center text-sm font-black text-slate-500 tabular-nums">
              {index + 1}
            </span>
            <div
              className={`w-1 h-10 rounded-full ${isHome ? "bg-blue-500" : "bg-red-500"}`}
            />
            <div className="flex-1 min-w-0">
              <p className="font-black text-white truncate">{player.playerName}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {isHome ? homeName : awayName}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-black tabular-nums">
              {player.goals > 0 && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Goal className="w-3.5 h-3.5" /> {player.goals}
                </span>
              )}
              <span className="flex items-center gap-1 text-amber-400">
                <Swords className="w-3.5 h-3.5" /> {player.duelsWon}W
              </span>
              {player.superMovesUsed > 0 && (
                <span className="flex items-center gap-1 text-violet-400">
                  <Sparkles className="w-3.5 h-3.5" /> {player.superMovesUsed}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DuelTimeline({ duels }: { duels: DuelRecord[] }) {
  if (duels.length === 0) return null;

  const recent = [...duels].reverse().slice(0, 6);

  return (
    <div className="space-y-2">
      {recent.map((duel, index) => {
        const peak = Math.max(duel.homePower, duel.awayPower);
        return (
          <div
            key={`${duel.turn}-${duel.homePlayerId}-${duel.awayPlayerId}-${index}`}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Turno {duel.turn} · {duel.duelType === "GOAL" ? "Portería" : "Campo"}
              </span>
              {duel.goalScored && (
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  <Goal className="w-3 h-3" /> Gol
                </span>
              )}
            </div>
            <p className="text-sm text-slate-300">
              <span className="text-blue-300 font-bold">{duel.homePlayerName}</span>
              {" vs "}
              <span className="text-red-300 font-bold">{duel.awayPlayerName}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              {duel.homePower} — {duel.awayPower}
              <span className="text-slate-600 mx-2">·</span>
              pico {peak}
            </p>
          </div>
        );
      })}
    </div>
  );
}

interface PostMatchViewProps {
  homeTeamName: string;
  awayTeamName: string;
  homeClubId: string;
  awayClubId: string;
  homeShieldUrl?: string | null;
  awayShieldUrl?: string | null;
  homeScore: number;
  awayScore: number;
  matchFormat: MatchFormat;
  currentTurn: number;
  matchStats: ReturnType<typeof useMatchStore.getState>["matchStats"];
  matchXp: MatchXpResult | null;
  matchXpLoading: boolean;
  matchXpError: string | null;
  matchXpApplied: boolean;
  matchXpPending?: boolean;
  isOnline?: boolean;
  isRetrying?: boolean;
  onRetryUpload?: () => void;
  winnerRewards: MatchWinnerRewards | null;
  onGoHome: () => void;
  onRematch: () => void;
}

export function PostMatchView({
  homeTeamName,
  awayTeamName,
  homeClubId,
  awayClubId,
  homeShieldUrl,
  awayShieldUrl,
  homeScore,
  awayScore,
  matchFormat,
  currentTurn,
  matchStats,
  matchXp,
  matchXpLoading,
  matchXpError,
  matchXpApplied,
  matchXpPending = false,
  isOnline = true,
  isRetrying = false,
  onRetryUpload,
  winnerRewards,
  onGoHome,
  onRematch,
}: PostMatchViewProps) {
  const result = getMatchResult(homeScore, awayScore, matchStats.penaltyShootout);
  const homeStats = aggregateTeamStats("home", matchStats.duels, matchStats.goals, matchStats.possessionTurns);
  const awayStats = aggregateTeamStats("away", matchStats.duels, matchStats.goals, matchStats.possessionTurns);
  const players = aggregatePlayerStats(matchStats.duels, matchStats.goals);
  const mvp = findMvp(players);
  const topDuel = findHighestPowerDuel(matchStats.duels);
  const homePossession = getPossessionPercent(matchStats.possessionTurns, "home");
  const duration = formatDuration(matchStats.startedAt, matchStats.finishedAt);
  const formatLabel = matchFormat === "11v11" ? "11 vs 11" : "4 vs 4";

  const outcomeHeadline =
    result.outcome === "draw"
      ? "¡Empate!"
      : result.outcome === "home"
        ? `¡${homeTeamName} gana!`
        : `¡${awayTeamName} gana!`;

  return (
    <div className="min-h-screen text-white pb-10">
      <div className="fixed inset-0 -z-10 bg-slate-950">
        <Image
          src="/setup_back.webp"
          fill
          alt=""
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-linear-to-b from-slate-950 via-slate-950/90 to-slate-950" />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
            <Flag className="w-3.5 h-3.5" /> Final del partido
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white drop-shadow-lg">
            {outcomeHeadline}
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
            {formatLabel} · {matchStats.duels.length} duelos · Turno {Math.max(1, currentTurn - 1)}
            {matchStats.penaltyShootout
              ? ` · Penaltis ${matchStats.penaltyShootout.homeScore}-${matchStats.penaltyShootout.awayScore}`
              : ""}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border-2 border-slate-700 bg-slate-900/90 backdrop-blur-md p-6 md:p-8 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <ClubShield
                shieldUrl={homeShieldUrl}
                alt={homeTeamName}
                className="w-10 h-10 object-contain mx-auto mb-2"
              />
              <p className="text-xs md:text-sm font-black uppercase tracking-wider text-blue-200 truncate">
                {homeTeamName}
              </p>
            </div>

            <div className="flex items-center gap-3 md:gap-6 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span
                className={`text-5xl md:text-7xl font-black tabular-nums ${result.outcome === "home" ? "text-amber-400" : "text-white"}`}
              >
                {homeScore}
              </span>
              <span className="text-2xl text-slate-600 font-black">—</span>
              <span
                className={`text-5xl md:text-7xl font-black tabular-nums ${result.outcome === "away" ? "text-amber-400" : "text-white"}`}
              >
                {awayScore}
              </span>
            </div>

            <div className="flex-1 text-center">
              <ClubShield
                shieldUrl={awayShieldUrl}
                alt={awayTeamName}
                className="w-10 h-10 object-contain mx-auto mb-2"
              />
              <p className="text-xs md:text-sm font-black uppercase tracking-wider text-red-200 truncate">
                {awayTeamName}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <PossessionBar
              homePercent={homePossession}
              homeName={homeTeamName}
              awayName={awayTeamName}
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatPill label="Duración" value={duration} accent="amber" />
          <StatPill label="Duelos" value={matchStats.duels.length} />
          <StatPill label="Goles en duelo" value={matchStats.goals.filter((g) => g.source === "duel").length} accent="emerald" />
          <StatPill label="Empates" value={matchStats.duels.filter((d) => d.winnerSide === "draw").length} />
        </div>

        {mvp && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border-2 border-amber-400/40 bg-linear-to-br from-amber-950/40 to-slate-900/80 p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />
            <div className="flex items-center gap-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                <Crown className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/80 mb-1">
                  Jugador del partido
                </p>
                <p className="text-2xl font-black text-white">{mvp.playerName}</p>
                <p className="text-sm text-slate-400 mt-1">
                  {mvp.goals > 0 && `${mvp.goals} gol${mvp.goals > 1 ? "es" : ""}`}
                  {mvp.goals > 0 && mvp.duelsWon > 0 && " · "}
                  {mvp.duelsWon > 0 && `${mvp.duelsWon} duelo${mvp.duelsWon > 1 ? "s" : ""} ganado${mvp.duelsWon > 1 ? "s" : ""}`}
                  {mvp.superMovesUsed > 0 && ` · ${mvp.superMovesUsed} super${mvp.superMovesUsed > 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {topDuel && (
          <div className="rounded-3xl border border-violet-500/30 bg-violet-950/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-violet-400" />
              <h2 className="text-sm font-black uppercase tracking-widest text-violet-200">
                Duelo más intenso
              </h2>
            </div>
            <p className="text-white font-bold">
              {topDuel.homePlayerName} vs {topDuel.awayPlayerName}
            </p>
            <p className="text-sm text-slate-400 mt-1 tabular-nums">
              Turno {topDuel.turn} · Poder {topDuel.homePower} — {topDuel.awayPower}
              <span className="text-violet-300 font-black ml-2">
                (pico {Math.max(topDuel.homePower, topDuel.awayPower)})
              </span>
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <TeamStatsCard
            side="home"
            teamName={homeTeamName}
            shieldUrl={homeShieldUrl}
            stats={homeStats}
            isWinner={result.outcome === "home"}
          />
          <TeamStatsCard
            side="away"
            teamName={awayTeamName}
            shieldUrl={awayShieldUrl}
            stats={awayStats}
            isWinner={result.outcome === "away"}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-200">
                Ranking de jugadores
              </h2>
            </div>
            <PlayerLeaderboard
              players={players}
              homeName={homeTeamName}
              awayName={awayTeamName}
            />
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-5 h-5 text-slate-400" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-200">
                Últimos duelos
              </h2>
            </div>
            <DuelTimeline duels={matchStats.duels} />
          </section>
        </div>

        <MatchXpSummary
          matchXp={matchXp}
          loading={matchXpLoading}
          error={matchXpError}
          applied={matchXpApplied}
          pending={matchXpPending}
          isOnline={isOnline}
          isRetrying={isRetrying}
          onRetry={onRetryUpload}
          winnerRewards={winnerRewards}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          homeClubId={homeClubId}
          awayClubId={awayClubId}
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onRematch}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-widest text-sm bg-linear-to-r from-amber-500 to-amber-600 border-b-4 border-amber-800 text-amber-950 shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:scale-[1.02] active:scale-95 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Revancha
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-widest text-sm bg-slate-800 border-2 border-slate-600 text-white hover:border-slate-400 active:scale-95 transition-all"
          >
            <Home className="w-5 h-5" />
            Menú principal
          </button>
        </div>
      </div>
    </div>
  );
}
