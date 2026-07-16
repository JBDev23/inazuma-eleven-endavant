import { calculateNormalPower, calculateSuperPower, calculateWeightedStats } from './calculator';
import { ACTION_WEIGHTS } from './constants';
import {
  applyFacilityWeatherPowerModifier,
  getFacilityElementMultiplier,
  getFacilityWeatherPowerMultiplier,
  getFacilityDuelParticipantBoosts,
  type FacilityDuelContext,
  type FacilityDuelParticipantBoosts,
} from '../match-facility-bonuses';
import { rollDefenderFoul } from './fouls';
import { getMovePowerAtLevel } from './move-power';
import { getTacticMultiplier } from './tactics';
import {
  applyWeatherPowerModifier,
  getWeatherPowerMultiplier,
  DEFAULT_WEATHER,
  type WeatherCondition,
} from './weather';
import type { BurningPhaseSnapshot, BurningPhaseState } from '../burning-phase';
import { buildBurningPhaseSnapshot, isSideInBurningPhase } from '../burning-phase';
import { getShotDistanceMultiplier, isShotAction } from './shot-distance';
import type { ActionCategory, DuelStats } from './types';

export type DuelSide = 'home' | 'away';

export type DuelType = 'FIELD' | 'GOAL';

export interface DuelMoveInput {
  id: number;
  name: string;
  element: string;
  basePower: number;
  maxPower: number;
  currentLevel: number;
  foulRate: number;
  secondaryType?: string | null;
}

export interface DuelParticipantInput {
  side: DuelSide;
  stats: DuelStats;
  element: string;
  action: ActionCategory;
  move?: DuelMoveInput;
  /** Franjas de distancia al disparar (0 = junto a la portería). */
  shotDistance?: number;
}

export interface DuelResolutionInput {
  home: DuelParticipantInput;
  away: DuelParticipantInput;
  ballSide: DuelSide;
  duelType: DuelType;
  currentTurn: number;
  /** @deprecated Usa `burningPhase` por bando. */
  isBurningPhase?: boolean;
  burningPhase?: BurningPhaseState;
  weather?: WeatherCondition;
  random?: () => number;
  facilityContext?: FacilityDuelContext | null;
  homeFacilityBoosts?: FacilityDuelParticipantBoosts;
  awayFacilityBoosts?: FacilityDuelParticipantBoosts;
}

export interface PowerBreakdown {
  eStats: number;
  elementMultiplier: number;
  tacticMultiplier: number;
  rng: number;
  furor: number;
  techniquePower?: number;
  stabMultiplier?: number;
  weatherMultiplier?: number;
  shotDistanceMultiplier?: number;
  total: number;
}

export interface DuelEffects {
  goalScored: boolean;
  goalSide?: DuelSide;
  possessionChange: boolean;
  newBallSide: DuelSide;
}

export interface DuelFoul {
  foulSide: DuelSide;
  foulRate: number;
  action: ActionCategory;
  /** Ganador por poder antes de aplicar la falta. */
  powerWinnerSide: DuelSide | 'draw';
}

export interface DuelResolution {
  winnerSide: DuelSide | 'draw';
  homePower: number;
  awayPower: number;
  homeBreakdown: PowerBreakdown;
  awayBreakdown: PowerBreakdown;
  effects: DuelEffects;
  burningPhase: BurningPhaseSnapshot;
  /** Verdadero si algún bando tiene la Fase de Furor activa. */
  isBurningPhase: boolean;
  foul?: DuelFoul;
}

const SUPER_ACTIONS = new Set<ActionCategory>([
  'DRIBBLE_SUPER',
  'BLOCK_SUPER',
  'SHOOT_SUPER',
  'CATCH_SUPER',
]);

function isSuperAction(action: ActionCategory): boolean {
  return SUPER_ACTIONS.has(action);
}

function duelHasSuperTechnique(home: DuelParticipantInput, away: DuelParticipantInput): boolean {
  return isSuperAction(home.action) || isSuperAction(away.action);
}

function rollRng(max: number, random: () => number): number {
  if (max <= 0) return 0;
  return Math.floor(random() * (max + 1));
}

