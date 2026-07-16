import { describe, expect, it } from 'vitest';
import {
  applyShotDistanceMultiplier,
  formatShotDistanceMultiplier,
  getShotDistanceMultiplier,
} from './shot-distance';

describe('getShotDistanceMultiplier', () => {
  it('returns the correct multiplier per franja', () => {
    expect(getShotDistanceMultiplier(0)).toBe(1.6);
    expect(getShotDistanceMultiplier(1)).toBe(1.4);
    expect(getShotDistanceMultiplier(2)).toBe(1.2);
    expect(getShotDistanceMultiplier(3)).toBe(1);
    expect(getShotDistanceMultiplier(4)).toBe(0.8);
    expect(getShotDistanceMultiplier(5)).toBe(0.7);
    expect(getShotDistanceMultiplier(6)).toBe(0.6);
    expect(getShotDistanceMultiplier(7)).toBe(0.5);
    expect(getShotDistanceMultiplier(8)).toBe(0.4);
    expect(getShotDistanceMultiplier(9)).toBe(0.3);
    expect(getShotDistanceMultiplier(10)).toBe(0.2);
    expect(getShotDistanceMultiplier(11)).toBe(0.1);
    expect(getShotDistanceMultiplier(12)).toBe(0);
    expect(getShotDistanceMultiplier(99)).toBe(0);
  });

  it('floors fractional franjas', () => {
    expect(getShotDistanceMultiplier(3.9)).toBe(1);
    expect(getShotDistanceMultiplier(11.9)).toBe(0.1);
  });
});

describe('applyShotDistanceMultiplier', () => {
  it('floors the adjusted power', () => {
    expect(applyShotDistanceMultiplier(100, 0)).toBe(160);
    expect(applyShotDistanceMultiplier(100, 3)).toBe(100);
    expect(applyShotDistanceMultiplier(100, 12)).toBe(0);
  });
});

describe('formatShotDistanceMultiplier', () => {
  it('formats as percentage', () => {
    expect(formatShotDistanceMultiplier(0)).toBe('160%');
    expect(formatShotDistanceMultiplier(3)).toBe('100%');
    expect(formatShotDistanceMultiplier(12)).toBe('0%');
  });
});
