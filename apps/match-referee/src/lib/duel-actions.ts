import type {
  ActionCategory,
  Coach,
  MoveType,
  Player,
  PlayerMoveWithProgress,
  PlayerWithDetails,
} from "@inazuma/shared";
import {
  applyFacilityCostMultiplier,
  applyWeatherToDuelStats,
  calculateNormalDuelGpCost,
  calculateWeightedStats,
  getEffectiveStats,
  getWeatherShootSuperTpExtra,
  normalizePlayerMoves,
  type WeatherCondition,
  type SportsCityState,
} from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import type { DuelContext, DuelRole } from "@/lib/duel-context";
import { isGoalkeeperSlot } from "@/lib/duel-context";
import { getGpCostMultiplierForPlayer, getTpCostMultiplierForPlayer } from "@/lib/match-facility";
import { getPositionKey } from "./roster-utils";

export type DuelActionOption = {
  id: ActionCategory;
  label: string;
  shortLabel: string;
  group: "ataque" | "defensa" | "portero";
};

export interface DuelActionPick {
  category: ActionCategory;
  moveId?: number;
  moveName?: string;
  shotDistance?: number;
}

const SUPER_ACTIONS = new Set<ActionCategory>([
  "DRIBBLE_SUPER",
  "BLOCK_SUPER",
  "SHOOT_SUPER",
  "CATCH_SUPER",
]);

const SHOT_ACTIONS = new Set<ActionCategory>([
  "SHOOT_NORMAL",
  "LOB_SHOT",
  "SHOOT_SUPER",
]);

const GOALKEEPER_ONLY_ACTIONS = new Set<ActionCategory>([
  "CATCH_NORMAL",
  "CATCH_SUPER",
  "PUNCH_NORMAL",
]);

const ROLE_ALLOWED_ACTIONS: Record<DuelRole, ActionCategory[]> = {
  field_attacker: ["FEINT_NORMAL", "DRIBBLE_NORMAL", "DRIBBLE_SUPER"],
  field_defender: ["BLOCK_NORMAL", "STEAL_NORMAL", "BLOCK_SUPER"],
  shooter: ["SHOOT_NORMAL", "LOB_SHOT", "SHOOT_SUPER"],
  goalkeeper: ["CATCH_NORMAL", "PUNCH_NORMAL", "CATCH_SUPER"],
};

const PENALTY_AREA_ATTACKER_ACTIONS: ActionCategory[] = [
  "SHOOT_NORMAL",
  "LOB_SHOT",
  "SHOOT_SUPER",
];

export const DUEL_ACTIONS: DuelActionOption[] = [
  { id: "FEINT_NORMAL", label: "Finta", shortLabel: "Finta", group: "ataque" },
  { id: "DRIBBLE_NORMAL", label: "Regate", shortLabel: "Regate", group: "ataque" },
  { id: "DRIBBLE_SUPER", label: "Supertécnica de Regate", shortLabel: "Reg. Súper", group: "ataque" },
  { id: "SHOOT_NORMAL", label: "Tiro Normal", shortLabel: "Tiro", group: "ataque" },
  { id: "LOB_SHOT", label: "Vaselina", shortLabel: "Vaselina", group: "ataque" },
  { id: "SHOOT_SUPER", label: "Supertécnica de Tiro", shortLabel: "Tiro Súper", group: "ataque" },
  { id: "BLOCK_NORMAL", label: "Carga", shortLabel: "Carga", group: "defensa" },
  { id: "STEAL_NORMAL", label: "Segada", shortLabel: "Segada", group: "defensa" },
  { id: "BLOCK_SUPER", label: "Supertécnica de Defensa", shortLabel: "Def. Súper", group: "defensa" },
  { id: "CATCH_NORMAL", label: "Atrape (Mano)", shortLabel: "Atrape", group: "portero" },
  { id: "PUNCH_NORMAL", label: "Despeje (Puño)", shortLabel: "Despeje", group: "portero" },
  { id: "CATCH_SUPER", label: "Supertécnica de Portero", shortLabel: "Par. Súper", group: "portero" },
];

export function isSuperAction(action: ActionCategory): boolean {
  return SUPER_ACTIONS.has(action);
}

export function isShotAction(action: ActionCategory): boolean {
  return SHOT_ACTIONS.has(action);
}