function getStabMultiplier(playerElement: string, moveElement: string): number {
  return playerElement.trim().toLowerCase() === moveElement.trim().toLowerCase() ? 1.2 : 1;
}

function applyRepeatedSuperPenalty(
  total: number,
  participant: DuelParticipantInput,
  facilityContext: FacilityDuelContext | null | undefined,
  boosts: FacilityDuelParticipantBoosts | undefined,
): number {
  if (
    !facilityContext ||
    !boosts ||
    boosts.repeatedSuperPenalty >= 1 ||
    !isSuperAction(participant.action) ||
    !participant.move
  ) {
    return total;
  }

  const usedMoves =
    participant.side === 'home'
      ? facilityContext.homeUsedSuperMoves
      : facilityContext.awayUsedSuperMoves;

  if (!usedMoves.has(participant.move.name)) {
    return total;
  }

  return Math.floor(total * boosts.repeatedSuperPenalty);
}

function applyShotDistanceToPower(
  total: number,
  participant: DuelParticipantInput,
): { total: number; shotDistanceMultiplier?: number } {
  if (participant.shotDistance == null || !isShotAction(participant.action)) {
    return { total };
  }

  const shotDistanceMultiplier = getShotDistanceMultiplier(participant.shotDistance);
  const adjusted = Math.floor(total * shotDistanceMultiplier);

  return {
    total: adjusted,
    shotDistanceMultiplier: shotDistanceMultiplier === 1 ? undefined : shotDistanceMultiplier,
  };
}

function calculateParticipantPower(
  participant: DuelParticipantInput,
  opponent: DuelParticipantInput,
  duelType: DuelType,
  isBurningPhase: boolean,
  tacticsDisabled: boolean,
  weather: WeatherCondition,
  random: () => number,
  facilityContext?: FacilityDuelContext | null,
  facilityBoosts?: FacilityDuelParticipantBoosts,
): PowerBreakdown {
  const actionData = ACTION_WEIGHTS[participant.action];
  const eStats = calculateWeightedStats(participant.stats, participant.action);
  const elementMultiplier = facilityBoosts
    ? getFacilityElementMultiplier(
        participant.element,
        opponent.element,
        facilityBoosts,
      )
    : getFacilityElementMultiplier(participant.element, opponent.element, {
        statMultiplier: 1,
        ignoreElementalDisadvantage: false,
        repeatedSuperPenalty: 1,
      });
  const tacticMultiplier = tacticsDisabled
    ? 1
    : getTacticMultiplier(participant.action, opponent.action, duelType);
  const rng = rollRng(actionData.rngMax, random);
  const furor = isBurningPhase ? actionData.burningPhaseBonus : 0;

  if (isSuperAction(participant.action) && participant.move) {
    const techniquePower = getMovePowerAtLevel(participant.move);
    const stabMultiplier = getStabMultiplier(participant.element, participant.move.element);
    const rawTotal = calculateSuperPower(
      participant.stats,
      participant.action,
      techniquePower,
      elementMultiplier,
      stabMultiplier,
      isBurningPhase,
      rng,
    );
    const weatherMultiplier = facilityContext
      ? getFacilityWeatherPowerMultiplier(
          participant.action,
          weather,
          facilityContext,
          participant.move,
        )
      : getWeatherPowerMultiplier(participant.action, weather, participant.move);
    const weatherAdjusted = facilityContext
      ? applyFacilityWeatherPowerModifier(
          rawTotal,
          participant.action,
          weather,
          facilityContext,
          participant.move,
        )
      : applyWeatherPowerModifier(rawTotal, participant.action, weather, participant.move);
    const total = applyRepeatedSuperPenalty(
      weatherAdjusted,
      participant,
      facilityContext,
      facilityBoosts,
    );
    const { total: distanceAdjusted, shotDistanceMultiplier } = applyShotDistanceToPower(
      total,
      participant,
    );

    return {
      eStats,
      elementMultiplier,
      tacticMultiplier,
      rng,
      furor,
      techniquePower,
      stabMultiplier,
      weatherMultiplier: weatherMultiplier === 1 ? undefined : weatherMultiplier,
      shotDistanceMultiplier,
      total: distanceAdjusted,
    };
  }

  const rawTotal = calculateNormalPower(
    participant.stats,
    participant.action,
    elementMultiplier,
    tacticMultiplier,
    isBurningPhase,
    rng,
  );
  const weatherMultiplier = facilityContext
    ? getFacilityWeatherPowerMultiplier(
        participant.action,
        weather,
        facilityContext,
        participant.move,
      )
    : getWeatherPowerMultiplier(participant.action, weather, participant.move);
  const weatherAdjusted = facilityContext
    ? applyFacilityWeatherPowerModifier(
        rawTotal,
        participant.action,
        weather,
        facilityContext,
        participant.move,
      )
    : applyWeatherPowerModifier(rawTotal, participant.action, weather, participant.move);
  const total = applyRepeatedSuperPenalty(
    weatherAdjusted,
    participant,
    facilityContext,
    facilityBoosts,
  );
  const { total: distanceAdjusted, shotDistanceMultiplier } = applyShotDistanceToPower(
    total,
    participant,
  );

  return {
    eStats,
    elementMultiplier,
    tacticMultiplier,
    rng,
    furor,
    weatherMultiplier: weatherMultiplier === 1 ? undefined : weatherMultiplier,
    shotDistanceMultiplier,
    total: distanceAdjusted,
  };
}

