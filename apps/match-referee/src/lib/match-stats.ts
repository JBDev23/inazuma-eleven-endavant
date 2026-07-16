import type { DuelResolution } from "@inazuma/shared";
import type { ConsumableUsageRecord, MoveUsageRecord, PlayerWithDetails } from "@inazuma/shared";
import type { MatchSide } from "@/lib/match-turn";
import type { PenaltyShootoutState } from "@/lib/penalty-shootout";
import type { DuelContext } from "@/lib/duel-context";
import { getEffectiveDuelType, isGoalkeeperFieldDuel, shouldAttemptGoalkeeperSave } from "@/lib/duel-context";
import { isGoalkeeperSlot } from "@/lib/duel-context";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import { getActionLabel } from "@/lib/duel-actions";

export type GoalSource = "duel" | "manual" | "open_goal";

export interface GoalEvent {
  side: MatchSide;
  turn: number | null;
  source: GoalSource;
  playerId?: number;
  playerName?: string;
}

export interface DuelRecord {
  turn: number;
  duelType: "FIELD" | "GOAL";
  ballSideAtStart: MatchSide;
  homePlayerId: number;
  homePlayerName: string;
  awayPlayerId: number;
  awayPlayerName: string;
  winnerSide: DuelResolution["winnerSide"];
  homePower: number;
  awayPower: number;
  goalScored: boolean;
  goalSide?: MatchSide;
  scorerId?: number;
  scorerName?: string;
  saverId?: number;
  saverName?: string;
  homeUsedSuper: boolean;
  awayUsedSuper: boolean;
  homeMoveId?: number;
  awayMoveId?: number;
  homeMoveName?: string;
  awayMoveName?: string;
  possessionChanged: boolean;
  foulOccurred: boolean;
  foulSide?: MatchSide;
  foulAction?: string;
}

export interface PlayerMatchStats {
  playerId: number;
  playerName: string;
  side: MatchSide;
  duelsPlayed: number;
  duelsWon: number;
  goals: number;
  saves: number;
  superMovesUsed: number;
  totalPower: number;
}

export interface TeamMatchStats {
  duelsPlayed: number;
  duelsWon: number;
  draws: number;
  goals: number;
  superMovesUsed: number;
  possessionTurns: number;
  totalPower: number;
  fieldDuels: number;
  goalDuels: number;
}

export interface PlayerParticipationStats {
  turnsOnField: number;
  possessionTurns: number;
}

export interface MatchStats {
  duels: DuelRecord[];
  goals: GoalEvent[];
  possessionTurns: { home: number; away: number };
  playerParticipation: Record<number, PlayerParticipationStats>;
  consumableUsages: ConsumableUsageRecord[];
  moveUsages: MoveUsageRecord[];
  turnsPlayed: number;
  startedAt: string | null;
  finishedAt: string | null;
  penaltyShootout?: Pick<
    PenaltyShootoutState,
    "homeScore" | "awayScore" | "shots" | "winnerSide"
  >;
}

export function createEmptyPlayerParticipation(): Record<number, PlayerParticipationStats> {
  return {};
}

export function createEmptyMatchStats(): MatchStats {
  return {
    duels: [],
    goals: [],
    possessionTurns: { home: 0, away: 0 },
    playerParticipation: createEmptyPlayerParticipation(),
    consumableUsages: [],
    moveUsages: [],
    turnsPlayed: 0,
    startedAt: null,
    finishedAt: null,
  };
}

function usedSuperTechnique(power: number, breakdown: DuelResolution["homeBreakdown"]): boolean {
  return breakdown.techniquePower != null && breakdown.techniquePower > 0;
}

function resolveScorer(
  duelContext: DuelContext,
  goalSide: MatchSide | undefined,
  homePlayer: PlayerWithDetails,
  awayPlayer: PlayerWithDetails,
  format: MatchFormat,
): { id: number; name: string } | null {
  if (!goalSide) return null;

  if (duelContext.inPenaltyArea && duelContext.type === "FIELD") {
    const scorer = goalSide === "home" ? homePlayer : awayPlayer;
    return { id: scorer.id, name: scorer.name };
  }

  if (duelContext.type !== "GOAL") return null;

  const homeIsGk = isGoalkeeperSlot(homePlayer, format);
  const awayIsGk = isGoalkeeperSlot(awayPlayer, format);

  if (goalSide === "home" && !homeIsGk) {
    return { id: homePlayer.id, name: homePlayer.name };
  }
  if (goalSide === "away" && !awayIsGk) {
    return { id: awayPlayer.id, name: awayPlayer.name };
  }
  if (goalSide === "home" && homeIsGk && !awayIsGk) {
    return null;
  }
  if (goalSide === "away" && awayIsGk && !homeIsGk) {
    return null;
  }

  return null;
}

