import { parseItemStats, type Item, type ItemType } from '@inazuma/shared';

type RawItem = {
  id: number;
  name: string;
  type: ItemType | string;
  price: number;
  stats: unknown;
};

export function formatItem(raw: RawItem): Item {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type as ItemType,
    price: raw.price,
    stats: parseItemStats(raw.stats),
  };
}

export function formatClubItem(
  raw: { clubId: string; itemId: number; quantity: number; item: RawItem },
) {
  return {
    clubId: raw.clubId,
    itemId: raw.itemId,
    quantity: raw.quantity,
    item: formatItem(raw.item),
  };
}

export function formatClubItems(
  rawItems: Array<{ clubId: string; itemId: number; quantity: number; item: RawItem }>,
) {
  return rawItems.map(formatClubItem);
}
