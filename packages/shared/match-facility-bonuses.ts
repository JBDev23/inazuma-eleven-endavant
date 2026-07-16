import { ELEMENT_LABELS, getElementMultiplier, normalizeElement, type NormalizedElement } from './match-engine/elements';
import {
  applyWeatherPowerModifier,
  getWeatherPowerMultiplier,
  type WeatherCondition,
} from './match-engine/weather';
import type { ActionCategory } from './match-engine/types';
import type { DuelStats } from './match-engine/types';
import type { MatchFormatKey, MatchXpResult, PlayerMatchXpBreakdown } from './match-xp.utils';
import { addExperience } from './xp.utils';
import {
  facilitiesToState,
  type ClubFacilityRecord,
  type FacilityId,
  type FacilityLevel,
  type SportsCityState,
} from './sports-city';

export type MatchFacilityAbilityId =
  | 'NULLIFY_FOUL'
  | 'REVEAL_OPPONENT_COMMAND'
  | 'REPEAT_COIN_TOSS';

export const MATCH_FACILITY_ABILITY_LABELS: Record<MatchFacilityAbilityId, string> = {
  NULLIFY_FOUL: 'Anular falta (Laboratorio Nv.1)',
  REVEAL_OPPONENT_COMMAND: 'Espiar comando (Banquillos Nv.3)',
  REPEAT_COIN_TOSS: 'Registrar chapa repetida (Entrenamiento Nv.3)',
};

export type FacilityDuelParticipantBoosts = {
  statMultiplier: number;
  ignoreElementalDisadvantage: boolean;
  repeatedSuperPenalty: number;
};

export type FacilityDuelContext = {
  isOfficialMatch: boolean;
  pitchElement: string | null;
  homeFacilities: SportsCityState;
  awayFacilities: SportsCityState;
  homeHasRetractableRoof: boolean;
  homeUsedSuperMoves: Set<string>;
  awayUsedSuperMoves: Set<string>;
};

export type MatchFacilityState = {
  pitchElement: string | null;
  subBoostTurns: Record<number, number>;
  usedAbilities: Partial<Record<MatchFacilityAbilityId, 'home' | 'away'>>;
  homeUsedSuperMoves: string[];
  awayUsedSuperMoves: string[];
  clinicGpRecoveryUsed: Partial<Record<'home' | 'away', boolean>>;
};

export function createEmptyMatchFacilityState(): MatchFacilityState {
  return {
    pitchElement: null,
    subBoostTurns: {},
    usedAbilities: {},
    homeUsedSuperMoves: [],
    awayUsedSuperMoves: [],
    clinicGpRecoveryUsed: {},
  };
}

export function isOfficialMatch(format: MatchFormatKey): boolean {
  return format === '11v11';
}

export function resolveClubFacilities(
  facilities?: ClubFacilityRecord[],
): SportsCityState {
  if (!facilities?.length) {
    return facilitiesToState([]);
  }
  return facilitiesToState(facilities);
}

export function getFacilityLevel(
  state: SportsCityState,
  facilityId: FacilityId,
): FacilityLevel {
  return state[facilityId];
}

function multiplyStats(stats: DuelStats, multiplier: number): DuelStats {
  if (multiplier === 1) return stats;
  return {
    kick: Math.round(stats.kick * multiplier),
    body: Math.round(stats.body * multiplier),
    control: Math.round(stats.control * multiplier),
    guard: Math.round(stats.guard * multiplier),
    speed: Math.round(stats.speed * multiplier),
    stamina: Math.round(stats.stamina * multiplier),
    guts: Math.round(stats.guts * multiplier),
  };
}

function applyGutsMultiplier(stats: DuelStats, multiplier: number): DuelStats {
  if (multiplier === 1) return stats;
  return { ...stats, guts: Math.round(stats.guts * multiplier) };
}

/** Elemento del terreno elegido por el club (solo campo Nv.2+). */
export function getClubPitchElement(
  facilities?: ClubFacilityRecord[],
): string | null {
  if (!facilities?.length) return null;

  const field = facilities.find((f) => f.facilityId === 'field');
  if (!field || field.level < 2) return null;

  return normalizeElement(field.pitchElement);
}

