import { describe, expect, it } from "vitest";
import { applyFacilityCostMultiplier, getFieldGpCostPerTurn } from "@inazuma/shared";
import { drainFieldGpForTurnAdvance } from "./match-player-resources";
import type { UserClub, PlayerWithDetails } from "@inazuma/shared";

function makePlayer(id: number, position11: number): PlayerWithDetails {
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

function makeTeam(id: string, starters: PlayerWithDetails[]): UserClub {
  return {
    id,
    name: id,
    roster: starters,
    coaches: [],
    activeCoachId: null,
    activeFormation11Id: null,
    activeFormation4Id: null,
    consumables: [],
    facilities: [],
  } as UserClub;
}

describe("drainFieldGpForTurnAdvance", () => {
  const home = makeTeam("home", [makePlayer(1, 1)]);
  const away = makeTeam("away", [makePlayer(2, 1)]);
  const baseMap = {
    1: { gp: 100, tp: 100 },
    2: { gp: 100, tp: 100 },
  };

  it("drains GP from on-field starters each turn", () => {
    const next = drainFieldGpForTurnAdvance(
      baseMap,
      home,
      away,
      "11v11",
      "clear",
    );

    expect(next[1].gp).toBe(99);
    expect(next[2].gp).toBe(99);
  });

  it("applies clinic GP discount without zeroing the per-turn cost", () => {
    const homeWithClinic = {
      ...home,
      facilities: [{ facilityId: "clinic" as const, level: 1 as const, upgradingTo: null }],
    };

    const next = drainFieldGpForTurnAdvance(
      baseMap,
      homeWithClinic,
      away,
      "11v11",
      "clear",
      { field: 0, stands: 0, benches: 0, shop: 0, training: 0, clinic: 1, lab: 0 },
      { field: 0, stands: 0, benches: 0, shop: 0, training: 0, clinic: 0, lab: 0 },
    );

    const expectedCost = applyFacilityCostMultiplier(
      getFieldGpCostPerTurn("clear"),
      0.8,
    );
    expect(next[1].gp).toBe(100 - expectedCost);
    expect(next[2].gp).toBe(99);
  });
});
