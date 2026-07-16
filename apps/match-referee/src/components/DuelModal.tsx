"use client";

import { useEffect, useRef, useState } from "react";
import { getDisplayStats, getEffectiveStats, getActiveCoach, getStatModifierKind, normalizePlayerWithMoves, applyWeatherToDuelStats, getAvailableMatchAbilities, MATCH_FACILITY_ABILITY_LABELS, nullifyDuelFoul, formatShotDistanceMultiplier, getShotDistanceMultiplier, type DuelResolution, type PlayerStats, type PlayerWithDetails, type PenaltyAreaShotBlockResult } from "@inazuma/shared";
import type { ActionCategory } from "@inazuma/shared";
import {
  X,
  Swords,
  Zap,
  ShieldHalf,
  Play,
  ChevronRight,
  Target,
  Shield,
  Goal,
  Smartphone,
  Ruler,
  Sparkles,
} from "lucide-react";
import { MatchFormat } from "./MatchFormatSelector";
import type { MatchSide } from "@/lib/match-turn";
import {
  type DuelActionPick,
  getAvailableDuelActions,
  getDuelActionResourceCost,
  getPlayerSuperMoves,
  isShotAction,
  isSuperAction,
  formatActionPickSummary,
} from "@/lib/duel-actions";
import {
  type DuelContext,
  getDefendingSide,
  getDuelActionStarter,
  getDuelRoleLabel,
  getDuelTypeLabel,
  getEffectiveDuelType,
  getGoalkeeperFromTeam,
  getPlayerDuelRole,
  shouldAttemptGoalkeeperSave,
} from "@/lib/duel-context";
import { useMatchStore } from "@/store/useMatchStore";
import type { PlayerMatchResources, PlayerResourcesMap } from "@/lib/match-player-resources";
import { PlayerSpriteAvatar } from "@/components/PlayerSpriteAvatar";
import { SuperMoveSelector } from "@/components/SuperMoveSelector";
import { DuelActionsOverview } from "@/components/DuelActionsOverview";
import { DuelResolutionView } from "@/components/DuelResolutionView";
import { MoveLevelUpCelebration } from "@/components/MoveLevelUpCelebration";
import { resolveMatchDuel, resolvePenaltyAreaShotBlockMatch, resolvePenaltyAreaShotGoalkeeperMatch } from "@/lib/resolve-match-duel";
import {
  previewPlayerMoveLevelUp,
  type MatchMoveLevelUpEvent,
} from "@/lib/match-move-progress";
import { getTeamFacilities } from "@/lib/match-facility";

interface DuelModalProps {
  homePlayer: PlayerWithDetails;
  awayPlayer: PlayerWithDetails;
  homeTeamName: string;
  awayTeamName: string;
  currentTurn: number;
  duelContext: DuelContext;
  format: MatchFormat;
  onClose: () => void;
  onApplyDuel?: (
    resolution: DuelResolution,
    picks: { home: DuelActionPick; away: DuelActionPick; goalkeeper?: DuelActionPick },
    extras?: {
      goalkeeperPlayer?: PlayerWithDetails;
      penaltyAreaShotBlock?: PenaltyAreaShotBlockResult;
    },
  ) => void;
}

type DuelPhase =
  | "intro"
  | "actions-overview"
  | "pick-first"
  | "transition"
  | "pick-second"
  | "transition-gk"
  | "pick-goalkeeper"
  | "resolution-defender"
  | "resolution";

const INTRO_DELAY_MS = 3000;

type ResourceBarDef = {
  key: "gp" | "tp";
  label: string;
  icon: typeof Target;
  barClass: string;
  iconClass: string;
};

const RESOURCE_BARS: ResourceBarDef[] = [
  {
    key: "gp",
    label: "GP",
    icon: Target,
    barClass: "bg-linear-to-r from-amber-600 to-yellow-400",
    iconClass: "text-amber-400",
  },
  {
    key: "tp",
    label: "TP",
    icon: Sparkles,
    barClass: "bg-linear-to-r from-violet-600 to-purple-400",
    iconClass: "text-violet-400",
  },
];

