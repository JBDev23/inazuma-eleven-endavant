import { describe, expect, it } from 'vitest';
import {
  getEffectiveDuelType,
  getPlayerDuelRole,
  getDuelTypeLabel,
  isGoalkeeperFieldDuel,
  resolveDuelContext,
  shouldAttemptGoalkeeperSave,
} from './duel-context';
import type { Player } from '@inazuma/shared';

const fieldPlayerHome = { position4: 2, position11: 5 } as Player;
const goalkeeperAway = { position4: 1, position11: 1 } as Player;

describe('goalkeeper outside small area', () => {
  it('resolves GOAL duel as field when goalkeeper is outside small area', () => {
    const context = resolveDuelContext(
      fieldPlayerHome,
      goalkeeperAway,
      '4v4',
      'home',
      false,
      false,
    );

    expect(context.type).toBe('GOAL');
    expect(context.goalkeeperInSmallArea).toBe(false);
    expect(context.ballSide).toBe('home');
    expect(context.goalkeeperSide).toBe('away');
    expect(isGoalkeeperFieldDuel(context)).toBe(true);
    expect(getEffectiveDuelType(context)).toBe('FIELD');
    expect(shouldAttemptGoalkeeperSave(context)).toBe(false);
  });

  it('assigns dribble/defense roles when opponent has possession', () => {
    const context = resolveDuelContext(
      fieldPlayerHome,
      goalkeeperAway,
      '4v4',
      'home',
      false,
      false,
    );

    expect(getPlayerDuelRole('home', context, fieldPlayerHome, goalkeeperAway, '4v4')).toBe(
      'field_attacker',
    );
    expect(getPlayerDuelRole('away', context, fieldPlayerHome, goalkeeperAway, '4v4')).toBe(
      'field_defender',
    );
    expect(getDuelTypeLabel(context)).toBe('Regate vs defensa (portero fuera)');
  });

  it('assigns goalkeeper as attacker when their team has possession', () => {
    const context = resolveDuelContext(
      fieldPlayerHome,
      goalkeeperAway,
      '4v4',
      'away',
      false,
      false,
    );

    expect(context.ballSide).toBe('away');
    expect(getPlayerDuelRole('away', context, fieldPlayerHome, goalkeeperAway, '4v4')).toBe(
      'field_attacker',
    );
    expect(getPlayerDuelRole('home', context, fieldPlayerHome, goalkeeperAway, '4v4')).toBe(
      'field_defender',
    );
    expect(getDuelTypeLabel(context)).toBe('Regate del portero (portero fuera)');
  });

  it('keeps shooter/goalkeeper roles when goalkeeper is in small area and opponent attacks', () => {
    const context = resolveDuelContext(
      fieldPlayerHome,
      goalkeeperAway,
      '4v4',
      'home',
      false,
      true,
    );

    expect(getPlayerDuelRole('home', context, fieldPlayerHome, goalkeeperAway, '4v4')).toBe(
      'shooter',
    );
    expect(getPlayerDuelRole('away', context, fieldPlayerHome, goalkeeperAway, '4v4')).toBe(
      'goalkeeper',
    );
    expect(getEffectiveDuelType(context)).toBe('GOAL');
  });

  it('lets goalkeeper dribble when in small area and their team has possession', () => {
    const context = resolveDuelContext(
      fieldPlayerHome,
      goalkeeperAway,
      '4v4',
      'away',
      false,
      true,
    );

    expect(isGoalkeeperFieldDuel(context)).toBe(true);
    expect(getEffectiveDuelType(context)).toBe('FIELD');
    expect(getPlayerDuelRole('away', context, fieldPlayerHome, goalkeeperAway, '4v4')).toBe(
      'field_attacker',
    );
    expect(getPlayerDuelRole('home', context, fieldPlayerHome, goalkeeperAway, '4v4')).toBe(
      'field_defender',
    );
    expect(getDuelTypeLabel(context)).toBe('Regate del portero (en el área)');
  });
});
