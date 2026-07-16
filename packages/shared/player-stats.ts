import type { Player, PlayerStats, StatKey } from './types';

export const STAT_KEYS: StatKey[] = [
  'gp',
  'tp',
  'kick',
  'body',
  'control',
  'guard',
  'speed',
  'stamina',
  'guts',
];

export const BASE_STAT_MULTIPLIER = 0.15;

/** Nivel máximo para interpolar entre baseStats y maxStats */
export const MAX_PLAYER_LEVEL = 50;

export function buildMaxStatsFromSeed(data: Record<StatKey, number>): PlayerStats {
  return { ...data };
}

export function buildBaseStatsFromMax(
  maxStats: PlayerStats,
  multiplier = BASE_STAT_MULTIPLIER,
): PlayerStats {
  const baseStats = {} as PlayerStats;
  for (const key of STAT_KEYS) {
    baseStats[key] = Math.round(maxStats[key] * multiplier);
  }
  return baseStats;
}

function asPlayerStats(value: unknown): PlayerStats | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const stats = {} as PlayerStats;
  for (const key of STAT_KEYS) {
    const n = record[key];
    if (typeof n !== 'number') return null;
    stats[key] = n;
  }
  return stats;
}

/** Stats efectivas en un nivel concreto (interpolación lineal base → max). */
export function getStatsAtLevel(
  baseStats: PlayerStats,
  maxStats: PlayerStats,
  level: number,
  maxLevel = MAX_PLAYER_LEVEL,
): PlayerStats {
  const clampedLevel = Math.max(1, Math.min(level, maxLevel));
  const progress = maxLevel <= 1 ? 0 : (clampedLevel - 1) / (maxLevel - 1);
  const result = {} as PlayerStats;

  for (const key of STAT_KEYS) {
    const base = baseStats[key];
    const max = maxStats[key];
    result[key] = Math.round(base + (max - base) * progress);
  }

  return result;
}

/** Stats que debe mostrar la UI: nivel actual del jugador (por defecto 1). */
export function getDisplayStats(player: Player): PlayerStats {
  const base = asPlayerStats(player.baseStats);
  const max = asPlayerStats(player.maxStats);

  if (base && max) {
    return getStatsAtLevel(base, max, player.level ?? 1);
  }

  // Compatibilidad con mapData antiguo que aún tenga columnas planas embebidas
  const legacy = player as Player & Partial<PlayerStats>;
  const hasLegacy = STAT_KEYS.some((key) => typeof legacy[key] === 'number');
  if (hasLegacy) {
    const legacyMax = {} as PlayerStats;
    for (const key of STAT_KEYS) {
      legacyMax[key] = legacy[key] ?? 0;
    }
    const legacyBase = buildBaseStatsFromMax(legacyMax);
    return getStatsAtLevel(legacyBase, legacyMax, player.level ?? 1);
  }

  return Object.fromEntries(STAT_KEYS.map((key) => [key, 0])) as PlayerStats;
}

export function getTotalStats(stats: PlayerStats): number {
  return STAT_KEYS.reduce((sum, key) => sum + stats[key], 0);
}

export function parseStatBonuses(value: unknown): Partial<Record<StatKey, number>> {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  const bonuses: Partial<Record<StatKey, number>> = {};
  for (const key of STAT_KEYS) {
    const n = record[key];
    if (typeof n === 'number' && n > 0) {
      bonuses[key] = n;
    }
  }
  return bonuses;
}

export function applyStatBonuses(
  stats: PlayerStats,
  bonuses: Partial<Record<StatKey, number>> | undefined,
): PlayerStats {
  if (!bonuses) return stats;
  const result = { ...stats };
  for (const key of STAT_KEYS) {
    const bonus = bonuses[key];
    if (bonus) {
      result[key] += bonus;
    }
  }
  return result;
}

export function hasStatBonuses(bonuses: Partial<Record<StatKey, number>> | undefined): boolean {
  if (!bonuses) return false;
  return STAT_KEYS.some((key) => (bonuses[key] ?? 0) > 0);
}
