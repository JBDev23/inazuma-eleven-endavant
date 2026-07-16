import type { Coach, CoachModifiers, Item, Player, PlayerStats, StatKey, UserClub } from './types';
import { getDisplayModifiers } from './coach-stats';
import { applyItemBonuses, getEquippedItems } from './item-stats';
import { applyStatBonuses, getDisplayStats, STAT_KEYS } from './player-stats';

export type StatModifierKind = 'boost' | 'nerf' | 'neutral';

type PlayerWithEquipment = Player & {
  primaryItem?: Item | null;
  secondaryItem?: Item | null;
};

/** Resuelve el entrenador activo de un club a partir de activeCoachId y coaches[]. */
export function getActiveCoach(club: UserClub | null | undefined): Coach | null {
  if (!club?.activeCoachId || !club.coaches?.length) return null;
  return club.coaches.find((coach) => coach.id === club.activeCoachId) ?? null;
}

/** Aplica multiplicadores tácticos del entrenador sobre stats base (redondeo al entero más cercano). */
export function applyCoachModifiers(
  baseStats: PlayerStats,
  modifiers: CoachModifiers,
): PlayerStats {
  const result = {} as PlayerStats;
  for (const key of STAT_KEYS) {
    result[key] = Math.round(baseStats[key] * modifiers[key]);
  }
  return result;
}

/** Stats del jugador con bonificadores de objetos equipados (sin entrenador). */
export function getStatsWithItems(player: PlayerWithEquipment): PlayerStats {
  const base = getDisplayStats(player);
  const withPc = applyStatBonuses(base, player.statBonuses);
  return applyItemBonuses(withPc, getEquippedItems(player)) as PlayerStats;
}

/** Stats efectivas: nivel + objetos + bonificaciones del entrenador activo (si lo hay). */
export function getEffectiveStats(player: PlayerWithEquipment, coach?: Coach | null): PlayerStats {
  const withItems = getStatsWithItems(player);
  if (!coach) return withItems;
  return applyCoachModifiers(withItems, getDisplayModifiers(coach));
}

export function getStatModifierKind(base: number, effective: number): StatModifierKind {
  if (effective > base) return 'boost';
  if (effective < base) return 'nerf';
  return 'neutral';
}

export function getStatDelta(base: number, effective: number): number {
  return effective - base;
}

export function hasCoachStatChanges(baseStats: PlayerStats, effectiveStats: PlayerStats): boolean {
  return STAT_KEYS.some((key) => baseStats[key] !== effectiveStats[key]);
}

export function hasItemStatChanges(baseStats: PlayerStats, statsWithItems: PlayerStats): boolean {
  return STAT_KEYS.some((key) => baseStats[key] !== statsWithItems[key]);
}

export function getModifiedStatKeys(
  baseStats: PlayerStats,
  effectiveStats: PlayerStats,
): StatKey[] {
  return STAT_KEYS.filter((key) => baseStats[key] !== effectiveStats[key]);
}
