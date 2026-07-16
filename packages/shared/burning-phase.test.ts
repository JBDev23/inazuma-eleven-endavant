import { describe, expect, it } from 'vitest';
import {
  adjustBurningPhaseOnRewind,
  BURNING_PHASE_DURATION_TURNS,
  canOfferFuryPhaseButton,
  createEmptyBurningPhaseState,
  createEmptyBurningPhaseUsedState,
  getBurningPhaseTurnsRemaining,
  getGoalDeficitForSide,
  isSecondHalfOfMatch,
  isSideInBurningPhase,
} from './burning-phase';

describe('burning-phase', () => {
  it('detects second half after halftime', () => {
    expect(isSecondHalfOfMatch(10, 20, false)).toBe(false);
    expect(isSecondHalfOfMatch(11, 20, false)).toBe(false);
    expect(isSecondHalfOfMatch(11, 20, true)).toBe(true);
  });

  it('computes goal deficit per side', () => {
    expect(getGoalDeficitForSide('home', 1, 3)).toBe(2);
    expect(getGoalDeficitForSide('away', 1, 3)).toBe(0);
  });

  it('offers fury button only when losing in second half and not used yet', () => {
    const burningPhaseActive = createEmptyBurningPhaseState();
    const burningPhaseUsed = createEmptyBurningPhaseUsedState();
    const base = {
      side: 'home' as const,
      currentTurn: 12,
      totalTurns: 20,
      halfTimeCompleted: true,
      homeScore: 0,
      awayScore: 1,
      burningPhaseActive,
      burningPhaseUsed,
    };

    expect(canOfferFuryPhaseButton(base)).toBe(true);
    expect(canOfferFuryPhaseButton({ ...base, homeScore: 1, awayScore: 1 })).toBe(false);
    expect(canOfferFuryPhaseButton({ ...base, currentTurn: 8 })).toBe(false);
    expect(
      canOfferFuryPhaseButton({
        ...base,
        burningPhaseActive: { ...burningPhaseActive, home: 12 },
      }),
    ).toBe(false);
    expect(
      canOfferFuryPhaseButton({
        ...base,
        burningPhaseUsed: { ...burningPhaseUsed, home: true },
      }),
    ).toBe(false);
  });

  it('lasts exactly three turns from activation', () => {
    const burningPhaseActive = { home: 12, away: 0 };

    expect(getBurningPhaseTurnsRemaining('home', burningPhaseActive, 11)).toBe(0);
    expect(isSideInBurningPhase('home', burningPhaseActive, 11)).toBe(false);
    expect(getBurningPhaseTurnsRemaining('home', burningPhaseActive, 12)).toBe(
      BURNING_PHASE_DURATION_TURNS,
    );
    expect(isSideInBurningPhase('home', burningPhaseActive, 12)).toBe(true);
    expect(getBurningPhaseTurnsRemaining('home', burningPhaseActive, 13)).toBe(2);
    expect(getBurningPhaseTurnsRemaining('home', burningPhaseActive, 14)).toBe(1);
    expect(getBurningPhaseTurnsRemaining('home', burningPhaseActive, 15)).toBe(0);
    expect(isSideInBurningPhase('home', burningPhaseActive, 15)).toBe(false);
  });

  it('clears activation and usage when rewinding before the activation turn', () => {
    const burningPhaseActive = { home: 12, away: 0 };
    const burningPhaseUsed = { home: true, away: false };

    expect(adjustBurningPhaseOnRewind(burningPhaseActive, burningPhaseUsed, 11)).toEqual({
      burningPhaseActive: { home: 0, away: 0 },
      burningPhaseUsed: { home: false, away: false },
    });
    expect(adjustBurningPhaseOnRewind(burningPhaseActive, burningPhaseUsed, 12)).toEqual({
      burningPhaseActive,
      burningPhaseUsed,
    });
    expect(adjustBurningPhaseOnRewind(burningPhaseActive, burningPhaseUsed, 13)).toEqual({
      burningPhaseActive,
      burningPhaseUsed,
    });
  });
});