export function buildDuelRecord(params: {
  turn: number;
  duelContext: DuelContext;
  homePlayer: PlayerWithDetails;
  awayPlayer: PlayerWithDetails;
  resolution: DuelResolution;
  format: MatchFormat;
  homeAction?: { moveId?: number; moveName?: string };
  awayAction?: { moveId?: number; moveName?: string };
  goalkeeperPlayer?: PlayerWithDetails;
}): DuelRecord {
  const {
    turn,
    duelContext,
    homePlayer,
    awayPlayer,
    resolution,
    format,
    homeAction,
    awayAction,
    goalkeeperPlayer,
  } = params;
  const { effects } = resolution;
  const scorer = effects.goalScored
    ? resolveScorer(duelContext, effects.goalSide, homePlayer, awayPlayer, format)
    : null;

  let saverId: number | undefined;
  let saverName: string | undefined;
  const defendingSide: MatchSide =
    duelContext.ballSide === "home" ? "away" : "home";

  if (
    duelContext.inPenaltyArea &&
    duelContext.type === "FIELD" &&
    shouldAttemptGoalkeeperSave(duelContext) &&
    !effects.goalScored &&
    resolution.winnerSide === defendingSide &&
    params.goalkeeperPlayer
  ) {
    saverId = params.goalkeeperPlayer.id;
    saverName = params.goalkeeperPlayer.name;
  } else if (
    duelContext.type === "GOAL" &&
    duelContext.goalkeeperInSmallArea &&
    !isGoalkeeperFieldDuel(duelContext) &&
    !effects.goalScored &&
    resolution.winnerSide !== "draw"
  ) {
    const gk =
      resolution.winnerSide === "home"
        ? isGoalkeeperSlot(homePlayer, format)
          ? homePlayer
          : null
        : isGoalkeeperSlot(awayPlayer, format)
          ? awayPlayer
          : null;
    if (gk) {
      saverId = gk.id;
      saverName = gk.name;
    }
  }

  return {
    turn,
    duelType: getEffectiveDuelType(duelContext),
    ballSideAtStart: duelContext.ballSide,
    homePlayerId: homePlayer.id,
    homePlayerName: homePlayer.name,
    awayPlayerId: awayPlayer.id,
    awayPlayerName: awayPlayer.name,
    winnerSide: resolution.winnerSide,
    homePower: resolution.homePower,
    awayPower: resolution.awayPower,
    goalScored: effects.goalScored,
    goalSide: effects.goalSide,
    scorerId: scorer?.id,
    scorerName: scorer?.name,
    saverId,
    saverName,
    homeUsedSuper: usedSuperTechnique(resolution.homePower, resolution.homeBreakdown),
    awayUsedSuper: usedSuperTechnique(resolution.awayPower, resolution.awayBreakdown),
    homeMoveId: homeAction?.moveId,
    awayMoveId: awayAction?.moveId,
    homeMoveName: homeAction?.moveName,
    awayMoveName: awayAction?.moveName,
    possessionChanged: effects.possessionChange,
    foulOccurred: resolution.foul != null,
    foulSide: resolution.foul?.foulSide,
    foulAction: resolution.foul ? getActionLabel(resolution.foul.action) : undefined,
  };
}

