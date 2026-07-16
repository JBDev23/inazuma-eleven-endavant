import { isOfficialMatch } from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";

export const DEFAULT_TOTAL_TURNS = 20;
export const MIN_TOTAL_TURNS = 4;
export const MAX_TOTAL_TURNS = 40;

export const TURN_COUNT_OPTIONS = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40] as const;

export function isValidTotalTurns(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MIN_TOTAL_TURNS &&
    value <= MAX_TOTAL_TURNS &&
    value % 2 === 0
  );
}

export function normalizeTotalTurns(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_TOTAL_TURNS;
  const rounded = Math.round(value);
  const clamped = Math.min(MAX_TOTAL_TURNS, Math.max(MIN_TOTAL_TURNS, rounded));
  return clamped % 2 === 0 ? clamped : clamped + 1;
}

/** Primer turno de la segunda parte (p. ej. turno 11 en un partido de 20). */
export function getSecondHalfStartTurn(totalTurns: number): number {
  return totalTurns / 2 + 1;
}

export function hasHalftime(format: MatchFormat): boolean {
  return isOfficialMatch(format);
}

export function shouldShowHalfTime(
  currentTurn: number,
  totalTurns: number,
  halfTimeCompleted: boolean,
  format: MatchFormat,
): boolean {
  if (!hasHalftime(format)) return false;
  return !halfTimeCompleted && currentTurn === getSecondHalfStartTurn(totalTurns);
}

export function isMatchTied(homeScore: number, awayScore: number): boolean {
  return homeScore === awayScore;
}

export function shouldStartPenaltyShootout(
  penaltyShootoutEnabled: boolean,
  homeScore: number,
  awayScore: number,
): boolean {
  return penaltyShootoutEnabled && isMatchTied(homeScore, awayScore);
}

export function isMatchTurnsComplete(
  currentTurn: number,
  totalTurns: number,
): boolean {
  return currentTurn > totalTurns;
}

/** Turno mínimo al que se puede retroceder manualmente. */
export function getMinRewindTurn(
  currentTurn: number,
  totalTurns: number,
  halfTimeCompleted: boolean,
  format: MatchFormat,
): number {
  if (!hasHalftime(format)) return 1;

  const secondHalfStart = getSecondHalfStartTurn(totalTurns);
  if (halfTimeCompleted || currentTurn >= secondHalfStart) {
    return secondHalfStart;
  }
  return 1;
}

export function canRewindTurn(
  currentTurn: number,
  totalTurns: number,
  halfTimeCompleted: boolean,
  format: MatchFormat,
): boolean {
  return currentTurn > getMinRewindTurn(currentTurn, totalTurns, halfTimeCompleted, format);
}
