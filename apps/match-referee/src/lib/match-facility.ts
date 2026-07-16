import {
  createEmptyMatchFacilityState,
  getClubPitchElement,
  getFacilityGpCostMultiplier,
  getFacilityTpCostMultiplier,
  isOfficialMatch,
  resolveClubFacilities,
  type MatchFacilityState,
  type SportsCityState,
  type UserClub,
} from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";

export {
  createEmptyMatchFacilityState,
  type MatchFacilityState,
};

export function getTeamFacilities(team: UserClub | null): SportsCityState {
  return resolveClubFacilities(team?.facilities);
}

export function buildInitialMatchFacilityState(
  homeTeam: UserClub,
  format: MatchFormat,
): MatchFacilityState {
  const state = createEmptyMatchFacilityState();
  if (!isOfficialMatch(format)) return state;

  state.pitchElement = getClubPitchElement(homeTeam.facilities);
  return state;
}

export function getGpCostMultiplierForPlayer(
  side: "home" | "away",
  format: MatchFormat,
  homeFacilities: SportsCityState,
  awayFacilities: SportsCityState,
): number {
  if (!isOfficialMatch(format)) return 1;
  const facilities = side === "home" ? homeFacilities : awayFacilities;
  return getFacilityGpCostMultiplier(side, facilities, true);
}

export function getTpCostMultiplierForPlayer(
  side: "home" | "away",
  format: MatchFormat,
  homeFacilities: SportsCityState,
  awayFacilities: SportsCityState,
): number {
  if (!isOfficialMatch(format)) return 1;
  const facilities = side === "home" ? homeFacilities : awayFacilities;
  return getFacilityTpCostMultiplier(side, facilities, true);
}

export function recordSuperMoveUsage(
  state: MatchFacilityState,
  side: "home" | "away",
  moveName: string,
): MatchFacilityState {
  const key = side === "home" ? "homeUsedSuperMoves" : "awayUsedSuperMoves";
  if (state[key].includes(moveName)) return state;
  return {
    ...state,
    [key]: [...state[key], moveName],
  };
}
