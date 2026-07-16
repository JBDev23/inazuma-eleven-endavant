import {
  applyConsumableRestore,
  isRestoreConsumable,
  getFacilityConsumableEffectValue,
  isOfficialMatch,
  type ClubConsumableWithDetails,
  type ConsumableUsageRecord,
  type UserClub,
} from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import { getStarterPlayers } from "@/lib/match-substitutions";
import { getTeamFacilities } from "@/lib/match-facility";
import type { PlayerMatchResources } from "@/lib/match-player-resources";

export function hasPlayerUsedConsumable(
  usages: ConsumableUsageRecord[],
  playerId: number,
): boolean {
  return usages.some((usage) => usage.playerId === playerId);
}

export function isPlayerOnField(
  team: UserClub,
  playerId: number,
  format: MatchFormat,
): boolean {
  return getStarterPlayers(team, format).some((player) => player.id === playerId);
}

export function getEffectiveConsumableQuantity(
  entry: ClubConsumableWithDetails,
  clubId: string,
  usages: ConsumableUsageRecord[],
): number {
  const used = usages.filter(
    (usage) => usage.clubId === clubId && usage.consumableId === entry.consumableId,
  ).length;
  return Math.max(0, entry.quantity - used);
}

export function teamHasAvailableConsumables(
  team: UserClub,
  format: MatchFormat,
  usages: ConsumableUsageRecord[],
): boolean {
  return getStarterPlayers(team, format).some(
    (player) => getAvailableConsumablesForPlayer(team, player.id, usages).length > 0,
  );
}

export function getAvailableConsumablesForPlayer(
  team: UserClub,
  playerId: number,
  usages: ConsumableUsageRecord[],
): Array<ClubConsumableWithDetails & { effectiveQuantity: number }> {
  if (hasPlayerUsedConsumable(usages, playerId)) return [];

  return (team.consumables ?? [])
    .map((entry) => ({
      ...entry,
      effectiveQuantity: getEffectiveConsumableQuantity(entry, team.id, usages),
    }))
    .filter(
      (entry) => entry.effectiveQuantity > 0 && isRestoreConsumable(entry.consumable),
    );
}

export function applyConsumableDecrementsToTeam(
  team: UserClub,
  usages: ConsumableUsageRecord[],
): UserClub {
  const clubUsages = usages.filter((usage) => usage.clubId === team.id);
  if (clubUsages.length === 0) return team;

  const counts = new Map<number, number>();
  for (const usage of clubUsages) {
    counts.set(usage.consumableId, (counts.get(usage.consumableId) ?? 0) + 1);
  }

  const consumables = (team.consumables ?? [])
    .map((entry) => ({
      ...entry,
      quantity: entry.quantity - (counts.get(entry.consumableId) ?? 0),
    }))
    .filter((entry) => entry.quantity > 0);

  return { ...team, consumables };
}

export function applyConsumableToPlayerResources(
  current: PlayerMatchResources,
  max: PlayerMatchResources,
  effect: Parameters<typeof applyConsumableRestore>[2],
  effectValue: number,
): PlayerMatchResources {
  return applyConsumableRestore(current, max, effect, effectValue);
}

export function resolveConsumableEffectValue(
  team: UserClub,
  baseEffectValue: number,
  format: MatchFormat,
): number {
  return getFacilityConsumableEffectValue(
    baseEffectValue,
    getTeamFacilities(team),
    isOfficialMatch(format),
  );
}

export function formatConsumableEffectForMatch(
  consumable: { effect: string; effectValue: number },
  team: UserClub,
  format: MatchFormat,
): string {
  const effective = resolveConsumableEffectValue(team, consumable.effectValue, format);
  if (consumable.effect === "RESTORE_GP_PERCENT") return `+${effective}% GP`;
  if (consumable.effect === "RESTORE_TP_PERCENT") return `+${effective}% TP`;
  return `+${effective}%`;
}