function getDefenderSide(ballSide: DuelSide): DuelSide {
  return ballSide === 'home' ? 'away' : 'home';
}

export function computeDuelEffects(
  winnerSide: DuelSide | 'draw',
  ballSide: DuelSide,
  duelType: DuelType,
): DuelEffects {
  const attackerSide = ballSide;
  const defenderSide = getDefenderSide(ballSide);

  if (duelType === 'GOAL') {
    if (winnerSide === attackerSide) {
      const concedingSide = defenderSide;
      return {
        goalScored: true,
        goalSide: attackerSide,
        possessionChange: true,
        newBallSide: concedingSide,
      };
    }

    return {
      goalScored: false,
      possessionChange: true,
      newBallSide: defenderSide,
    };
  }

  if (winnerSide === defenderSide) {
    return {
      goalScored: false,
      possessionChange: true,
      newBallSide: defenderSide,
    };
  }

  return {
    goalScored: false,
    possessionChange: false,
    newBallSide: ballSide,
  };
}

function resolveBurningPhaseActiveFlags(
  input: DuelResolutionInput,
): Record<DuelSide, boolean> {
  if (input.burningPhase) {
    return {
      home: isSideInBurningPhase('home', input.burningPhase, input.currentTurn),
      away: isSideInBurningPhase('away', input.burningPhase, input.currentTurn),
    };
  }

  const legacy = input.isBurningPhase ?? false;
  return { home: legacy, away: legacy };
}

