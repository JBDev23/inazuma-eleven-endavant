import type { PlayerWithDetails } from "@inazuma/shared";
import { REQUIRED_11, REQUIRED_4, type PositionKey, type TacticsMode } from "./types";

export function serializeRoster(roster: PlayerWithDetails[]): string {
  return JSON.stringify(
    roster
      .map((p) => ({
        id: p.id,
        isActiveRoster: p.isActiveRoster,
        position11: p.position11,
        position4: p.position4,
      }))
      .sort((a, b) => a.id - b.id),
  );
}

export function getSaveWarnings(roster: PlayerWithDetails[]): string[] {
  const warnings: string[] = [];
  const convocados = roster.filter((p) => p.isActiveRoster);

  if (convocados.length === 0) {
    warnings.push("No has convocado a ningún jugador.");
  }

  const assigned11 = roster.filter((p) => p.position11 !== null).length;
  if (assigned11 < REQUIRED_11) {
    warnings.push(`Alineación 11v11 incompleta: ${assigned11}/${REQUIRED_11} puestos asignados.`);
  }

  const assigned4 = roster.filter((p) => p.position4 !== null).length;
  if (assigned4 < REQUIRED_4) {
    warnings.push(`Alineación pachanga incompleta: ${assigned4}/${REQUIRED_4} puestos asignados.`);
  }

  const convocadosSinPuesto = convocados.filter(
    (p) => p.position11 === null && p.position4 === null,
  ).length;
  if (convocadosSinPuesto > 0) {
    warnings.push(
      `${convocadosSinPuesto} convocado${convocadosSinPuesto > 1 ? "s" : ""} sin posición en el campo.`,
    );
  }

  return warnings;
}

export function getPositionKey(mode: TacticsMode): PositionKey {
  return mode === "11vs11" ? "position11" : "position4";
}