export function aggregatePlayerStats(
  duels: DuelRecord[],
  goals: GoalEvent[],
): PlayerMatchStats[] {
  const map = new Map<number, PlayerMatchStats>();

  const ensure = (id: number, name: string, side: MatchSide): PlayerMatchStats => {
    const existing = map.get(id);
    if (existing) return existing;
    const entry: PlayerMatchStats = {
      playerId: id,
      playerName: name,
      side,
      duelsPlayed: 0,
      duelsWon: 0,
      goals: 0,
      saves: 0,
      superMovesUsed: 0,
      totalPower: 0,
    };
    map.set(id, entry);
    return entry;
  };

  for (const duel of duels) {
    const home = ensure(duel.homePlayerId, duel.homePlayerName, "home");
    const away = ensure(duel.awayPlayerId, duel.awayPlayerName, "away");

    home.duelsPlayed += 1;
    away.duelsPlayed += 1;
    home.totalPower += duel.homePower;
    away.totalPower += duel.awayPower;

    if (duel.winnerSide === "home") home.duelsWon += 1;
    if (duel.winnerSide === "away") away.duelsWon += 1;
    if (duel.homeUsedSuper) home.superMovesUsed += 1;
    if (duel.awayUsedSuper) away.superMovesUsed += 1;

    if (duel.saverId && duel.saverName) {
      const side: MatchSide =
        duel.saverId === duel.homePlayerId ? "home" : "away";
      const saver = ensure(duel.saverId, duel.saverName, side);
      saver.saves += 1;
    }
  }

  for (const goal of goals) {
    if (goal.playerId && goal.playerName) {
      const player = ensure(goal.playerId, goal.playerName, goal.side);
      player.goals += 1;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const scoreA = a.goals * 100 + a.duelsWon * 10 + a.totalPower;
    const scoreB = b.goals * 100 + b.duelsWon * 10 + b.totalPower;
    return scoreB - scoreA;
  });
}

export function aggregateTeamStats(
  side: MatchSide,
  duels: DuelRecord[],
  goals: GoalEvent[],
  possessionTurns: { home: number; away: number },
): TeamMatchStats {
  const isHome = side === "home";

  const teamDuels = duels;
  let duelsWon = 0;
  let draws = 0;
  let superMovesUsed = 0;
  let totalPower = 0;
  let fieldDuels = 0;
  let goalDuels = 0;

  for (const duel of duels) {
    if (duel.duelType === "FIELD") fieldDuels += 1;
    else goalDuels += 1;

    if (duel.winnerSide === side) duelsWon += 1;
    if (duel.winnerSide === "draw") draws += 1;

    totalPower += isHome ? duel.homePower : duel.awayPower;
    superMovesUsed += isHome ? (duel.homeUsedSuper ? 1 : 0) : (duel.awayUsedSuper ? 1 : 0);
  }

  const teamGoals = goals.filter((g) => g.side === side).length;

  return {
    duelsPlayed: teamDuels.length,
    duelsWon,
    draws,
    goals: teamGoals,
    superMovesUsed,
    possessionTurns: isHome ? possessionTurns.home : possessionTurns.away,
    totalPower,
    fieldDuels,
    goalDuels,
  };
}

export function getMatchResult(
  homeScore: number,
  awayScore: number,
  penaltyShootout?: MatchStats["penaltyShootout"],
): {
  outcome: "home" | "away" | "draw";
  label: string;
} {
  if (penaltyShootout?.winnerSide) {
    return penaltyShootout.winnerSide === "home"
      ? { outcome: "home", label: "Victoria local (penaltis)" }
      : { outcome: "away", label: "Victoria visitante (penaltis)" };
  }

  if (homeScore > awayScore) {
    return { outcome: "home", label: "Victoria local" };
  }
  if (awayScore > homeScore) {
    return { outcome: "away", label: "Victoria visitante" };
  }
  return { outcome: "draw", label: "Empate" };
}

export function getPossessionPercent(possessionTurns: { home: number; away: number }, side: MatchSide): number {
  const total = possessionTurns.home + possessionTurns.away;
  if (total === 0) return 50;
  const value = side === "home" ? possessionTurns.home : possessionTurns.away;
  return Math.round((value / total) * 100);
}

export function findMvp(players: PlayerMatchStats[]): PlayerMatchStats | null {
  if (players.length === 0) return null;
  return players.reduce((best, current) => {
    const bestScore = best.goals * 100 + best.duelsWon * 15 + best.superMovesUsed * 5;
    const currentScore = current.goals * 100 + current.duelsWon * 15 + current.superMovesUsed * 5;
    return currentScore > bestScore ? current : best;
  });
}

export function findHighestPowerDuel(duels: DuelRecord[]): DuelRecord | null {
  if (duels.length === 0) return null;
  return duels.reduce((best, duel) => {
    const duelPeak = Math.max(duel.homePower, duel.awayPower);
    const bestPeak = Math.max(best.homePower, best.awayPower);
    return duelPeak > bestPeak ? duel : best;
  });
}