export function resolveDuel(input: DuelResolutionInput): DuelResolution {
  const random = input.random ?? Math.random;
  const burningPhaseActive = resolveBurningPhaseActiveFlags(input);
  const burningPhase = input.burningPhase
    ? buildBurningPhaseSnapshot(input.burningPhase, input.currentTurn)
    : {
        home: { active: burningPhaseActive.home, turnsRemaining: burningPhaseActive.home ? 1 : 0 },
        away: { active: burningPhaseActive.away, turnsRemaining: burningPhaseActive.away ? 1 : 0 },
      };
  const weather = input.weather ?? DEFAULT_WEATHER;
  const tacticsDisabled = duelHasSuperTechnique(input.home, input.away);

  const homeBreakdown = calculateParticipantPower(
    input.home,
    input.away,
    input.duelType,
    burningPhaseActive.home,
    tacticsDisabled,
    weather,
    random,
    input.facilityContext,
    input.homeFacilityBoosts,
  );
  const awayBreakdown = calculateParticipantPower(
    input.away,
    input.home,
    input.duelType,
    burningPhaseActive.away,
    tacticsDisabled,
    weather,
    random,
    input.facilityContext,
    input.awayFacilityBoosts,
  );

  let powerWinnerSide: DuelSide | 'draw' = 'draw';
  if (homeBreakdown.total > awayBreakdown.total) powerWinnerSide = 'home';
  else if (awayBreakdown.total > homeBreakdown.total) powerWinnerSide = 'away';

  const defenderSide = getDefenderSide(input.ballSide);
  const defender = defenderSide === 'home' ? input.home : input.away;
  const foulRoll = rollDefenderFoul({
    duelType: input.duelType,
    ballSide: input.ballSide,
    defenderAction: defender.action,
    moveFoulRate: defender.move?.foulRate,
    weather,
    random,
  });

  let winnerSide = powerWinnerSide;
  let effects = computeDuelEffects(powerWinnerSide, input.ballSide, input.duelType);
  let foul: DuelFoul | undefined;

  if (foulRoll.occurred && foulRoll.foulSide && foulRoll.action) {
    const attackerSide = input.ballSide;
    foul = {
      foulSide: foulRoll.foulSide,
      foulRate: foulRoll.foulRate,
      action: foulRoll.action,
      powerWinnerSide,
    };
    winnerSide = attackerSide;
    effects = {
      goalScored: false,
      possessionChange: false,
      newBallSide: attackerSide,
    };
  }

  return {
    winnerSide,
    homePower: homeBreakdown.total,
    awayPower: awayBreakdown.total,
    homeBreakdown,
    awayBreakdown,
    effects,
    burningPhase,
    isBurningPhase: burningPhase.home.active || burningPhase.away.active,
    foul,
  };
}

export function nullifyDuelFoul(
  resolution: DuelResolution,
  ballSide: DuelSide,
  duelType: DuelType,
): DuelResolution {
  if (!resolution.foul) return resolution;

  const winnerSide = resolution.foul.powerWinnerSide;
  const effects = computeDuelEffects(winnerSide, ballSide, duelType);

  return {
    ...resolution,
    winnerSide,
    effects,
    foul: undefined,
  };
}

export interface PenaltyAreaShotBlockResult {
  shotPower: number;
  defenderPower: number;
  residualPower: number;
  shotBreakdown: PowerBreakdown;
  defenderBreakdown: PowerBreakdown;
  /** El defensor intercepta el tiro (poder residual ≤ 0). */
  blocked: boolean;
  foul?: DuelFoul;
  burningPhase: BurningPhaseSnapshot;
  isBurningPhase: boolean;
}

function buildBurningPhaseSnapshotFromInput(
  input: DuelResolutionInput,
  burningPhaseActive: Record<DuelSide, boolean>,
): { burningPhase: BurningPhaseSnapshot; isBurningPhase: boolean } {
  const burningPhase = input.burningPhase
    ? buildBurningPhaseSnapshot(input.burningPhase, input.currentTurn)
    : {
        home: { active: burningPhaseActive.home, turnsRemaining: burningPhaseActive.home ? 1 : 0 },
        away: { active: burningPhaseActive.away, turnsRemaining: burningPhaseActive.away ? 1 : 0 },
      };

  return {
    burningPhase,
    isBurningPhase: burningPhase.home.active || burningPhase.away.active,
  };
}

/**
 * Fase 1 del tiro en el área: el poder del defensor se resta al del tiro.
 * Si el residual es ≤ 0, el defensor gana y recupera el balón.
 */
