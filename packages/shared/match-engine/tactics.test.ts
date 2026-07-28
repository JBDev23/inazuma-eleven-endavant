import { describe, expect, it } from 'vitest';
import { getTacticAdvantageLabel, getTacticMultiplier } from './tactics';

describe('GOAL tactics RPS', () => {
  it('Tiro Normal beats Atrape and loses to Despeje', () => {
    expect(getTacticMultiplier('SHOOT_NORMAL', 'CATCH_NORMAL', 'GOAL')).toBe(1.2);
    expect(getTacticMultiplier('CATCH_NORMAL', 'SHOOT_NORMAL', 'GOAL')).toBe(0.8);
    expect(getTacticMultiplier('PUNCH_NORMAL', 'SHOOT_NORMAL', 'GOAL')).toBe(1.2);
    expect(getTacticMultiplier('SHOOT_NORMAL', 'PUNCH_NORMAL', 'GOAL')).toBe(0.8);
  });

  it('Vaselina beats Despeje and loses to Atrape', () => {
    expect(getTacticMultiplier('LOB_SHOT', 'PUNCH_NORMAL', 'GOAL')).toBe(1.2);
    expect(getTacticMultiplier('PUNCH_NORMAL', 'LOB_SHOT', 'GOAL')).toBe(0.8);
    expect(getTacticMultiplier('CATCH_NORMAL', 'LOB_SHOT', 'GOAL')).toBe(1.2);
    expect(getTacticMultiplier('LOB_SHOT', 'CATCH_NORMAL', 'GOAL')).toBe(0.8);
  });

  it('exposes advantage labels for the goal cycle', () => {
    expect(getTacticAdvantageLabel('SHOOT_NORMAL', 'CATCH_NORMAL', 'GOAL')).toBe('advantage');
    expect(getTacticAdvantageLabel('SHOOT_NORMAL', 'PUNCH_NORMAL', 'GOAL')).toBe('disadvantage');
    expect(getTacticAdvantageLabel('LOB_SHOT', 'PUNCH_NORMAL', 'GOAL')).toBe('advantage');
    expect(getTacticAdvantageLabel('LOB_SHOT', 'CATCH_NORMAL', 'GOAL')).toBe('disadvantage');
  });
});
