import { describe, expect, it } from "vitest";
import {
  isMatchTied,
  isMatchTurnsComplete,
  shouldStartPenaltyShootout,
} from "./match-turns";

describe("match-turns", () => {
  it("detects tied scores", () => {
    expect(isMatchTied(1, 1)).toBe(true);
    expect(isMatchTied(2, 1)).toBe(false);
  });

  it("starts penalty shootout when enabled and tied at regulation end", () => {
    expect(shouldStartPenaltyShootout(true, 1, 1)).toBe(true);
    expect(shouldStartPenaltyShootout(true, 2, 1)).toBe(false);
    expect(shouldStartPenaltyShootout(false, 1, 1)).toBe(false);
  });

  it("completes turns after total turns", () => {
    expect(isMatchTurnsComplete(21, 20)).toBe(true);
    expect(isMatchTurnsComplete(20, 20)).toBe(false);
  });
});