export function resolvePenaltyAreaShotBlock(
  input: DuelResolutionInput,
): PenaltyAreaShotBlockResult {
  const random = input.random ?? Math.random;
  const burningPhaseActive = resolveBurningPhaseActiveFlags(input);
  const { burningPhase, isBurningPhase } = buildBurningPhaseSnapshotFromInput(
    input,
    burningPhaseActive,
  );
  const weather = input.weather ?? DEFAULT_WEATHER;
  const tacticsDisabled = duelHasSuperTechnique(input.home, input.away);

  const attackerSide = input.ballSide;
  const defenderSide = getDefenderSide(input.ballSide);
  const shot = attackerSide === 'home' ? input.home : input.away;
  const defender = defenderSide === 'home' ? input.home : input.away;
  const homeFacilityBoosts =
    input.homeFacilityBoosts ??
    (input.facilityContext
      ? getFacilityDuelParticipantBoosts('home', input.home.element, input.facilityContext, 1)
      : undefined);
  const awayFacilityBoosts =
    input.awayFacilityBoosts ??
    (input.facilityContext
      ? getFacilityDuelParticipantBoosts('away', input.away.element, input.facilityContext, 1)
      : undefined);

  const shotBreakdown = calculateParticipantPower(
    shot,
    defender,
    'FIELD',
    burningPhaseActive[attackerSide],
    tacticsDisabled,
    weather,
    random,
    input.facilityContext,
    attackerSide === 'home' ? homeFacilityBoosts : awayFacilityBoosts,
  );
  const defenderBreakdown = calculateParticipantPower(
    defender,
    shot,
    'FIELD',
    burningPhaseActive[defenderSide],
    tacticsDisabled,
    weather,
    random,
    input.facilityContext,
    defenderSide === 'home' ? homeFacilityBoosts : awayFacilityBoosts,
  );

  const residualPower = shotBreakdown.total - defenderBreakdown.total;

  const foulRoll = rollDefenderFoul({
    duelType: 'FIELD',
    ballSide: input.ballSide,
    defenderAction: defender.action,
    moveFoulRate: defender.move?.foulRate,
    weather,
    random,
  });

  let foul: DuelFoul | undefined;
  if (foulRoll.occurred && foulRoll.foulSide && foulRoll.action) {
    foul = {
      foulSide: foulRoll.foulSide,
      foulRate: foulRoll.foulRate,
      action: foulRoll.action,
      powerWinnerSide: attackerSide,
    };
  }

  return {
    shotPower: shotBreakdown.total,
    defenderPower: defenderBreakdown.total,
    residualPower,
    shotBreakdown,
    defenderBreakdown,
    blocked: residualPower <= 0,
    foul,
    burningPhase,
    isBurningPhase,
  };
}

export function buildPenaltyAreaDefenderBlockResolution(
  input: DuelResolutionInput,
  block: PenaltyAreaShotBlockResult,
): DuelResolution {
  const defenderSide = getDefenderSide(input.ballSide);

  const homeBreakdown =
    input.ballSide === 'home' ? block.shotBreakdown : block.defenderBreakdown;
  const awayBreakdown =
    input.ballSide === 'home' ? block.defenderBreakdown : block.shotBreakdown;

  if (block.foul) {
    return {
      winnerSide: input.ballSide,
      homePower: homeBreakdown.total,
      awayPower: awayBreakdown.total,
      homeBreakdown,
      awayBreakdown,
      effects: {
        goalScored: false,
        possessionChange: false,
        newBallSide: input.ballSide,
      },
      burningPhase: block.burningPhase,
      isBurningPhase: block.isBurningPhase,
      foul: block.foul,
    };
  }

  return {
    winnerSide: defenderSide,
    homePower: homeBreakdown.total,
    awayPower: awayBreakdown.total,
    homeBreakdown,
    awayBreakdown,
    effects: computeDuelEffects(defenderSide, input.ballSide, 'FIELD'),
    burningPhase: block.burningPhase,
    isBurningPhase: block.isBurningPhase,
  };
}

/** Resolución visual para la animación tiro vs defensa (incluye cuando el tiro pasa). */
export function buildPenaltyAreaDefenderClashResolution(
  input: DuelResolutionInput,
  block: PenaltyAreaShotBlockResult,
): DuelResolution {
  const attackerSide = input.ballSide;
  const defenderSide = getDefenderSide(input.ballSide);
  const homeBreakdown =
    attackerSide === 'home' ? block.shotBreakdown : block.defenderBreakdown;
  const awayBreakdown =
    attackerSide === 'home' ? block.defenderBreakdown : block.shotBreakdown;

  let winnerSide: DuelSide | 'draw' = 'draw';
  if (block.foul) {
    winnerSide = attackerSide;
  } else if (block.blocked) {
    winnerSide = defenderSide;
  } else {
    winnerSide = attackerSide;
  }

  return {
    winnerSide,
    homePower: homeBreakdown.total,
    awayPower: awayBreakdown.total,
    homeBreakdown,
    awayBreakdown,
    effects: block.foul
      ? {
          goalScored: false,
          possessionChange: false,
          newBallSide: attackerSide,
        }
      : block.blocked
        ? computeDuelEffects(defenderSide, input.ballSide, 'FIELD')
        : {
            goalScored: false,
            possessionChange: false,
            newBallSide: attackerSide,
          },
    burningPhase: block.burningPhase,
    isBurningPhase: block.isBurningPhase,
    foul: block.foul,
  };
}

