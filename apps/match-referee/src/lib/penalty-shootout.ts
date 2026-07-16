import {
  getActiveCoach,
  getEffectiveStats,
  type PlayerWithDetails,
  type UserClub,
} from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import type { MatchSide } from "@/lib/match-turn";
import { getGoalkeeperFromTeam, isGoalkeeperSlot } from "@/lib/duel-context";
import { getBenchPlayers, getPlayerPosition, getStarterPlayers } from "@/lib/match-substitutions";

export type PenaltyShootoutPhase = "setup" | "coin_toss" | "shooting" | "finished";

export type PenaltyShotOutcome = "miss" | "goal";

export interface PenaltyShotRecord {
  side: MatchSide;
  shooterId: number;
  goalkeeperId: number;
  outcome: PenaltyShotOutcome;
  round: number;
  viaDuel: boolean;
}

export interface PenaltyShootoutState {
  phase: PenaltyShootoutPhase;
  kicksPerTeam: number;
  homeShooters: number[];
  awayShooters: number[];
  homeGoalkeeperId: number;
  awayGoalkeeperId: number;
  homeSetupConfirmed: boolean;
  awaySetupConfirmed: boolean;
  firstShooterSide: MatchSide | null;
  homeScore: number;
  awayScore: number;
  shots: PenaltyShotRecord[];
  winnerSide: MatchSide | null;
}

export function getPenaltyKicksPerTeam(format: MatchFormat): number {
  return format === "11v11" ? 5 : 3;
}

export function proposePenaltyShooters(
  team: UserClub,
  format: MatchFormat,
  goalkeeperId: number,
  count: number,
): number[] {
  const coach = getActiveCoach(team);
  const candidates = getPenaltyEligiblePlayers(team, format)
    .filter((p) => p.id !== goalkeeperId)
    .map((player) => ({
      id: player.id,
      kick: getEffectiveStats(player, coach).kick,
    }))
    .sort((a, b) => b.kick - a.kick || a.id - b.id);

  return candidates.slice(0, count).map((c) => c.id);
}

export function createInitialPenaltyShootout(
  homeTeam: UserClub,
  awayTeam: UserClub,
  format: MatchFormat,
): PenaltyShootoutState {
  const kicksPerTeam = getPenaltyKicksPerTeam(format);
  const homeGk = getGoalkeeperFromTeam(homeTeam, format);
  const awayGk = getGoalkeeperFromTeam(awayTeam, format);

  const homeGoalkeeperId = homeGk?.id ?? getStarterPlayers(homeTeam, format)[0]?.id ?? 0;
  const awayGoalkeeperId = awayGk?.id ?? getStarterPlayers(awayTeam, format)[0]?.id ?? 0;

  return {
    phase: "setup",
    kicksPerTeam,
    homeShooters: proposePenaltyShooters(homeTeam, format, homeGoalkeeperId, kicksPerTeam),
    awayShooters: proposePenaltyShooters(awayTeam, format, awayGoalkeeperId, kicksPerTeam),
    homeGoalkeeperId,
    awayGoalkeeperId,
    homeSetupConfirmed: false,
    awaySetupConfirmed: false,
    firstShooterSide: null,
    homeScore: 0,
    awayScore: 0,
    shots: [],
    winnerSide: null,
  };
}

export function getOppositeSide(side: MatchSide): MatchSide {
  return side === "home" ? "away" : "home";
}

export function getShootingSide(state: PenaltyShootoutState): MatchSide | null {
  if (!state.firstShooterSide || state.phase !== "shooting") return null;
  const isFirstTeamTurn = state.shots.length % 2 === 0;
  return isFirstTeamTurn ? state.firstShooterSide : getOppositeSide(state.firstShooterSide);
}

export function getShotsTakenBySide(state: PenaltyShootoutState, side: MatchSide): number {
  return state.shots.filter((shot) => shot.side === side).length;
}

export function getCurrentShooterId(state: PenaltyShootoutState): number | null {
  const side = getShootingSide(state);
  if (!side) return null;

  const shotIndex = getShotsTakenBySide(state, side);
  const shooters = side === "home" ? state.homeShooters : state.awayShooters;
  if (shooters.length === 0) return null;

  return shooters[shotIndex % shooters.length] ?? null;
}

