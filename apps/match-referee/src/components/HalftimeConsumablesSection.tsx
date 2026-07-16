"use client";

import { useState } from "react";
import {
  getActiveCoach,
  getConsumableTierColor,
  getEffectiveStats,
  type PlayerWithDetails,
  type UserClub,
} from "@inazuma/shared";
import { Droplets, Sparkles, Target, UtensilsCrossed } from "lucide-react";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import { PlayerSpriteAvatar } from "@/components/PlayerSpriteAvatar";
import { useMatchStore } from "@/store/useMatchStore";
import {
  formatConsumableEffectForMatch,
  getAvailableConsumablesForPlayer,
  teamHasAvailableConsumables,
} from "@/lib/match-consumables";
import { resolvePlayerResources } from "@/lib/match-player-resources";
import { getStarterPlayers } from "@/lib/match-substitutions";

interface HalftimeConsumablesSectionProps {
  homeTeam: UserClub;
  awayTeam: UserClub;
  format: MatchFormat;
}

function PlayerConsumableRow({
  player,
  side,
  team,
  format,
}: {
  player: PlayerWithDetails;
  side: "home" | "away";
  team: UserClub;
  format: MatchFormat;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isUsing, setIsUsing] = useState(false);
  const playerResources = useMatchStore((state) => state.playerResources);
  const matchStats = useMatchStore((state) => state.matchStats);
  const useConsumableOnPlayer = useMatchStore((state) => state.useConsumableOnPlayer);

  const coach = getActiveCoach(team);
  const current = resolvePlayerResources(playerResources, player, coach);
  const max = getEffectiveStats(player, coach);
  const usages = matchStats.consumableUsages ?? [];
  const available = getAvailableConsumablesForPlayer(team, player.id, usages);

  const handleUse = (consumableId: number) => {
    setError(null);
    setIsUsing(true);
    const result = useConsumableOnPlayer(side, player.id, consumableId);
    setIsUsing(false);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2.5 space-y-2">
      <div className="flex items-center gap-2.5">
        <PlayerSpriteAvatar
          spriteUrl={player.spriteUrl}
          alt={player.name}
          className="w-8 h-8 border border-slate-600 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate">{player.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-[10px] font-black tabular-nums ${
                current.gp <= 0 ? "text-red-400" : "text-amber-300"
              }`}
            >
              <Target className="inline w-2.5 h-2.5 mr-0.5 opacity-80" />
              {current.gp}/{max.gp}
            </span>
            <span
              className={`text-[10px] font-black tabular-nums ${
                current.tp <= 0 ? "text-red-400" : "text-violet-300"
              }`}
            >
              <Sparkles className="inline w-2.5 h-2.5 mr-0.5 opacity-80" />
              {current.tp}/{max.tp}
            </span>
          </div>
        </div>
      </div>

      {available.length === 0 ? (
        <p className="text-[10px] font-bold text-slate-500 uppercase text-center py-1">
          {usages.some((usage) => usage.playerId === player.id)
            ? "Ya usó un consumible"
            : "Sin consumibles"}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {available.map(({ consumable, effectiveQuantity }) => {
            const Icon = consumable.category === "FOOD" ? UtensilsCrossed : Droplets;
            const tierColor = getConsumableTierColor(consumable);

            return (
              <button
                key={consumable.id}
                type="button"
                disabled={isUsing}
                onClick={() => handleUse(consumable.id)}
                title={formatConsumableEffectForMatch(consumable, team, format)}
                className={`flex items-center gap-1.5 rounded-lg border bg-linear-to-r ${tierColor} px-2 py-1.5 text-left transition-all hover:scale-[1.02] disabled:opacity-50`}
              >
                <Icon className="w-3 h-3 shrink-0 text-white/80" />
                <span className="text-[9px] font-black text-white uppercase truncate max-w-[72px]">
                  {consumable.name}
                </span>
                <span className="text-[9px] font-bold text-white/70 tabular-nums shrink-0">
                  ×{effectiveQuantity}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-[10px] font-bold text-red-300 text-center">{error}</p>
      )}
    </div>
  );
}

function TeamConsumablesPanel({
  side,
  team,
  teamName,
  format,
}: {
  side: "home" | "away";
  team: UserClub;
  teamName: string;
  format: MatchFormat;
}) {
  const matchStats = useMatchStore((state) => state.matchStats);
  const starters = getStarterPlayers(team, format);
  const usages = matchStats.consumableUsages ?? [];
  const hasConsumables = teamHasAvailableConsumables(team, format, usages);

  if (!hasConsumables) {
    return (
      <p className="text-[10px] font-bold text-slate-500 uppercase text-center py-2">
        Sin consumibles disponibles
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p
        className={`text-[10px] font-black uppercase tracking-widest ${
          side === "home" ? "text-blue-300/90" : "text-red-300/90"
        }`}
      >
        {teamName}
      </p>
      {starters.map((player) => (
        <PlayerConsumableRow
          key={player.id}
          player={player}
          side={side}
          team={team}
          format={format}
        />
      ))}
    </div>
  );
}

export function HalftimeConsumablesSection({
  homeTeam,
  awayTeam,
  format,
}: HalftimeConsumablesSectionProps) {
  const [expandedSide, setExpandedSide] = useState<"home" | "away" | null>(null);
  const matchStats = useMatchStore((state) => state.matchStats);
  const usages = matchStats.consumableUsages ?? [];

  const homeHas = teamHasAvailableConsumables(homeTeam, format, usages);
  const awayHas = teamHasAvailableConsumables(awayTeam, format, usages);

  if (!homeHas && !awayHas) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Droplets className="w-4 h-4 text-sky-400" />
        <p className="text-[10px] font-black uppercase tracking-widest text-sky-300/90">
          Consumibles en el descanso
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!homeHas}
          onClick={() => setExpandedSide((current) => (current === "home" ? null : "home"))}
          className={`py-2.5 px-2 rounded-xl border-2 font-black uppercase tracking-widest text-[10px] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
            expandedSide === "home"
              ? "border-blue-400 bg-blue-950/60 text-blue-200"
              : "border-blue-500/40 bg-blue-950/40 text-blue-300 hover:bg-blue-950/70"
          }`}
        >
          {homeTeam.name}
        </button>
        <button
          type="button"
          disabled={!awayHas}
          onClick={() => setExpandedSide((current) => (current === "away" ? null : "away"))}
          className={`py-2.5 px-2 rounded-xl border-2 font-black uppercase tracking-widest text-[10px] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
            expandedSide === "away"
              ? "border-red-400 bg-red-950/60 text-red-200"
              : "border-red-500/40 bg-red-950/40 text-red-300 hover:bg-red-950/70"
          }`}
        >
          {awayTeam.name}
        </button>
      </div>

      {expandedSide === "home" && (
        <TeamConsumablesPanel
          side="home"
          team={homeTeam}
          teamName={homeTeam.name}
          format={format}
        />
      )}
      {expandedSide === "away" && (
        <TeamConsumablesPanel
          side="away"
          team={awayTeam}
          teamName={awayTeam.name}
          format={format}
        />
      )}

      <p className="text-[10px] text-center text-slate-500">
        Un consumible por jugador en todo el partido
      </p>
    </div>
  );
}