export function buildFacilityDuelContext(params: {
  format: MatchFormatKey;
  pitchElement: string | null;
  homeFacilities: SportsCityState;
  awayFacilities: SportsCityState;
  homeUsedSuperMoves: string[];
  awayUsedSuperMoves: string[];
}): FacilityDuelContext | null {
  if (!isOfficialMatch(params.format)) return null;

  return {
    isOfficialMatch: true,
    pitchElement: params.pitchElement,
    homeFacilities: params.homeFacilities,
    awayFacilities: params.awayFacilities,
    homeHasRetractableRoof: params.homeFacilities.field >= 3,
    homeUsedSuperMoves: new Set(params.homeUsedSuperMoves),
    awayUsedSuperMoves: new Set(params.awayUsedSuperMoves),
  };
}

export function getAvailableMatchAbilities(
  side: 'home' | 'away',
  facilities: SportsCityState,
  usedAbilities: MatchFacilityState['usedAbilities'],
  context: 'any' | 'foul' | 'opponent_pick' | 'coin_toss',
): MatchFacilityAbilityId[] {
  const available: MatchFacilityAbilityId[] = [];

  if (
    facilities.lab >= 1 &&
    !usedAbilities.NULLIFY_FOUL &&
    context === 'foul'
  ) {
    available.push('NULLIFY_FOUL');
  }

  if (
    facilities.benches >= 3 &&
    !usedAbilities.REVEAL_OPPONENT_COMMAND &&
    (context === 'opponent_pick' || context === 'any')
  ) {
    available.push('REVEAL_OPPONENT_COMMAND');
  }

  if (
    facilities.training >= 3 &&
    !usedAbilities.REPEAT_COIN_TOSS &&
    context === 'any'
  ) {
    available.push('REPEAT_COIN_TOSS');
  }

  return available;
}

export function getFacilityDuelParticipantBoosts(
  side: 'home' | 'away',
  playerElement: string,
  context: FacilityDuelContext,
  subBoostMultiplier: number,
): FacilityDuelParticipantBoosts {
  const ownFacilities =
    side === 'home' ? context.homeFacilities : context.awayFacilities;
  const opponentFacilities =
    side === 'home' ? context.awayFacilities : context.homeFacilities;

  let statMultiplier = subBoostMultiplier;

  if (
    side === 'home' &&
    context.homeFacilities.field >= 2 &&
    context.pitchElement &&
    normalizeElement(playerElement) === context.pitchElement
  ) {
    statMultiplier *= 1.05;
  }

  return {
    statMultiplier,
    ignoreElementalDisadvantage: ownFacilities.lab >= 2,
    repeatedSuperPenalty:
      opponentFacilities.lab >= 3 ? 0.9 : 1,
  };
}

export function applyFacilityGutsModifiers(
  stats: DuelStats,
  side: 'home' | 'away',
  context: FacilityDuelContext,
): DuelStats {
  let result = stats;

  if (side === 'home' && context.homeFacilities.stands >= 1) {
    result = applyGutsMultiplier(result, 1.05);
  }

  if (side === 'away' && context.homeFacilities.stands >= 3) {
    result = applyGutsMultiplier(result, 0.9);
  }

  return result;
}

export function applyFacilityStatMultiplier(
  stats: DuelStats,
  multiplier: number,
): DuelStats {
  return multiplyStats(stats, multiplier);
}

export function getFacilityElementMultiplier(
  actorElement: string,
  opponentElement: string,
  boosts: FacilityDuelParticipantBoosts,
): number {
  const base = getElementMultiplier(actorElement, opponentElement);
  if (boosts.ignoreElementalDisadvantage && base < 1) {
    return 1;
  }
  return base;
}

/** Cancela penalizaciones climáticas cuando el estadio local tiene techo retráctil. */
export function applyFacilityWeatherPowerModifier(
  total: number,
  action: ActionCategory,
  weather: WeatherCondition,
  context: FacilityDuelContext,
  move?: { element: string; secondaryType?: string | null },
): number {
  if (!context.homeHasRetractableRoof || weather === 'clear' || total <= 0) {
    return total;
  }

  const penalized = applyWeatherPowerModifier(total, action, weather, move);
  if (penalized >= total) return total;
  return total;
}

export function getFacilityWeatherPowerMultiplier(
  action: ActionCategory,
  weather: WeatherCondition,
  context: FacilityDuelContext,
  move?: { element: string; secondaryType?: string | null },
): number {
  if (!context.homeHasRetractableRoof || weather === 'clear') return 1;

  const full = getWeatherPowerMultiplier(action, weather, move);
  if (full >= 1) return full;
  return 1;
}

/** Aplica un multiplicador de coste sin anular costes base de 1 (p. ej. 20% menos → 1 sigue siendo 1). */
export function applyFacilityCostMultiplier(baseCost: number, multiplier: number): number {
  if (baseCost <= 0) return 0;
  if (multiplier >= 1) return Math.floor(baseCost * multiplier);
  return Math.max(1, Math.floor(baseCost * multiplier));
}

