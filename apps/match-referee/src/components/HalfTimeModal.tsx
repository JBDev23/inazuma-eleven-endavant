"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowRightLeft, Swords, Target, Timer, Users } from "lucide-react";
import { ClubShield } from "@/components/ClubShield";
import { HalftimeConsumablesSection } from "@/components/HalftimeConsumablesSection";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import type { UserClub } from "@inazuma/shared";
import {
  aggregateTeamStats,
  getPossessionPercent,
} from "@/lib/match-stats";
import type { MatchStats } from "@/lib/match-stats";

interface HalfTimeModalProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeam: UserClub;
  awayTeam: UserClub;
  format: MatchFormat;
  homeShieldUrl?: string | null;
  awayShieldUrl?: string | null;
  homeScore: number;
  awayScore: number;
  totalTurns: number;
  matchStats: MatchStats;
  homeHasBench: boolean;
  awayHasBench: boolean;
  onOpenSubstitutions: (side: "home" | "away") => void;
  onContinue: () => void;
}

function StatRow({
  label,
  home,
  away,
  icon,
}: {
  label: string;
  home: string | number;
  away: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-slate-800/80 last:border-0">
      <div className="w-6 shrink-0 text-slate-500">{icon}</div>
      <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <span className="w-10 text-center text-sm font-black text-blue-400 tabular-nums">{home}</span>
      <span className="text-slate-600 font-black">·</span>
      <span className="w-10 text-center text-sm font-black text-red-400 tabular-nums">{away}</span>
    </div>
  );
}

export function HalfTimeModal({
  homeTeamName,
  awayTeamName,
  homeTeam,
  awayTeam,
  format,
  homeShieldUrl,
  awayShieldUrl,
  homeScore,
  awayScore,
  totalTurns,
  matchStats,
  homeHasBench,
  awayHasBench,
  onOpenSubstitutions,
  onContinue,
}: HalfTimeModalProps) {
  const [mounted, setMounted] = useState(false);
  const halfTurns = totalTurns / 2;

  useEffect(() => {
    setMounted(true);
  }, []);

  const homeStats = aggregateTeamStats("home", matchStats.duels, matchStats.goals, matchStats.possessionTurns);
  const awayStats = aggregateTeamStats("away", matchStats.duels, matchStats.goals, matchStats.possessionTurns);
  const homePossession = getPossessionPercent(matchStats.possessionTurns, "home");
  const awayPossession = getPossessionPercent(matchStats.possessionTurns, "away");

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[min(90dvh,100%)] bg-slate-900 border-2 border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="shrink-0 bg-linear-to-r from-emerald-950/80 to-slate-950 px-6 py-5 text-center border-b border-emerald-500/20">
          <div className="inline-flex items-center gap-2 text-emerald-400 mb-2">
            <Timer className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Descanso</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-white">
            Entretiempo
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">
            {halfTurns} turnos completados · cambio de campo
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5 space-y-4 scrollbar-hide">
          <div className="flex items-center justify-between gap-3 bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <ClubShield
                shieldUrl={homeShieldUrl}
                alt={homeTeamName}
                className="w-8 h-8 object-contain"
              />
              <span className="text-[10px] font-black uppercase text-blue-300/90 truncate w-full text-center">
                {homeTeamName}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-3xl font-black text-white tabular-nums">{homeScore}</span>
              <span className="text-xl text-slate-600 font-black">-</span>
              <span className="text-3xl font-black text-white tabular-nums">{awayScore}</span>
            </div>
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <ClubShield
                shieldUrl={awayShieldUrl}
                alt={awayTeamName}
                className="w-8 h-8 object-contain"
              />
              <span className="text-[10px] font-black uppercase text-red-300/90 truncate w-full text-center">
                {awayTeamName}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950/40 border border-slate-800 px-4 py-2">
            <div className="flex justify-end gap-4 pb-1 mb-1 border-b border-slate-800/60">
              <span className="w-10 text-center text-[9px] font-black uppercase text-blue-400/70">Loc</span>
              <span className="w-10 text-center text-[9px] font-black uppercase text-red-400/70">Vis</span>
            </div>
            <StatRow
              label="Duelos ganados"
              home={homeStats.duelsWon}
              away={awayStats.duelsWon}
              icon={<Swords className="w-4 h-4" />}
            />
            <StatRow
              label="Duelos jugados"
              home={homeStats.duelsPlayed}
              away={awayStats.duelsPlayed}
              icon={<Target className="w-4 h-4" />}
            />
            <StatRow
              label="Posesión"
              home={`${homePossession}%`}
              away={`${awayPossession}%`}
              icon={<Timer className="w-4 h-4" />}
            />
            <StatRow
              label="Supertecnicas"
              home={homeStats.superMovesUsed}
              away={awayStats.superMovesUsed}
              icon={<Swords className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-3">
            <ArrowRightLeft className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              Los equipos cambian de campo. La segunda parte comienza en el turno{" "}
              <span className="font-black text-emerald-300">{halfTurns + 1}</span>.
            </p>
          </div>

          {(homeHasBench || awayHasBench) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300/90">
                  Cambios gratuitos de entretiempo
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!homeHasBench}
                  onClick={() => onOpenSubstitutions("home")}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 border-blue-500/40 bg-blue-950/40 text-blue-300 font-black uppercase tracking-widest text-[10px] hover:bg-blue-950/70 hover:border-blue-400/60 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="truncate w-full text-center">{homeTeamName}</span>
                </button>
                <button
                  type="button"
                  disabled={!awayHasBench}
                  onClick={() => onOpenSubstitutions("away")}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 border-red-500/40 bg-red-950/40 text-red-300 font-black uppercase tracking-widest text-[10px] hover:bg-red-950/70 hover:border-red-400/60 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="truncate w-full text-center">{awayTeamName}</span>
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-500">
                No consumen cambios de partido
              </p>
            </div>
          )}

          <HalftimeConsumablesSection
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            format={format}
          />
        </div>

        <div className="shrink-0 px-6 pt-4 pb-6 border-t border-slate-800 bg-slate-900">
          <button
            type="button"
            onClick={onContinue}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm bg-linear-to-r from-emerald-500 to-emerald-600 border-b-4 border-emerald-800 text-emerald-950 shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:scale-[1.02] active:scale-95 transition-all"
          >
            Segunda parte
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
