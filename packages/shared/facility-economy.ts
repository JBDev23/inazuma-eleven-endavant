import type { SportsCityState } from './sports-city';

const SHOP_ITEM_DISCOUNT = 0.2;
const FREE_MARKET_DISCOUNT = 0.2;
const CLINIC_CONSUMABLE_EFFECT_BONUS = 0.5;

export function applyPriceDiscount(basePrice: number, discountRate: number): number {
  return Math.max(0, Math.floor(basePrice * (1 - discountRate)));
}

/** Tienda Nv.2: -20% en objetos del catálogo. */
export function getShopItemPrice(basePrice: number, facilities: SportsCityState): number {
  if (facilities.shop < 2) return basePrice;
  return applyPriceDiscount(basePrice, SHOP_ITEM_DISCOUNT);
}

/** Tienda Nv.3: -20% al fichar en mercado libre. */
export function getFreeMarketPlayerPrice(basePrice: number, facilities: SportsCityState): number {
  if (facilities.shop < 3) return basePrice;
  return applyPriceDiscount(basePrice, FREE_MARKET_DISCOUNT);
}

/**
 * Clínica Nv.2: +50% de efecto en consumibles usados en partido oficial.
 * Ej.: 25% GP → 37% (floor de 37.5).
 */
export function getFacilityConsumableEffectValue(
  baseEffectValue: number,
  facilities: SportsCityState,
  isOfficialMatch: boolean,
): number {
  if (!isOfficialMatch || facilities.clinic < 2) return baseEffectValue;
  return Math.floor(baseEffectValue * (1 + CLINIC_CONSUMABLE_EFFECT_BONUS));
}
