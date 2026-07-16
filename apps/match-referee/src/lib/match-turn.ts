export type MatchSide = "home" | "away";

/** Turnos impares: local elige primero. Turnos pares: visitante elige primero. */
export function getActionStarter(turn: number): MatchSide {
  return turn % 2 === 1 ? "home" : "away";
}
