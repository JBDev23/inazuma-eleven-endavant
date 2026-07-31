import { describe, expect, it } from 'vitest';
import {
  computeCoachMarketPrice,
  computePlayerMarketPrice,
  DEFAULT_ECONOMY_PRICING,
  getCoachSellPrice,
  getPlayerTollOrSellPrice,
  sumStatBonuses,
} from './entity-pricing';

describe('entity-pricing', () => {
  it('sums stat bonuses as total PC applied', () => {
    expect(sumStatBonuses({ kick: 2, speed: 1, gp: 0 })).toBe(3);
    expect(sumStatBonuses({})).toBe(0);
  });

  it('computes player price from base, level and PC', () => {
    expect(
      computePlayerMarketPrice(
        { level: 5, statBonuses: { kick: 2, speed: 1 } },
        DEFAULT_ECONOMY_PRICING,
      ),
    ).toBe(15 + 5 * 5 + 3 * 1);
  });

  it('computes coach price from base and level', () => {
    expect(computeCoachMarketPrice({ level: 3 }, DEFAULT_ECONOMY_PRICING)).toBe(30 + 3 * 10);
  });

  it('halves for toll/sell', () => {
    const player = { level: 4, statBonuses: { kick: 1 } };
    const full = computePlayerMarketPrice(player, DEFAULT_ECONOMY_PRICING);
    expect(getPlayerTollOrSellPrice(player, DEFAULT_ECONOMY_PRICING)).toBe(Math.floor(full / 2));
    expect(getCoachSellPrice({ level: 2 }, DEFAULT_ECONOMY_PRICING)).toBe(
      Math.floor(computeCoachMarketPrice({ level: 2 }, DEFAULT_ECONOMY_PRICING) / 2),
    );
  });
});
