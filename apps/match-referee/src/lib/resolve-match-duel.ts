import {
  buildDuelDebugLog,
  formatDuelDebugLog,
  formatFoulRatePercent,
  getEffectiveStats,
  logDuelDebug,
  resolveDuel,
  buildPenaltyAreaDefenderBlockResolution,
  resolvePenaltyAreaShotBlock,
  resolvePenaltyAreaShotVsGoalkeeper,
  buildPenaltyAreaDefenderClashResolution,
  applyWeatherToDuelStats,
  applyFacilityGutsModifiers,
  applyFacilityStatMultiplier,
  buildFacilityDuelContext,
  getFacilityDuelParticipantBoosts,
  getSubBoostMultiplier,
  type Coach,
  type DuelDebugLog,
  type DuelResolution,
  type DuelStats,
  type FacilityDuelContext,
  type MatchFacilityState,
  type PlayerWithDetails,
  type WeatherCondition,
  type SportsCityState,
  type MatchFormatKey,
  type BurningPhaseState,
  type PenaltyAreaShotBlockResult,
} from "@inazuma/shared";
import { getActionLabel, type DuelActionPick, formatActionPickSummary } from "@/lib/duel-actions";
import { getEffectiveDuelType, type DuelContext } from "@/lib/duel-context";
import type { MatchSide } from "@/lib/match-turn";

