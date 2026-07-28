"use client";

import { useEffect, useState } from "react";
import { PlayerSpriteAvatar } from "@/components/PlayerSpriteAvatar";
import { createPortal } from "react-dom";
import {
  getDisplayStats,
  getEffectiveStats,
  getActiveCoach,
  getStatModifierKind,
  formatConsumableEffect,
  getConsumableTierColor,
  CONSUMABLE_CATEGORY_LABELS,
  getPlayerMatchModifiers,
  isOfficialMatch,
  normalizePlayerMoves,
  type ConsumableCategory,
  type PlayerMoveWithProgress,
  type PlayerWithDetails,
} from "@inazuma/shared";
import {
  X,
  Swords,
  Zap,
  ShieldHalf,
  Shield,
  Target,
  Sparkles,
  Heart,
  Flame,
  Footprints,
  Brain,
  ArrowRightLeft,
  Droplets,
  UtensilsCrossed,
  Star,
  Lock,
  Activity,
  Hand,
  Leaf,
  Wind,
  Mountain,
  CircleDashed,
} from "lucide-react";
import { MatchFormat } from "./MatchFormatSelector";
import { useMatchStore } from "@/store/useMatchStore";
import { getAvailableConsumablesForPlayer, formatConsumableEffectForMatch } from "@/lib/match-consumables";
import { getTeamFacilities } from "@/lib/match-facility";
import { getMoveTpCost } from "@/lib/duel-actions";
import { PlayerMatchModifiersBadge } from "@/components/PlayerMatchModifiersBadge";

interface PlayerStatsModalProps {
  player: PlayerWithDetails;
  isHome: boolean;
  teamName: string;
  format: MatchFormat;
  onClose: () => void;
  canSubstitute?: boolean;
  substitutionsRemaining?: number;
  onSubstitute?: () => void;
  canUseConsumables?: boolean;
}

const STAT_ROWS = [
  { key: "kick" as const, label: "Tiro", icon: Swords, color: "text-amber-400" },
  { key: "guard" as const, label: "Defensa", icon: ShieldHalf, color: "text-emerald-400" },
  { key: "speed" as const, label: "Velocidad", icon: Zap, color: "text-cyan-400" },
  { key: "body" as const, label: "Cuerpo", icon: Heart, color: "text-rose-400" },
  { key: "control" as const, label: "Control", icon: Footprints, color: "text-blue-400" },
  { key: "stamina" as const, label: "Resistencia", icon: Flame, color: "text-orange-400" },
  { key: "guts" as const, label: "Valor", icon: Brain, color: "text-violet-400" },
];

const MOVE_TYPE_LABELS: Record<string, string> = {
  SHOOT: "Tiro",
  DRIBBLE: "Regate",
  BLOCK: "Defensa",
  CATCH: "Parada",
  SKILL: "Habilidad",
};

function getMoveElementStyle(element: string, isUnlocked: boolean) {
  if (!isUnlocked) {
    return "border-slate-700/50 bg-slate-900/60 text-slate-500 opacity-75";
  }

  switch (element?.toLowerCase()) {
    case "fuego":
    case "fire":
      return "border-red-500/30 bg-red-950/30 text-red-300";
    case "bosque":
    case "wood":
      return "border-emerald-500/30 bg-emerald-950/30 text-emerald-300";
    case "aire":
    case "wind":
      return "border-sky-500/30 bg-sky-950/30 text-sky-300";
    case "montaña":
    case "earth":
      return "border-amber-500/30 bg-amber-950/30 text-amber-300";
    default:
      return "border-slate-600/40 bg-slate-900/60 text-slate-300";
  }
}

