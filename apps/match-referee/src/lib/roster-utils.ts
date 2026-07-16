import type { PlayerWithDetails } from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";

export const REQUIRED_STARTERS: Record<MatchFormat, number> = {
  "11v11": 11,
  "4v4": 4,
};

export function getPositionKey(format: MatchFormat): "position11" | "position4" {
  return format === "11v11" ? "position11" : "position4";
}

export function serializeLineup(
  roster: PlayerWithDetails[],
  format: MatchFormat,
): string {
  const posKey = getPositionKey(format);
  return JSON.stringify(
    roster
      .map((p) => ({ id: p.id, pos: p[posKey] }))
      .sort((a, b) => a.id - b.id),
  );
}

export function getActiveFormationId(club: { activeFormation11Id: number | null; activeFormation4Id: number | null }, format: MatchFormat): number | null {
  return format === "11v11" ? club.activeFormation11Id : club.activeFormation4Id;
}
