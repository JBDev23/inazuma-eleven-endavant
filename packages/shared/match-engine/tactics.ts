import type { ActionCategory } from './types';

export type TacticFamily =
  | 'feint'
  | 'dribble'
  | 'block'
  | 'steal'
  | 'shoot'
  | 'lob'
  | 'catch'
  | 'punch'
  | 'other';

const ACTION_TACTIC_FAMILY: Partial<Record<ActionCategory, TacticFamily>> = {
  FEINT_NORMAL: 'feint',
  DRIBBLE_NORMAL: 'dribble',
  DRIBBLE_SUPER: 'dribble',
  BLOCK_NORMAL: 'block',
  BLOCK_SUPER: 'block',
  STEAL_NORMAL: 'steal',
  SHOOT_NORMAL: 'shoot',
  LOB_SHOT: 'lob',
  VOLLEY: 'shoot',
  SHOOT_SUPER: 'shoot',
  CATCH_NORMAL: 'catch',
  CATCH_SUPER: 'catch',
  PUNCH_NORMAL: 'punch',
};

/** Ciclo de campo: finta > carga > segada > regate > finta */
const FIELD_RPS: Record<TacticFamily, TacticFamily> = {
  feint: 'block',
  block: 'steal',
  steal: 'dribble',
  dribble: 'feint',
  shoot: 'other',
  lob: 'other',
  catch: 'other',
  punch: 'other',
  other: 'other',
};

/**
 * Ciclo de portería: tiro > atrape > vaselina > despeje > tiro
 * - Tiro Normal rompe el agarre (gana a Atrape)
 * - Despeje rechaza la fuerza bruta (gana a Tiro Normal)
 * - Vaselina engaña al portero agresivo (gana a Despeje)
 * - Atrape embolsa el balón bombeado (gana a Vaselina)
 */
const GOAL_RPS: Record<TacticFamily, TacticFamily> = {
  shoot: 'catch',
  catch: 'lob',
  lob: 'punch',
  punch: 'shoot',
  feint: 'other',
  dribble: 'other',
  block: 'other',
  steal: 'other',
  other: 'other',
};

export function getActionTacticFamily(action: ActionCategory): TacticFamily {
  return ACTION_TACTIC_FAMILY[action] ?? 'other';
}

export function getTacticMultiplier(
  actorAction: ActionCategory,
  opponentAction: ActionCategory,
  duelType: 'FIELD' | 'GOAL',
): number {
  const actorFamily = getActionTacticFamily(actorAction);
  const opponentFamily = getActionTacticFamily(opponentAction);
  if (actorFamily === 'other' || opponentFamily === 'other') return 1;

  const table = duelType === 'GOAL' ? GOAL_RPS : FIELD_RPS;

  if (table[actorFamily] === opponentFamily) return 1.2;
  if (table[opponentFamily] === actorFamily) return 0.8;
  return 1;
}

export function getTacticAdvantageLabel(
  actorAction: ActionCategory,
  opponentAction: ActionCategory,
  duelType: 'FIELD' | 'GOAL',
): 'advantage' | 'disadvantage' | 'neutral' {
  const multiplier = getTacticMultiplier(actorAction, opponentAction, duelType);
  if (multiplier > 1) return 'advantage';
  if (multiplier < 1) return 'disadvantage';
  return 'neutral';
}
