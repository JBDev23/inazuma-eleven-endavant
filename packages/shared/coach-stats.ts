import type { Coach, CoachModifiers, StatKey } from './types';
import { STAT_KEYS } from './player-stats';

/** Nivel máximo para interpolar entre baseModifiers y maxModifiers */
export const MAX_COACH_LEVEL = 10;

/** A nivel 1 el entrenador aplica el 10% del bonus/malus máximo (ej. +10% max → +1% en nivel 1). */
export const BASE_MODIFIER_RATIO = 0.1;

export function buildMaxModifiersFromSeed(
  data: Record<StatKey, number>,
): CoachModifiers {
  return { ...data };
}

export function buildBaseModifiersFromMax(
  maxModifiers: CoachModifiers,
  ratio = BASE_MODIFIER_RATIO,
): CoachModifiers {
  const baseModifiers = {} as CoachModifiers;
  for (const key of STAT_KEYS) {
    const max = maxModifiers[key];
    baseModifiers[key] = 1 + (max - 1) * ratio;
  }
  return baseModifiers;
}

function asCoachModifiers(value: unknown): CoachModifiers | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const modifiers = {} as CoachModifiers;
  for (const key of STAT_KEYS) {
    const n = record[key];
    if (typeof n !== 'number') return null;
    modifiers[key] = n;
  }
  return modifiers;
}

function roundModifier(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Multiplicadores tácticos efectivos en un nivel concreto (interpolación lineal base → max). */
export function getModifiersAtLevel(
  baseModifiers: CoachModifiers,
  maxModifiers: CoachModifiers,
  level: number,
  maxLevel = MAX_COACH_LEVEL,
): CoachModifiers {
  const clampedLevel = Math.max(1, Math.min(level, maxLevel));
  const progress = maxLevel <= 1 ? 0 : (clampedLevel - 1) / (maxLevel - 1);
  const result = {} as CoachModifiers;

  for (const key of STAT_KEYS) {
    const base = baseModifiers[key];
    const max = maxModifiers[key];
    result[key] = roundModifier(base + (max - base) * progress);
  }

  return result;
}

/** Multiplicadores que debe mostrar la UI: nivel actual del entrenador (por defecto 1). */
export function getDisplayModifiers(coach: Coach): CoachModifiers {
  const base = asCoachModifiers(coach.baseModifiers);
  const max = asCoachModifiers(coach.maxModifiers);

  if (base && max) {
    return getModifiersAtLevel(base, max, coach.level ?? 1);
  }

  return Object.fromEntries(STAT_KEYS.map((key) => [key, 1])) as CoachModifiers;
}
