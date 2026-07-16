import type { PlayerWithDetails, UserClub } from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import type { MatchSide } from "@/lib/match-turn";
import { getStarterPlayers } from "@/lib/match-substitutions";
import type { PlayerParticipationStats } from "@/lib/match-stats";

export function creditTurnParticipation(
  participation: Record<number, PlayerParticipationStats>,
  homeTeam: UserClub | null,
  awayTeam: UserClub | null,
  format: MatchFormat,
  ballSide: MatchSide,
): Record<number, PlayerParticipationStats> {
  if (!homeTeam || !awayTeam) return participation;

  const next = { ...participation };
  const homeStarters = getStarterPlayers(homeTeam, format);
  const awayStarters = getStarterPlayers(awayTeam, format);

  const creditTeam = (players: PlayerWithDetails[], possessing: boolean) => {
    for (const player of players) {
      const current = next[player.id] ?? { turnsOnField: 0, possessionTurns: 0 };
      next[player.id] = {
        turnsOnField: current.turnsOnField + 1,
        possessionTurns: current.possessionTurns + (possessing ? 1 : 0),
      };
    }
  };

  creditTeam(homeStarters, ballSide === "home");
  creditTeam(awayStarters, ballSide === "away");

  return next;
}