export function getMoveTypeForSuperAction(action: ActionCategory): MoveType | null {
  switch (action) {
    case "DRIBBLE_SUPER":
      return "DRIBBLE";
    case "BLOCK_SUPER":
      return "BLOCK";
    case "SHOOT_SUPER":
      return "SHOOT";
    case "CATCH_SUPER":
      return "CATCH";
    default:
      return null;
  }
}

export function getPlayerSuperMoves(
  player: { level?: number; moves?: unknown[] },
  action: ActionCategory,
): PlayerMoveWithProgress[] {
  const moveType = getMoveTypeForSuperAction(action);
  if (!moveType) return [];

  const playerLevel = Number(player.level ?? 1);
  const moves = normalizePlayerMoves(player);

  return moves.filter(
    (move) =>
      move.type.toUpperCase() === moveType &&
      playerLevel >= (move.unlockLevel ?? 1),
  );
}

function getAllowedActionIds(role: DuelRole, context: DuelContext): ActionCategory[] {
  const base = [...ROLE_ALLOWED_ACTIONS[role]];
  if (role === "field_attacker" && context.inPenaltyArea) {
    base.push(...PENALTY_AREA_ATTACKER_ACTIONS);
  }
  return base;
}

export function isActionAllowedForPlayer(
  action: ActionCategory,
  player: Player,
  format: MatchFormat,
): boolean {
  if (GOALKEEPER_ONLY_ACTIONS.has(action)) {
    return isGoalkeeperSlot(player, format);
  }
  return true;
}

export function getAvailableDuelActions(
  player: Player,
  format: MatchFormat,
  role: DuelRole,
  context: DuelContext,
): DuelActionOption[] {
  const allowed = new Set(getAllowedActionIds(role, context));
  return DUEL_ACTIONS.filter(
    (a) => allowed.has(a.id) && isActionAllowedForPlayer(a.id, player, format),
  );
}

export function getActionLabel(action: ActionCategory): string {
  return DUEL_ACTIONS.find((a) => a.id === action)?.label ?? action;
}

export function formatActionPickSummary(pick: DuelActionPick): string {
  let label = getActionLabel(pick.category);
  if (pick.moveName) label += ` — ${pick.moveName}`;
  if (pick.shotDistance != null) label += ` (${pick.shotDistance} franjas)`;
  return label;
}

export function getMoveTpCost(
  move: PlayerMoveWithProgress & { move?: { tpCost?: number } },
): number {
  if (typeof move.tpCost === "number" && Number.isFinite(move.tpCost)) {
    return move.tpCost;
  }

  const nested = move.move?.tpCost;
  if (typeof nested === "number" && Number.isFinite(nested)) {
    return nested;
  }

  return 0;
}

export function getDuelActionResourceCost(
  pick: DuelActionPick,
  player: PlayerWithDetails | Player,
  weather: WeatherCondition = "clear",
  coach?: Coach | null,
  options?: {
    side?: "home" | "away";
    format?: MatchFormat;
    homeFacilities?: SportsCityState;
    awayFacilities?: SportsCityState;
  },
): { tp: number; gp: number } {
  if (isSuperAction(pick.category) && pick.moveId != null) {
    const move = normalizePlayerMoves(player).find((m) => m.id === pick.moveId);
    const baseTp = move ? getMoveTpCost(move) : 0;
    const snowExtra = pick.category === "SHOOT_SUPER" ? getWeatherShootSuperTpExtra(weather) : 0;
    let tp = baseTp + snowExtra;

    if (options?.side && options.format && options.homeFacilities && options.awayFacilities) {
      const tpMultiplier = getTpCostMultiplierForPlayer(
        options.side,
        options.format,
        options.homeFacilities,
        options.awayFacilities,
      );
      tp = applyFacilityCostMultiplier(tp, tpMultiplier);
    }

    return { tp, gp: 0 };
  }

  const stats = getEffectiveStats(player, coach);
  const duelStats = applyWeatherToDuelStats(
    {
      kick: stats.kick,
      body: stats.body,
      control: stats.control,
      guard: stats.guard,
      speed: stats.speed,
      stamina: stats.stamina,
      guts: stats.guts,
    },
    weather,
  );
  const eStats = calculateWeightedStats(duelStats, pick.category);
  let gp = calculateNormalDuelGpCost(eStats);

  if (options?.side && options.format && options.homeFacilities && options.awayFacilities) {
    const gpMultiplier = getGpCostMultiplierForPlayer(
      options.side,
      options.format,
      options.homeFacilities,
      options.awayFacilities,
    );
    gp = applyFacilityCostMultiplier(gp, gpMultiplier);
  }

  return { tp: 0, gp };
}
