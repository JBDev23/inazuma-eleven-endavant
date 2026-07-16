import { normalizeElement, type NormalizedElement } from './elements';
import type { ActionCategory, DuelStats } from './types';

export type WeatherCondition =
  | 'clear'
  | 'rain'
  | 'strong_wind'
  | 'heat_wave'
  | 'muddy'
  | 'dense_fog'
  | 'snow';

export const DEFAULT_WEATHER: WeatherCondition = 'clear';

/** PE (GP) gastados por cada chapa en el campo al avanzar un turno. */
export const FIELD_GP_COST_PER_TURN = 1;

const SUPER_ACTIONS = new Set<ActionCategory>([
  'DRIBBLE_SUPER',
  'BLOCK_SUPER',
  'SHOOT_SUPER',
  'CATCH_SUPER',
]);

const DEFENSIVE_ACTIONS = new Set<ActionCategory>([
  'BLOCK_NORMAL',
  'STEAL_NORMAL',
  'BLOCK_SUPER',
]);

const WEATHER_SUPER_ELEMENT_BOOST: Partial<Record<WeatherCondition, NormalizedElement>> = {
  rain: 'wood',
  strong_wind: 'wind',
  heat_wave: 'fire',
  muddy: 'earth',
};

function isSuperAction(action: ActionCategory): boolean {
  return SUPER_ACTIONS.has(action);
}

function isDefensiveAction(action: ActionCategory): boolean {
  return DEFENSIVE_ACTIONS.has(action);
}

function isAerialSecondaryType(secondaryType: string | null | undefined): boolean {
  if (!secondaryType) return false;
  const normalized = secondaryType.trim().toLowerCase();
  return normalized === 'aerial' || normalized === 'aéreo' || normalized === 'aereo';
}

/** Tiros afectados por el viento: etiqueta Aéreo o Vaselina. */
export function isWindPenalizedShot(
  action: ActionCategory,
  moveSecondaryType?: string | null,
): boolean {
  if (action === 'LOB_SHOT' || action === 'VOLLEY') return true;
  if (action === 'SHOOT_NORMAL' || action === 'SHOOT_SUPER') {
    return isAerialSecondaryType(moveSecondaryType);
  }
  return false;
}

export function applyWeatherToDuelStats(
  stats: DuelStats,
  weather: WeatherCondition,
): DuelStats {
  if (weather !== 'muddy') return stats;

  return {
    ...stats,
    speed: Math.round(stats.speed * 0.9),
    body: Math.round(stats.body * 0.9),
  };
}

export function getWeatherFoulRateMultiplier(
  action: ActionCategory,
  weather: WeatherCondition,
): number {
  if (weather === 'rain' && action === 'STEAL_NORMAL') return 2;
  return 1;
}

export function getFieldGpCostPerTurn(weather: WeatherCondition): number {
  const base = FIELD_GP_COST_PER_TURN;
  if (weather === 'heat_wave') return base * 2;
  return base;
}

export function getWeatherShootSuperTpExtra(weather: WeatherCondition): number {
  return weather === 'snow' ? 5 : 0;
}

export function applyWeatherPowerModifier(
  total: number,
  action: ActionCategory,
  weather: WeatherCondition,
  move?: { element: string; secondaryType?: string | null },
): number {
  if (weather === 'clear' || total <= 0) return total;

  let multiplier = 1;

  const boostedElement = WEATHER_SUPER_ELEMENT_BOOST[weather];
  if (
    boostedElement &&
    isSuperAction(action) &&
    move &&
    normalizeElement(move.element) === boostedElement
  ) {
    multiplier *= 1.1;
  }

  if (weather === 'strong_wind' && isWindPenalizedShot(action, move?.secondaryType)) {
    multiplier *= 0.85;
  }

  if (weather === 'dense_fog' && isDefensiveAction(action)) {
    multiplier *= 0.9;
  }

  if (weather === 'snow' && isDefensiveAction(action)) {
    multiplier *= 1.1;
  }

  if (multiplier === 1) return total;
  return Math.floor(total * multiplier);
}

export function getWeatherPowerMultiplier(
  action: ActionCategory,
  weather: WeatherCondition,
  move?: { element: string; secondaryType?: string | null },
): number {
  if (weather === 'clear') return 1;

  let multiplier = 1;

  const boostedElement = WEATHER_SUPER_ELEMENT_BOOST[weather];
  if (
    boostedElement &&
    isSuperAction(action) &&
    move &&
    normalizeElement(move.element) === boostedElement
  ) {
    multiplier *= 1.1;
  }

  if (weather === 'strong_wind' && isWindPenalizedShot(action, move?.secondaryType)) {
    multiplier *= 0.85;
  }

  if (weather === 'dense_fog' && isDefensiveAction(action)) {
    multiplier *= 0.9;
  }

  if (weather === 'snow' && isDefensiveAction(action)) {
    multiplier *= 1.1;
  }

  return multiplier;
}
