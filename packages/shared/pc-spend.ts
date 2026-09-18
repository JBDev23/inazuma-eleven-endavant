import type { StatKey } from './types';
import { PC_COST_PER_STAT } from './economy';
import { STAT_KEYS } from './player-stats';

export { PC_COST_PER_STAT };

/** Tope de mejora PC por stat (kick, body, etc.) */
export const PC_STAT_BONUS_MAX = 10;

/** Tope de mejora PC para GP y TP */
export const PC_STAT_BONUS_MAX_GP_TP = 20;

export function getMaxPcBonusForStat(statKey: StatKey): number {
  return statKey === 'gp' || statKey === 'tp' ? PC_STAT_BONUS_MAX_GP_TP : PC_STAT_BONUS_MAX;
}

export function getStatBonus(bonuses: Partial<Record<StatKey, number>>, statKey: StatKey): number {
  return bonuses[statKey] ?? 0;
}

export function isStatBonusAtMax(
  bonuses: Partial<Record<StatKey, number>>,
  statKey: StatKey,
): boolean {
  return getStatBonus(bonuses, statKey) >= getMaxPcBonusForStat(statKey);
}

export function canIncreaseStatBonus(
  bonuses: Partial<Record<StatKey, number>>,
  statKey: StatKey,
): boolean {
  return !isStatBonusAtMax(bonuses, statKey);
}

export function canIncreaseAnyStatBonus(bonuses: Partial<Record<StatKey, number>>): boolean {
  return STAT_KEYS.some((key) => canIncreaseStatBonus(bonuses, key));
}

/** Cuántos puntos de mejora PC quedan hasta el tope de esa stat. */
export function getRemainingPcBonusRoom(
  bonuses: Partial<Record<StatKey, number>>,
  statKey: StatKey,
): number {
  return Math.max(0, getMaxPcBonusForStat(statKey) - getStatBonus(bonuses, statKey));
}

export interface SpendPcPreview {
  playerId: number;
  playerName: string;
  statKey: StatKey;
  amount: number;
  currentBonus: number;
  newBonus: number;
  maxBonus: number;
  pcCost: number;
  remainingPc: number;
  warnings: string[];
}

type PlayerForSpend = {
  id: number;
  name: string;
};

export function buildSpendPcPreview(
  playerId: number,
  statKey: StatKey,
  players: PlayerForSpend[],
  availablePc: number,
  currentBonuses: Partial<Record<StatKey, number>>,
  pcCostPerUnit: number = PC_COST_PER_STAT,
  amount: number = 1,
): SpendPcPreview {
  const warnings: string[] = [];
  const player = players.find((p) => p.id === playerId);
  const safeAmount = Number.isInteger(amount) && amount > 0 ? amount : 0;
  const totalCost = safeAmount * pcCostPerUnit;

  if (!player) {
    warnings.push(`El jugador #${playerId} no pertenece a tu plantilla.`);
  }

  if (!Number.isInteger(amount) || amount < 1) {
    warnings.push('La cantidad de mejora debe ser un entero positivo.');
  }

  if (availablePc < totalCost) {
    warnings.push(
      `No tienes suficientes PC. Disponibles: ${availablePc}, necesarios: ${totalCost}.`,
    );
  }

  const currentBonus = currentBonuses[statKey] ?? 0;
  const maxBonus = getMaxPcBonusForStat(statKey);
  const room = Math.max(0, maxBonus - currentBonus);

  if (currentBonus >= maxBonus) {
    warnings.push(
      `${player?.name ?? `Jugador #${playerId}`} ya tiene el máximo de +${maxBonus} en esta stat.`,
    );
  } else if (safeAmount > room) {
    warnings.push(
      `Solo puedes aumentar esta stat en +${room} más (máx. +${maxBonus}).`,
    );
  }

  return {
    playerId,
    playerName: player?.name ?? `#${playerId}`,
    statKey,
    amount: safeAmount,
    currentBonus,
    newBonus: Math.min(currentBonus + safeAmount, maxBonus),
    maxBonus,
    pcCost: totalCost,
    remainingPc: availablePc - totalCost,
    warnings,
  };
}

export function mergeStatBonus(
  bonuses: Partial<Record<StatKey, number>>,
  statKey: StatKey,
  amount: number = 1,
): Partial<Record<StatKey, number>> {
  if (!Number.isInteger(amount) || amount < 1) {
    throw new Error('La cantidad de mejora PC debe ser un entero positivo.');
  }

  const current = bonuses[statKey] ?? 0;
  const max = getMaxPcBonusForStat(statKey);

  if (current >= max) {
    throw new Error(`La stat ${statKey} ya está al máximo de mejora PC (+${max}).`);
  }

  if (current + amount > max) {
    throw new Error(
      `No se puede aumentar ${statKey} en +${amount} (máx. +${max}, actual +${current}).`,
    );
  }

  return {
    ...bonuses,
    [statKey]: current + amount,
  };
}
