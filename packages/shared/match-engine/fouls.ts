import type { ActionCategory } from './types';
import type { DuelSide } from './duel-resolver';
import {
  getWeatherFoulRateMultiplier,
  type WeatherCondition,
} from './weather';

/** Carga / Bloqueo: contacto legal, probabilidad muy baja (~2–5 %). */
export const BLOCK_NORMAL_FOUL_RATE = 0.035;

/** Segada: entra con los tacos, alta probabilidad (~15–20 %). */
export const STEAL_NORMAL_FOUL_RATE = 0.175;

const FOULABLE_DEFENSIVE_ACTIONS = new Set<ActionCategory>([
  'BLOCK_NORMAL',
  'STEAL_NORMAL',
  'BLOCK_SUPER',
]);

export function canActionCauseFoul(action: ActionCategory): boolean {
  return FOULABLE_DEFENSIVE_ACTIONS.has(action);
}

export function getFoulRateForAction(
  action: ActionCategory,
  moveFoulRate?: number,
  weather: WeatherCondition = 'clear',
): number {
  let rate = 0;

  switch (action) {
    case 'BLOCK_NORMAL':
      rate = BLOCK_NORMAL_FOUL_RATE;
      break;
    case 'STEAL_NORMAL':
      rate = STEAL_NORMAL_FOUL_RATE;
      break;
    case 'BLOCK_SUPER':
      rate = moveFoulRate ?? 0;
      break;
    default:
      rate = 0;
  }

  return Math.min(1, rate * getWeatherFoulRateMultiplier(action, weather));
}

export interface FoulRollResult {
  occurred: boolean;
  foulSide?: DuelSide;
  foulRate: number;
  action?: ActionCategory;
}

export function rollDefenderFoul(params: {
  duelType: 'FIELD' | 'GOAL';
  ballSide: DuelSide;
  defenderAction: ActionCategory;
  moveFoulRate?: number;
  weather?: WeatherCondition;
  random?: () => number;
}): FoulRollResult {
  const { duelType, ballSide, defenderAction, moveFoulRate, weather = 'clear' } = params;

  if (duelType !== 'FIELD' || !canActionCauseFoul(defenderAction)) {
    return { occurred: false, foulRate: 0 };
  }

  const foulRate = getFoulRateForAction(defenderAction, moveFoulRate, weather);
  if (foulRate <= 0) {
    return { occurred: false, foulRate: 0 };
  }

  const random = params.random ?? Math.random;
  const occurred = random() < foulRate;

  return {
    occurred,
    foulSide: occurred ? (ballSide === 'home' ? 'away' : 'home') : undefined,
    foulRate,
    action: defenderAction,
  };
}

export function formatFoulRatePercent(rate: number): string {
  return `${(rate * 100).toFixed(1).replace(/\.0$/, '')}%`;
}
