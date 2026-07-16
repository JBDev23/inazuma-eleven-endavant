import type { ApplyMatchXpDto } from "@inazuma/shared";
import type { UserClub } from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import { buildMatchXpParticipation } from "@/lib/match-xp";
import type { MatchStats } from "@/lib/match-stats";
import type { PendingMatchUpload } from "@/lib/offline-storage";

export function buildMatchXpPayload(
  homeTeam: UserClub,
  awayTeam: UserClub,
  matchStats: MatchStats,
  matchFormat: MatchFormat,
  totalTurns: number,
  homeScore: number,
  awayScore: number,
): ApplyMatchXpDto {
  const penaltyWinnerSide = matchStats.penaltyShootout?.winnerSide ?? null;
  const winnerClubId =
    penaltyWinnerSide === "home"
      ? homeTeam.id
      : penaltyWinnerSide === "away"
        ? awayTeam.id
        : undefined;

  return {
    format: matchFormat,
    totalTurns,
    homeClubId: homeTeam.id,
    awayClubId: awayTeam.id,
    homeScore,
    awayScore,
    ...(winnerClubId ? { winnerClubId } : {}),
    players: buildMatchXpParticipation(
      homeTeam,
      awayTeam,
      matchStats,
      matchFormat,
      { home: homeScore, away: awayScore },
    ),
    consumableUsages: (matchStats.consumableUsages ?? []).map((usage) => ({
      clubId: usage.clubId,
      playerId: usage.playerId,
      consumableId: usage.consumableId,
      turn: usage.turn,
    })),
    moveUsages: (matchStats.moveUsages ?? []).map((usage) => ({
      clubId: usage.clubId,
      playerId: usage.playerId,
      moveId: usage.moveId,
      turn: usage.turn,
    })),
  };
}

export function buildPendingMatchUpload(
  homeTeam: UserClub,
  awayTeam: UserClub,
  matchStats: MatchStats,
  matchFormat: MatchFormat,
  totalTurns: number,
  homeScore: number,
  awayScore: number,
): PendingMatchUpload {
  const finishedAt = matchStats.finishedAt ?? new Date().toISOString();

  return {
    id: finishedAt,
    finishedAt,
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,
    createdAt: new Date().toISOString(),
    payload: buildMatchXpPayload(
      homeTeam,
      awayTeam,
      matchStats,
      matchFormat,
      totalTurns,
      homeScore,
      awayScore,
    ),
  };
}
