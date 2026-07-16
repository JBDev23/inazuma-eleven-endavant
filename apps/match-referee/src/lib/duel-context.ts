import type { Player, PlayerWithDetails, UserClub } from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import type { MatchSide } from "@/lib/match-turn";
import { getPositionKey } from "@/lib/roster-utils";

export type DuelType = "FIELD" | "GOAL";

export type DuelRole = "field_attacker" | "field_defender" | "shooter" | "goalkeeper";

export interface DuelContext {
  type: DuelType;
  /** Equipo con posesión del balón (atacante / tirador). */
  ballSide: MatchSide;
  /** Solo relevante en duelos de campo: choque dentro del área de penalti. */
  inPenaltyArea: boolean;
  /**
   * Solo relevante cuando interviene el portero (duelo GOAL o fase de parada en el área).
   * true = tiro/parada; false = regate/defensa u oportunidad a puerta vacía.
   */
  goalkeeperInSmallArea: boolean;
  /** Band del portero en duelos GOAL. */
  goalkeeperSide?: MatchSide;
}

export function getDefendingSide(ballSide: MatchSide): MatchSide {
  return ballSide === "home" ? "away" : "home";
}

export function getGoalkeeperFromTeam(
  team: UserClub,
  format: MatchFormat,
): PlayerWithDetails | null {
  const posKey = getPositionKey(format);
  return team.roster.find((p) => p[posKey] === 1) ?? null;
}

export function isGoalkeeperSlot(player: Player, format: MatchFormat): boolean {
  return player[getPositionKey(format)] === 1;
}

export function detectDuelType(
  homePlayer: Player,
  awayPlayer: Player,
  format: MatchFormat,
): DuelType {
  const homeIsGk = isGoalkeeperSlot(homePlayer, format);
  const awayIsGk = isGoalkeeperSlot(awayPlayer, format);
  return homeIsGk !== awayIsGk ? "GOAL" : "FIELD";
}

/** Duelo regate/defensa en lugar de tiro/parada (portero fuera o portero con posesión en el área). */
export function isGoalkeeperFieldDuel(context: DuelContext): boolean {
  if (context.type !== "GOAL") return false;
  if (!context.goalkeeperInSmallArea) return true;
  return (
    context.goalkeeperSide != null && context.ballSide === context.goalkeeperSide
  );
}

export function isGoalkeeperDribbling(context: DuelContext): boolean {
  return (
    context.type === "GOAL" &&
    context.goalkeeperSide != null &&
    context.ballSide === context.goalkeeperSide
  );
}

export function getEffectiveDuelType(context: DuelContext): DuelType {
  return isGoalkeeperFieldDuel(context) ? "FIELD" : context.type;
}

export function shouldAttemptGoalkeeperSave(context: DuelContext): boolean {
  return context.goalkeeperInSmallArea;
}

export function getGoalkeeperSide(
  homePlayer: Player,
  awayPlayer: Player,
  format: MatchFormat,
): MatchSide {
  return isGoalkeeperSlot(homePlayer, format) ? "home" : "away";
}

export function resolveDuelContext(
  homePlayer: Player,
  awayPlayer: Player,
  format: MatchFormat,
  ballSide: MatchSide,
  inPenaltyArea: boolean,
  goalkeeperInSmallArea = true,
): DuelContext {
  const type = detectDuelType(homePlayer, awayPlayer, format);

  if (type === "GOAL") {
    return {
      type,
      ballSide,
      inPenaltyArea: false,
      goalkeeperInSmallArea,
      goalkeeperSide: getGoalkeeperSide(homePlayer, awayPlayer, format),
    };
  }

  return { type, ballSide, inPenaltyArea, goalkeeperInSmallArea };
}

export function getPlayerDuelRole(
  side: MatchSide,
  context: DuelContext,
  homePlayer: Player,
  awayPlayer: Player,
  format: MatchFormat,
): DuelRole {
  const player = side === "home" ? homePlayer : awayPlayer;
  const hasBall = side === context.ballSide;

  if (context.type === "GOAL") {
    if (isGoalkeeperFieldDuel(context)) {
      return hasBall ? "field_attacker" : "field_defender";
    }

    if (hasBall) return "shooter";

    return isGoalkeeperSlot(player, format) ? "goalkeeper" : "field_defender";
  }

  return hasBall ? "field_attacker" : "field_defender";
}

export function getDuelActionStarter(context: DuelContext): MatchSide {
  return context.ballSide;
}

export function getDuelTypeLabel(context: DuelContext | DuelType): string {
  if (typeof context === "string") {
    return context === "GOAL" ? "Duelo de portería" : "Duelo de campo";
  }

  if (isGoalkeeperFieldDuel(context)) {
    if (isGoalkeeperDribbling(context)) {
      return context.goalkeeperInSmallArea
        ? "Regate del portero (en el área)"
        : "Regate del portero (portero fuera)";
    }
    return "Regate vs defensa (portero fuera)";
  }

  return context.type === "GOAL" ? "Duelo de portería" : "Duelo de campo";
}

export function getDuelRoleLabel(role: DuelRole): string {
  switch (role) {
    case "field_attacker":
      return "Atacante";
    case "field_defender":
      return "Defensor";
    case "shooter":
      return "Tirador";
    case "goalkeeper":
      return "Portero";
  }
}
