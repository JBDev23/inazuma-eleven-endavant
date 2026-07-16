import { describe, expect, it } from "vitest";
import {
  countMatchMoveUsages,
  previewPlayerMoveLevelUp,
} from "./match-move-progress";
import type { PlayerWithDetails } from "@inazuma/shared";

const player = {
  id: 7,
  name: "Mark Evans",
  moves: [
    {
      id: 42,
      name: "Fire Tornado",
      type: "SHOOT",
      element: "Fire",
      uses: 4,
      currentLevel: 1,
      evolutionPath: "SHIN",
      evolutionSpeed: "FAST",
      unlockLevel: 1,
      isUnlocked: true,
      foulRate: 0,
      basePower: 100,
      maxPower: 200,
      tpCost: 30,
      secondaryType: null,
    },
  ],
} as PlayerWithDetails;

describe("match-move-progress", () => {
  it("counts usages in the current match", () => {
    const count = countMatchMoveUsages(
      [
        { turn: 1, side: "home", clubId: "a", playerId: 7, playerName: "Mark", moveId: 42, moveName: "Fire Tornado" },
        { turn: 2, side: "home", clubId: "a", playerId: 7, playerName: "Mark", moveId: 42, moveName: "Fire Tornado" },
      ],
      7,
      42,
    );
    expect(count).toBe(2);
  });

  it("previews level up when the next super use crosses the threshold", () => {
    const preview = previewPlayerMoveLevelUp(player, 42, []);
    expect(preview?.newLevel).toBe(2);
    expect(preview?.moveName).toBe("Fire Tornado");
  });

  it("does not preview level up when threshold is not met", () => {
    const lowUsesPlayer = {
      ...player,
      moves: [{ ...player.moves[0], uses: 1 }],
    } as PlayerWithDetails;

    expect(previewPlayerMoveLevelUp(lowUsesPlayer, 42, [])).toBeNull();
  });
});
