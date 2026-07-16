import type { ActionCategory } from './types';

/** Multiplicador de poder por franja de distancia (índice = franjas desde la portería). */
export const SHOT_DISTANCE_MULTIPLIERS = [
  1.6, // 0
  1.4, // 1
  1.2, // 2
  1.0, // 3
  0.8, // 4
  0.7, // 5
  0.6, // 6
  0.5, // 7
  0.4, // 8
  0.3, // 9
  0.2, // 10
  0.1, // 11
] as const;

const SHOT_ACTIONS = new Set<ActionCategory>([
  'SHOOT_NORMAL',
  'LOB_SHOT',
  'VOLLEY',
  'SHOOT_SUPER',
]);

export function isShotAction(action: ActionCategory): boolean {
  return SHOT_ACTIONS.has(action);
}

export function getShotDistanceMultiplier(franjas: number): number {
  if (!Number.isFinite(franjas) || franjas < 0) return 1;
  const index = Math.floor(franjas);
  if (index >= 12) return 0;
  return SHOT_DISTANCE_MULTIPLIERS[index] ?? 0;
}

export function applyShotDistanceMultiplier(power: number, franjas: number): number {
  return Math.floor(power * getShotDistanceMultiplier(franjas));
}

export function formatShotDistanceMultiplier(franjas: number): string {
  return `${Math.round(getShotDistanceMultiplier(franjas) * 100)}%`;
}
