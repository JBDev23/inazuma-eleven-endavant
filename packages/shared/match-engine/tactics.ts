import type { ActionCategory } from './types';

export type TacticFamily =
  | 'feint'
  | 'dribble'
  | 'block'
  | 'steal'
  | 'shoot'
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
  LOB_SHOT: 'shoot',
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
  catch: 'other',
  punch: 'other',
  other: 'other',
};

/** Ciclo de portería: tiro > puño > atrapada > tiro */
const GOAL_RPS: Record<TacticFamily, TacticFamily> = {
  shoot: 'punch',
  punch: 'catch',
  catch: 'shoot',
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
