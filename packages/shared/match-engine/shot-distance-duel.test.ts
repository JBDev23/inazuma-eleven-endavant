import { describe, expect, it } from 'vitest';
import { resolveDuel, type DuelParticipantInput } from './duel-resolver';

const baseStats = {
  kick: 80,
  body: 50,
  control: 50,
  guard: 70,
  speed: 50,
  stamina: 50,
  guts: 50,
};

function participant(
  side: 'home' | 'away',
  action: DuelParticipantInput['action'],
  shotDistance?: number,
): DuelParticipantInput {
  return { side, stats: baseStats, element: 'fire', action, shotDistance };
}

describe('resolveDuel shot distance', () => {
  it('applies distance multiplier to shoot power', () => {
    const closeShot = resolveDuel({
      home: participant('home', 'SHOOT_NORMAL', 0),
      away: participant('away', 'BLOCK_NORMAL'),
      ballSide: 'home',
      duelType: 'FIELD',
      currentTurn: 1,
      random: () => 0,
    });

    const neutralShot = resolveDuel({
      home: participant('home', 'SHOOT_NORMAL', 3),
      away: participant('away', 'BLOCK_NORMAL'),
      ballSide: 'home',
      duelType: 'FIELD',
      currentTurn: 1,
      random: () => 0,
    });

    const farShot = resolveDuel({
      home: participant('home', 'SHOOT_NORMAL', 12),
      away: participant('away', 'BLOCK_NORMAL'),
      ballSide: 'home',
      duelType: 'FIELD',
      currentTurn: 1,
      random: () => 0,
    });

    expect(closeShot.homePower).toBeGreaterThan(neutralShot.homePower);
    expect(neutralShot.homePower).toBeGreaterThan(0);
    expect(farShot.homePower).toBe(0);
    expect(closeShot.homeBreakdown.shotDistanceMultiplier).toBe(1.6);
    expect(farShot.homeBreakdown.shotDistanceMultiplier).toBe(0);
  });
});