function toDuelStats(
  player: PlayerWithDetails,
  coach?: Coach | null,
  weather: WeatherCondition = "clear",
  facilityContext?: FacilityDuelContext | null,
  side?: MatchSide,
  subBoostTurns?: Record<number, number>,
): DuelStats {
  const stats = getEffectiveStats(player, coach);
  let duelStats = applyWeatherToDuelStats(
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

  if (facilityContext && side) {
    duelStats = applyFacilityGutsModifiers(duelStats, side, facilityContext);
    const subBoost = getSubBoostMultiplier(player.id, subBoostTurns ?? {});
    const facilityBoosts = getFacilityDuelParticipantBoosts(
      side,
      player.element,
      facilityContext,
      subBoost,
    );
    duelStats = applyFacilityStatMultiplier(duelStats, facilityBoosts.statMultiplier);
  }

  return duelStats;
}

function buildParticipant(
  side: MatchSide,
  player: PlayerWithDetails,
  pick: DuelActionPick,
  weather: WeatherCondition,
  coach?: Coach | null,
  facilityContext?: FacilityDuelContext | null,
  subBoostTurns?: Record<number, number>,
) {
  const participant = {
    side,
    stats: toDuelStats(player, coach, weather, facilityContext, side, subBoostTurns),
    element: player.element,
    action: pick.category,
    shotDistance: pick.shotDistance,
  };

  if (pick.moveId != null) {
    const move = player.moves.find((m) => m.id === pick.moveId);
    if (move) {
      return {
        ...participant,
        move: {
          id: move.id,
          name: move.name,
          element: move.element,
          basePower: move.basePower,
          maxPower: move.maxPower,
          currentLevel: move.currentLevel,
          foulRate: move.foulRate ?? 0,
          secondaryType: move.secondaryType ?? null,
        },
      };
    }
  }

  return participant;
}

export interface MatchDuelResult {
  resolution: DuelResolution;
  debugLog: DuelDebugLog;
  debugText: string;
}

type MatchDuelParams = {
  homePlayer: PlayerWithDetails;
  awayPlayer: PlayerWithDetails;
  homeAction: DuelActionPick;
  awayAction: DuelActionPick;
  duelContext: DuelContext;
  currentTurn: number;
  weather?: WeatherCondition;
  homeCoach?: Coach | null;
  awayCoach?: Coach | null;
  isBurningPhase?: boolean;
  burningPhase?: BurningPhaseState;
  random?: () => number;
  matchFormat?: MatchFormatKey;
  homeFacilities?: SportsCityState;
  awayFacilities?: SportsCityState;
  matchFacilityState?: MatchFacilityState;
};

function buildDuelInput(params: MatchDuelParams) {
  const weather = params.weather ?? "clear";
  const facilityContext = buildFacilityDuelContext({
    format: params.matchFormat ?? "4v4",
    pitchElement: params.matchFacilityState?.pitchElement ?? null,
    homeFacilities: params.homeFacilities ?? { field: 0, stands: 0, benches: 0, shop: 0, training: 0, clinic: 0, lab: 0 },
    awayFacilities: params.awayFacilities ?? { field: 0, stands: 0, benches: 0, shop: 0, training: 0, clinic: 0, lab: 0 },
    homeUsedSuperMoves: params.matchFacilityState?.homeUsedSuperMoves ?? [],
    awayUsedSuperMoves: params.matchFacilityState?.awayUsedSuperMoves ?? [],
  });

  const subBoostTurns = params.matchFacilityState?.subBoostTurns ?? {};

  const homeFacilityBoosts = facilityContext
    ? getFacilityDuelParticipantBoosts(
        "home",
        params.homePlayer.element,
        facilityContext,
        getSubBoostMultiplier(params.homePlayer.id, subBoostTurns),
      )
    : undefined;

  const awayFacilityBoosts = facilityContext
    ? getFacilityDuelParticipantBoosts(
        "away",
        params.awayPlayer.element,
        facilityContext,
        getSubBoostMultiplier(params.awayPlayer.id, subBoostTurns),
      )
    : undefined;

  return {
    input: {
      home: buildParticipant(
        "home",
        params.homePlayer,
        params.homeAction,
        weather,
        params.homeCoach,
        facilityContext,
        subBoostTurns,
      ),
      away: buildParticipant(
        "away",
        params.awayPlayer,
        params.awayAction,
        weather,
        params.awayCoach,
        facilityContext,
        subBoostTurns,
      ),
      ballSide: params.duelContext.ballSide,
      duelType: getEffectiveDuelType(params.duelContext),
      currentTurn: params.currentTurn,
      burningPhase: params.burningPhase,
      isBurningPhase: params.isBurningPhase,
      weather,
      random: params.random,
      facilityContext,
      homeFacilityBoosts,
      awayFacilityBoosts,
    },
    labels: {
      homeName: params.homePlayer.name,
      awayName: params.awayPlayer.name,
      homeAction: formatActionPickSummary(params.homeAction),
      awayAction: formatActionPickSummary(params.awayAction),
    },
    weather,
    facilityContext,
    subBoostTurns,
  };
}

export interface PenaltyAreaShotMatchResult extends MatchDuelResult {
  block: PenaltyAreaShotBlockResult;
  clashResolution: DuelResolution;
}

export function resolvePenaltyAreaShotBlockMatch(
  params: MatchDuelParams,
): PenaltyAreaShotMatchResult {
  const { input, labels } = buildDuelInput(params);
  const block = resolvePenaltyAreaShotBlock(input);
  const resolution = buildPenaltyAreaDefenderBlockResolution(input, block);
  const clashResolution = buildPenaltyAreaDefenderClashResolution(input, block);

  const debugLog = buildDuelDebugLog(input, resolution);
  const debugText = [
    formatDuelDebugLog(debugLog, labels),
    "",
    "— Tiro en el área —",
    `Poder del tiro: ${block.shotPower}`,
    `Poder del defensor (restado): ${block.defenderPower}`,
    `Poder residual: ${block.residualPower}`,
    block.blocked ? "El defensor intercepta el tiro." : "El tiro supera al defensor.",
  ].join("\n");

  return { resolution, debugLog, debugText, block, clashResolution };
}

export function resolvePenaltyAreaShotGoalkeeperMatch(
  params: MatchDuelParams & {
    goalkeeperPlayer: PlayerWithDetails;
    goalkeeperAction: DuelActionPick;
    block: PenaltyAreaShotBlockResult;
  },
): MatchDuelResult {
  const { input, labels, weather, facilityContext, subBoostTurns } = buildDuelInput(params);
  const attackerSide = params.duelContext.ballSide;
  const goalkeeperSide = attackerSide === "home" ? "away" : "home";
  const shotParticipant = attackerSide === "home" ? input.home : input.away;
  const goalkeeper = buildParticipant(
    goalkeeperSide,
    params.goalkeeperPlayer,
    params.goalkeeperAction,
    weather,
    goalkeeperSide === "home" ? params.homeCoach : params.awayCoach,
    facilityContext,
    subBoostTurns,
  );

  const resolution = resolvePenaltyAreaShotVsGoalkeeper({
    residualShotPower: params.block.residualPower,
    shotBreakdown: params.block.shotBreakdown,
    shotParticipant,
    goalkeeper,
    ballSide: attackerSide,
    currentTurn: params.currentTurn,
    burningPhase: params.burningPhase,
    weather,
    random: params.random,
    facilityContext,
    homeFacilityBoosts: input.homeFacilityBoosts,
    awayFacilityBoosts: input.awayFacilityBoosts,
  });

  const gkLabel = formatActionPickSummary(params.goalkeeperAction);
  const debugLog = buildDuelDebugLog(input, resolution);
  const debugText = [
    formatDuelDebugLog(debugLog, labels),
    "",
    "— Parada del portero —",
    `Poder del tiro (tras defensa): ${params.block.residualPower}`,
    `Poder del portero: ${goalkeeperSide === "home" ? resolution.homePower : resolution.awayPower}`,
    `Acción del portero: ${gkLabel}`,
  ].join("\n");

  return { resolution, debugLog, debugText };
}

export function resolveMatchDuel(params: MatchDuelParams): MatchDuelResult {
  const { input, labels } = buildDuelInput(params);

  const resolution = resolveDuel(input);

  logDuelDebug(input, resolution, labels);
  const debugLog = buildDuelDebugLog(input, resolution);
  const debugText = formatDuelDebugLog(debugLog, labels);

  return { resolution, debugLog, debugText };
}

export function getDuelWinnerLabel(
  resolution: DuelResolution,
  homeTeamName: string,
  awayTeamName: string,
): string {
  if (resolution.winnerSide === "draw") return "Empate técnico";
  return resolution.winnerSide === "home" ? homeTeamName : awayTeamName;
}

export function getDuelEffectsSummary(
  resolution: DuelResolution,
  options?: {
    penaltyAreaShot?: {
      shotPower: number;
      defenderPower: number;
      residualPower: number;
      blockedByDefender: boolean;
      goalkeeperPhase?: boolean;
    };
  },
): string[] {
  const lines: string[] = [];
  const { effects, foul } = resolution;
  const shotMeta = options?.penaltyAreaShot;

  if (shotMeta) {
    lines.push(
      `Tiro (${shotMeta.shotPower}) − defensa (${shotMeta.defenderPower}) = ${shotMeta.residualPower} residual`,
    );
    if (shotMeta.blockedByDefender) {
      lines.push("El defensor intercepta el tiro");
    } else if (shotMeta.goalkeeperPhase) {
      lines.push("El portero intenta la parada");
    }
  }

  if (foul) {
    lines.push(
      `¡Falta! (${getActionLabel(foul.action)}, ${formatFoulRatePercent(foul.foulRate)} de riesgo)`,
    );
    lines.push("Posesión para el equipo atacante");
  }

  if (effects.goalScored && effects.goalSide) {
    lines.push(
      effects.goalSide === "home" ? "¡GOL del equipo local!" : "¡GOL del visitante!",
    );
  }

  if (!foul) {
    if (effects.possessionChange) {
      lines.push(
        effects.newBallSide === "home"
          ? "Posesión para el local"
          : "Posesión para el visitante",
      );
    } else {
      lines.push("El balón se mantiene");
    }
  }

  lines.push("Avanza al siguiente turno");

  return lines;
}