export function getCurrentGoalkeeperId(state: PenaltyShootoutState): number | null {
  const shootingSide = getShootingSide(state);
  if (!shootingSide) return null;
  const defendingSide = getOppositeSide(shootingSide);
  return defendingSide === "home" ? state.homeGoalkeeperId : state.awayGoalkeeperId;
}

export function getCurrentPenaltyRound(state: PenaltyShootoutState): number {
  const homeTaken = getShotsTakenBySide(state, "home");
  const awayTaken = getShotsTakenBySide(state, "away");
  return Math.max(homeTaken, awayTaken, 1);
}

export function isSuddenDeath(state: PenaltyShootoutState): boolean {
  const homeTaken = getShotsTakenBySide(state, "home");
  const awayTaken = getShotsTakenBySide(state, "away");
  return homeTaken >= state.kicksPerTeam && awayTaken >= state.kicksPerTeam;
}

export function checkPenaltyShootoutWinner(state: PenaltyShootoutState): MatchSide | null {
  const homeTaken = getShotsTakenBySide(state, "home");
  const awayTaken = getShotsTakenBySide(state, "away");
  const { homeScore, awayScore, kicksPerTeam } = state;

  const homeRemaining = Math.max(0, kicksPerTeam - homeTaken);
  const awayRemaining = Math.max(0, kicksPerTeam - awayTaken);

  if (homeTaken > 0 || awayTaken > 0) {
    if (homeScore > awayScore + awayRemaining) return "home";
    if (awayScore > homeScore + homeRemaining) return "away";
  }

  if (homeTaken >= kicksPerTeam && awayTaken >= kicksPerTeam && homeScore !== awayScore) {
    return homeScore > awayScore ? "home" : "away";
  }

  if (isSuddenDeath(state) && homeTaken === awayTaken && homeTaken > kicksPerTeam) {
    const lastHome = state.shots.filter((s) => s.side === "home").at(-1);
    const lastAway = state.shots.filter((s) => s.side === "away").at(-1);
    if (lastHome && lastAway) {
      if (lastHome.outcome === "goal" && lastAway.outcome === "miss") return "home";
      if (lastAway.outcome === "goal" && lastHome.outcome === "miss") return "away";
    }
  }

  return null;
}

export function recordPenaltyShot(
  state: PenaltyShootoutState,
  outcome: PenaltyShotOutcome,
  viaDuel = false,
): PenaltyShootoutState {
  const side = getShootingSide(state);
  const shooterId = getCurrentShooterId(state);
  const goalkeeperId = getCurrentGoalkeeperId(state);

  if (!side || shooterId == null || goalkeeperId == null) {
    return state;
  }

  const round = getCurrentPenaltyRound(state);
  const shot: PenaltyShotRecord = {
    side,
    shooterId,
    goalkeeperId,
    outcome,
    round,
    viaDuel,
  };

  const next: PenaltyShootoutState = {
    ...state,
    shots: [...state.shots, shot],
    homeScore: state.homeScore + (outcome === "goal" && side === "home" ? 1 : 0),
    awayScore: state.awayScore + (outcome === "goal" && side === "away" ? 1 : 0),
  };

  const winnerSide = checkPenaltyShootoutWinner(next);
  if (winnerSide) {
    return {
      ...next,
      phase: "finished",
      winnerSide,
    };
  }

  return next;
}

export function getPlayerRoleLabel(position: string): string {
  const labels: Record<string, string> = {
    GK: "Portero",
    DF: "Defensa",
    MF: "Medio",
    FW: "Delantero",
  };
  return labels[position] ?? position;
}

export function formatPenaltyPlayerLine(
  player: PlayerWithDetails,
  format: MatchFormat,
): string {
  const slot = getPlayerPosition(player, format);
  const role = getPlayerRoleLabel(player.position);
  return slot != null ? `#${slot} · ${role}` : `Banquillo · ${role}`;
}

