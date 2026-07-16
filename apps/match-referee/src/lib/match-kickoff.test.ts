import { describe, expect, it } from "vitest";
import { getOppositeKickoffSide, resolveKickoff } from "@/lib/match-kickoff";

describe("getOppositeKickoffSide", () => {
  it("returns the other team for second-half kickoff", () => {
    expect(getOppositeKickoffSide("home")).toBe("away");
    expect(getOppositeKickoffSide("away")).toBe("home");
  });
});

describe("resolveKickoff", () => {
  it("gives ball possession to toss winner when they choose ball", () => {
    expect(
      resolveKickoff({ tossWinner: "home", choice: "ball", fieldEnd: "endA" }).ballPossession,
    ).toBe("home");
    expect(
      resolveKickoff({ tossWinner: "away", choice: "ball", fieldEnd: "endB" }).ballPossession,
    ).toBe("away");
  });
});
