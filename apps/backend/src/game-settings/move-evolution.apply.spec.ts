import {
  aggregateMoveUsages,
  applyMoveUsageProgress,
} from '@inazuma/shared';

describe('match move usage sync', () => {
  it('aggregates usages before applying progression', () => {
    const usages = [
      { clubId: 'club-a', playerId: 5, moveId: 12, turn: 1 },
      { clubId: 'club-a', playerId: 5, moveId: 12, turn: 4 },
    ];

    const aggregated = aggregateMoveUsages(usages);
    const entry = aggregated.get('5:12');
    expect(entry?.count).toBe(2);

    const progress = applyMoveUsageProgress(0, 1, 'SHIN', 'FAST', entry!.count);
    expect(progress.moveLevel).toBe(1);
    expect(progress.uses).toBe(2);
  });

  it('evolves technique when aggregated uses cross threshold', () => {
    const aggregated = aggregateMoveUsages([
      { clubId: 'club-a', playerId: 5, moveId: 12, turn: 1 },
      { clubId: 'club-a', playerId: 5, moveId: 12, turn: 2 },
      { clubId: 'club-a', playerId: 5, moveId: 12, turn: 3 },
      { clubId: 'club-a', playerId: 5, moveId: 12, turn: 4 },
      { clubId: 'club-a', playerId: 5, moveId: 12, turn: 5 },
    ]);

    const progress = applyMoveUsageProgress(0, 1, 'SHIN', 'FAST', aggregated.get('5:12')!.count);
    expect(progress.moveLevel).toBe(2);
    expect(progress.leveledUp).toBe(true);
  });
});