export function getPenaltyEligiblePlayers(
  team: UserClub,
  format: MatchFormat,
): PlayerWithDetails[] {
  const seen = new Set<number>();
  const players: PlayerWithDetails[] = [];

  for (const player of [...getStarterPlayers(team, format), ...getBenchPlayers(team, format)]) {
    if (seen.has(player.id)) continue;
    seen.add(player.id);
    players.push(player);
  }

  return players;
}

export function normalizePenaltyShooters(
  team: UserClub,
  format: MatchFormat,
  goalkeeperId: number,
  shooters: number[],
  kicksPerTeam: number,
): number[] {
  const unique: number[] = [];
  for (const id of shooters) {
    if (id === goalkeeperId || unique.includes(id)) continue;
    unique.push(id);
  }

  if (unique.length >= kicksPerTeam) {
    return unique.slice(0, kicksPerTeam);
  }

  const proposed = proposePenaltyShooters(team, format, goalkeeperId, kicksPerTeam);
  for (const id of proposed) {
    if (unique.length >= kicksPerTeam) break;
    if (!unique.includes(id)) unique.push(id);
  }

  return unique;
}

export function getAvailableShootersForSlot(
  team: UserClub,
  format: MatchFormat,
  goalkeeperId: number,
  shooters: number[],
  slotIndex: number,
): PlayerWithDetails[] {
  const currentId = shooters[slotIndex];
  const taken = new Set(
    shooters.filter((id, index) => index !== slotIndex && id != null),
  );

  return getPenaltyLineupCandidates(team, format, goalkeeperId).filter(
    (player) => !taken.has(player.id) || player.id === currentId,
  );
}

export function isPenaltyLineupComplete(
  shooters: number[],
  goalkeeperId: number,
  kicksPerTeam: number,
): boolean {
  if (goalkeeperId <= 0) return false;
  if (shooters.length !== kicksPerTeam) return false;

  const unique = new Set(shooters);
  if (unique.size !== kicksPerTeam) return false;
  return !shooters.includes(goalkeeperId);
}

export function findPlayerInTeam(
  team: UserClub,
  playerId: number,
): PlayerWithDetails | null {
  return team.roster.find((p) => p.id === playerId) ?? null;
}

export function canSelectAsGoalkeeper(
  player: PlayerWithDetails,
  format: MatchFormat,
): boolean {
  return player.isActiveRoster;
}

export function canSelectAsShooter(
  player: PlayerWithDetails,
  goalkeeperId: number,
): boolean {
  return player.isActiveRoster && player.id !== goalkeeperId;
}

export function getPenaltyLineupCandidates(
  team: UserClub,
  format: MatchFormat,
  goalkeeperId: number,
): PlayerWithDetails[] {
  const coach = getActiveCoach(team);
  return getPenaltyEligiblePlayers(team, format)
    .filter((p) => canSelectAsShooter(p, goalkeeperId))
    .sort((a, b) => {
      const kickDiff = getEffectiveStats(b, coach).kick - getEffectiveStats(a, coach).kick;
      if (kickDiff !== 0) return kickDiff;
      return a.name.localeCompare(b.name);
    });
}

export function getGoalkeeperCandidates(
  team: UserClub,
  format: MatchFormat,
): PlayerWithDetails[] {
  const coach = getActiveCoach(team);
  const eligible = getPenaltyEligiblePlayers(team, format);
  const fieldGk = eligible.find((p) => isGoalkeeperSlot(p, format));

  return [...eligible].sort((a, b) => {
    if (fieldGk) {
      if (a.id === fieldGk.id) return -1;
      if (b.id === fieldGk.id) return 1;
    }
    const guardDiff = getEffectiveStats(b, coach).guard - getEffectiveStats(a, coach).guard;
    if (guardDiff !== 0) return guardDiff;
    return a.name.localeCompare(b.name);
  });
}

export function moveShooterInList(shooters: number[], fromIndex: number, toIndex: number): number[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= shooters.length ||
    toIndex >= shooters.length ||
    fromIndex === toIndex
  ) {
    return shooters;
  }

  const next = [...shooters];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
