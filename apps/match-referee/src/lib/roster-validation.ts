import type { PlayerWithDetails } from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import { getPositionKey, REQUIRED_STARTERS } from "./roster-utils";

export function getRosterValidationIssues(
  roster: PlayerWithDetails[],
  format: MatchFormat,
  teamLabel: string,
): string[] {
  const issues: string[] = [];
  const posKey = getPositionKey(format);
  const required = REQUIRED_STARTERS[format];
  const prefix = `${teamLabel}:`;

  const starters = roster.filter((p) => {
    const pos = p[posKey];
    return pos !== null && pos >= 1 && pos <= required;
  });

  if (starters.length < required) {
    issues.push(
      `${prefix} alineación incompleta (${starters.length}/${required} titulares).`,
    );
  }

  const positions = starters.map((p) => p[posKey]!);
  const uniquePositions = new Set(positions);
  if (uniquePositions.size !== positions.length) {
    issues.push(`${prefix} hay posiciones duplicadas en el once inicial.`);
  }

  const nonConvocadosInLineup = starters.filter((p) => !p.isActiveRoster);
  if (nonConvocadosInLineup.length > 0) {
    issues.push(
      `${prefix} ${nonConvocadosInLineup.length} jugador${nonConvocadosInLineup.length > 1 ? "es" : ""} en el campo sin estar convocado${nonConvocadosInLineup.length > 1 ? "s" : ""}.`,
    );
  }

  return issues;
}

export function isRosterValidForFormat(
  roster: PlayerWithDetails[],
  format: MatchFormat,
): boolean {
  const posKey = getPositionKey(format);
  const required = REQUIRED_STARTERS[format];

  const starters = roster.filter((p) => {
    const pos = p[posKey];
    return pos !== null && pos >= 1 && pos <= required && p.isActiveRoster;
  });

  if (starters.length !== required) return false;

  const positions = starters.map((p) => p[posKey]!);
  return new Set(positions).size === positions.length;
}
