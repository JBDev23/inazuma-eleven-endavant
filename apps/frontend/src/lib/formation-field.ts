import type { Formation } from "@inazuma/shared";

export type FieldOrientation = "portrait" | "landscape";

export interface SlotCoord {
  top: string;
  left: string;
  role: string;
}

const DEFAULT_LINES_11 = [4, 3, 3];
const DEFAULT_LINES_4 = [1, 1, 1];

/**
 * Ajusta cuánto ancho ocupan los jugadores dentro de cada línea.
 * En vertical: controla el eje horizontal (left).
 * En apaisado: controla el eje vertical (top).
 */
const SLOT_SPREAD = {
  /** Margen desde el borde del campo (%) */
  margin: 15,
  /** Ancho/alto útil que ocupan los slots (%) — con margin 15, el rango va de 15% a 85% */
  span: 70,
} as const;

/**
 * Ajusta la profundidad de las líneas (portero → delanteros).
 * En vertical: controla el eje vertical (top).
 * En apaisado: controla el eje horizontal (left).
 */
const LINE_DEPTH = {
  goalkeeper: { portrait: 94.5, landscape: 3.5 },
  firstOutfield: { portrait: 80, landscape: 20 },
  span: 90,
} as const;

export function parseFormationLines(positions: unknown, playerCount: number): number[] {
  if (typeof positions === "string") {
    const lines = positions
      .split("-")
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !Number.isNaN(n));
    if (lines.length > 0) return lines;
  }

  if (Array.isArray(positions) && positions.length > 0 && typeof positions[0] === "number") {
    return positions as number[];
  }

  return playerCount === 4 ? DEFAULT_LINES_4 : DEFAULT_LINES_11;
}

export function formatFormationLines(positions: unknown, playerCount: number): string {
  return parseFormationLines(positions, playerCount).join("-");
}

function roleForLine(lineIndex: number, totalLines: number): string {
  if (lineIndex === 0) return "PR";
  if (lineIndex === 1) return "DF";
  if (lineIndex === totalLines - 1) return "DL";
  return "MD";
}

function slotPosition(
  lineIndex: number,
  totalLines: number,
  posInLine: number,
  orientation: FieldOrientation,
): { top: string; left: string } {
  const spreadPos = SLOT_SPREAD.margin + posInLine * SLOT_SPREAD.span;

  if (orientation === "portrait") {
    const topPercent =
      lineIndex === 0
        ? LINE_DEPTH.goalkeeper.portrait
        : LINE_DEPTH.firstOutfield.portrait -
          (lineIndex - 1) * (LINE_DEPTH.span / Math.max(totalLines - 1, 1));
    return { top: `${topPercent}%`, left: `${spreadPos}%` };
  }

  const leftPercent =
    lineIndex === 0
      ? LINE_DEPTH.goalkeeper.landscape
      : LINE_DEPTH.firstOutfield.landscape +
        (lineIndex - 1) * (LINE_DEPTH.span / Math.max(totalLines - 1, 1));
  return { top: `${spreadPos}%`, left: `${leftPercent}%` };
}

export function computeSlotsFromLines(
  lines: number[],
  orientation: FieldOrientation,
): Record<number, SlotCoord> {
  const slots: Record<number, SlotCoord> = {};
  const allLines = [1, ...lines];
  const totalLines = allLines.length;
  let slotNum = 1;

  allLines.forEach((count, lineIndex) => {
    const role = roleForLine(lineIndex, totalLines);

    for (let i = 0; i < count; i++) {
      const posInLine = count === 1 ? 0.5 : i / (count - 1);
      const { top, left } = slotPosition(lineIndex, totalLines, posInLine, orientation);
      slots[slotNum] = { top, left, role };
      slotNum++;
    }
  });

  return slots;
}

export function buildFieldSlots(
  formation: Formation | null | undefined,
  playerCount: number,
  orientation: FieldOrientation,
): Record<number, SlotCoord> {
  const lines = parseFormationLines(formation?.positions, playerCount);
  return computeSlotsFromLines(lines, orientation);
}

export function getFallbackFormation(playerCount: number): Formation {
  const lines = playerCount === 4 ? DEFAULT_LINES_4 : DEFAULT_LINES_11;
  return {
    id: 0,
    name: playerCount === 4 ? "Básica (4)" : "Básica (11)",
    playerCount,
    type: "BALANCED",
    price: 0,
    positions: lines.join("-"),
  };
}
