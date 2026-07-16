export const MAX_MOVE_LEVEL = 5;

export function getMovePowerAtLevel(
  move: { basePower: number; maxPower: number; currentLevel: number },
  maxLevel = MAX_MOVE_LEVEL,
): number {
  const level = Math.max(1, Math.min(move.currentLevel, maxLevel));
  const progress = maxLevel <= 1 ? 0 : (level - 1) / (maxLevel - 1);
  return Math.round(move.basePower + (move.maxPower - move.basePower) * progress);
}
