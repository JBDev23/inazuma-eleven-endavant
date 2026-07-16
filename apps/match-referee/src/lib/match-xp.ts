import type {
  GameSettings,
  PlayerMatchParticipation,
  PlayerWithDetails,
  UserClub,
} from "@inazuma/shared";
import {
  applyShopWinnerXpBonus,
  calculateMatchXp,
  computeBenchXpGrants,
  resolveClubFacilities,
  resolveMatchWinnerClubId,
} from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import {
  aggregatePlayerStats,
  type MatchStats,
} from "@/lib/match-stats";
import { getPositionKey } from "@/lib/roster-utils";
import { getBenchPlayers } from "@/lib/match-substitutions";

function findPlayerInTeams(
  homeTeam: UserClub,
  awayTeam: UserClub,
  playerId: number,
): { player: PlayerWithDetails; side: "home" | "away" } | null {
  const homePlayer = homeTeam.roster.find((p) => p.id === playerId);
  if (homePlayer) return { player: homePlayer, side: "home" };
  const awayPlayer = awayTeam.roster.find((p) => p.id === playerId);
  if (awayPlayer) return { player: awayPlayer, side: "away" };
  return null;
}

function findGoalkeeper(
  team: UserClub,
  format: MatchFormat,
): PlayerWithDetails | null {
  const posKey = getPositionKey(format);
  return team.roster.find((p) => p[posKey] === 1) ?? null;
}

function hasParticipated(
  playerId: number,
  participation: Record<number, { turnsOnField: number; possessionTurns: number }>,
  stats: ReturnType<typeof aggregatePlayerStats>,
): boolean {
  const part = participation[playerId];
  const stat = stats.find((s) => s.playerId === playerId);
  return (part?.turnsOnField ?? 0) > 0 || (stat?.duelsPlayed ?? 0) > 0;
}

export function buildMatchXpParticipation(
  homeTeam: UserClub,
  awayTeam: UserClub,
  matchStats: MatchStats,
  format: MatchFormat,
  scores: { home: number; away: number },
): PlayerMatchParticipation[] {
  const stats = aggregatePlayerStats(matchStats.duels, matchStats.goals);
  const participation = matchStats.playerParticipation ?? {};

  const playerIds = new Set<number>([
    ...stats.map((s) => s.playerId),
    ...Object.keys(participation).map(Number),
  ]);

  const result: PlayerMatchParticipation[] = [];

  for (const playerId of playerIds) {
    const located = findPlayerInTeams(homeTeam, awayTeam, playerId);
    if (!located) continue;

    const stat = stats.find((s) => s.playerId === playerId);
    const part = participation[playerId] ?? { turnsOnField: 0, possessionTurns: 0 };

    result.push({
      playerId,
      playerName: located.player.name,
      side: located.side,
      turnsOnField: part.turnsOnField,
      duelsPlayed: stat?.duelsPlayed ?? 0,
      duelsWon: stat?.duelsWon ?? 0,
      goals: stat?.goals ?? 0,
      saves: stat?.saves ?? 0,
      possessionTurns: part.possessionTurns,
      cleanSheet: false,
      level: located.player.level,
      experience: located.player.experience,
      guts: located.player.guts,
    });
  }

  const homeGk = findGoalkeeper(homeTeam, format);
  const awayGk = findGoalkeeper(awayTeam, format);

  if (scores.away === 0 && homeGk && hasParticipated(homeGk.id, participation, stats)) {
    const entry = result.find((p) => p.playerId === homeGk.id);
    if (entry) entry.cleanSheet = true;
  }

  if (scores.home === 0 && awayGk && hasParticipated(awayGk.id, participation, stats)) {
    const entry = result.find((p) => p.playerId === awayGk.id);
    if (entry) entry.cleanSheet = true;
  }

  return result;
}

export function previewMatchXp(
  format: MatchFormat,
  totalTurns: number,
  settings: GameSettings,
  homeTeam: UserClub,
  awayTeam: UserClub,
  matchStats: MatchStats,
  scores: { home: number; away: number },
) {
  const players = buildMatchXpParticipation(
    homeTeam,
    awayTeam,
    matchStats,
    format,
    scores,
  );
  const sessionConfig =
    settings.sessionConfigs.find((c) => c.session === settings.currentSession) ?? null;

  const baseResult = calculateMatchXp({
    format,
    totalTurns,
    sessionConfig,
    players,
  });

  const winnerClubId = resolveMatchWinnerClubId(
    homeTeam.id,
    awayTeam.id,
    scores.home,
    scores.away,
  );
  const winnerSide =
    winnerClubId === homeTeam.id ? "home" : winnerClubId === awayTeam.id ? "away" : null;
  const winnerFacilities = resolveClubFacilities(
    winnerSide === "home" ? homeTeam.facilities : winnerSide === "away" ? awayTeam.facilities : undefined,
  );

  const boostedPlayers = applyShopWinnerXpBonus(
    baseResult.players,
    winnerSide,
    winnerFacilities,
    format,
  );

  const playedIds = new Set(boostedPlayers.map((player) => player.playerId));
  const homeBenchPlayers = getBenchPlayers(homeTeam, format)
    .filter((player) => !playedIds.has(player.id))
    .map((player) => ({ playerId: player.id, playerName: player.name }));
  const awayBenchPlayers = getBenchPlayers(awayTeam, format)
    .filter((player) => !playedIds.has(player.id))
    .map((player) => ({ playerId: player.id, playerName: player.name }));

  const benchGrants = computeBenchXpGrants({
    format,
    matchXp: { ...baseResult, players: boostedPlayers },
    homeBenchPlayers,
    awayBenchPlayers,
    homeFacilities: resolveClubFacilities(homeTeam.facilities),
    awayFacilities: resolveClubFacilities(awayTeam.facilities),
  });

  return {
    ...baseResult,
    players: boostedPlayers,
    benchXpGrants: benchGrants,
  };
}
