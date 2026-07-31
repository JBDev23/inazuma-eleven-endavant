import type { StatKey } from './types';
import { parseStatBonuses } from './player-stats';

/** Knobs globales de precio dinámico (GameSettings). */
export interface EconomyPricingSettings {
  basePlayerPrice: number;
  playerPricePerLevel: number;
  baseCoachPrice: number;
  coachPricePerLevel: number;
  playerPricePerPc: number;
}

export const DEFAULT_ECONOMY_PRICING: EconomyPricingSettings = {
  basePlayerPrice: 15,
  playerPricePerLevel: 5,
  baseCoachPrice: 30,
  coachPricePerLevel: 10,
  playerPricePerPc: 1,
};

export function sumStatBonuses(
  statBonuses: Partial<Record<StatKey, number>> | unknown | undefined,
): number {
  const bonuses =
    statBonuses && typeof statBonuses === 'object' && !Array.isArray(statBonuses)
      ? parseStatBonuses(statBonuses)
      : {};
  return Object.values(bonuses).reduce((sum, n) => sum + (n ?? 0), 0);
}

export function computePlayerMarketPrice(
  player: { level?: number | null; statBonuses?: Partial<Record<StatKey, number>> | unknown },
  economy: EconomyPricingSettings = DEFAULT_ECONOMY_PRICING,
): number {
  const level = Math.max(1, Number(player.level ?? 1));
  const pcTotal = sumStatBonuses(player.statBonuses);
  return (
    economy.basePlayerPrice +
    level * economy.playerPricePerLevel +
    pcTotal * economy.playerPricePerPc
  );
}

export function computeCoachMarketPrice(
  coach: { level?: number | null },
  economy: EconomyPricingSettings = DEFAULT_ECONOMY_PRICING,
): number {
  const level = Math.max(1, Number(coach.level ?? 1));
  return economy.baseCoachPrice + level * economy.coachPricePerLevel;
}

export function getPlayerTollOrSellPrice(
  player: { level?: number | null; statBonuses?: Partial<Record<StatKey, number>> | unknown },
  economy: EconomyPricingSettings = DEFAULT_ECONOMY_PRICING,
): number {
  return Math.floor(computePlayerMarketPrice(player, economy) / 2);
}

export function getCoachSellPrice(
  coach: { level?: number | null },
  economy: EconomyPricingSettings = DEFAULT_ECONOMY_PRICING,
): number {
  return Math.floor(computeCoachMarketPrice(coach, economy) / 2);
}

/** Sobrescribe `price` con el valor de mercado dinámico. */
export function withComputedPlayerPrice<T extends { level?: number | null; statBonuses?: unknown; price?: number }>(
  player: T,
  economy: EconomyPricingSettings = DEFAULT_ECONOMY_PRICING,
): T {
  return {
    ...player,
    price: computePlayerMarketPrice(player, economy),
  };
}

export function withComputedCoachPrice<T extends { level?: number | null; price?: number }>(
  coach: T,
  economy: EconomyPricingSettings = DEFAULT_ECONOMY_PRICING,
): T {
  return {
    ...coach,
    price: computeCoachMarketPrice(coach, economy),
  };
}

export function withComputedPlayerPrices<T extends { level?: number | null; statBonuses?: unknown; price?: number }>(
  players: T[],
  economy: EconomyPricingSettings = DEFAULT_ECONOMY_PRICING,
): T[] {
  return players.map((p) => withComputedPlayerPrice(p, economy));
}

export function withComputedCoachPrices<T extends { level?: number | null; price?: number }>(
  coaches: T[],
  economy: EconomyPricingSettings = DEFAULT_ECONOMY_PRICING,
): T[] {
  return coaches.map((c) => withComputedCoachPrice(c, economy));
}
