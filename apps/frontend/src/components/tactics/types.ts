export type TacticsMode = "11vs11" | "pachanga";
export type PageTab = "convocados" | "alineacion" | "entrenador";
export type PositionKey = "position11" | "position4";

export const MAX_CONVOCADOS = 16;
export const REQUIRED_11 = 11;
export const REQUIRED_4 = 4;

export type SaveModalState =
  | null
  | { type: "confirm"; warnings: string[] }
  | { type: "success" }
  | { type: "error"; message: string };
