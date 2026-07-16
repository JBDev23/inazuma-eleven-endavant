export type BurningPhaseSide = 'home' | 'away';

/** Turno en el que se activó la fase (0 = sin activación en curso). */
export type BurningPhaseState = Record<BurningPhaseSide, number>;

export type BurningPhaseUsedState = Record<BurningPhaseSide, boolean>;

export const BURNING_PHASE_DURATION_TURNS = 3;

export function createEmptyBurningPhaseState(): BurningPhaseState {
  return { home: 0, away: 0 };
}

export function createEmptyBurningPhaseUsedState(): BurningPhaseUsedState {
  return { home: false, away: false };
}

export function normalizeBurningPhaseState(
  raw: unknown,
  currentTurn: number,
): BurningPhaseState {
  const empty = createEmptyBurningPhaseState();
  if (!raw || typeof raw !== 'object') return empty;

  const state = raw as Record<string, unknown>;
  const normalizeSide = (side: BurningPhaseSide): number => {
    const value = state[side];
    if (typeof value === 'boolean') return value ? currentTurn : 0;
    if (typeof value === 'number' && value > 0) return value;
    return 0;
  };

  return { home: normalizeSide('home'), away: normalizeSide('away') };
}

export function normalizeBurningPhaseUsedState(raw: unknown): BurningPhaseUsedState {
  const empty = createEmptyBurningPhaseUsedState();
  if (!raw || typeof raw !== 'object') return empty;

  const state = raw as Record<string, unknown>;
  return {
    home: state.home === true,
    away: state.away === true,
  };
}

export function hasBurningPhaseBeenUsed(
  side: BurningPhaseSide,
  burningPhaseUsed: BurningPhaseUsedState,
): boolean {
  return burningPhaseUsed[side];
}

export function getBurningPhaseTurnsRemaining(
  side: BurningPhaseSide,
  burningPhaseActive: BurningPhaseState,
  currentTurn: number,
): number {
  const activatedAt = burningPhaseActive[side];
  if (!activatedAt || currentTurn < activatedAt) return 0;
  return Math.max(0, activatedAt + BURNING_PHASE_DURATION_TURNS - currentTurn);
}

/** Al retroceder turno: anula activación y uso si aún no se alcanzó el turno de activación. */
export function adjustBurningPhaseOnRewind(
  burningPhaseActive: BurningPhaseState,
  burningPhaseUsed: BurningPhaseUsedState,
  newCurrentTurn: number,
): { burningPhaseActive: BurningPhaseState; burningPhaseUsed: BurningPhaseUsedState } {
  const adjustSide = (side: BurningPhaseSide) => {
    const activatedAt = burningPhaseActive[side];
    if (!activatedAt || newCurrentTurn >= activatedAt) {
      return { activatedAt, used: burningPhaseUsed[side] };
    }
    return { activatedAt: 0, used: false };
  };

  const home = adjustSide('home');
  const away = adjustSide('away');

  return {
    burningPhaseActive: { home: home.activatedAt, away: away.activatedAt },
    burningPhaseUsed: { home: home.used, away: away.used },
  };
}

export function inferBurningPhaseUsedFromLegacyState(
  burningPhaseActive: BurningPhaseState,
  burningPhaseUsed?: BurningPhaseUsedState,
): BurningPhaseUsedState {
  const used = burningPhaseUsed
    ? normalizeBurningPhaseUsedState(burningPhaseUsed)
    : createEmptyBurningPhaseUsedState();

  return {
    home: used.home || burningPhaseActive.home > 0,
    away: used.away || burningPhaseActive.away > 0,
  };
}

export function getSecondHalfStartTurn(totalTurns: number): number {
  return totalTurns / 2 + 1;
}

export function isSecondHalfOfMatch(
  currentTurn: number,
  totalTurns: number,
  halfTimeCompleted: boolean,
): boolean {
  return halfTimeCompleted && currentTurn >= getSecondHalfStartTurn(totalTurns);
}

export function getGoalDeficitForSide(
  side: BurningPhaseSide,
  homeScore: number,
  awayScore: number,
): number {
  if (side === 'home') return Math.max(0, awayScore - homeScore);
  return Math.max(0, homeScore - awayScore);
}

export function isSideLosingByAtLeastOneGoal(
  side: BurningPhaseSide,
  homeScore: number,
  awayScore: number,
): boolean {
  return getGoalDeficitForSide(side, homeScore, awayScore) >= 1;
}

export function canOfferFuryPhaseButton(params: {
  side: BurningPhaseSide;
  currentTurn: number;
  totalTurns: number;
  halfTimeCompleted: boolean;
  homeScore: number;
  awayScore: number;
  burningPhaseActive: BurningPhaseState;
  burningPhaseUsed: BurningPhaseUsedState;
}): boolean {
  if (hasBurningPhaseBeenUsed(params.side, params.burningPhaseUsed)) return false;
  if (isSideInBurningPhase(params.side, params.burningPhaseActive, params.currentTurn)) {
    return false;
  }
  if (!isSecondHalfOfMatch(params.currentTurn, params.totalTurns, params.halfTimeCompleted)) {
    return false;
  }
  return isSideLosingByAtLeastOneGoal(params.side, params.homeScore, params.awayScore);
}

export function isSideInBurningPhase(
  side: BurningPhaseSide,
  burningPhaseActive: BurningPhaseState,
  currentTurn: number,
): boolean {
  return getBurningPhaseTurnsRemaining(side, burningPhaseActive, currentTurn) > 0;
}

export type BurningPhaseSideSnapshot = {
  active: boolean;
  turnsRemaining: number;
};

export type BurningPhaseSnapshot = Record<BurningPhaseSide, BurningPhaseSideSnapshot>;

export function buildBurningPhaseSnapshot(
  burningPhaseActive: BurningPhaseState,
  currentTurn: number,
): BurningPhaseSnapshot {
  return {
    home: {
      active: isSideInBurningPhase('home', burningPhaseActive, currentTurn),
      turnsRemaining: getBurningPhaseTurnsRemaining('home', burningPhaseActive, currentTurn),
    },
    away: {
      active: isSideInBurningPhase('away', burningPhaseActive, currentTurn),
      turnsRemaining: getBurningPhaseTurnsRemaining('away', burningPhaseActive, currentTurn),
    },
  };
}
