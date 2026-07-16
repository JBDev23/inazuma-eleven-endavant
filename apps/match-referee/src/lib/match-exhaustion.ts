import type { Coach, PlayerWithDetails, UserClub } from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import { isGoalkeeperSlot } from "@/lib/duel-context";
import {
  resolvePlayerResources,
  type PlayerResourcesMap,
} from "@/lib/match-player-resources";
import {
  applySubstitutionToTeam,
  getBenchPlayers,
  getStarterPlayers,
  type AppliedSubstitution,
  type SubstitutionState,
  type TeamSubstitutionState,
} from "@/lib/match-substitutions";

export type ExhaustionSubstitutionRequest = {
  side: "home" | "away";
  outPlayer: PlayerWithDetails;
};

export function getExhaustionBenchCandidates(
  team: UserClub,
  format: MatchFormat,
  outPlayer: PlayerWithDetails,
  subbedOutIds: number[],
): PlayerWithDetails[] {
  const bench = getBenchPlayers(team, format).filter(
    (player) => !subbedOutIds.includes(player.id),
  );

  if (bench.length === 0) return [];

  const needsGoalkeeper = isGoalkeeperSlot(outPlayer, format);
  const goalkeepers = bench.filter((player) => player.position === "GK");

  if (needsGoalkeeper && goalkeepers.length > 0) {
    return goalkeepers;
  }

  return bench;
}

export function canApplyExhaustionSubstitution(
  teamState: TeamSubstitutionState,
  team: UserClub,
  format: MatchFormat,
  outPlayerId: number,
  inPlayerId: number,
): string | null {
  const outPlayer = team.roster.find((player) => player.id === outPlayerId);
  const inPlayer = team.roster.find((player) => player.id === inPlayerId);

  if (!outPlayer || !inPlayer) return "Jugador no encontrado.";

  const candidates = getExhaustionBenchCandidates(
    team,
    format,
    outPlayer,
    teamState.subbedOutIds,
  );

  if (candidates.length === 0) {
    return "No hay suplentes disponibles.";
  }

  if (!candidates.some((player) => player.id === inPlayerId)) {
    if (isGoalkeeperSlot(outPlayer, format) && inPlayer.position !== "GK") {
      return "Debes elegir un portero suplente.";
    }
    return "Este jugador no puede entrar por agotamiento.";
  }

  if (outPlayerId === inPlayerId) {
    return "Selecciona un suplente distinto.";
  }

  return null;
}

export function findExhaustedStarters(params: {
  homeTeam: UserClub | null;
  awayTeam: UserClub | null;
  playerResources: PlayerResourcesMap;
  matchFormat: MatchFormat;
  homeCoach: Coach | null;
  awayCoach: Coach | null;
}): ExhaustionSubstitutionRequest[] {
  const requests: ExhaustionSubstitutionRequest[] = [];

  const scanTeam = (
    side: "home" | "away",
    team: UserClub,
    coach: Coach | null,
  ) => {
    for (const player of getStarterPlayers(team, params.matchFormat)) {
      const resources = resolvePlayerResources(params.playerResources, player, coach);
      if (resources.gp <= 0) {
        requests.push({ side, outPlayer: player });
      }
    }
  };

  if (params.homeTeam) scanTeam("home", params.homeTeam, params.homeCoach);
  if (params.awayTeam) scanTeam("away", params.awayTeam, params.awayCoach);

  return requests;
}

export function applySingleExhaustionSubstitution(params: {
  side: "home" | "away";
  homeTeam: UserClub;
  awayTeam: UserClub;
  matchFormat: MatchFormat;
  substitutions: SubstitutionState;
  outPlayerId: number;
  inPlayerId: number;
}): {
  homeTeam: UserClub;
  awayTeam: UserClub;
  substitutions: SubstitutionState;
  applied: AppliedSubstitution | null;
} {
  const team = params.side === "home" ? params.homeTeam : params.awayTeam;
  const teamSub = params.substitutions[params.side];

  const error = canApplyExhaustionSubstitution(
    teamSub,
    team,
    params.matchFormat,
    params.outPlayerId,
    params.inPlayerId,
  );
  if (error) {
    return {
      homeTeam: params.homeTeam,
      awayTeam: params.awayTeam,
      substitutions: params.substitutions,
      applied: null,
    };
  }

  const result = applySubstitutionToTeam(
    team,
    params.matchFormat,
    params.outPlayerId,
    params.inPlayerId,
  );
  if (!result) {
    return {
      homeTeam: params.homeTeam,
      awayTeam: params.awayTeam,
      substitutions: params.substitutions,
      applied: null,
    };
  }

  const outPlayer = team.roster.find((player) => player.id === params.outPlayerId);
  const inPlayer = team.roster.find((player) => player.id === params.inPlayerId);
  if (!outPlayer || !inPlayer) {
    return {
      homeTeam: params.homeTeam,
      awayTeam: params.awayTeam,
      substitutions: params.substitutions,
      applied: null,
    };
  }

  const nextTeam = result.team;
  const nextSubstitutions = {
    ...params.substitutions,
    [params.side]: {
      ...teamSub,
      subbedOutIds: [...teamSub.subbedOutIds, params.outPlayerId],
    },
  };

  return {
    homeTeam: params.side === "home" ? nextTeam : params.homeTeam,
    awayTeam: params.side === "away" ? nextTeam : params.awayTeam,
    substitutions: nextSubstitutions,
    applied: {
      side: params.side,
      outPlayer,
      inPlayer,
      position: result.position,
      reason: "exhaustion",
    },
  };
}