export function getFacilityGpCostMultiplier(
  side: 'home' | 'away',
  facilities: SportsCityState,
  isOfficialMatch: boolean,
): number {
  if (!isOfficialMatch || facilities.clinic < 1) return 1;
  return 0.8;
}

export function getFacilityTpCostMultiplier(
  side: 'home' | 'away',
  facilities: SportsCityState,
  isOfficialMatch: boolean,
): number {
  if (!isOfficialMatch || facilities.training < 2) return 1;
  return 0.9;
}

export function applyHalftimeFacilityRecovery(
  current: { gp: number; tp: number },
  max: { gp: number; tp: number },
  side: 'home' | 'away',
  homeFacilities: SportsCityState,
  isOfficial: boolean,
): { gp: number; tp: number } {
  if (!isOfficial) return current;

  const standsLevel =
    side === 'home' ? homeFacilities.stands : 0;
  if (standsLevel < 2) return current;

  const restore = (value: number, cap: number) =>
    Math.min(cap, value + Math.floor(cap * 0.2));

  return {
    gp: restore(current.gp, max.gp),
    tp: restore(current.tp, max.tp),
  };
}

export function getClinicGpRecoveryAmount(maxGp: number): number {
  return Math.max(1, Math.floor(maxGp * 0.3));
}

export const BENCH_XP_SHARE_RATIO = 0.35;
export const SUB_ENTRY_BOOST_TURNS = 2;
export const SUB_ENTRY_STAT_MULTIPLIER = 1.15;

export interface BenchXpGrant {
  playerId: number;
  playerName: string;
  side: 'home' | 'away';
  xp: number;
}

export function computeBenchXpGrants(params: {
  format: MatchFormatKey;
  matchXp: MatchXpResult;
  homeBenchPlayers: Array<{ playerId: number; playerName: string }>;
  awayBenchPlayers: Array<{ playerId: number; playerName: string }>;
  homeFacilities: SportsCityState;
  awayFacilities: SportsCityState;
}): BenchXpGrant[] {
  if (!isOfficialMatch(params.format)) return [];

  const grants: BenchXpGrant[] = [];

  const processSide = (
    side: 'home' | 'away',
    benchPlayers: Array<{ playerId: number; playerName: string }>,
    hasBenchBonus: boolean,
  ) => {
    if (!hasBenchBonus || benchPlayers.length === 0) return;

    const played = params.matchXp.players.filter((p) => p.side === side);
    if (played.length === 0) return;

    const averageXp =
      played.reduce((sum, p) => sum + p.totalXp, 0) / played.length;
    const minPlayedXp = Math.min(...played.map((p) => p.totalXp));
    const benchXp = Math.min(
      Math.floor(averageXp * BENCH_XP_SHARE_RATIO),
      minPlayedXp,
    );

    if (benchXp <= 0) return;

    for (const bench of benchPlayers) {
      grants.push({
        playerId: bench.playerId,
        playerName: bench.playerName,
        side,
        xp: benchXp,
      });
    }
  };

  processSide(
    'home',
    params.homeBenchPlayers,
    params.homeFacilities.benches >= 1,
  );
  processSide(
    'away',
    params.awayBenchPlayers,
    params.awayFacilities.benches >= 1,
  );

  return grants;
}

export function applyShopWinnerXpBonus(
  players: PlayerMatchXpBreakdown[],
  winnerSide: 'home' | 'away' | null,
  winnerFacilities: SportsCityState,
  format: MatchFormatKey,
): PlayerMatchXpBreakdown[] {
  if (
    !winnerSide ||
    !isOfficialMatch(format) ||
    winnerFacilities.shop < 1
  ) {
    return players;
  }

  return players.map((player) => {
    if (player.side !== winnerSide) return player;
    const boostedTotal = Math.floor(player.totalXp * 1.15);
    const bonusXp = boostedTotal - player.floorXp;
    const progression = addExperience(
      player.previousLevel,
      player.previousExperience,
      boostedTotal,
    );
    return {
      ...player,
      totalXp: boostedTotal,
      bonusXp,
      newLevel: progression.level,
      newXp: progression.experience,
      levelsGained: progression.levelsGained,
      newExperience: progression.experience,
      leveledUp: progression.leveledUp,
    };
  });
}