export interface PenaltyAreaShotGoalkeeperInput {
  residualShotPower: number;
  shotBreakdown: PowerBreakdown;
  shotParticipant: DuelParticipantInput;
  goalkeeper: DuelParticipantInput;
  ballSide: DuelSide;
  currentTurn: number;
  burningPhase?: BurningPhaseState;
  isBurningPhase?: boolean;
  weather?: WeatherCondition;
  random?: () => number;
  facilityContext?: FacilityDuelContext | null;
  homeFacilityBoosts?: FacilityDuelParticipantBoosts;
  awayFacilityBoosts?: FacilityDuelParticipantBoosts;
}

/**
 * Fase 2 del tiro en el área: el portero intenta parar el tiro con el poder residual.
 */
export function resolvePenaltyAreaShotVsGoalkeeper(
  input: PenaltyAreaShotGoalkeeperInput,
): DuelResolution {
  const random = input.random ?? Math.random;
  const burningPhaseActive = resolveBurningPhaseActiveFlags({
    home: input.shotParticipant.side === 'home' ? input.shotParticipant : input.goalkeeper,
    away: input.shotParticipant.side === 'away' ? input.shotParticipant : input.goalkeeper,
    ballSide: input.ballSide,
    duelType: 'GOAL',
    currentTurn: input.currentTurn,
    burningPhase: input.burningPhase,
    isBurningPhase: input.isBurningPhase,
  } as DuelResolutionInput);
  const { burningPhase, isBurningPhase } = buildBurningPhaseSnapshotFromInput(
    {
      home: input.shotParticipant.side === 'home' ? input.shotParticipant : input.goalkeeper,
      away: input.shotParticipant.side === 'away' ? input.shotParticipant : input.goalkeeper,
      ballSide: input.ballSide,
      duelType: 'GOAL',
      currentTurn: input.currentTurn,
      burningPhase: input.burningPhase,
      isBurningPhase: input.isBurningPhase,
    },
    burningPhaseActive,
  );
  const weather = input.weather ?? DEFAULT_WEATHER;
  const goalkeeperSide = input.goalkeeper.side;
  const gkFacilityBoosts =
    goalkeeperSide === 'home' ? input.homeFacilityBoosts : input.awayFacilityBoosts;

  const gkBreakdown = calculateParticipantPower(
    input.goalkeeper,
    input.shotParticipant,
    'GOAL',
    burningPhaseActive[goalkeeperSide],
    duelHasSuperTechnique(input.shotParticipant, input.goalkeeper),
    weather,
    random,
    input.facilityContext,
    gkFacilityBoosts,
  );

  const shotBreakdownForGk: PowerBreakdown = {
    ...input.shotBreakdown,
    total: input.residualShotPower,
  };

  const attackerSide = input.ballSide;
  const homeBreakdown =
    attackerSide === 'home' ? shotBreakdownForGk : gkBreakdown;
  const awayBreakdown =
    attackerSide === 'home' ? gkBreakdown : shotBreakdownForGk;

  let winnerSide: DuelSide | 'draw' = 'draw';
  if (input.residualShotPower > gkBreakdown.total) winnerSide = attackerSide;
  else if (gkBreakdown.total > input.residualShotPower) winnerSide = goalkeeperSide;

  const effects = computeDuelEffects(winnerSide, input.ballSide, 'GOAL');

  return {
    winnerSide,
    homePower: homeBreakdown.total,
    awayPower: awayBreakdown.total,
    homeBreakdown,
    awayBreakdown,
    effects,
    burningPhase,
    isBurningPhase,
  };
}
