import type { PlayerWithDetails, UserClub } from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import { getPositionKey, REQUIRED_STARTERS } from "./roster-utils";

export const MAX_SUBSTITUTIONS = 5;

export type PendingSubstitution = {
  outPlayerId: number;
  inPlayerId: number;
};

export type TeamSubstitutionState = {
  used: number;
  subbedOutIds: number[];
  pending: PendingSubstitution | null;
};

export type SubstitutionState = {
  home: TeamSubstitutionState;
  away: TeamSubstitutionState;
};

export type AppliedSubstitution = {
  side: "home" | "away";
  outPlayer: PlayerWithDetails;
  inPlayer: PlayerWithDetails;
  position: number;
  reason?: "manual" | "exhaustion" | "halftime";
};

export function createEmptyTeamSubstitutionState(): TeamSubstitutionState {
  return { used: 0, subbedOutIds: [], pending: null };
}

export function createEmptySubstitutionState(): SubstitutionState {
  return {
    home: createEmptyTeamSubstitutionState(),
    away: createEmptyTeamSubstitutionState(),
  };
}

export function getStarterPlayers(
  team: UserClub,
  format: MatchFormat,
): PlayerWithDetails[] {
  const posKey = getPositionKey(format);
  const required = REQUIRED_STARTERS[format];
  return team.roster
    .filter((p) => {
      const pos = p[posKey];
      return pos !== null && pos >= 1 && pos <= required;
    })
    .sort((a, b) => a[posKey]! - b[posKey]!);
}

export function getBenchPlayers(
  team: UserClub,
  format: MatchFormat,
): PlayerWithDetails[] {
  const posKey = getPositionKey(format);
  return team.roster
    .filter((p) => p.isActiveRoster && !p[posKey])
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getPlayerPosition(
  player: PlayerWithDetails,
  format: MatchFormat,
): number | null {
  const posKey = getPositionKey(format);
  return player[posKey];
}

export function canRequestSubstitution(
  teamState: TeamSubstitutionState,
  team: UserClub,
  format: MatchFormat,
  outPlayerId: number,
  inPlayerId: number,
): string | null {
  if (teamState.used >= MAX_SUBSTITUTIONS) {
    return `Máximo de ${MAX_SUBSTITUTIONS} cambios alcanzado.`;
  }

  if (teamState.pending) {
    return "Ya hay un cambio pendiente. Cancélalo antes de solicitar otro.";
  }

  const posKey = getPositionKey(format);
  const required = REQUIRED_STARTERS[format];

  const outPlayer = team.roster.find((p) => p.id === outPlayerId);
  const inPlayer = team.roster.find((p) => p.id === inPlayerId);

  if (!outPlayer || !inPlayer) return "Jugador no encontrado.";

  const outPos = outPlayer[posKey];
  if (outPos === null || outPos < 1 || outPos > required) {
    return "El jugador que sale debe estar en el campo.";
  }

  if (!inPlayer.isActiveRoster || inPlayer[posKey]) {
    return "El jugador que entra debe estar en el banquillo.";
  }

  if (teamState.subbedOutIds.includes(inPlayerId)) {
    return "Este jugador ya jugó y fue retirado; no puede volver a entrar.";
  }

  if (outPlayerId === inPlayerId) {
    return "Selecciona jugadores distintos.";
  }

  return null;
}

export function canRequestHalftimeSubstitution(
  teamState: TeamSubstitutionState,
  team: UserClub,
  format: MatchFormat,
  outPlayerId: number,
  inPlayerId: number,
): string | null {
  const posKey = getPositionKey(format);
  const required = REQUIRED_STARTERS[format];

  const outPlayer = team.roster.find((p) => p.id === outPlayerId);
  const inPlayer = team.roster.find((p) => p.id === inPlayerId);

  if (!outPlayer || !inPlayer) return "Jugador no encontrado.";

  const outPos = outPlayer[posKey];
  if (outPos === null || outPos < 1 || outPos > required) {
    return "El jugador que sale debe estar en el campo.";
  }

  if (!inPlayer.isActiveRoster || inPlayer[posKey]) {
    return "El jugador que entra debe estar en el banquillo.";
  }

  if (teamState.subbedOutIds.includes(inPlayerId)) {
    return "Este jugador ya jugó y fue retirado; no puede volver a entrar.";
  }

  if (outPlayerId === inPlayerId) {
    return "Selecciona jugadores distintos.";
  }

  return null;
}

export function updateSubbedOutIdsAfterHalftimeSub(
  subbedOutIds: number[],
  outPlayerId: number,
): number[] {
  if (subbedOutIds.includes(outPlayerId)) {
    return subbedOutIds;
  }
  return [...subbedOutIds, outPlayerId];
}

export function applySubstitutionToTeam(
  team: UserClub,
  format: MatchFormat,
  outPlayerId: number,
  inPlayerId: number,
): { team: UserClub; position: number } | null {
  const posKey = getPositionKey(format);
  const outPlayer = team.roster.find((p) => p.id === outPlayerId);
  const inPlayer = team.roster.find((p) => p.id === inPlayerId);

  if (!outPlayer || !inPlayer) return null;

  const position = outPlayer[posKey];
  if (position === null || position === undefined) return null;

  const roster = team.roster.map((p) => {
    if (p.id === outPlayerId) return { ...p, [posKey]: null };
    if (p.id === inPlayerId) return { ...p, [posKey]: position };
    return p;
  });

  return { team: { ...team, roster }, position };
}