function MoveElementIcon({ element, size = 14 }: { element: string; size?: number }) {
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

function MoveTypeIcon({ type, size = 11 }: { type: string; size?: number }) {
  switch (type?.toUpperCase()) {
    case "SHOOT":
      return <Target size={size} />;
    case "DRIBBLE":
      return <Activity size={size} />;
    case "BLOCK":
      return <Shield size={size} />;
    case "CATCH":
      return <Hand size={size} />;
    case "SKILL":
      return <Sparkles size={size} />;
    default:
      return <Shield size={size} />;
  }
}

function getEvolutionBadge(path: string, level: number) {
  if (level <= 1 || path === "NONE") return null;

  if (path === "SHIN") {
    if (level === 2) return { text: "Kai", style: "text-emerald-300 bg-emerald-950/50 border-emerald-500/30" };
    if (level >= 3) return { text: "Shin", style: "text-fuchsia-300 bg-fuchsia-950/50 border-fuchsia-500/30" };
  }

  if (path === "L_G") {
    if (level >= 5) return { text: `G${level}`, style: "text-amber-300 bg-amber-950/50 border-amber-500/30" };
    return { text: `G${level}`, style: "text-sky-300 bg-sky-950/50 border-sky-500/30" };
  }

  return { text: `Nv.${level}`, style: "text-slate-300 bg-slate-800/80 border-slate-600/30" };
}

function SuperMoveCard({ move, playerElement }: { move: PlayerMoveWithProgress; playerElement?: string }) {
  const isUnlocked = move.isUnlocked;
  const style = getMoveElementStyle(move.element, isUnlocked);
  const tpCost = getMoveTpCost(move);
  const evolution = isUnlocked ? getEvolutionBadge(move.evolutionPath, move.currentLevel) : null;
  const hasStab =
    isUnlocked &&
    !!playerElement &&
    playerElement.toLowerCase() === move.element?.toLowerCase();

  return (
    <div className={`rounded-xl border p-2.5 ${style}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MoveElementIcon element={move.element} />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide truncate">
              {isUnlocked ? move.name : "?????????"}
            </p>
            {isUnlocked && (
              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                {evolution && (
                  <span className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${evolution.style}`}>
                    {evolution.text}
                  </span>
                )}
                {hasStab && (
                  <span className="px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest text-cyan-300 bg-cyan-950/50 border-cyan-500/30">
                    STAB
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {!isUnlocked ? (
          <span className="shrink-0 flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded text-[9px] font-bold border border-white/10">
            <Lock size={9} /> Nv. {move.unlockLevel}
          </span>
        ) : null}
      </div>

      {isUnlocked && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] font-bold opacity-80">
              <MoveTypeIcon type={move.type} />
              {move.basePower}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60 bg-black/20 px-1.5 py-0.5 rounded">
              {MOVE_TYPE_LABELS[move.type] ?? move.type}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-black bg-black/25 px-2 py-0.5 rounded-md">
            {tpCost} <Zap size={10} className="text-amber-400" />
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceBar({
  label,
  icon: Icon,
  iconClass,
  barClass,
  current,
  max,
}: {
  label: string;
  icon: typeof Target;
  iconClass: string;
  barClass: string;
  current: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-black/30 px-2.5 py-2 border border-white/5">
      <Icon className={`w-3.5 h-3.5 shrink-0 ${iconClass}`} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {label}
          </span>
          <span className="text-xs font-black tabular-nums">
            {current}
            <span className="text-slate-500 font-bold">/{max}</span>
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-950/80 overflow-hidden">
          <div
            className={`h-full rounded-full ${barClass} transition-all duration-500 ease-out`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function PlayerStatsModal({
  player,
  isHome,
  teamName,
  format,
  onClose,
  canSubstitute = false,
  substitutionsRemaining,
  onSubstitute,
  canUseConsumables = false,
}: PlayerStatsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [consumableError, setConsumableError] = useState<string | null>(null);
  const [isUsingConsumable, setIsUsingConsumable] = useState(false);
  const currentResources = useMatchStore((state) => {
    const map = state.playerResources;
    const stored = map[player.id];
    if (stored) return stored;

    const team = isHome ? state.homeTeam : state.awayTeam;
    const coach = getActiveCoach(team);
    const maxStats = getEffectiveStats(player, coach);
    return { tp: maxStats.tp, gp: maxStats.gp };
  });
  const homeTeam = useMatchStore((state) => state.homeTeam);
  const awayTeam = useMatchStore((state) => state.awayTeam);
  const matchStats = useMatchStore((state) => state.matchStats);
  const matchFacilityState = useMatchStore((state) => state.matchFacilityState);
  const useConsumableOnPlayer = useMatchStore((state) => state.useConsumableOnPlayer);
  const team = isHome ? homeTeam : awayTeam;
  const coach = getActiveCoach(team);
  const baseStats = getDisplayStats(player);
  const maxStats = getEffectiveStats(player, coach);
  const playerMoves = normalizePlayerMoves(player);

  const availableConsumables = canUseConsumables && team
    ? getAvailableConsumablesForPlayer(
        team,
        player.id,
        matchStats.consumableUsages ?? [],
      )
    : [];

  const facilityModifiers =
    team && isOfficialMatch(format)
      ? getPlayerMatchModifiers({
          playerId: player.id,
          playerElement: player.element,
          side: isHome ? "home" : "away",
          format,
          matchFacilityState,
          homeFacilities: getTeamFacilities(homeTeam),
          awayFacilities: getTeamFacilities(awayTeam),
        })
      : [];

  const handleUseConsumable = async (consumableId: number) => {
    if (!team) return;
    setConsumableError(null);
    setIsUsingConsumable(true);
    const side = isHome ? "home" : "away";
    const result = useConsumableOnPlayer(side, player.id, consumableId);
    setIsUsingConsumable(false);
    if (!result.success) {
      setConsumableError(result.error);
    }
  };

  const positionNum = format === "11v11" ? player.position11 : player.position4;
  const bgGradient = isHome ? "from-blue-600 to-blue-900" : "from-red-600 to-red-900";
  const borderColor = isHome ? "border-blue-400" : "border-red-400";

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-stats-title"
    >
      <div
        className="absolute inset-0 z-0 cursor-pointer bg-slate-950/90 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-linear-to-br ${bgGradient} border border-white/10 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 bg-black/40 rounded-full text-white/70 hover:text-white hover:bg-black/60 transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <div className="relative z-10 p-6 flex flex-col items-center overflow-y-auto flex-1 min-h-0 scrollbar-hide">
          <div className="w-full flex justify-between items-start mb-4 pr-8">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
              {isHome ? "Local" : "Visitante"}
            </span>
            <div className="bg-black/50 px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
              <span className="text-[10px] text-slate-300 font-mono uppercase tracking-widest">POS</span>
              <span className="text-sm font-black">{positionNum}</span>
            </div>
          </div>

          <PlayerSpriteAvatar
            spriteUrl={player.spriteUrl}
            alt={player.name}
            className={`border-4 shadow-2xl mb-4 w-28 h-28 md:w-36 md:h-36 ${borderColor}`}
          />

          <h2
            id="player-stats-title"
            className="font-black uppercase tracking-tighter text-center text-2xl leading-none drop-shadow-md"
          >
            {player.name}
          </h2>

          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/60 truncate max-w-full">
            {teamName}
          </p>

          {coach && (
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-purple-300/80">
              Bonos del entrenador activos
            </p>
          )}

          <div className="mt-2 mb-4 flex flex-wrap justify-center gap-1.5 text-[10px] text-white/70">
            <span className="bg-black/40 px-2 py-0.5 rounded">{player.position}</span>
            <span className="bg-black/40 px-2 py-0.5 rounded">{player.element}</span>
            <span className="bg-black/40 px-2 py-0.5 rounded">Nv. {player.level ?? 1}</span>
          </div>

          {facilityModifiers.length > 0 && (
            <div className="w-full mb-4 bg-black/30 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-300/90 mb-2 text-center">
                Bonos del estadio
              </p>
              <PlayerMatchModifiersBadge
                modifiers={facilityModifiers}
                size="detail"
                className="justify-center gap-1.5"
              />
              <ul className="mt-2 space-y-1">
                {facilityModifiers.map((modifier) => (
                  <li
                    key={modifier.id}
                    className="text-[10px] font-bold text-white/60 text-center leading-snug"
                  >
                    {modifier.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="w-full grid grid-cols-2 gap-2 mb-4">
            <ResourceBar
              label="GP"
              icon={Target}
              iconClass="text-amber-400"
              barClass="bg-linear-to-r from-amber-600 to-yellow-400"
              current={currentResources.gp}
              max={maxStats.gp}
            />
            <ResourceBar
              label="TP"
              icon={Sparkles}
              iconClass="text-violet-400"
              barClass="bg-linear-to-r from-violet-600 to-purple-400"
              current={currentResources.tp}
              max={maxStats.tp}
            />
          </div>

          <div className="w-full grid grid-cols-2 gap-2 bg-black/30 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
            {STAT_ROWS.map(({ key, label, icon: Icon, color }) => {
              const value = maxStats[key];
              const base = baseStats[key];
              const kind = getStatModifierKind(base, value);
              const valueClass =
                kind === "boost"
                  ? "text-emerald-300"
                  : kind === "nerf"
                    ? "text-red-300"
                    : "text-white";

              return (
              <div key={key} className="flex items-center gap-2 px-1 py-1">
                <Icon className={`w-4 h-4 shrink-0 ${color} opacity-80`} />
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">
                    {label}
                  </span>
                  <span className={`text-lg font-black tabular-nums ${valueClass}`}>
                    {value}
                    {kind !== "neutral" && (
                      <span className="ml-1 text-[10px] font-bold line-through text-slate-500">
                        {base}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
            })}
          </div>

          <div className="w-full mt-4 bg-black/30 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-300 mb-2 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" />
              Supertécnicas
            </p>

            {playerMoves.length === 0 ? (
              <p className="text-[11px] font-bold text-slate-500 uppercase text-center py-2">
                Sin supertécnicas registradas
              </p>
            ) : (
              <div className="space-y-2">
                {playerMoves.map((move) => (
                  <SuperMoveCard key={move.id} move={move} playerElement={player.element} />
                ))}
              </div>
            )}
          </div>

          {canUseConsumables && (
            <div className="w-full mt-4 bg-black/30 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-300 mb-2 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5" />
                Consumibles
              </p>

              {availableConsumables.length === 0 ? (
                <p className="text-[11px] font-bold text-slate-500 uppercase text-center py-2">
                  {(matchStats.consumableUsages ?? []).some((u) => u.playerId === player.id)
                    ? "Ya usó un consumible"
                    : "Sin consumibles disponibles"}
                </p>
              ) : (
                <div className="space-y-2">
                  {availableConsumables.map(({ consumable, effectiveQuantity }) => {
                    const Icon =
                      consumable.category === "FOOD" ? UtensilsCrossed : Droplets;
                    const tierColor = getConsumableTierColor(consumable);

                    return (
                      <button
                        key={consumable.id}
                        type="button"
                        disabled={isUsingConsumable}
                        onClick={() => handleUseConsumable(consumable.id)}
                        className={`w-full flex items-center gap-3 rounded-xl border-2 bg-linear-to-r ${tierColor} px-3 py-2.5 text-left transition-all hover:scale-[1.01] disabled:opacity-50`}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-white/80" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/60">
                            {CONSUMABLE_CATEGORY_LABELS[consumable.category as ConsumableCategory]}
                          </p>
                          <p className="text-xs font-black text-white uppercase truncate">
                            {consumable.name}
                          </p>
                          <p className="text-[10px] font-bold text-sky-200">
                            {team
                              ? formatConsumableEffectForMatch(consumable, team, format)
                              : formatConsumableEffect(consumable)}
                          </p>
                        </div>
                        <span className="text-xs font-black text-white/70 tabular-nums shrink-0">
                          ×{effectiveQuantity}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {consumableError && (
                <p className="mt-2 text-[11px] font-bold text-red-300 text-center">
                  {consumableError}
                </p>
              )}
            </div>
          )}

          {canSubstitute && onSubstitute && (
            <button
              type="button"
              onClick={onSubstitute}
              className="mt-4 w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-sm bg-black/40 border-2 border-amber-500/60 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Cambiar jugador
              {substitutionsRemaining != null && (
                <span className="text-amber-500/80 tabular-nums">({substitutionsRemaining})</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
