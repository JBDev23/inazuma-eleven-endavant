import type { Consumable, ConsumableCategory, ConsumableEffect } from '@inazuma/shared';

type RawConsumable = {
  id: number;
  name: string;
  category: ConsumableCategory | string;
  effect: ConsumableEffect | string;
  effectValue: number;
  price: number;
  description: string | null;
  imageUrl: string | null;
};

export function formatConsumable(raw: RawConsumable): Consumable {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category as ConsumableCategory,
    effect: raw.effect as ConsumableEffect,
    effectValue: raw.effectValue,
    price: raw.price,
    description: raw.description,
    imageUrl: raw.imageUrl,
  };
}

export function formatClubConsumable(
  raw: { clubId: string; consumableId: number; quantity: number; consumable: RawConsumable },
) {
  return {
    clubId: raw.clubId,
    consumableId: raw.consumableId,
    quantity: raw.quantity,
    consumable: formatConsumable(raw.consumable),
  };
}

export function formatClubConsumables(
  rawItems: Array<{ clubId: string; consumableId: number; quantity: number; consumable: RawConsumable }>,
) {
  return rawItems.map(formatClubConsumable);
}
