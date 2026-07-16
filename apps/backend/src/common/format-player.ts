import {
  formatPlayerWithMoves,
  formatPlayersWithMoves,
  parseStatBonuses,
  type RawPlayerWithMoves,
} from '@inazuma/shared';
import { formatFormation } from './format-formation';
import { formatClubItems, formatItem } from './format-item';
import { formatClubConsumables } from './format-consumable';
import { formatClubFacilities } from './format-facility';

export { formatPlayerWithMoves, formatPlayersWithMoves };

export function enrichPlayerWithEquipment(
  rawPlayer: RawPlayerWithMoves | null | undefined,
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

  return player;
}

export function enrichPlayersWithEquipment(rawPlayers: RawPlayerWithMoves[]) {
  return rawPlayers
    .map((player) => enrichPlayerWithEquipment(player))
    .filter((player): player is NonNullable<typeof player> => player != null);
}

export function formatClubWithRoster<
  T extends {
    roster?: unknown[];
    formations?: unknown[];
    formation11?: unknown;
    formation4?: unknown;
    items?: unknown[];
    consumables?: unknown[];
    facilities?: unknown[];
  },
>(club: T) {
  const formatted: T & { formation11?: unknown; formation4?: unknown } = { ...club };

  if (club.roster) {
    formatted.roster = enrichPlayersWithEquipment(club.roster as RawPlayerWithMoves[]);
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

export function formatTeamWithPlayers<T extends { players?: unknown[] }>(team: T) {
  if (!team.players) return team;
  return {
    ...team,
    players: enrichPlayersWithEquipment(team.players as RawPlayerWithMoves[]),
  };
}
