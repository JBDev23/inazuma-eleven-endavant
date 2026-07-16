import type { Consumable, ConsumableCategory, ConsumableEffect } from './types';

export const CONSUMABLE_CATEGORY_LABELS: Record<ConsumableCategory, string> = {
  WATER: 'Agua',
  FOOD: 'Comida',
  SPECIAL: 'Especial',
};

export const CONSUMABLE_EFFECT_LABELS: Record<ConsumableEffect, string> = {
  RESTORE_GP_PERCENT: 'Recupera GP',
  RESTORE_TP_PERCENT: 'Recupera TP',
  REVEAL_OPPONENT_COMMAND: 'Espía comando rival',
};

export const CONSUMABLE_CATEGORY_ORDER: ConsumableCategory[] = ['WATER', 'FOOD', 'SPECIAL'];

const TIER_COLORS = [
  'border-slate-600 from-slate-800/80 to-slate-900',
  'border-blue-600 from-blue-900/40 to-slate-900',
  'border-purple-600 from-purple-900/40 to-slate-900',
  'border-amber-500 from-amber-900/40 to-slate-900',
] as const;

export function getConsumableTier(consumable: Pick<Consumable, 'effectValue'>): number {
  const percent = consumable.effectValue;
  if (percent <= 25) return 1;
  if (percent <= 50) return 2;
  if (percent <= 75) return 3;
  return 4;
}

export function getConsumableTierColor(consumable: Pick<Consumable, 'effectValue'>): string {
  return TIER_COLORS[getConsumableTier(consumable) - 1] ?? TIER_COLORS[0];
}

export function formatConsumableEffect(consumable: Pick<Consumable, 'effect' | 'effectValue'>): string {
  switch (consumable.effect) {
    case 'RESTORE_GP_PERCENT':
      return `+${consumable.effectValue}% GP`;
    case 'RESTORE_TP_PERCENT':
      return `+${consumable.effectValue}% TP`;
    case 'REVEAL_OPPONENT_COMMAND':
      return 'Revela el comando del rival';
    default:
      return CONSUMABLE_EFFECT_LABELS[consumable.effect];
  }
}

export function isRestoreConsumable(
  consumable: Pick<Consumable, 'effect'>,
): consumable is Consumable & { effect: 'RESTORE_GP_PERCENT' | 'RESTORE_TP_PERCENT' } {
  return consumable.effect === 'RESTORE_GP_PERCENT' || consumable.effect === 'RESTORE_TP_PERCENT';
}

export function applyConsumableRestore(
  current: { gp: number; tp: number },
  max: { gp: number; tp: number },
  effect: ConsumableEffect,
  effectValue: number,
): { gp: number; tp: number } {
  const restore = (value: number, cap: number) =>
    Math.min(cap, value + Math.floor((cap * effectValue) / 100));

  switch (effect) {
    case 'RESTORE_GP_PERCENT':
      return { ...current, gp: restore(current.gp, max.gp) };
    case 'RESTORE_TP_PERCENT':
      return { ...current, tp: restore(current.tp, max.tp) };
    default:
      return current;
  }
}

export interface ConsumableUsageRecord {
  turn: number;
  side: 'home' | 'away';
  clubId: string;
  playerId: number;
  playerName: string;
  consumableId: number;
  consumableName: string;
  effect: ConsumableEffect;
  effectValue: number;
}

export interface ApplyMatchConsumableUsage {
  clubId: string;
  playerId: number;
  consumableId: number;
  turn: number;
}