function ResourceBar({
  stat,
  current,
  max,
}: {
  stat: ResourceBarDef;
  current: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const Icon = stat.icon;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-black/30 px-2.5 py-2 border border-white/5">
      <Icon className={`w-3.5 h-3.5 shrink-0 ${stat.iconClass}`} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {stat.label}
          </span>
          <span className="text-xs font-black tabular-nums">
            {current}
            <span className="text-slate-500 font-bold">/{max}</span>
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-950/80 overflow-hidden">
          <div
            className={`h-full rounded-full ${stat.barClass} transition-all duration-500 ease-out`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function TpGpBars({
  current,
  max,
  compact = false,
}: {
  current: PlayerMatchResources;
  max: Pick<PlayerStats, "tp" | "gp">;
  compact?: boolean;
}) {
  return (
    <div className={`w-full grid grid-cols-2 gap-2 ${compact ? "mt-3" : "mt-4 mb-2"}`}>
      {RESOURCE_BARS.map((bar) => (
        <ResourceBar
          key={bar.key}
          stat={bar}
          current={current[bar.key]}
          max={max[bar.key]}
        />
      ))}
    </div>
  );
}

function getOtherSide(side: MatchSide): MatchSide {
  return side === "home" ? "away" : "home";
}

function CoachStatValue({
  value,
  baseValue,
  className = "text-xl md:text-2xl font-black",
}: {
  value: number;
  baseValue: number;
  className?: string;
}) {
  const kind = getStatModifierKind(baseValue, value);
  const colorClass =
    kind === "boost"
      ? "text-emerald-300"
      : kind === "nerf"
        ? "text-red-300"
        : "text-white";

  return (
    <span
      className={`tabular-nums ${className} ${colorClass}`}
      title={kind !== "neutral" ? `Base: ${baseValue}` : undefined}
    >
      {value}
      {kind !== "neutral" && (
        <span className="block text-[8px] font-bold opacity-70 line-through text-slate-400">
          {baseValue}
        </span>
      )}
    </span>
  );
}

export function DuelModal({
  homePlayer,
  awayPlayer,
  homeTeamName,
  awayTeamName,
  currentTurn,
  duelContext,
  format,
  onClose,
  onApplyDuel,
}: DuelModalProps) {
  const normalizedHomePlayer = normalizePlayerWithMoves(homePlayer);
  const normalizedAwayPlayer = normalizePlayerWithMoves(awayPlayer);
  const homeTeam = useMatchStore((state) => state.homeTeam);
  const awayTeam = useMatchStore((state) => state.awayTeam);
  const homeCoach = getActiveCoach(homeTeam);
  const awayCoach = getActiveCoach(awayTeam);
  const actionStarter = getDuelActionStarter(duelContext);
  const weather = useMatchStore((state) => state.weather);
  const matchFacilityState = useMatchStore((state) => state.matchFacilityState);
  const getPlayerResources = useMatchStore((state) => state.getPlayerResources);
  const spendPlayerResources = useMatchStore((state) => state.spendPlayerResources);
  const restorePlayerResources = useMatchStore((state) => state.restorePlayerResources);
  const useMatchFacilityAbility = useMatchStore((state) => state.useMatchFacilityAbility);
  const recordSuperMoveUsage = useMatchStore((state) => state.recordSuperMoveUsage);
  const recordMoveUsage = useMatchStore((state) => state.recordMoveUsage);
  const burningPhaseActive = useMatchStore((state) => state.burningPhaseActive);
  const homeFacilities = getTeamFacilities(homeTeam);
  const awayFacilities = getTeamFacilities(awayTeam);
  const resourceCostOptions = {
    format,
    homeFacilities,
    awayFacilities,
  };
  const [phase, setPhase] = useState<DuelPhase>("intro");
  const [selectedAction, setSelectedAction] = useState<ActionCategory | null>(null);
  const [selectedMoveId, setSelectedMoveId] = useState<number | null>(null);
  const [shotDistance, setShotDistance] = useState("");
  const [homeAction, setHomeAction] = useState<DuelActionPick | null>(null);
  const [awayAction, setAwayAction] = useState<DuelActionPick | null>(null);
  const [duelResolution, setDuelResolution] = useState<DuelResolution | null>(null);
  const [duelDebugText, setDuelDebugText] = useState<string | null>(null);
  const [moveLevelUps, setMoveLevelUps] = useState<MatchMoveLevelUpEvent[]>([]);
  const [penaltyAreaShotBlock, setPenaltyAreaShotBlock] = useState<PenaltyAreaShotBlockResult | null>(null);
  const [defenderClashResolution, setDefenderClashResolution] = useState<DuelResolution | null>(null);
  const [penaltyAreaOutcome, setPenaltyAreaOutcome] = useState<
    "blocked" | "foul" | "to-gk" | "open-goal" | null
  >(null);
  const [goalkeeperAction, setGoalkeeperAction] = useState<DuelActionPick | null>(null);
  const resourceSnapshotRef = useRef<PlayerResourcesMap>({});

  const defendingSide = getDefendingSide(duelContext.ballSide);
  const defendingTeam = defendingSide === "home" ? homeTeam : awayTeam;
  const goalkeeperPlayerRaw =
    defendingTeam ? getGoalkeeperFromTeam(defendingTeam, format) : null;
  const goalkeeperPlayer = goalkeeperPlayerRaw
    ? normalizePlayerWithMoves(goalkeeperPlayerRaw)
    : null;
  const goalkeeperDuelContext: DuelContext = {
    type: "GOAL",
    ballSide: duelContext.ballSide,
    inPenaltyArea: false,
    goalkeeperInSmallArea: duelContext.goalkeeperInSmallArea,
  };

  const secondPicker = getOtherSide(actionStarter);

  const toMatchStats = (player: PlayerWithDetails, coach: ReturnType<typeof getActiveCoach>) => {
    const stats = getEffectiveStats(player, coach);
    const duelStats = applyWeatherToDuelStats(
      {
        kick: stats.kick,
        body: stats.body,
        control: stats.control,
        guard: stats.guard,
        speed: stats.speed,
        stamina: stats.stamina,
        guts: stats.guts,
      },
      weather,
    );
    return { ...stats, ...duelStats };
  };

  const homeStats = toMatchStats(normalizedHomePlayer, homeCoach);
  const awayStats = toMatchStats(normalizedAwayPlayer, awayCoach);
  const homeBaseStats = getDisplayStats(normalizedHomePlayer);
  const awayBaseStats = getDisplayStats(normalizedAwayPlayer);

  useEffect(() => {
    if (phase !== "intro") return;
    const timer = setTimeout(() => setPhase("actions-overview"), INTRO_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const resetPickerState = () => {
    setSelectedAction(null);
    setSelectedMoveId(null);
    setShotDistance("");
  };

  const handleContinueFromOverview = () => {
    resourceSnapshotRef.current = {
      [normalizedHomePlayer.id]: getPlayerResources(normalizedHomePlayer.id) ?? {
        tp: homeStats.tp,
        gp: homeStats.gp,
      },
      [normalizedAwayPlayer.id]: getPlayerResources(normalizedAwayPlayer.id) ?? {
        tp: awayStats.tp,
        gp: awayStats.gp,
      },
    };
    setPhase("pick-first");
    resetPickerState();
  };

  const getPlayerResourceState = (player: PlayerWithDetails, isHome: boolean) => {
    const coach = isHome ? homeCoach : awayCoach;
    const max = getEffectiveStats(player, coach);
    const current = getPlayerResources(player.id) ?? { tp: max.tp, gp: max.gp };
    return { current, max: { tp: max.tp, gp: max.gp } };
  };

  const getSideInfo = (side: MatchSide) => {
    const isHome = side === "home";
    const player = isHome ? normalizedHomePlayer : normalizedAwayPlayer;
    const stats = isHome ? homeStats : awayStats;
    const baseStats = isHome ? homeBaseStats : awayBaseStats;
    return {
      side,
      isHome,
      player,
      stats,
      baseStats,
      resources: getPlayerResourceState(player, isHome),
      teamName: isHome ? homeTeamName : awayTeamName,
      label: isHome ? "LOCAL" : "VISITANTE",
      colorClass: isHome ? "text-blue-400" : "text-red-400",
      bgGradient: isHome ? "from-blue-600 to-blue-900" : "from-red-600 to-red-900",
      borderColor: isHome ? "border-blue-400" : "border-red-400",
      role: getPlayerDuelRole(side, duelContext, normalizedHomePlayer, normalizedAwayPlayer, format),
    };
  };

  const starterInfo = getSideInfo(actionStarter);
  const secondInfo = getSideInfo(secondPicker);

  const buildGoalkeeperActionPick = (action: ActionCategory): DuelActionPick | null => {
    const pick: DuelActionPick = { category: action };

    if (isSuperAction(action)) {
      if (!goalkeeperPlayer) return null;
      const moves = getPlayerSuperMoves(goalkeeperPlayer, action);
      const move = moves.find((m) => m.id === selectedMoveId);
      if (!move) return null;
      pick.moveId = move.id;
      pick.moveName = move.name;
    }

    return pick;
  };

  const canConfirmGoalkeeperSelection = (): boolean => {
    if (!selectedAction || !goalkeeperPlayer) return false;

    if (isSuperAction(selectedAction)) {
      const moves = getPlayerSuperMoves(goalkeeperPlayer, selectedAction);
      if (moves.length === 0) return false;
      if (!selectedMoveId) return false;
    }

    const pick = buildGoalkeeperActionPick(selectedAction);
    if (!pick) return false;

    const cost = getDuelActionResourceCost(
      pick,
      goalkeeperPlayer,
      weather,
      defendingSide === "home" ? homeCoach : awayCoach,
      { ...resourceCostOptions, side: defendingSide },
    );
    const current =
      getPlayerResources(goalkeeperPlayer.id) ?? {
        tp: getEffectiveStats(goalkeeperPlayer, defendingSide === "home" ? homeCoach : awayCoach).tp,
        gp: getEffectiveStats(goalkeeperPlayer, defendingSide === "home" ? homeCoach : awayCoach).gp,
      };
    return current.tp >= cost.tp && current.gp >= cost.gp;
  };

  const buildActionPick = (side: MatchSide, action: ActionCategory): DuelActionPick | null => {
    const info = getSideInfo(side);
    const pick: DuelActionPick = { category: action };

    if (isSuperAction(action)) {
      const moves = getPlayerSuperMoves(info.player, action);
      const move = moves.find((m) => m.id === selectedMoveId);
      if (!move) return null;
      pick.moveId = move.id;
      pick.moveName = move.name;
    }

    if (isShotAction(action)) {
      if (shotDistance.trim() === "") return null;
      const distance = Number(shotDistance);
      if (!Number.isFinite(distance) || distance < 0) return null;
      pick.shotDistance = Math.floor(distance);
    }

    return pick;
  };

  const canConfirmSelection = (side: MatchSide): boolean => {
    if (!selectedAction) return false;
    const info = getSideInfo(side);

    if (isSuperAction(selectedAction)) {
      const moves = getPlayerSuperMoves(info.player, selectedAction);
      if (moves.length === 0) return false;
      if (!selectedMoveId) return false;
    }

    if (isShotAction(selectedAction)) {
      if (shotDistance.trim() === "") return false;
      const distance = Number(shotDistance);
      if (!Number.isFinite(distance) || distance < 0) return false;
    }

    const pick = buildActionPick(side, selectedAction);
    if (!pick) return false;

    const cost = getDuelActionResourceCost(
      pick,
      info.player,
      weather,
      info.isHome ? homeCoach : awayCoach,
      { ...resourceCostOptions, side },
    );
    const { current } = info.resources;
    return current.tp >= cost.tp && current.gp >= cost.gp;
  };

  const matchDuelBase = () => ({
    homePlayer: normalizedHomePlayer,
    awayPlayer: normalizedAwayPlayer,
    duelContext,
    currentTurn,
    weather,
    homeCoach,
    awayCoach,
    matchFormat: format,
    homeFacilities,
    awayFacilities,
    matchFacilityState,
    burningPhase: burningPhaseActive,
  });

  const recordPickedMoveLevelUps = (
    nextHome: DuelActionPick,
    nextAway: DuelActionPick,
  ) => {
    const matchUsages = useMatchStore.getState().matchStats.moveUsages ?? [];
    const levelUps: MatchMoveLevelUpEvent[] = [];

    if (nextHome.moveId != null) {
      const preview = previewPlayerMoveLevelUp(
        normalizedHomePlayer,
        nextHome.moveId,
        matchUsages,
      );
      if (preview) levelUps.push({ ...preview, side: "home" });
      recordSuperMoveUsage("home", nextHome.moveName!);
    }
    if (nextAway.moveId != null) {
      const preview = previewPlayerMoveLevelUp(
        normalizedAwayPlayer,
        nextAway.moveId,
        matchUsages,
      );
      if (preview) levelUps.push({ ...preview, side: "away" });
      recordSuperMoveUsage("away", nextAway.moveName!);
    }

    setMoveLevelUps(levelUps);
  };

  const finishFieldDuelResolution = (
    nextHome: DuelActionPick,
    nextAway: DuelActionPick,
  ) => {
    const { resolution, debugText } = resolveMatchDuel({
      ...matchDuelBase(),
      homeAction: nextHome,
      awayAction: nextAway,
    });
    setDuelResolution(resolution);
    setDuelDebugText(debugText);
    recordPickedMoveLevelUps(nextHome, nextAway);
    setPhase("resolution");
  };

  const finishPenaltyAreaShotResolution = (
    nextHome: DuelActionPick,
    nextAway: DuelActionPick,
  ) => {
    const { resolution, debugText, block, clashResolution } = resolvePenaltyAreaShotBlockMatch({
      ...matchDuelBase(),
      homeAction: nextHome,
      awayAction: nextAway,
    });

    recordPickedMoveLevelUps(nextHome, nextAway);

    setPenaltyAreaShotBlock(block);
    setDefenderClashResolution(clashResolution);
    setDuelDebugText(debugText);
    setHomeAction(nextHome);
    setAwayAction(nextAway);

    if (block.foul) {
      setPenaltyAreaOutcome("foul");
      setDuelResolution(resolution);
      setPhase("resolution-defender");
      return;
    }

    if (block.blocked) {
      setPenaltyAreaOutcome("blocked");
      setDuelResolution(resolution);
      setPhase("resolution-defender");
      return;
    }

    if (!goalkeeperPlayer || !shouldAttemptGoalkeeperSave(duelContext)) {
      const attackerSide = duelContext.ballSide;
      const openGoalResolution: DuelResolution = {
        winnerSide: attackerSide,
        homePower: attackerSide === "home" ? block.residualPower : 0,
        awayPower: attackerSide === "away" ? block.residualPower : 0,
        homeBreakdown:
          attackerSide === "home"
            ? { ...block.shotBreakdown, total: block.residualPower }
            : block.defenderBreakdown,
        awayBreakdown:
          attackerSide === "away"
            ? { ...block.shotBreakdown, total: block.residualPower }
            : block.defenderBreakdown,
        effects: {
          goalScored: true,
          goalSide: attackerSide,
          possessionChange: true,
          newBallSide: defendingSide,
        },
        burningPhase: block.burningPhase,
        isBurningPhase: block.isBurningPhase,
      };
      setPenaltyAreaOutcome("open-goal");
      setDuelResolution(openGoalResolution);
      setPhase("resolution-defender");
      return;
    }

    setPenaltyAreaOutcome("to-gk");
    setDuelResolution(null);
    setPhase("resolution-defender");
  };

  const handleConfirmDefenderPhase = () => {
    if (!duelResolution || !homeAction || !awayAction) return;
    handleConfirmDuel();
  };

  const confirmActionPick = (pickingSide: MatchSide, pick: DuelActionPick) => {
    if (phase === "pick-goalkeeper") {
      if (!goalkeeperPlayer || !penaltyAreaShotBlock || !homeAction || !awayAction) {
        return false;
      }

      const gkCost = getDuelActionResourceCost(
        pick,
        goalkeeperPlayer,
        weather,
        defendingSide === "home" ? homeCoach : awayCoach,
        { ...resourceCostOptions, side: defendingSide },
      );
      if (!spendPlayerResources(goalkeeperPlayer.id, gkCost)) return false;

      const { resolution, debugText } = resolvePenaltyAreaShotGoalkeeperMatch({
        ...matchDuelBase(),
        homeAction,
        awayAction,
        goalkeeperPlayer,
        goalkeeperAction: pick,
        block: penaltyAreaShotBlock,
      });

      setGoalkeeperAction(pick);
      setDuelResolution(resolution);
      setDuelDebugText(debugText);

      if (pick.moveId != null) {
        const matchUsages = useMatchStore.getState().matchStats.moveUsages ?? [];
        const preview = previewPlayerMoveLevelUp(
          goalkeeperPlayer,
          pick.moveId,
          matchUsages,
        );
        if (preview) {
          setMoveLevelUps((prev) => [...prev, { ...preview, side: defendingSide }]);
        }
        recordSuperMoveUsage(defendingSide, pick.moveName!);
      }

      setPhase("resolution");
      return true;
    }

    const info = getSideInfo(pickingSide);
    const cost = getDuelActionResourceCost(
      pick,
      info.player,
      weather,
      info.isHome ? homeCoach : awayCoach,
      { ...resourceCostOptions, side: pickingSide },
    );
    if (!spendPlayerResources(info.player.id, cost)) return false;

    if (phase === "pick-first") {
      if (actionStarter === "home") setHomeAction(pick);
      else setAwayAction(pick);
      setPhase("transition");
      resetPickerState();
      return true;
    }

    if (phase === "pick-second") {
      const nextHome = actionStarter === "home" ? homeAction! : pick;
      const nextAway = actionStarter === "away" ? awayAction! : pick;
      if (actionStarter === "home") setAwayAction(pick);
      else setHomeAction(pick);

      const attackerPick = actionStarter === "home" ? nextHome : nextAway;
      const isPenaltyAreaShot =
        duelContext.type === "FIELD" &&
        duelContext.inPenaltyArea &&
        isShotAction(attackerPick.category);

      if (isPenaltyAreaShot) {
        finishPenaltyAreaShotResolution(nextHome, nextAway);
      } else {
        finishFieldDuelResolution(nextHome, nextAway);
      }
      return true;
    }

    return false;
  };

  const handleConfirmAction = () => {
    if (!selectedAction) return;

    if (phase === "pick-goalkeeper") {
      if (!canConfirmGoalkeeperSelection()) return;
      const pick = buildGoalkeeperActionPick(selectedAction);
      if (!pick) return;
      confirmActionPick(defendingSide, pick);
      return;
    }

    const pickingSide = phase === "pick-first" ? actionStarter : secondPicker;
    if (!canConfirmSelection(pickingSide)) return;

    const pick = buildActionPick(pickingSide, selectedAction);
    if (!pick) return;

    confirmActionPick(pickingSide, pick);
  };

  const handleClose = (skipRestore = false) => {
    if (!skipRestore && Object.keys(resourceSnapshotRef.current).length > 0) {
      restorePlayerResources(resourceSnapshotRef.current);
    }
    onClose();
  };

  const handleRollbackDuel = () => {
    restorePlayerResources(resourceSnapshotRef.current);
    setHomeAction(null);
    setAwayAction(null);
    setDuelResolution(null);
    setDuelDebugText(null);
    setMoveLevelUps([]);
    setPenaltyAreaShotBlock(null);
    setDefenderClashResolution(null);
    setPenaltyAreaOutcome(null);
    setGoalkeeperAction(null);
    setPhase("actions-overview");
    resetPickerState();
  };

  const handleConfirmDuel = () => {
    if (!duelResolution || !homeAction || !awayAction) return;

    if (homeAction.moveId != null && homeTeam) {
      recordMoveUsage({
        turn: currentTurn,
        side: "home",
        clubId: homeTeam.id,
        playerId: homePlayer.id,
        playerName: homePlayer.name,
        moveId: homeAction.moveId,
        moveName: homeAction.moveName ?? "",
      });
    }
    if (awayAction.moveId != null && awayTeam) {
      recordMoveUsage({
        turn: currentTurn,
        side: "away",
        clubId: awayTeam.id,
        playerId: awayPlayer.id,
        playerName: awayPlayer.name,
        moveId: awayAction.moveId,
        moveName: awayAction.moveName ?? "",
      });
    }
    if (goalkeeperAction?.moveId != null && goalkeeperPlayer && defendingTeam) {
      recordMoveUsage({
        turn: currentTurn,
        side: defendingSide,
        clubId: defendingTeam.id,
        playerId: goalkeeperPlayer.id,
        playerName: goalkeeperPlayer.name,
        moveId: goalkeeperAction.moveId,
        moveName: goalkeeperAction.moveName ?? "",
      });
    }

    onApplyDuel?.(
      duelResolution,
      {
        home: homeAction,
        away: awayAction,
        goalkeeper: goalkeeperAction ?? undefined,
      },
      {
        goalkeeperPlayer: goalkeeperAction ? goalkeeperPlayer ?? undefined : undefined,
        penaltyAreaShotBlock: penaltyAreaShotBlock ?? undefined,
      },
    );
    handleClose(true);
  };

  const handleNullifyFoul = (side: MatchSide) => {
    if (!duelResolution?.foul) return;
    const result = useMatchFacilityAbility(side, "NULLIFY_FOUL");
    if (!result.success) return;
    setDuelResolution(
      nullifyDuelFoul(
        duelResolution,
        duelContext.ballSide,
        getEffectiveDuelType(duelContext),
      ),
    );
  };

  const handleRevealOpponentCommand = (side: MatchSide) => {
    useMatchFacilityAbility(side, "REVEAL_OPPONENT_COMMAND");
  };

  const handleActionSelect = (action: ActionCategory) => {
    setSelectedAction(action);
    setSelectedMoveId(null);
    if (!isShotAction(action)) setShotDistance("");
  };

  const DuelistCard = ({
    player,
    stats,
    baseStats,
    resources,
    isHome,
    highlight = false,
    compact = false,
    roleLabel,
  }: {
    player: PlayerWithDetails;
    stats: ReturnType<typeof getEffectiveStats>;
    baseStats: ReturnType<typeof getDisplayStats>;
    resources: { current: PlayerMatchResources; max: Pick<PlayerStats, "tp" | "gp"> };
    isHome: boolean;
    highlight?: boolean;
    compact?: boolean;
    roleLabel?: string;
  }) => {
    const positionNum = format === "11v11" ? player.position11 : player.position4;
    const bgGradient = isHome ? "from-blue-600 to-blue-900" : "from-red-600 to-red-900";
    const shadowColor = isHome ? "rgba(37,99,235,0.4)" : "rgba(220,38,38,0.4)";

    return (
      <div
        className={`relative flex-1 rounded-3xl bg-linear-to-br ${bgGradient} border ${
          highlight ? "border-amber-400/60 ring-2 ring-amber-400/40" : "border-white/10"
        } shadow-[0_0_40px_${shadowColor}] flex flex-col items-center justify-between overflow-hidden ${
          compact ? "p-4 max-w-sm mx-auto w-full" : "p-6"
        }`}
      >
        <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none" />

        <div className="relative z-10 w-full flex flex-col items-center">
          {highlight && (
            <div className="absolute top-10 right-0 z-20 flex items-center gap-1 bg-amber-500/90 text-amber-950 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">
              <Play className="w-3 h-3 fill-current" />
              Elige acción
            </div>
          )}

          <div className="w-full flex justify-between items-start mb-4">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-80">
              {isHome ? "LOCAL" : "VISITANTE"}
            </span>
            <div className="bg-black/50 px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
              <span className="text-[10px] text-slate-300 font-mono uppercase tracking-widest">POS</span>
              <span className="text-sm font-black">{positionNum}</span>
            </div>
          </div>

          <PlayerSpriteAvatar
            spriteUrl={player.spriteUrl}
            alt={player.name}
            className={`border-4 shadow-2xl mb-4 ${
              isHome ? "border-blue-400" : "border-red-400"
            } ${compact ? "w-24 h-24" : "w-32 h-32 md:w-48 md:h-48"}`}
          />

          <h2
            className={`font-black uppercase tracking-tighter text-center leading-none drop-shadow-md ${
              compact ? "text-xl" : "text-2xl md:text-3xl"
            }`}
          >
            {player.name}
          </h2>

          {roleLabel && (
            <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-amber-300/90 bg-black/40 px-3 py-1 rounded-full border border-amber-400/30">
              {roleLabel}
            </span>
          )}

          <div className="mt-1 mb-2 flex flex-wrap justify-center gap-1 text-[10px] text-white/70">
            <span className="bg-black/40 px-2 py-0.5 rounded">{player.element}</span>
          </div>

          <TpGpBars current={resources.current} max={resources.max} compact={compact} />

          {!compact && (
            <div className="w-full grid grid-cols-3 gap-2 bg-black/30 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <Swords className="w-4 h-4 text-amber-400 mb-1 opacity-80" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ATA</span>
                <CoachStatValue value={stats.kick} baseValue={baseStats.kick} />
              </div>
              <div className="flex flex-col items-center border-x border-white/10">
                <ShieldHalf className="w-4 h-4 text-emerald-400 mb-1 opacity-80" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">DEF</span>
                <CoachStatValue value={stats.guard} baseValue={baseStats.guard} />
              </div>
              <div className="flex flex-col items-center">
                <Zap className="w-4 h-4 text-cyan-400 mb-1 opacity-80" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">VEL</span>
                <CoachStatValue value={stats.speed} baseValue={baseStats.speed} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActionSelector = (side: MatchSide) => {
    const info = getSideInfo(side);
    const availableActions = getAvailableDuelActions(info.player, format, info.role, duelContext);
    const superMoves = selectedAction && isSuperAction(selectedAction)
      ? getPlayerSuperMoves(info.player, selectedAction)
      : [];

    const groups = [
      { key: "ataque" as const, label: "Ataque", icon: Target },
      { key: "defensa" as const, label: "Defensa", icon: Shield },
      { key: "portero" as const, label: "Portero", icon: Goal },
    ];

    return (
      <div className="flex flex-col gap-6">
        <DuelistCard
          player={info.player}
          stats={info.stats}
          baseStats={info.baseStats}
          resources={info.resources}
          isHome={info.isHome}
          highlight
          compact
          roleLabel={getDuelRoleLabel(info.role)}
        />

        <div className="space-y-4">
          <p className="text-center text-sm text-slate-400">
            <span className={`font-black uppercase ${info.colorClass}`}>{info.label}</span>
            {" "}({info.teamName}) — elige la acción
          </p>

          {availableActions.length === 0 ? (
            <p className="text-center text-sm text-red-400/80 py-4">
              No hay acciones disponibles para este rol.
            </p>
          ) : (
            groups.map(({ key, label, icon: Icon }) => {
              const actions = availableActions.filter((a) => a.group === key);
              if (actions.length === 0) return null;

              return (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {actions.map((action) => {
                      const previewPick: DuelActionPick = { category: action.id };
                      const cost = getDuelActionResourceCost(
                        previewPick,
                        info.player,
                        weather,
                        info.isHome ? homeCoach : awayCoach,
                        { ...resourceCostOptions, side },
                      );
                      const canAfford =
                        info.resources.current.tp >= cost.tp &&
                        info.resources.current.gp >= cost.gp;
                      const showGp = cost.gp > 0;
                      const showTp = cost.tp > 0;

                      return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => handleActionSelect(action.id)}
                        className={`px-3 py-3 rounded-xl border text-sm font-bold uppercase tracking-wide transition-all active:scale-95 flex flex-col items-center gap-1 ${
                          selectedAction === action.id
                            ? "bg-amber-500 border-amber-400 text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                            : canAfford
                              ? "bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-800"
                              : "bg-slate-900/60 border-slate-800 text-slate-500 opacity-60"
                        }`}
                      >
                        <span>{action.label}</span>
                        {(showGp || showTp) && (
                          <span
                            className={`text-[9px] font-black tracking-widest ${
                              canAfford ? "text-amber-300/90" : "text-red-400/80"
                            }`}
                          >
                            {showGp && `-${cost.gp} GP`}
                            {showGp && showTp && " · "}
                            {showTp && `-${cost.tp} TP`}
                          </span>
                        )}
                      </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {selectedAction && isSuperAction(selectedAction) && (
            <SuperMoveSelector
              moves={superMoves}
              selectedMoveId={selectedMoveId}
              onSelect={setSelectedMoveId}
              currentTp={info.resources.current.tp}
              maxTp={info.resources.max.tp}
              playerElement={info.player.element}
            />
          )}

          {selectedAction && isShotAction(selectedAction) && (
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-cyan-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                    Distancia del tiro (franjas)
                  </p>
                </div>
                {shotDistance.trim() !== "" && Number.isFinite(Number(shotDistance)) && Number(shotDistance) >= 0 && (
                  <span className="text-xs font-black text-cyan-200 tabular-nums">
                    × {formatShotDistanceMultiplier(Number(shotDistance))}
                  </span>
                )}
              </div>
              <input
                type="number"
                min={0}
                step={1}
                value={shotDistance}
                onChange={(e) => setShotDistance(e.target.value)}
                placeholder="Ej: 3"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-lg font-bold focus:outline-none focus:border-cyan-400"
              />
              {shotDistance.trim() !== "" && Number.isFinite(Number(shotDistance)) && getShotDistanceMultiplier(Number(shotDistance)) === 0 && (
                <p className="text-xs text-red-400/90 font-bold">
                  A 12+ franjas el tiro no tiene poder efectivo (0%).
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={!canConfirmSelection(side)}
          onClick={handleConfirmAction}
          className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-linear-to-r from-amber-500 to-amber-600 border-b-4 border-amber-800 text-amber-950 shadow-[0_0_30px_rgba(245,158,11,0.3)] enabled:hover:shadow-[0_0_50px_rgba(245,158,11,0.5)]"
        >
          Confirmar acción
        </button>
      </div>
    );
  };

  const GoalkeeperActionSelector = () => {
    if (!goalkeeperPlayer) {
      return (
        <p className="text-center text-sm text-red-400/80 py-8">
          No hay portero disponible en el once.
        </p>
      );
    }

    const isHome = defendingSide === "home";
    const coach = isHome ? homeCoach : awayCoach;
    const gkStats = toMatchStats(goalkeeperPlayer, coach);
    const gkBaseStats = getDisplayStats(goalkeeperPlayer);
    const gkResources = getPlayerResourceState(goalkeeperPlayer, isHome);
    const availableActions = getAvailableDuelActions(
      goalkeeperPlayer,
      format,
      "goalkeeper",
      goalkeeperDuelContext,
    );
    const superMoves =
      selectedAction && isSuperAction(selectedAction)
        ? getPlayerSuperMoves(goalkeeperPlayer, selectedAction)
        : [];
    const teamName = isHome ? homeTeamName : awayTeamName;
    const colorClass = isHome ? "text-blue-400" : "text-red-400";
    const residual = penaltyAreaShotBlock?.residualPower ?? 0;

    return (
      <div className="flex flex-col gap-6">
        {penaltyAreaShotBlock && (
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-4 text-center space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
              Tiro en el área
            </p>
            <p className="text-sm text-slate-300">
              Tiro <span className="font-black text-white">{penaltyAreaShotBlock.shotPower}</span>
              {" − "}
              Defensa <span className="font-black text-white">{penaltyAreaShotBlock.defenderPower}</span>
              {" = "}
              <span className="font-black text-cyan-300">{residual}</span> de poder residual
            </p>
          </div>
        )}

        <DuelistCard
          player={goalkeeperPlayer}
          stats={gkStats}
          baseStats={gkBaseStats}
          resources={gkResources}
          isHome={isHome}
          highlight
          compact
          roleLabel="Portero"
        />

        <div className="space-y-4">
          <p className="text-center text-sm text-slate-400">
            <span className={`font-black uppercase ${colorClass}`}>
              {isHome ? "LOCAL" : "VISITANTE"}
            </span>
            {" "}({teamName}) — el portero intenta la parada
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableActions.map((action) => {
              const previewPick: DuelActionPick = { category: action.id };
              const cost = getDuelActionResourceCost(
                previewPick,
                goalkeeperPlayer,
                weather,
                coach,
                { ...resourceCostOptions, side: defendingSide },
              );
              const canAfford =
                gkResources.current.tp >= cost.tp &&
                gkResources.current.gp >= cost.gp;

              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleActionSelect(action.id)}
                  className={`px-3 py-3 rounded-xl border text-sm font-bold uppercase tracking-wide transition-all active:scale-95 flex flex-col items-center gap-1 ${
                    selectedAction === action.id
                      ? "bg-amber-500 border-amber-400 text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                      : canAfford
                        ? "bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-800"
                        : "bg-slate-900/60 border-slate-800 text-slate-500 opacity-60"
                  }`}
                >
                  <span>{action.label}</span>
                  {(cost.gp > 0 || cost.tp > 0) && (
                    <span
                      className={`text-[9px] font-black tracking-widest ${
                        canAfford ? "text-amber-300/90" : "text-red-400/80"
                      }`}
                    >
                      {cost.gp > 0 && `-${cost.gp} GP`}
                      {cost.gp > 0 && cost.tp > 0 && " · "}
                      {cost.tp > 0 && `-${cost.tp} TP`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedAction && isSuperAction(selectedAction) && (
            <SuperMoveSelector
              moves={superMoves}
              selectedMoveId={selectedMoveId}
              onSelect={setSelectedMoveId}
              currentTp={gkResources.current.tp}
              maxTp={gkResources.max.tp}
              playerElement={goalkeeperPlayer.element}
            />
          )}
        </div>

        <button
          type="button"
          disabled={!canConfirmGoalkeeperSelection()}
          onClick={handleConfirmAction}
          className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-linear-to-r from-amber-500 to-amber-600 border-b-4 border-amber-800 text-amber-950 shadow-[0_0_30px_rgba(245,158,11,0.3)] enabled:hover:shadow-[0_0_50px_rgba(245,158,11,0.5)]"
        >
          Confirmar parada
        </button>
      </div>
    );
  };

  const renderBody = () => {
    if (phase === "intro") {
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

          <div className="flex flex-col md:flex-row gap-6 md:gap-12 relative">
            <DuelistCard
              player={normalizedHomePlayer}
              stats={homeStats}
              baseStats={homeBaseStats}
              resources={getPlayerResourceState(normalizedHomePlayer, true)}
              isHome
              highlight={actionStarter === "home"}
              roleLabel={getDuelRoleLabel(getSideInfo("home").role)}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-slate-950 p-4 rounded-full border-4 border-slate-800 shadow-2xl hidden md:flex">
              <span className="text-4xl font-black italic text-amber-500 tracking-tighter -ml-1 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                VS
              </span>
            </div>
            <div className="md:hidden flex items-center justify-center w-full my-[-30px] z-20">
              <div className="bg-slate-950 p-3 rounded-full border-4 border-slate-800 shadow-2xl">
                <span className="text-2xl font-black italic text-amber-500 tracking-tighter -ml-1">VS</span>
              </div>
            </div>
            <DuelistCard
              player={normalizedAwayPlayer}
              stats={awayStats}
              baseStats={awayBaseStats}
              resources={getPlayerResourceState(normalizedAwayPlayer, false)}
              isHome={false}
              highlight={actionStarter === "away"}
              roleLabel={getDuelRoleLabel(getSideInfo("away").role)}
            />
          </div>
        </div>
      );
    }

    if (phase === "actions-overview") {
      return (
        <DuelActionsOverview
          homeInfo={getSideInfo("home")}
          awayInfo={getSideInfo("away")}
          duelContext={duelContext}
          format={format}
          weather={weather}
          homeCoach={homeCoach}
          awayCoach={awayCoach}
          homeFacilities={homeFacilities}
          awayFacilities={awayFacilities}
          actionStarter={actionStarter}
          onContinue={handleContinueFromOverview}
        />
      );
    }

    if (phase === "pick-first") {
      return renderActionSelector(actionStarter);
    }

    if (phase === "transition") {
      return (
        <div className="flex flex-col items-center justify-center gap-8 py-12 max-w-lg mx-auto text-center">
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-10 w-full flex flex-col items-center gap-6">
            <div className="bg-slate-700/50 p-5 rounded-full border border-slate-600">
              <Smartphone className="w-12 h-12 text-slate-300" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-100">
                Pasa el móvil
              </p>
              <p className="text-sm text-slate-500">
                Entrega el dispositivo al otro equipo sin mostrar la pantalla
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPhase("pick-second");
              resetPickerState();
            }}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-lg transition-all active:scale-95 bg-slate-800 border-2 border-slate-600 hover:border-amber-400/50 text-white flex items-center justify-center gap-2"
          >
            Listo, siguiente equipo
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (phase === "pick-second") {
      const pickerSide = secondPicker;
      const spyAbilities = getAvailableMatchAbilities(
        pickerSide,
        pickerSide === "home" ? homeFacilities : awayFacilities,
        matchFacilityState.usedAbilities,
        "opponent_pick",
      );
      const opponentPick =
        actionStarter === "home" ? awayAction : homeAction;

      return (
        <div className="space-y-4">
          {spyAbilities.includes("REVEAL_OPPONENT_COMMAND") && (
            <button
              type="button"
              onClick={() => handleRevealOpponentCommand(pickerSide)}
              className="w-full py-3 rounded-xl border-2 border-violet-500/40 bg-violet-950/40 text-violet-200 text-xs font-black uppercase tracking-widest hover:border-violet-400"
            >
              {MATCH_FACILITY_ABILITY_LABELS.REVEAL_OPPONENT_COMMAND}
            </button>
          )}
          {matchFacilityState.usedAbilities.REVEAL_OPPONENT_COMMAND === pickerSide &&
            opponentPick && (
              <div className="rounded-xl border border-violet-500/30 bg-violet-950/30 px-4 py-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-300 mb-1">
                  Comando rival revelado
                </p>
                <p className="text-sm font-bold text-white">
                  {formatActionPickSummary(opponentPick)}
                </p>
              </div>
            )}
          {renderActionSelector(secondPicker)}
        </div>
      );
    }

    if (phase === "transition-gk") {
      const defendingInfo = getSideInfo(defendingSide);
      return (
        <div className="flex flex-col items-center justify-center gap-8 py-12 max-w-lg mx-auto text-center">
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-3xl p-8 w-full space-y-4">
            <p className="text-lg font-black uppercase tracking-tight text-emerald-300">
              El tiro supera al defensor
            </p>
            {penaltyAreaShotBlock && (
              <p className="text-sm text-slate-400">
                Poder residual del tiro:{" "}
                <span className="font-black text-white">{penaltyAreaShotBlock.residualPower}</span>
              </p>
            )}
            <p className="text-sm text-slate-500">
              El portero ({goalkeeperPlayer?.name ?? "—"}) puede intentar la parada.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-10 w-full flex flex-col items-center gap-6">
            <div className="bg-slate-700/50 p-5 rounded-full border border-slate-600">
              <Smartphone className="w-12 h-12 text-slate-300" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-100">
                Pasa el móvil
              </p>
              <p className="text-sm text-slate-500">
                Entrega el dispositivo a{" "}
                <span className={`font-black ${defendingInfo.colorClass}`}>
                  {defendingInfo.label}
                </span>{" "}
                para la parada del portero
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPhase("pick-goalkeeper");
              resetPickerState();
            }}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-lg transition-all active:scale-95 bg-slate-800 border-2 border-slate-600 hover:border-emerald-400/50 text-white flex items-center justify-center gap-2"
          >
            Listo, elegir parada
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (phase === "pick-goalkeeper") {
      return <GoalkeeperActionSelector />;
    }

    if (
      phase === "resolution-defender" &&
      defenderClashResolution &&
      homeAction &&
      awayAction &&
      penaltyAreaShotBlock
    ) {
      const resolutionToDisplay =
        penaltyAreaOutcome === "open-goal" && duelResolution
          ? duelResolution
          : defenderClashResolution;
      const foulSideForNullify = resolutionToDisplay.foul?.foulSide ?? null;
      const nullifyAbilities =
        foulSideForNullify != null
          ? getAvailableMatchAbilities(
              foulSideForNullify,
              foulSideForNullify === "home" ? homeFacilities : awayFacilities,
              matchFacilityState.usedAbilities,
              "foul",
            )
          : [];

      return (
        <div className="space-y-4">
          <MoveLevelUpCelebration events={moveLevelUps} />
          <DuelResolutionView
            resolution={resolutionToDisplay}
            debugText={duelDebugText ?? undefined}
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            homePlayerName={normalizedHomePlayer.name}
            awayPlayerName={normalizedAwayPlayer.name}
            homeAction={homeAction}
            awayAction={awayAction}
            resolutionStep="defender"
            ballSide={duelContext.ballSide}
            penaltyAreaShot={{
              shotPower: penaltyAreaShotBlock.shotPower,
              defenderPower: penaltyAreaShotBlock.defenderPower,
              residualPower: penaltyAreaShotBlock.residualPower,
              blockedByDefender: penaltyAreaShotBlock.blocked,
              goalkeeperPhase: false,
            }}
            onConfirm={handleConfirmDefenderPhase}
            onContinueToGoalkeeper={
              penaltyAreaOutcome === "to-gk"
                ? () => {
                    resetPickerState();
                    setPhase("transition-gk");
                  }
                : undefined
            }
            onRollback={handleRollbackDuel}
            foulNullify={
              nullifyAbilities.includes("NULLIFY_FOUL") && foulSideForNullify
                ? {
                    label: MATCH_FACILITY_ABILITY_LABELS.NULLIFY_FOUL,
                    onUse: () =>
                      setDefenderClashResolution(
                        nullifyDuelFoul(
                          resolutionToDisplay,
                          duelContext.ballSide,
                          getEffectiveDuelType(duelContext),
                        ),
                      ),
                  }
                : null
            }
          />
        </div>
      );
    }

    if (phase === "resolution" && duelResolution && homeAction && awayAction) {
      const foulSideForNullify = duelResolution.foul?.foulSide ?? null;
      const nullifyAbilities =
        foulSideForNullify != null
          ? getAvailableMatchAbilities(
              foulSideForNullify,
              foulSideForNullify === "home" ? homeFacilities : awayFacilities,
              matchFacilityState.usedAbilities,
              "foul",
            )
          : [];

      return (
        <div className="space-y-4">
          <MoveLevelUpCelebration events={moveLevelUps} />
          <DuelResolutionView
            resolution={duelResolution}
            debugText={duelDebugText ?? undefined}
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            homePlayerName={normalizedHomePlayer.name}
            awayPlayerName={normalizedAwayPlayer.name}
            homeAction={homeAction}
            awayAction={awayAction}
            resolutionStep={goalkeeperAction ? "goalkeeper" : "standard"}
            ballSide={duelContext.ballSide}
            goalkeeperAction={goalkeeperAction ?? undefined}
            goalkeeperPlayerName={goalkeeperPlayer?.name}
            penaltyAreaShot={
              penaltyAreaShotBlock
                ? {
                    shotPower: penaltyAreaShotBlock.shotPower,
                    defenderPower: penaltyAreaShotBlock.defenderPower,
                    residualPower: penaltyAreaShotBlock.residualPower,
                    blockedByDefender: penaltyAreaShotBlock.blocked,
                    goalkeeperPhase: goalkeeperAction != null,
                  }
                : undefined
            }
            onConfirm={handleConfirmDuel}
            onRollback={handleRollbackDuel}
            foulNullify={
              nullifyAbilities.includes("NULLIFY_FOUL") && foulSideForNullify
                ? {
                    label: MATCH_FACILITY_ABILITY_LABELS.NULLIFY_FOUL,
                    onUse: () => handleNullifyFoul(foulSideForNullify),
                  }
                : null
            }
          />
        </div>
      );
    }

    return null;
  };

  const headerSubtitle = () => {
    switch (phase) {
      case "intro":
        return (
          <>
            <span className={`font-black uppercase ${actionStarter === "home" ? "text-blue-400" : "text-red-400"}`}>
              {actionStarter === "home" ? "LOCAL" : "VISITANTE"} ({starterInfo.teamName})
            </span>
            {" "}elige la primera acción (tiene el balón)
          </>
        );
      case "actions-overview":
        return <>Revisad las acciones y supertécnicas de ambos jugadores antes de elegir</>;
      case "pick-first":
        return <>Selecciona la acción del {getDuelRoleLabel(starterInfo.role).toLowerCase()}</>;
      case "transition":
        return <>Entrega el móvil al otro equipo</>;
      case "pick-second":
        return (
          <>
            <span className={`font-black uppercase ${secondInfo.colorClass}`}>
              {secondInfo.label}
            </span>
            {" "}({getDuelRoleLabel(secondInfo.role).toLowerCase()}) elige su acción
          </>
        );
      case "transition-gk":
        return <>El tiro supera al defensor — preparad la parada del portero</>;
      case "pick-goalkeeper":
        return (
          <>
            Portero{" "}
            <span className="font-black text-emerald-300">{goalkeeperPlayer?.name ?? "—"}</span>
            {" "}elige la parada (poder residual: {penaltyAreaShotBlock?.residualPower ?? "—"})
          </>
        );
      case "resolution-defender":
        return <>Tiro contra defensa — calculando poder residual</>;
      case "resolution":
        return <>Motor calculando el resultado del duelo</>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-700 w-full max-w-5xl rounded-3xl flex flex-col shadow-2xl overflow-hidden max-h-[95vh]">
        <div className="p-4 md:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 relative gap-4">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-lg border border-amber-500/30 shrink-0">
                <Swords className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-slate-200 truncate">
                {phase === "intro"
                  ? "Análisis de Duelo"
                  : phase === "actions-overview"
                    ? "Acciones disponibles"
                    : phase === "transition" || phase === "transition-gk"
                    ? "Cambio de equipo"
                    : phase === "pick-goalkeeper"
                      ? "Parada del portero"
                    : phase === "resolution-defender"
                      ? "Tiro vs defensa"
                    : phase === "resolution"
                      ? "Resolución del duelo"
                      : "Duelo en curso"}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 pl-0 md:pl-14">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                Turno {currentTurn}
              </span>
              <span className="text-xs md:text-sm text-slate-400">{headerSubtitle()}</span>
              {phase === "intro" && (
                <span className="text-[10px] text-slate-600 animate-pulse">
                  · acciones en {INTRO_DELAY_MS / 1000}s
                </span>
              )}
            </div>
          </div>
          {phase !== "resolution" && phase !== "resolution-defender" && (
            <button
              onClick={() => handleClose()}
              className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 hover:text-red-400 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">{renderBody()}</div>
      </div>
    </div>
  );
}
