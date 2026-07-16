"use client";

import type { Coach, PlayerStats, PlayerWithDetails } from "@inazuma/shared";
import type { WeatherCondition } from "@inazuma/shared";
import {
  ChevronRight,
  Goal,
  Shield,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import type { MatchSide } from "@/lib/match-turn";
import {
  getAvailableDuelActions,
  getDuelActionResourceCost,
  getPlayerSuperMoves,
  isSuperAction,
  type DuelActionOption,
} from "@/lib/duel-actions";
import type { DuelContext, DuelRole } from "@/lib/duel-context";
import { getDuelRoleLabel, getDuelTypeLabel } from "@/lib/duel-context";
import type { PlayerMatchResources } from "@/lib/match-player-resources";
import type { SportsCityState } from "@inazuma/shared";
import { PlayerSpriteAvatar } from "@/components/PlayerSpriteAvatar";

type SideOverviewInfo = {
  side: MatchSide;
  isHome: boolean;
  player: PlayerWithDetails;
  resources: { current: PlayerMatchResources; max: Pick<PlayerStats, "tp" | "gp"> };
  teamName: string;
  label: string;
  colorClass: string;
  role: DuelRole;
};

interface DuelActionsOverviewProps {
  homeInfo: SideOverviewInfo;
  awayInfo: SideOverviewInfo;
  duelContext: DuelContext;
  format: MatchFormat;
  weather: WeatherCondition;
  homeCoach: Coach | null;
  awayCoach: Coach | null;
  homeFacilities: SportsCityState;
  awayFacilities: SportsCityState;
  actionStarter: MatchSide;
  onContinue: () => void;
}

const ACTION_GROUPS = [
  { key: "ataque" as const, label: "Ataque", icon: Target },
  { key: "defensa" as const, label: "Defensa", icon: Shield },
  { key: "portero" as const, label: "Portero", icon: Goal },
];

function ResourcePill({
  label,
  current,
  max,
  icon: Icon,
  iconClass,
}: {
  label: string;
  current: number;
  max: number;
  icon: typeof Target;
  iconClass: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;

  return (
    <div className="rounded-xl bg-black/30 border border-white/5 px-2.5 py-2">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3 h-3 ${iconClass}`} />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {label}
          </span>
        </div>
        <span className="text-xs font-black tabular-nums">
          {current}
          <span className="text-slate-500 font-bold">/{max}</span>
        </span>
      </div>
      <div className="h-1 rounded-full bg-slate-950/80 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            label === "TP"
              ? "bg-linear-to-r from-violet-600 to-purple-400"
              : "bg-linear-to-r from-amber-600 to-yellow-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SuperMoveRow({
  name,
  tpCost,
  currentTp,
  canAfford,
}: {
  name: string;
  tpCost: number;
  currentTp: number;
  canAfford: boolean;
}) {
  const afterTp = Math.max(0, currentTp - tpCost);

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[11px] border ${
        canAfford
          ? "bg-violet-950/40 border-violet-500/20 text-violet-100"
          : "bg-slate-900/60 border-slate-800 text-slate-500"
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <Star className="w-3 h-3 shrink-0 text-violet-400" />
        <span className="font-bold truncate">{name}</span>
      </div>
      <div className="shrink-0 text-right tabular-nums">
        <span className={`font-black ${canAfford ? "text-amber-300" : "text-red-400/80"}`}>
          -{tpCost} TP
        </span>
        {canAfford && (
          <span className="text-slate-500 font-bold ml-1.5">→ {afterTp}</span>
        )}
      </div>
    </div>
  );
}

function ActionPreviewRow({
  action,
  info,
  weather,
  coach,
  resourceCostOptions,
}: {
  action: DuelActionOption;
  info: SideOverviewInfo;
  weather: WeatherCondition;
  coach: Coach | null;
  resourceCostOptions: {
    format: MatchFormat;
    homeFacilities: SportsCityState;
    awayFacilities: SportsCityState;
    side: MatchSide;
  };
}) {
  const { current } = info.resources;
  const isSuper = isSuperAction(action.id);

  if (isSuper) {
    const moves = getPlayerSuperMoves(info.player, action.id);
    const hasMoves = moves.length > 0;

    return (
      <div className="rounded-xl border border-violet-500/20 bg-violet-950/15 p-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wide text-violet-200">
            {action.label}
          </span>
        </div>
        {!hasMoves ? (
          <p className="text-[10px] text-slate-500 italic pl-5">
            Sin supertécnicas desbloqueadas
          </p>
        ) : (
          <div className="space-y-1 pl-1">
            {moves.map((move) => {
              const previewPick = { category: action.id, moveId: move.id };
              const cost = getDuelActionResourceCost(
                previewPick,
                info.player,
                weather,
                coach,
                resourceCostOptions,
              );
              const canAfford = current.tp >= cost.tp;

              return (
                <SuperMoveRow
                  key={move.id}
                  name={move.name}
                  tpCost={cost.tp}
                  currentTp={current.tp}
                  canAfford={canAfford}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const previewPick = { category: action.id };
  const cost = getDuelActionResourceCost(
    previewPick,
    info.player,
    weather,
    coach,
    resourceCostOptions,
  );
  const canAfford = current.gp >= cost.gp && current.tp >= cost.tp;

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
        canAfford
          ? "bg-slate-800/60 border-slate-700 text-slate-100"
          : "bg-slate-900/40 border-slate-800 text-slate-500"
      }`}
    >
      <span className="text-xs font-bold uppercase tracking-wide">{action.label}</span>
      {cost.gp > 0 && (
        <span
          className={`text-[10px] font-black tabular-nums ${
            canAfford ? "text-amber-300" : "text-red-400/80"
          }`}
        >
          -{cost.gp} GP
        </span>
      )}
      {cost.gp === 0 && cost.tp === 0 && (
        <span className="text-[10px] font-bold text-emerald-400/80">Gratis</span>
      )}
    </div>
  );
}

function PlayerActionsPanel({
  info,
  duelContext,
  format,
  weather,
  coach,
  homeFacilities,
  awayFacilities,
  picksFirst,
}: {
  info: SideOverviewInfo;
  duelContext: DuelContext;
  format: MatchFormat;
  weather: WeatherCondition;
  coach: Coach | null;
  homeFacilities: SportsCityState;
  awayFacilities: SportsCityState;
  picksFirst: boolean;
}) {
  const availableActions = getAvailableDuelActions(info.player, format, info.role, duelContext);
  const bgGradient = info.isHome ? "from-blue-600/20 to-blue-950/40" : "from-red-600/20 to-red-950/40";
  const borderColor = info.isHome ? "border-blue-500/30" : "border-red-500/30";
  const positionNum = format === "11v11" ? info.player.position11 : info.player.position4;

  const resourceCostOptions = {
    format,
    homeFacilities,
    awayFacilities,
    side: info.side,
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border ${borderColor} bg-linear-to-br ${bgGradient} overflow-hidden ${
        picksFirst ? "ring-2 ring-amber-400/50 ring-offset-2 ring-offset-slate-950" : ""
      }`}
    >
      <div className="p-4 border-b border-white/5 bg-black/20">
        <div className="flex items-start gap-3">
          <PlayerSpriteAvatar
            spriteUrl={info.player.spriteUrl}
            alt={info.player.name}
            className={`w-16 h-16 border-2 ${
              info.isHome ? "border-blue-400" : "border-red-400"
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-black uppercase tracking-widest ${info.colorClass}`}>
                {info.label}
              </span>
              <span className="text-[10px] text-slate-500 truncate">{info.teamName}</span>
              {picksFirst && (
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Elige primero
                </span>
              )}
            </div>
            <h3 className="font-black uppercase tracking-tight text-lg leading-tight truncate mt-0.5">
              {info.player.name}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-slate-300">
                POS {positionNum}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300/90 bg-black/40 px-2 py-0.5 rounded border border-amber-400/20">
                {getDuelRoleLabel(info.role)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <ResourcePill
            label="GP"
            current={info.resources.current.gp}
            max={info.resources.max.gp}
            icon={Target}
            iconClass="text-amber-400"
          />
          <ResourcePill
            label="TP"
            current={info.resources.current.tp}
            max={info.resources.max.tp}
            icon={Sparkles}
            iconClass="text-violet-400"
          />
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {availableActions.length === 0 ? (
          <p className="text-sm text-red-400/80 text-center py-4">
            No hay acciones disponibles para este rol.
          </p>
        ) : (
          ACTION_GROUPS.map(({ key, label, icon: Icon }) => {
            const actions = availableActions.filter((a) => a.group === key);
            if (actions.length === 0) return null;

            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {label}
                  </span>
                </div>
                <div className="space-y-2">
                  {actions.map((action) => (
                    <ActionPreviewRow
                      key={action.id}
                      action={action}
                      info={info}
                      weather={weather}
                      coach={coach}
                      resourceCostOptions={resourceCostOptions}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function DuelActionsOverview({
  homeInfo,
  awayInfo,
  duelContext,
  format,
  weather,
  homeCoach,
  awayCoach,
  homeFacilities,
  awayFacilities,
  actionStarter,
  onContinue,
}: DuelActionsOverviewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-center gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          {getDuelTypeLabel(duelContext)}
        </span>
        {duelContext.type === "FIELD" && duelContext.inPenaltyArea && (
          <span className="text-xs font-black uppercase tracking-widest text-emerald-300 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-500/30">
            Área de penalti
          </span>
        )}
        {duelContext.type === "GOAL" && !duelContext.goalkeeperInSmallArea && (
          <span className="text-xs font-black uppercase tracking-widest text-violet-300 bg-violet-950/50 px-3 py-1 rounded-full border border-violet-500/30">
            Portero fuera del área pequeña
          </span>
        )}
        <span className="text-xs font-black uppercase tracking-widest text-amber-300 bg-amber-950/50 px-3 py-1 rounded-full border border-amber-500/30">
          Balón: {duelContext.ballSide === "home" ? "LOCAL" : "VISITANTE"}
        </span>
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Revisad las acciones disponibles, supertécnicas y recursos de ambos jugadores antes de
          elegir. Los costes de TP muestran cuánto os quedaría tras usar cada supertécnica.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <PlayerActionsPanel
          info={homeInfo}
          duelContext={duelContext}
          format={format}
          weather={weather}
          coach={homeCoach}
          homeFacilities={homeFacilities}
          awayFacilities={awayFacilities}
          picksFirst={actionStarter === "home"}
        />
        <PlayerActionsPanel
          info={awayInfo}
          duelContext={duelContext}
          format={format}
          weather={weather}
          coach={awayCoach}
          homeFacilities={homeFacilities}
          awayFacilities={awayFacilities}
          picksFirst={actionStarter === "away"}
        />
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-lg transition-all active:scale-95 bg-linear-to-r from-amber-500 to-amber-600 border-b-4 border-amber-800 text-amber-950 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2"
      >
        Continuar al duelo
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