export function getShopWinnerYensBonus(
  baseYens: number,
  winnerFacilities: SportsCityState,
  format: MatchFormatKey,
): number {
  if (!isOfficialMatch(format) || winnerFacilities.shop < 1) {
    return baseYens;
  }
  return Math.floor(baseYens * 1.15);
}

export function getTrainingPeXpPerPoint(
  baseXpPerPe: number,
  facilities: SportsCityState,
): number {
  if (facilities.training < 1) return baseXpPerPe;
  return Math.floor(baseXpPerPe * 1.1);
}

export function tickSubBoostTurns(
  subBoostTurns: Record<number, number>,
): Record<number, number> {
  const next: Record<number, number> = {};
  for (const [playerId, turns] of Object.entries(subBoostTurns)) {
    if (turns > 1) {
      next[Number(playerId)] = turns - 1;
    }
  }
  return next;
}

export function getSubBoostMultiplier(
  playerId: number,
  subBoostTurns: Record<number, number>,
): number {
  return (subBoostTurns[playerId] ?? 0) > 0 ? SUB_ENTRY_STAT_MULTIPLIER : 1;
}

export function registerSubEntryBoost(playerId: number): Record<number, number> {
  return { [playerId]: SUB_ENTRY_BOOST_TURNS };
}

export type PlayerMatchModifierIcon =
  | 'sub_boost'
  | 'pitch_element'
  | 'guts_boost'
  | 'guts_nerf'
  | 'lab_shield';

export type PlayerMatchModifier = {
  id: string;
  icon: PlayerMatchModifierIcon;
  shortLabel: string;
  title: string;
  tone: 'positive' | 'negative' | 'neutral';
  turnsRemaining?: number;
};

/** Modificadores activos de estadio visibles para un jugador en partido oficial. */
export function getPlayerMatchModifiers(params: {
  playerId: number;
  playerElement: string;
  side: 'home' | 'away';
  format: MatchFormatKey;
  matchFacilityState: MatchFacilityState;
  homeFacilities: SportsCityState;
  awayFacilities: SportsCityState;
}): PlayerMatchModifier[] {
  if (!isOfficialMatch(params.format)) return [];

  const modifiers: PlayerMatchModifier[] = [];
  const ownFacilities =
    params.side === 'home' ? params.homeFacilities : params.awayFacilities;
  const subTurns = params.matchFacilityState.subBoostTurns[params.playerId] ?? 0;

  if (subTurns > 0 && ownFacilities.benches >= 2) {
    modifiers.push({
      id: 'sub_boost',
      icon: 'sub_boost',
      shortLabel: '+15%',
      title: `Entrada en caliente (+15% stats, ${subTurns} turno${subTurns > 1 ? 's' : ''} restante${subTurns > 1 ? 's' : ''})`,
      tone: 'positive',
      turnsRemaining: subTurns,
    });
  }

  const pitchElement = params.matchFacilityState.pitchElement;
  if (
    params.side === 'home' &&
    params.homeFacilities.field >= 2 &&
    pitchElement &&
    normalizeElement(params.playerElement) === pitchElement
  ) {
    modifiers.push({
      id: 'pitch_element',
      icon: 'pitch_element',
      shortLabel: '+5%',
      title: `Terreno elemental (${ELEMENT_LABELS[pitchElement as NormalizedElement] ?? pitchElement}, +5% stats)`,
      tone: 'positive',
    });
  }

  if (params.side === 'home' && params.homeFacilities.stands >= 1) {
    modifiers.push({
      id: 'guts_home',
      icon: 'guts_boost',
      shortLabel: 'Valor+',
      title: 'Afición local (+5% valor)',
      tone: 'positive',
    });
  }

  if (params.side === 'away' && params.homeFacilities.stands >= 3) {
    modifiers.push({
      id: 'guts_away',
      icon: 'guts_nerf',
      shortLabel: 'Valor−',
      title: 'Ambiente hostil (−10% valor)',
      tone: 'negative',
    });
  }

  if (ownFacilities.lab >= 2) {
    modifiers.push({
      id: 'lab_shield',
      icon: 'lab_shield',
      shortLabel: 'Elem.',
      title: 'Laboratorio: ignora desventaja elemental',
      tone: 'neutral',
    });
  }

  return modifiers;
}

export function hasSubEntryFacilityBoost(
  side: 'home' | 'away',
  format: MatchFormatKey,
  homeFacilities: SportsCityState,
  awayFacilities: SportsCityState,
): boolean {
  if (!isOfficialMatch(format)) return false;
  const facilities = side === 'home' ? homeFacilities : awayFacilities;
  return facilities.benches >= 2;
}
