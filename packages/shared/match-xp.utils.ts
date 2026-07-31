import { addExperience } from './xp.utils';
import type { EconomyPricingSettings } from './entity-pricing';
import { DEFAULT_ECONOMY_PRICING } from './entity-pricing';

export type MatchFormatKey = '11v11' | '4v4';

export interface SessionXpConfig {
  session: number;
  minXp: number;
  maxXp: number;
  /** Multiplicador sobre min/max oficial para calcular XP de pachanga */
  pachangaMultiplier: number;
  winnerRewardPp: number;
  winnerRewardYens: number;
  /** XP que gana un entrenador por cada YE canjeado */
  coachXpPerYe: number;
}

export interface GameSettings extends EconomyPricingSettings {
  currentSession: number;
  sessionConfigs: SessionXpConfig[];
}

export { DEFAULT_ECONOMY_PRICING };

export interface PlayerMatchParticipation {
  playerId: number;
  playerName: string;
  side: 'home' | 'away';
  turnsOnField: number;
  duelsPlayed: number;
  duelsWon: number;
  goals: number;
  saves: number;
  possessionTurns: number;
  cleanSheet: boolean;
  level: number;
  experience: number;
  /** Valor (guts) a nivel actual — usado en desempates de ranking. */
  guts: number;
}

export interface PlayerMatchXpBreakdown {
  playerId: number;
  playerName: string;
  side: 'home' | 'away';
  turnsOnField: number;
  performanceScore: number;
  performanceRank: number;
  floorXp: number;
  bonusXp: number;
  totalXp: number;
  previousLevel: number;
  newLevel: number;
  previousXp: number;
  newXp: number;
  levelsGained: number;
  baseXp: number;
  newExperience: number;
  previousExperience: number;
  leveledUp: boolean;
}

export interface MatchWinnerRewards {
  clubId: string;
  pp: number;
  yens: number;
}

export interface MatchXpResult {
  format: MatchFormatKey;
  minXp: number;
  maxXp: number;
  bonusPool: number;
  xpPerTurn: number;
  baseXpPerTurn: number;
  session: number;
  pachangaMultiplier: number | null;
  players: PlayerMatchXpBreakdown[];
}

export interface MatchXpPerformanceWeights {
  duelPlayed: number;
  duelWon: number;
  goal: number;
  save: number;
  possessionTurn: number;
  cleanSheet: number;
}

export const DEFAULT_MATCH_XP_WEIGHTS: MatchXpPerformanceWeights = {
  duelPlayed: 10,
  duelWon: 15,
  goal: 50,
  save: 40,
  possessionTurn: 2,
  cleanSheet: 55,
};

export interface CalculateMatchXpInput {
  format: MatchFormatKey;
  totalTurns: number;
  sessionConfig: SessionXpConfig | null;
  players: PlayerMatchParticipation[];
  weights?: MatchXpPerformanceWeights;
  /** Generador [0, 1) para el desempate final por suerte. Por defecto Math.random. */
  rng?: () => number;
}

export function computePachangaXpBounds(config: SessionXpConfig): {
  minXp: number;
  maxXp: number;
} {
  const multiplier = Math.max(0, config.pachangaMultiplier);
  return {
    minXp: Math.floor(config.minXp * multiplier),
    maxXp: Math.floor(config.maxXp * multiplier),
  };
}

function resolveBounds(input: CalculateMatchXpInput): {
  minXp: number;
  maxXp: number;
  pachangaMultiplier: number | null;
} {
  if (!input.sessionConfig) {
    return { minXp: 0, maxXp: 0, pachangaMultiplier: null };
  }

  if (input.format === '4v4') {
    const bounds = computePachangaXpBounds(input.sessionConfig);
    return {
      ...bounds,
      pachangaMultiplier: input.sessionConfig.pachangaMultiplier,
    };
  }

  return {
    minXp: input.sessionConfig.minXp,
    maxXp: input.sessionConfig.maxXp,
    pachangaMultiplier: null,
  };
}

export function computeParticipationPerformanceScore(
  player: Pick<
    PlayerMatchParticipation,
    'duelsPlayed' | 'duelsWon' | 'goals' | 'saves' | 'possessionTurns' | 'cleanSheet'
  >,
  weights: MatchXpPerformanceWeights = DEFAULT_MATCH_XP_WEIGHTS,
): number {
  return (
    player.duelsPlayed * weights.duelPlayed +
    player.duelsWon * weights.duelWon +
    player.goals * weights.goal +
    player.saves * weights.save +
    player.possessionTurns * weights.possessionTurn +
    (player.cleanSheet ? weights.cleanSheet : 0)
  );
}

/** Orden lexicográfico de desempate por peso de rol (acción más difícil primero). */
const ROLE_WEIGHT_TIEBREAK_GETTERS: Array<(p: PlayerMatchParticipation) => number> = [
  (p) => (p.cleanSheet ? 1 : 0),
  (p) => p.goals,
  (p) => p.saves,
  (p) => p.duelsWon,
  (p) => p.duelsPlayed,
  (p) => p.possessionTurns,
];

