import { describe, expect, it } from "vitest";
import type { PlayerWithDetails, UserClub } from "@inazuma/shared";
import {
  canRequestHalftimeSubstitution,
  updateSubbedOutIdsAfterHalftimeSub,
  type TeamSubstitutionState,
} from "./match-substitutions";

function makePlayer(id: number, position11: number | null): PlayerWithDetails {
  return {
    id,
    name: `Player ${id}`,
    position: "MF",
    element: "Fire",
    position11,
    position4: null,
    isActiveRoster: true,
    level: 1,
    baseStats: {
      gp: 30,
      tp: 30,
      kick: 10,
      body: 10,
      control: 10,
      guard: 10,
      speed: 10,
      stamina: 10,
      guts: 10,
    },
    maxStats: {
      gp: 100,
      tp: 100,
      kick: 50,
      body: 50,
      control: 50,
      guard: 50,
      speed: 50,
      stamina: 50,
      guts: 50,
    },
  } as PlayerWithDetails;
}

function makeTeam(): UserClub {
  return {
    id: "home",
    name: "Home",
    roster: [
      makePlayer(1, 1),
      makePlayer(2, 2),
      makePlayer(3, null),
    ],
    coaches: [],
    activeCoachId: null,
    activeFormation11Id: null,
    activeFormation4Id: null,
    consumables: [],
    facilities: [],
  } as UserClub;
}

describe("halftime substitutions", () => {
  it("rejects re-entering a player who was already subbed out", () => {
    const teamState: TeamSubstitutionState = {
      used: 1,
      subbedOutIds: [3],
      pending: null,
    };

    const error = canRequestHalftimeSubstitution(teamState, makeTeam(), "11v11", 1, 3);

    expect(error).toBe("Este jugador ya jugó y fue retirado; no puede volver a entrar.");
  });

  it("keeps previously subbed-out players blocked after halftime changes", () => {
    const updated = updateSubbedOutIdsAfterHalftimeSub([3], 1);

    expect(updated).toEqual([3, 1]);
  });
});
