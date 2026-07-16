import {
  getActiveCoach,
  getEffectiveStats,
  type PlayerWithDetails,
  type UserClub,
  type Coach,
  type WeatherCondition,
  applyFacilityCostMultiplier,
  getFieldGpCostPerTurn,
  type SportsCityState,
} from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import { getStarterPlayers } from "@/lib/match-substitutions";
import { getGpCostMultiplierForPlayer } from "@/lib/match-facility";

export type PlayerMatchResources = {
  tp: number;
  gp: number;
};

export type PlayerResourcesMap = Record<number, PlayerMatchResources>;

export function normalizePlayerResourcesMap(
  map: PlayerResourcesMap | Record<string, PlayerMatchResources>,
): PlayerResourcesMap {
  const normalized: PlayerResourcesMap = {};

  for (const [key, value] of Object.entries(map ?? {})) {
    if (!value || typeof value !== "object") continue;
    normalized[Number(key)] = {
      tp: Number(value.tp) || 0,
      gp: Number(value.gp) || 0,
    };
  }

  return normalized;
}

export function getPlayerResourcesFromMap(
  map: PlayerResourcesMap,
  playerId: number,
): PlayerMatchResources | undefined {
  return map[playerId];
}

export function findPlayerInTeams(
  homeTeam: UserClub | null,
  awayTeam: UserClub | null,
  playerId: number,
): PlayerWithDetails | undefined {
  return [...(homeTeam?.roster ?? []), ...(awayTeam?.roster ?? [])].find(
    (player) => player.id === playerId,
  );
}

export function findPlayerTeamSide(
  homeTeam: UserClub | null,
  awayTeam: UserClub | null,
  playerId: number,
): "home" | "away" | null {
  if (homeTeam?.roster?.some((player) => player.id === playerId)) return "home";
  if (awayTeam?.roster?.some((player) => player.id === playerId)) return "away";
  return null;
}

export function getCoachForPlayer(
  homeTeam: UserClub | null,
  awayTeam: UserClub | null,
  playerId: number,
): Coach | null {
  const side = findPlayerTeamSide(homeTeam, awayTeam, playerId);
  if (!side) return null;
  return getActiveCoach(side === "home" ? homeTeam : awayTeam);
}

export function resolvePlayerResources(
  map: PlayerResourcesMap,
  player: PlayerWithDetails,
  coach?: Coach | null,
): PlayerMatchResources {
  const stored = getPlayerResourcesFromMap(map, player.id);
  if (stored) return stored;

  const stats = getEffectiveStats(player, coach);
  return { tp: stats.tp, gp: stats.gp };
}

export function buildPlayerResourcesFromRoster(
  roster: PlayerWithDetails[],
  coach?: Coach | null,
): PlayerResourcesMap {
  const map: PlayerResourcesMap = {};

  for (const player of roster) {
    const stats = getEffectiveStats(player, coach);
    map[player.id] = { tp: stats.tp, gp: stats.gp };
  }

  return map;
}

export function buildPlayerResourcesFromTeams(
  homeTeam: UserClub | null,
  awayTeam: UserClub | null,
): PlayerResourcesMap {
  return {
    ...buildPlayerResourcesFromRoster(homeTeam?.roster ?? [], getActiveCoach(homeTeam)),
    ...buildPlayerResourcesFromRoster(awayTeam?.roster ?? [], getActiveCoach(awayTeam)),
  };
}

export function canAffordResources(
  current: PlayerMatchResources | undefined,
  cost: PlayerMatchResources,
): boolean {
  if (!current) return false;
  return current.tp >= cost.tp && current.gp >= cost.gp;
}

export function mergeMissingPlayerResources(
  current: PlayerResourcesMap,
  homeTeam: UserClub | null,
  awayTeam: UserClub | null,
): { map: PlayerResourcesMap; changed: boolean } {
  const expected = buildPlayerResourcesFromTeams(homeTeam, awayTeam);
  const normalized = normalizePlayerResourcesMap(current);
  const merged = { ...normalized };
  let changed = false;

  for (const [id, baseline] of Object.entries(expected)) {
    const playerId = Number(id);
    if (!getPlayerResourcesFromMap(merged, playerId)) {
      merged[playerId] = baseline;
      changed = true;
    }
  }

  return { map: merged, changed };
}

export function drainFieldGpForTurnAdvance(
  current: PlayerResourcesMap,
  homeTeam: UserClub | null,
  awayTeam: UserClub | null,
  format: MatchFormat,
  weather: WeatherCondition,
  homeFacilities?: SportsCityState,
  awayFacilities?: SportsCityState,
): PlayerResourcesMap {
  const gpCost = getFieldGpCostPerTurn(weather);
  if (gpCost <= 0 || !homeTeam || !awayTeam) return current;

  const next = { ...normalizePlayerResourcesMap(current) };

  const drainTeam = (
    team: UserClub,
    coach: Coach | null,
    side: "home" | "away",
  ) => {
    const multiplier =
      homeFacilities && awayFacilities
        ? getGpCostMultiplierForPlayer(side, format, homeFacilities, awayFacilities)
        : 1;
    const effectiveCost = applyFacilityCostMultiplier(gpCost, multiplier);

    for (const player of getStarterPlayers(team, format)) {
      const resources = resolvePlayerResources(next, player, coach);
      next[player.id] = {
        ...resources,
        gp: Math.max(0, resources.gp - effectiveCost),
      };
    }
  };

  drainTeam(homeTeam, getActiveCoach(homeTeam), "home");
  drainTeam(awayTeam, getActiveCoach(awayTeam), "away");

  return next;
}
