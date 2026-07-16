"use client";

import { createPortal } from "react-dom";
import { Goal, Swords, XCircle } from "lucide-react";
import type { UserClub } from "@inazuma/shared";
import { ClubShield } from "@/components/ClubShield";
import { PlayerSpriteAvatar } from "@/components/PlayerSpriteAvatar";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import type { PenaltyShootoutState } from "@/lib/penalty-shootout";
import {
  findPlayerInTeam,
  formatPenaltyPlayerLine,
  getCurrentPenaltyRound,
  getCurrentShooterId,
  getCurrentGoalkeeperId,
  getShootingSide,
  getShotsTakenBySide,
  isSuddenDeath,
} from "@/lib/penalty-shootout";

interface PenaltyShootoutPanelProps {
  homeTeam: UserClub;
  awayTeam: UserClub;
  format: MatchFormat;
  shootout: PenaltyShootoutState;
  onMiss: () => void;
  onGoal: () => void;
  onDuel: () => void;
}

function PenaltyScoreDots({
  side,
  shootout,
  teamName,
  shieldUrl,
}: {
  side: "home" | "away";
  shootout: PenaltyShootoutState;
  teamName: string;
  shieldUrl?: string | null;
}) {
  const isHome = side === "home";
  const teamShots = shootout.shots.filter((shot) => shot.side === side);
  const scheduled = isSuddenDeath(shootout)
    ? Math.max(teamShots.length, shootout.kicksPerTeam)
    : shootout.kicksPerTeam;

  return (
    <div className={`flex flex-col items-center gap-2 flex-1 ${isHome ? "items-start md:items-center" : "items-end md:items-center"}`}>
      <div className="flex items-center gap-2">
        <ClubShield shieldUrl={shieldUrl} alt={teamName} className="w-7 h-7 object-contain" />
        <span className={`text-xs font-black uppercase truncate max-w-[120px] ${isHome ? "text-blue-300" : "text-red-300"}`}>
          {teamName}
        </span>
      </div>
      <span className={`text-3xl font-black tabular-nums ${isHome ? "text-blue-200" : "text-red-200"}`}>
        {isHome ? shootout.homeScore : shootout.awayScore}
      </span>
      <div className="flex flex-wrap gap-1.5 justify-center max-w-[160px]">
        {Array.from({ length: scheduled }).map((_, index) => {
          const shot = teamShots[index];
          return (
            <div
              key={index}
              className={`w-3 h-3 rounded-full border ${
                !shot
                  ? "border-slate-600 bg-slate-800/50"
                  : shot.outcome === "goal"
                    ? "border-emerald-400 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                    : "border-red-400/60 bg-red-400/20"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function PenaltyShootoutPanel({
  homeTeam,
  awayTeam,
  format,
  shootout,
  onMiss,
  onGoal,
  onDuel,
}: PenaltyShootoutPanelProps) {
  const shootingSide = getShootingSide(shootout);
  const shooterId = getCurrentShooterId(shootout);
  const goalkeeperId = getCurrentGoalkeeperId(shootout);

  if (!shootingSide || shooterId == null || goalkeeperId == null) return null;

  const shootingTeam = shootingSide === "home" ? homeTeam : awayTeam;
  const defendingTeam = shootingSide === "home" ? awayTeam : homeTeam;
  const shooter = findPlayerInTeam(shootingTeam, shooterId);
  const goalkeeper = findPlayerInTeam(defendingTeam, goalkeeperId);

  if (!shooter || !goalkeeper) return null;

  const round = getCurrentPenaltyRound(shootout);
  const shotNumber = getShotsTakenBySide(shootout, shootingSide) + 1;
  const suddenDeath = isSuddenDeath(shootout);

  return createPortal(
    <div className="fixed inset-0 z-90 flex items-end md:items-center justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-2xl rounded-3xl border-2 border-amber-500/50 bg-slate-950/95 backdrop-blur-xl shadow-[0_0_60px_rgba(245,158,11,0.2)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-linear-to-r from-amber-950/50 to-slate-950 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
            {suddenDeath ? "Muerte súbita" : `Ronda ${round}`}
          </p>
          <h2 className="text-lg font-black uppercase tracking-widest text-white mt-1">
            Tanda de penaltis
          </h2>
        </div>

        <div className="px-5 py-4 flex items-center justify-between gap-4 border-b border-slate-800">
          <PenaltyScoreDots
            side="home"
            shootout={shootout}
            teamName={homeTeam.name}
            shieldUrl={homeTeam.shieldUrl}
          />
          <span className="text-slate-600 font-black text-xl">—</span>
          <PenaltyScoreDots
            side="away"
            shootout={shootout}
            teamName={awayTeam.name}
            shieldUrl={awayTeam.shieldUrl}
          />
        </div>

        <div className="p-5 space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
              Tiro {shotNumber} · {shootingTeam.name}
            </p>
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <PlayerSpriteAvatar
                  spriteUrl={shooter.spriteUrl}
                  alt={shooter.name}
                  className="w-14 h-14 border-2 border-amber-500/40"
                />
                <span className="text-xs font-black text-amber-300 uppercase">Tirador</span>
                <span className="text-sm font-bold text-white">{shooter.name}</span>
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  {formatPenaltyPlayerLine(shooter, format)}
                </span>
              </div>
              <span className="text-slate-600 font-black text-lg">VS</span>
              <div className="flex flex-col items-center gap-2">
                <PlayerSpriteAvatar
                  spriteUrl={goalkeeper.spriteUrl}
                  alt={goalkeeper.name}
                  className="w-14 h-14 border-2 border-cyan-500/40"
                />
                <span className="text-xs font-black text-cyan-300 uppercase">Portero</span>
                <span className="text-sm font-bold text-white">{goalkeeper.name}</span>
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  {formatPenaltyPlayerLine(goalkeeper, format)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onMiss}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 border-red-500/40 bg-red-950/30 hover:bg-red-950/50 active:scale-[0.98] transition-all"
            >
              <XCircle className="w-6 h-6 text-red-400" />
              <span className="text-xs font-black uppercase text-red-300">Fallo</span>
            </button>
            <button
              type="button"
              onClick={onGoal}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-950/50 active:scale-[0.98] transition-all"
            >
              <Goal className="w-6 h-6 text-emerald-400" />
              <span className="text-xs font-black uppercase text-emerald-300">Gol</span>
            </button>
            <button
              type="button"
              onClick={onDuel}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 border-amber-500/40 bg-amber-950/30 hover:bg-amber-950/50 active:scale-[0.98] transition-all"
            >
              <Swords className="w-6 h-6 text-amber-400" />
              <span className="text-xs font-black uppercase text-amber-300">Duelo</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
