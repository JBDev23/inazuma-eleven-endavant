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

export interface SpendPcPreview {
  playerId: number;
  playerName: string;
  statKey: StatKey;
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
  pcCost: number = PC_COST_PER_STAT,
): SpendPcPreview {
  const warnings: string[] = [];
  const player = players.find((p) => p.id === playerId);

  if (!player) {
    warnings.push(`El jugador #${playerId} no pertenece a tu plantilla.`);
  }

  if (availablePc < pcCost) {
    warnings.push(`No tienes suficientes PC. Disponibles: ${availablePc}, necesarios: ${pcCost}.`);
  }

  const currentBonus = currentBonuses[statKey] ?? 0;
  const maxBonus = getMaxPcBonusForStat(statKey);

  if (currentBonus >= maxBonus) {
    warnings.push(
      `${player?.name ?? `Jugador #${playerId}`} ya tiene el máximo de +${maxBonus} en esta stat.`,
    );
  }

  return {
    playerId,
    playerName: player?.name ?? `#${playerId}`,
    statKey,
    currentBonus,
    newBonus: Math.min(currentBonus + 1, maxBonus),
    maxBonus,
    pcCost,
    remainingPc: availablePc - pcCost,
    warnings,
  };
}

export function mergeStatBonus(
  bonuses: Partial<Record<StatKey, number>>,
  statKey: StatKey,
): Partial<Record<StatKey, number>> {
  if (isStatBonusAtMax(bonuses, statKey)) {
    throw new Error(`La stat ${statKey} ya está al máximo de mejora PC (+${getMaxPcBonusForStat(statKey)}).`);
  }

  return {
    ...bonuses,
    [statKey]: (bonuses[statKey] ?? 0) + 1,
  };
}
