import { describe, expect, it } from 'vitest';
import {
  buildPenaltyAreaDefenderBlockResolution,
  resolvePenaltyAreaShotBlock,
  resolvePenaltyAreaShotVsGoalkeeper,
  type DuelParticipantInput,
} from './duel-resolver';

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
): DuelParticipantInput {
  return { side, stats: baseStats, element: 'fire', action };
}

describe('resolvePenaltyAreaShotBlock', () => {
  it('blocks when defender power meets or exceeds shot power', () => {
    const input = {
      home: participant('home', 'SHOOT_NORMAL'),
      away: participant('away', 'BLOCK_SUPER'),
      ballSide: 'home' as const,
      duelType: 'FIELD' as const,
      currentTurn: 1,
      random: () => 0,
    };

    const block = resolvePenaltyAreaShotBlock(input);
    expect(block.shotPower).toBeGreaterThan(0);
    expect(block.residualPower).toBe(block.shotPower - block.defenderPower);
    expect(block.blocked).toBe(block.residualPower <= 0);

    if (block.blocked) {
      const resolution = buildPenaltyAreaDefenderBlockResolution(input, block);
      expect(resolution.winnerSide).toBe('away');
      expect(resolution.effects.possessionChange).toBe(true);
      expect(resolution.effects.newBallSide).toBe('away');
      expect(resolution.effects.goalScored).toBe(false);
    }
  });
});

describe('resolvePenaltyAreaShotVsGoalkeeper', () => {
  it('scores when residual shot power beats goalkeeper', () => {
    const resolution = resolvePenaltyAreaShotVsGoalkeeper({
      residualShotPower: 120,
      shotBreakdown: {
        eStats: 80,
        elementMultiplier: 1,
        tacticMultiplier: 1,
        rng: 0,
        furor: 0,
        total: 120,
      },
      shotParticipant: participant('home', 'SHOOT_NORMAL'),
      goalkeeper: participant('away', 'CATCH_NORMAL'),
      ballSide: 'home',
      currentTurn: 1,
      random: () => 0,
    });

    expect(resolution.winnerSide).toBe('home');
    expect(resolution.effects.goalScored).toBe(true);
    expect(resolution.effects.goalSide).toBe('home');
  });

  it('saves when goalkeeper power exceeds residual shot', () => {
    const resolution = resolvePenaltyAreaShotVsGoalkeeper({
      residualShotPower: 10,
      shotBreakdown: {
        eStats: 10,
        elementMultiplier: 1,
        tacticMultiplier: 1,
        rng: 0,
        furor: 0,
        total: 10,
      },
      shotParticipant: participant('home', 'SHOOT_NORMAL'),
      goalkeeper: participant('away', 'CATCH_SUPER'),
      ballSide: 'home',
      currentTurn: 1,
      random: () => 0,
    });

    expect(resolution.winnerSide).toBe('away');
    expect(resolution.effects.goalScored).toBe(false);
    expect(resolution.effects.newBallSide).toBe('away');
  });
});
