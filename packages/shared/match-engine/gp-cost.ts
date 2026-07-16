/**
 * GP (PE) cost for normal duel actions, scaled from weighted stat power (eStats).
 * Stronger players / higher-level actions cost more stamina per duel.
 */

/** Divisor applied to eStats to derive GP cost. */
export const DUEL_NORMAL_GP_POWER_DIVISOR = 40;

export const DUEL_NORMAL_GP_MIN = 1;
export const DUEL_NORMAL_GP_MAX = 6;

export function calculateNormalDuelGpCost(eStats: number): number {
  if (!Number.isFinite(eStats) || eStats <= 0) return DUEL_NORMAL_GP_MIN;

  const scaled = Math.ceil(eStats / DUEL_NORMAL_GP_POWER_DIVISOR);
  return Math.min(DUEL_NORMAL_GP_MAX, Math.max(DUEL_NORMAL_GP_MIN, scaled));
}
