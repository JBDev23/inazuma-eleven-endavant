import type { PlayerWithDetails, UserClub } from "@inazuma/shared";
import { normalizePlayerWithMoves } from "@inazuma/shared";

export function findRosterPlayer(
  team: UserClub | null | undefined,
  playerId: number,
): PlayerWithDetails | undefined {
  const player = team?.roster.find((entry) => entry.id === playerId);
  return player ? normalizePlayerWithMoves(player) : undefined;
}

export function resolveDuelPlayer(
  team: UserClub,
  selected: PlayerWithDetails,
): PlayerWithDetails {
  return findRosterPlayer(team, selected.id) ?? normalizePlayerWithMoves(selected);
}
