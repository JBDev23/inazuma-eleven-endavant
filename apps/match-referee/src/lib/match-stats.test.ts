import { describe, expect, it } from 'vitest';
import { buildDuelRecord, createEmptyMatchStats } from './match-stats';
import type { DuelContext } from './duel-context';
import type { PlayerWithDetails } from '@inazuma/shared';

const basePlayer = (id: number, name: string): PlayerWithDetails =>
  ({
    id,
    name,
    moves: [],
    element: 'Fuego',
    position: 'FW',
    level: 10,
    kick: 50,
    body: 50,
    control: 50,
    guard: 50,
    speed: 50,
    stamina: 50,
    guts: 50,
    gp: 100,
    tp: 100,
  }) as PlayerWithDetails;

const duelContext: DuelContext = {
  type: 'FIELD',
  ballSide: 'home',
  inPenaltyArea: false,
  goalkeeperInSmallArea: true,
};

describe('match-stats move tracking', () => {
  it('stores move ids on duel records when provided', () => {
    const record = buildDuelRecord({
      turn: 3,
      duelContext,
      homePlayer: basePlayer(1, 'Home'),
      awayPlayer: basePlayer(2, 'Away'),
      resolution: {
        winnerSide: 'home',
        homePower: 120,
        awayPower: 80,
        homeBreakdown: { techniquePower: 40 },
        awayBreakdown: {},
        effects: { goalScored: false, possessionChange: false },
      } as never,
      format: '11v11',
      homeAction: { moveId: 99, moveName: 'Fire Tornado' },
    });

    expect(record.homeMoveId).toBe(99);
    expect(record.homeMoveName).toBe('Fire Tornado');
    expect(record.homeUsedSuper).toBe(true);
  });

  it('initializes empty match stats with move usage list', () => {
    const stats = createEmptyMatchStats();
    expect(stats.moveUsages).toEqual([]);
  });
});
