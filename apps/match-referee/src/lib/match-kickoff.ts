import type { MatchSide } from "@/lib/match-turn";
import type { FieldOrientation } from "@/lib/formation-field";

/** endA = arriba/izquierda (visitante por defecto), endB = abajo/derecha (local por defecto) */
export type FieldEnd = "endA" | "endB";

export function getFieldEndLabels(orientation: FieldOrientation): { endA: string; endB: string } {
  if (orientation === "landscape") {
    return { endA: "Lado izquierdo", endB: "Lado derecho" };
  }
  return { endA: "Lado de arriba", endB: "Lado de abajo" };
}

export function computePitchSwapped(teamChoosing: MatchSide, chosenEnd: FieldEnd): boolean {
  if (teamChoosing === "home") return chosenEnd === "endA";
  return chosenEnd === "endB";
}

export function getOppositeKickoffSide(side: MatchSide): MatchSide {
  return side === "home" ? "away" : "home";
}

export function resolveKickoff({
  tossWinner,
  choice,
  fieldEnd,
}: {
  tossWinner: MatchSide;
  choice: "field" | "ball";
  fieldEnd: FieldEnd;
}): { ballPossession: MatchSide; pitchSwapped: boolean } {
  const fieldChooser = choice === "field" ? tossWinner : (tossWinner === "home" ? "away" : "home");
  const ballPossession = choice === "ball" ? tossWinner : fieldChooser === "home" ? "away" : "home";

  return {
    ballPossession,
    pitchSwapped: computePitchSwapped(fieldChooser, fieldEnd),
  };
}
