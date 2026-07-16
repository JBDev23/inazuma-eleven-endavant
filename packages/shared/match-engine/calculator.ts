// packages/shared/src/match-engine/calculator.ts

import { ActionCategory, DuelStats } from './types';
import { ACTION_WEIGHTS } from './constants';
import { roundDuelStat } from './duel-format';

/**
 * Calculates E_stats: The weighted sum of stats based on the selected action.
 */
export function calculateWeightedStats(stats: DuelStats, category: ActionCategory): number {
  const { weights } = ACTION_WEIGHTS[category];
  
  return roundDuelStat(
    stats.kick * weights.kick +
      stats.body * weights.body +
      stats.control * weights.control +
      stats.guard * weights.guard +
      stats.speed * weights.speed +
      stats.stamina * weights.stamina +
      stats.guts * weights.guts,
  );
}

/**
 * Formula 1: Final Power for Normal Actions (Feint, Charge, Normal Shoot, etc.)
 */
export function calculateNormalPower(
  stats: DuelStats,
  category: ActionCategory,
  elementMultiplier: number,
  tacticMultiplier: number,
  isBurningPhaseActive: boolean,
  rngOverride?: number,
): number {
  const actionData = ACTION_WEIGHTS[category];
  const eStats = calculateWeightedStats(stats, category);
  
  const rng = rngOverride ?? Math.floor(Math.random() * (actionData.rngMax + 1));
  const furor = isBurningPhaseActive ? actionData.burningPhaseBonus : 0;

  const basePower = Math.floor(eStats * elementMultiplier * tacticMultiplier);
  
  return basePower + rng + furor;
}

/**
 * Formula 2: Final Power for Super Techniques (Hissatsus)
 */
export function calculateSuperPower(
  stats: DuelStats,
  category: ActionCategory,
  techniquePower: number,
  elementMultiplier: number,
  stabMultiplier: number,
  isBurningPhaseActive: boolean,
  rngOverride?: number,
): number {
  const actionData = ACTION_WEIGHTS[category];
  const eStats = calculateWeightedStats(stats, category);
  
  const rng = rngOverride ?? Math.floor(Math.random() * (actionData.rngMax + 1));
  const furor = isBurningPhaseActive ? actionData.burningPhaseBonus : 0;

  const techniqueContribution = techniquePower * stabMultiplier;
  const basePower = Math.floor((eStats + techniqueContribution) * elementMultiplier);
  
  return basePower + rng + furor;
}