/** Desempate por peso de rol: compara acciones de mayor a menor dificultad. */
export function compareRoleWeightTieBreak(
  a: PlayerMatchParticipation,
  b: PlayerMatchParticipation,
): number {
  for (const getValue of ROLE_WEIGHT_TIEBREAK_GETTERS) {
    const diff = getValue(b) - getValue(a);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Comparador completo de ranking de participación.
 * 1. Puntos de rendimiento
 * 2. Peso del rol (acción más difícil)
 * 3. Nivel más bajo (compensación)
 * 4. Valor (guts) más alto
 * 5. Dado RNG preasignado
 */
export function compareParticipationRanking(
  a: PlayerMatchParticipation,
  b: PlayerMatchParticipation,
  performanceScoreA: number,
  performanceScoreB: number,
  tieBreakRollA: number,
  tieBreakRollB: number,
): number {
  if (performanceScoreB !== performanceScoreA) {
    return performanceScoreB - performanceScoreA;
  }

  const roleDiff = compareRoleWeightTieBreak(a, b);
  if (roleDiff !== 0) return roleDiff;

  if (a.level !== b.level) return a.level - b.level;

  if (a.guts !== b.guts) return b.guts - a.guts;

  return tieBreakRollB - tieBreakRollA;
}

/** Premio individual por posición en el ranking (1º = maxXp, último = minXp). */
export function resolveRankRewardXp(
  rankIndex: number,
  participantCount: number,
  minXp: number,
  maxXp: number,
): number {
  if (participantCount <= 0) return 0;
  if (participantCount === 1) return maxXp;

  const factor = 1 - rankIndex / (participantCount - 1);
  return Math.floor(minXp + (maxXp - minXp) * factor);
}

export function calculateMatchXp(input: CalculateMatchXpInput): MatchXpResult {
  const weights = input.weights ?? DEFAULT_MATCH_XP_WEIGHTS;
  const { minXp, maxXp, pachangaMultiplier } = resolveBounds(input);
  const safeTotalTurns = Math.max(1, input.totalTurns);
  const xpPerTurn = Math.floor(minXp / safeTotalTurns);
  const bonusPool = Math.max(0, maxXp - minXp);

  const participants = input.players.filter(
    (player) => player.turnsOnField > 0 || player.duelsPlayed > 0,
  );

  const rng = input.rng ?? Math.random;
  const tieBreakRolls = new Map(
    participants.map((player) => [player.playerId, rng()]),
  );

  const ranked = participants
    .map((player) => ({
      player,
      performanceScore: computeParticipationPerformanceScore(player, weights),
      tieBreakRoll: tieBreakRolls.get(player.playerId) ?? 0,
    }))
    .sort((a, b) =>
      compareParticipationRanking(
        a.player,
        b.player,
        a.performanceScore,
        b.performanceScore,
        a.tieBreakRoll,
        b.tieBreakRoll,
      ),
    );

  const players: PlayerMatchXpBreakdown[] = ranked.map((entry, index) => {
    const totalXp = resolveRankRewardXp(index, ranked.length, minXp, maxXp);
    const floorXp = minXp;
    const bonusXp = totalXp - minXp;
    const progression = addExperience(
      entry.player.level,
      entry.player.experience,
      totalXp,
    );

    return {
      playerId: entry.player.playerId,
      playerName: entry.player.playerName,
      side: entry.player.side,
      turnsOnField: entry.player.turnsOnField,
      performanceScore: entry.performanceScore,
      performanceRank: index + 1,
      floorXp,
      bonusXp,
      totalXp,
      previousLevel: entry.player.level,
      newLevel: progression.level,
      previousXp: entry.player.experience,
      newXp: progression.experience,
      levelsGained: progression.levelsGained,
      baseXp: minXp,
      newExperience: progression.experience,
      previousExperience: entry.player.experience,
      leveledUp: progression.leveledUp,
    };
  });

  return {
    format: input.format,
    minXp,
    maxXp,
    bonusPool,
    xpPerTurn,
    baseXpPerTurn: xpPerTurn,
    session: input.sessionConfig?.session ?? 0,
    pachangaMultiplier,
    players,
  };
}

export function resolveMatchWinnerClubId(
  homeClubId: string,
  awayClubId: string,
  homeScore: number,
  awayScore: number,
): string | null {
  if (homeScore > awayScore) return homeClubId;
  if (awayScore > homeScore) return awayClubId;
  return null;
}

export function previewXpSettlement(
  currentLevel: number,
  currentXp: number,
  xpToAdd: number,
) {
  const result = addExperience(currentLevel, currentXp, xpToAdd);
  return {
    previousLevel: currentLevel,
    newLevel: result.level,
    previousXp: currentXp,
    currentXp: result.experience,
    leveledUp: result.leveledUp,
    levelsGained: result.levelsGained,
  };
}
