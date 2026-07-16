import { describe, expect, it } from 'vitest';
import {
  aggregateMoveUsages,
  applyMoveUsageProgress,
  getMaxMoveLevel,
  getMoveEvolutionLabel,
  getUsesRequiredForNextLevel,
  previewMoveLevelUp,
} from './move-evolution';

describe('getMaxMoveLevel', () => {
  it('returns correct caps per evolution path', () => {
    expect(getMaxMoveLevel('SHIN')).toBe(3);
    expect(getMaxMoveLevel('L_G')).toBe(5);
    expect(getMaxMoveLevel('NONE')).toBe(1);
  });
});

describe('getUsesRequiredForNextLevel', () => {
  it('returns null when technique cannot evolve further', () => {
    expect(getUsesRequiredForNextLevel('FAST', 3, 'SHIN')).toBeNull();
    expect(getUsesRequiredForNextLevel('NONE', 1, 'SHIN')).toBeNull();
    expect(getUsesRequiredForNextLevel('FAST', 1, 'NONE')).toBeNull();
  });

  it('returns tiered thresholds by speed', () => {
    expect(getUsesRequiredForNextLevel('FAST', 1, 'SHIN')).toBe(5);
    expect(getUsesRequiredForNextLevel('MEDIUM', 1, 'SHIN')).toBe(8);
    expect(getUsesRequiredForNextLevel('SLOW', 1, 'L_G')).toBe(12);
  });
});

describe('applyMoveUsageProgress', () => {
  it('accumulates uses without leveling when below threshold', () => {
    const result = applyMoveUsageProgress(2, 1, 'SHIN', 'FAST', 1);
    expect(result).toEqual({
      uses: 3,
      moveLevel: 1,
      leveledUp: false,
      levelsGained: 0,
    });
  });

  it('levels up SHIN path and carries excess uses', () => {
    const result = applyMoveUsageProgress(3, 1, 'SHIN', 'FAST', 3);
    expect(result.moveLevel).toBe(2);
    expect(result.leveledUp).toBe(true);
    expect(result.levelsGained).toBe(1);
    expect(result.uses).toBe(1);
  });

  it('can chain multiple level ups in one match', () => {
    const result = applyMoveUsageProgress(0, 1, 'SHIN', 'FAST', 20);
    expect(result.moveLevel).toBe(3);
    expect(result.levelsGained).toBe(2);
    expect(result.uses).toBe(7);
  });

  it('does not exceed max level for NONE path', () => {
    const result = applyMoveUsageProgress(0, 1, 'NONE', 'NONE', 50);
    expect(result.moveLevel).toBe(1);
    expect(result.uses).toBe(50);
  });
});

describe('previewMoveLevelUp', () => {
  it('detects when the next use triggers a level up', () => {
    const preview = previewMoveLevelUp(4, 1, 'SHIN', 'FAST', 0);
    expect(preview).toEqual({
      evolutionPath: 'SHIN',
      previousLevel: 1,
      newLevel: 2,
      levelsGained: 1,
    });
  });

  it('returns null when the next use is not enough', () => {
    expect(previewMoveLevelUp(2, 1, 'SHIN', 'FAST', 0)).toBeNull();
  });
});

describe('getMoveEvolutionLabel', () => {
  it('maps shin and l_g labels', () => {
    expect(getMoveEvolutionLabel('SHIN', 2)).toBe('Kai');
    expect(getMoveEvolutionLabel('SHIN', 3)).toBe('Shin');
    expect(getMoveEvolutionLabel('L_G', 4)).toBe('L4');
    expect(getMoveEvolutionLabel('L_G', 5)).toBe('G5');
  });
});

describe('aggregateMoveUsages', () => {
  it('groups repeated uses of the same player technique', () => {
    const aggregated = aggregateMoveUsages([
      { clubId: 'a', playerId: 1, moveId: 10, turn: 1 },
      { clubId: 'a', playerId: 1, moveId: 10, turn: 3 },
      { clubId: 'b', playerId: 2, moveId: 20, turn: 2 },
    ]);

    expect(aggregated.size).toBe(2);
    expect(aggregated.get('1:10')).toEqual({ playerId: 1, moveId: 10, count: 2 });
    expect(aggregated.get('2:20')).toEqual({ playerId: 2, moveId: 20, count: 1 });
  });
});
