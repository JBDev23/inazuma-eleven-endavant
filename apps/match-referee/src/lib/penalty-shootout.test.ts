import { describe, expect, it } from "vitest";
import {
  checkPenaltyShootoutWinner,
  createInitialPenaltyShootout,
  getCurrentShooterId,
  getShootingSide,
  isPenaltyLineupComplete,
  normalizePenaltyShooters,
  recordPenaltyShot,
  type PenaltyShootoutState,
} from "./penalty-shootout";

function baseShootingState(overrides: Partial<PenaltyShootoutState> = {}): PenaltyShootoutState {
  return {
    phase: "shooting",
    kicksPerTeam: 3,
    homeShooters: [101, 102, 103],
    awayShooters: [201, 202, 203],
    homeGoalkeeperId: 100,
    awayGoalkeeperId: 200,
    homeSetupConfirmed: true,
    awaySetupConfirmed: true,
    firstShooterSide: "home",
    homeScore: 0,
    awayScore: 0,
    shots: [],
    winnerSide: null,
    ...overrides,
  };
}

describe("penalty-shootout", () => {
  it("alternates shooting sides starting with coin toss winner", () => {
    const state = baseShootingState({ firstShooterSide: "away" });
    expect(getShootingSide(state)).toBe("away");

    const afterHome = recordPenaltyShot(state, "goal");
    expect(getShootingSide(afterHome)).toBe("home");
  });

  it("cycles shooters within each team", () => {
    const state = baseShootingState();
    expect(getCurrentShooterId(state)).toBe(101);

    let next = recordPenaltyShot(state, "miss");
    next = recordPenaltyShot(next, "miss");
    expect(getCurrentShooterId(next)).toBe(102);
  });

  it("detects winner when team cannot catch up", () => {
    let state = baseShootingState();
    state = recordPenaltyShot(state, "goal");
    state = recordPenaltyShot(state, "miss");
    state = recordPenaltyShot(state, "goal");
    state = recordPenaltyShot(state, "miss");
    state = recordPenaltyShot(state, "goal");

    expect(state.phase).toBe("finished");
    expect(state.winnerSide).toBe("home");
    expect(state.homeScore).toBe(2);
    expect(state.awayScore).toBe(0);
  });

  it("continues to sudden death when tied after regulation kicks", () => {
    let state = baseShootingState();
    const outcomes: Array<"goal" | "miss"> = [
      "goal", "goal",
      "miss", "miss",
      "goal", "goal",
    ];

    for (const outcome of outcomes) {
      state = recordPenaltyShot(state, outcome);
    }

    expect(state.phase).toBe("shooting");
    expect(state.homeScore).toBe(2);
    expect(state.awayScore).toBe(2);
    expect(checkPenaltyShootoutWinner(state)).toBeNull();

    state = recordPenaltyShot(state, "goal");
    state = recordPenaltyShot(state, "miss");
    expect(state.phase).toBe("finished");
    expect(state.winnerSide).toBe("home");
  });

  it("creates initial lineup with kickers and goalkeepers", () => {
    const homeTeam = {
      id: "home",
      name: "Home",
      roster: [
        { id: 1, name: "GK", isActiveRoster: true, position11: 1, position4: 1, level: 1, baseStats: {}, maxStats: { kick: 10, guard: 50, gp: 1, tp: 1, body: 1, control: 1, speed: 1, stamina: 1, guts: 1 } },
        { id: 2, name: "Striker", isActiveRoster: true, position11: 9, position4: 2, level: 1, baseStats: {}, maxStats: { kick: 40, guard: 10, gp: 1, tp: 1, body: 1, control: 1, speed: 1, stamina: 1, guts: 1 } },
        { id: 3, name: "Mid", isActiveRoster: true, position11: 8, position4: 3, level: 1, baseStats: {}, maxStats: { kick: 20, guard: 10, gp: 1, tp: 1, body: 1, control: 1, speed: 1, stamina: 1, guts: 1 } },
      ],
    } as never;
    const awayTeam = { ...homeTeam, id: "away", name: "Away" } as never;

    const shootout = createInitialPenaltyShootout(homeTeam, awayTeam, "4v4");
    expect(shootout.phase).toBe("setup");
    expect(shootout.kicksPerTeam).toBe(3);
    expect(shootout.homeGoalkeeperId).toBe(1);
    expect(shootout.homeShooters).toContain(2);
  });

  it("normalizes shooters when changing goalkeeper", () => {
    const shooters = normalizePenaltyShooters(
      {
        roster: [
          { id: 1, name: "GK", isActiveRoster: true, position4: 1, position11: 1, level: 1, baseStats: {}, maxStats: { kick: 5, guard: 50, gp: 1, tp: 1, body: 1, control: 1, speed: 1, stamina: 1, guts: 1 } },
          { id: 2, name: "A", isActiveRoster: true, position4: 2, position11: 2, level: 1, baseStats: {}, maxStats: { kick: 30, guard: 10, gp: 1, tp: 1, body: 1, control: 1, speed: 1, stamina: 1, guts: 1 } },
          { id: 3, name: "B", isActiveRoster: true, position4: 3, position11: 3, level: 1, baseStats: {}, maxStats: { kick: 20, guard: 10, gp: 1, tp: 1, body: 1, control: 1, speed: 1, stamina: 1, guts: 1 } },
          { id: 4, name: "C", isActiveRoster: true, position4: null, position11: null, level: 1, baseStats: {}, maxStats: { kick: 15, guard: 10, gp: 1, tp: 1, body: 1, control: 1, speed: 1, stamina: 1, guts: 1 } },
        ],
      } as never,
      "4v4",
      1,
      [2, 1, 3],
      3,
    );

    expect(shooters).toEqual([2, 3, 4]);
    expect(isPenaltyLineupComplete(shooters, 1, 3)).toBe(true);
  });
});
