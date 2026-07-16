import type { Item, ItemStats, ItemType, Player, StatKey } from './types';
import { STAT_KEYS } from './player-stats';

export const PRIMARY_ITEM_TYPES: ItemType[] = ['BOOTS', 'GLOVES'];
export const SECONDARY_ITEM_TYPES: ItemType[] = ['BRACELET', 'PENDANT'];

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  BOOTS: 'Botas',
  GLOVES: 'Guantes',
  BRACELET: 'Pulsera',
  PENDANT: 'Colgante',
};

export function isPrimaryItemType(type: ItemType): boolean {
  return PRIMARY_ITEM_TYPES.includes(type);
}

export function isSecondaryItemType(type: ItemType): boolean {
  return SECONDARY_ITEM_TYPES.includes(type);
}

export function getPrimaryItemTypeForPosition(position: string): ItemType {
  return position === 'GK' ? 'GLOVES' : 'BOOTS';
}

export function canEquipPrimaryItem(player: Pick<Player, 'position'>, item: Pick<Item, 'type'>): boolean {
  return item.type === getPrimaryItemTypeForPosition(player.position);
}

export function parseItemStats(value: unknown): ItemStats {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  const stats: ItemStats = {};
  for (const key of STAT_KEYS) {
    const n = record[key];
    if (typeof n === 'number' && Number.isFinite(n)) {
      stats[key] = n;
    }
  }
  return stats;
}

export function getEquippedItems(
  player: Pick<Player, 'primaryItem' | 'secondaryItem'>,
): Item[] {
  return [player.primaryItem, player.secondaryItem].filter(
    (item): item is Item => item != null,
  );
}

export function sumItemBonuses(items: Array<Pick<Item, 'stats'>>): ItemStats {
  const total: ItemStats = {};
  for (const item of items) {
    const stats = parseItemStats(item.stats);
    for (const key of STAT_KEYS) {
      const bonus = stats[key];
      if (bonus != null) {
        total[key] = (total[key] ?? 0) + bonus;
      }
    }
  }
  return total;
}

export function applyItemBonuses(baseStats: Record<StatKey, number>, items: Array<Pick<Item, 'stats'>>): Record<StatKey, number> {
  const bonuses = sumItemBonuses(items);
  const result = { ...baseStats };
  for (const key of STAT_KEYS) {
    const bonus = bonuses[key];
    if (bonus != null) {
      result[key] = baseStats[key] + bonus;
    }
  }
  return result;
}
