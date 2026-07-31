import {
  formatPlayerWithMoves,
  formatPlayersWithMoves,
  parseStatBonuses,
  withComputedPlayerPrice,
  withComputedCoachPrice,
  type EconomyPricingSettings,
  type RawPlayerWithMoves,
} from '@inazuma/shared';
import { formatFormation } from './format-formation';
import { formatClubItems, formatItem } from './format-item';
import { formatClubConsumables } from './format-consumable';
import { formatClubFacilities } from './format-facility';

export { formatPlayerWithMoves, formatPlayersWithMoves };

export function enrichPlayerWithEquipment(
  rawPlayer: RawPlayerWithMoves | null | undefined,
  economy?: EconomyPricingSettings,
) {
  const player = formatPlayerWithMoves(rawPlayer);
  if (!player) return null;

  const raw = rawPlayer as Record<string, unknown>;
  player.primaryItemId = (raw.primaryItemId as number | null | undefined) ?? null;
  player.secondaryItemId = (raw.secondaryItemId as number | null | undefined) ?? null;
  player.statBonuses = parseStatBonuses(raw.statBonuses);

  if (raw.primaryItem && typeof raw.primaryItem === 'object') {
    player.primaryItem = formatItem(raw.primaryItem as Parameters<typeof formatItem>[0]);
    player.primaryItemId = player.primaryItem.id;
  } else {
    player.primaryItem = null;
  }
  if (raw.secondaryItem && typeof raw.secondaryItem === 'object') {
    player.secondaryItem = formatItem(raw.secondaryItem as Parameters<typeof formatItem>[0]);
    player.secondaryItemId = player.secondaryItem.id;
  } else {
    player.secondaryItem = null;
  }

  return economy ? withComputedPlayerPrice(player, economy) : player;
}

export function enrichPlayersWithEquipment(
  rawPlayers: RawPlayerWithMoves[],
  economy?: EconomyPricingSettings,
) {
  return rawPlayers
    .map((player) => enrichPlayerWithEquipment(player, economy))
    .filter((player): player is NonNullable<typeof player> => player != null);
}

export function applyPlayerEconomyPrice<T extends { level?: number | null; statBonuses?: unknown; price?: number }>(
  player: T,
  economy: EconomyPricingSettings,
): T {
  return withComputedPlayerPrice(player, economy);
}

export function applyCoachEconomyPrice<T extends { level?: number | null; price?: number }>(
  coach: T,
  economy: EconomyPricingSettings,
): T {
  return withComputedCoachPrice(coach, economy);
}

export function formatClubWithRoster<
  T extends {
    roster?: unknown[];
    coaches?: unknown[];
    formations?: unknown[];
    formation11?: unknown;
    formation4?: unknown;
    items?: unknown[];
    consumables?: unknown[];
    facilities?: unknown[];
  },
>(club: T, economy?: EconomyPricingSettings) {
  const formatted: T & { formation11?: unknown; formation4?: unknown } = { ...club };

  if (club.roster) {
    formatted.roster = enrichPlayersWithEquipment(
      club.roster as RawPlayerWithMoves[],
      economy,
    );
  }

  if (club.coaches && economy) {
    formatted.coaches = (club.coaches as Array<{ level?: number | null; price?: number }>).map(
      (coach) => withComputedCoachPrice(coach, economy),
    );
  }

  if (club.items) {
    formatted.items = formatClubItems(
      club.items as Array<{
        clubId: string;
        itemId: number;
        quantity: number;
        item: Parameters<typeof formatItem>[0];
      }>,
    );
  }

  if (club.consumables) {
    formatted.consumables = formatClubConsumables(
      club.consumables as Array<{
        clubId: string;
        consumableId: number;
        quantity: number;
        consumable: Parameters<typeof import('./format-consumable').formatConsumable>[0];
      }>,
    );
  }

  if (club.facilities) {
    formatted.facilities = formatClubFacilities(
      club.facilities as Array<{
        facility: import('@prisma/client').FacilityType;
        level: number;
        upgradingTo: number | null;
        pitchElement?: string | null;
      }>,
    );
  }

  if (club.formations) {
    formatted.formations = (
      club.formations as Array<{ clubId: string; formationId: number; unlockedAt: Date; formation: unknown }>
    ).map((entry) => ({
      ...entry,
      formation: formatFormation(entry.formation as Parameters<typeof formatFormation>[0]),
    }));
  }

  if ('formation11' in club && club.formation11) {
    formatted.formation11 = formatFormation(
      club.formation11 as Parameters<typeof formatFormation>[0],
    );
  }

  if ('formation4' in club && club.formation4) {
    formatted.formation4 = formatFormation(
      club.formation4 as Parameters<typeof formatFormation>[0],
    );
  }

  return formatted;
}

export function formatTeamWithPlayers<T extends { players?: unknown[] }>(
  team: T,
  economy?: EconomyPricingSettings,
) {
  if (!team.players) return team;
  return {
    ...team,
    players: enrichPlayersWithEquipment(team.players as RawPlayerWithMoves[], economy),
  };
}
