import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  type DuelEffects,
  UserClub,
  getActiveCoach,
  getEffectiveStats,
  applyHalftimeFacilityRecovery,
  getClinicGpRecoveryAmount,
  isOfficialMatch,
  registerSubEntryBoost,
  tickSubBoostTurns,
  getFacilityConsumableEffectValue,
  type MatchFacilityAbilityId,
  createEmptyBurningPhaseState,
  createEmptyBurningPhaseUsedState,
  adjustBurningPhaseOnRewind,
  hasBurningPhaseBeenUsed,
  isSideInBurningPhase,
  normalizeBurningPhaseState,
  inferBurningPhaseUsedFromLegacyState,
  type BurningPhaseState,
  type BurningPhaseUsedState,
  type MoveUsageRecord,
} from "@inazuma/shared";
import { MatchFormat } from "@/components/MatchFormatSelector";
import type { TimeOfDay } from "@/components/TimeOfDaySelector";
import type { WeatherCondition } from "@/components/WeatherSelector";
import {
  DEFAULT_TIME_OF_DAY,
  DEFAULT_WEATHER,
} from "@/lib/match-environment";
import type { MatchSide } from "@/lib/match-turn";
import { getOppositeKickoffSide } from "@/lib/match-kickoff";
import {
  buildPlayerResourcesFromTeams,
  canAffordResources,
  drainFieldGpForTurnAdvance,
  findPlayerInTeams,
  getCoachForPlayer,
  mergeMissingPlayerResources,
  normalizePlayerResourcesMap,
  resolvePlayerResources,
  findPlayerTeamSide,
  type PlayerMatchResources,
  type PlayerResourcesMap,
} from "@/lib/match-player-resources";
import {
  createEmptyMatchStats,
  createEmptyPlayerParticipation,
  type DuelRecord,
  type GoalEvent,
  type MatchStats,
} from "@/lib/match-stats";
import {
  applyPlayerMoveUsageToRoster,
} from "@/lib/match-move-progress";
import { creditTurnParticipation } from "@/lib/match-participation";
import {
  applySubstitutionToTeam,
  canRequestHalftimeSubstitution,
  canRequestSubstitution,
  createEmptySubstitutionState,
  getStarterPlayers,
  updateSubbedOutIdsAfterHalftimeSub,
  type AppliedSubstitution,
  type SubstitutionState,
} from "@/lib/match-substitutions";
import {
  applySingleExhaustionSubstitution,
  findExhaustedStarters,
  type ExhaustionSubstitutionRequest,
} from "@/lib/match-exhaustion";
import { pickRandomMatchBackground } from "@/lib/match-background";
import {
  applyConsumableToPlayerResources,
  getAvailableConsumablesForPlayer,
  hasPlayerUsedConsumable,
  isPlayerOnField,
} from "@/lib/match-consumables";
import {
  DEFAULT_TOTAL_TURNS,
  getMinRewindTurn,
  normalizeTotalTurns,
  shouldStartPenaltyShootout,
} from "@/lib/match-turns";
import {
  createInitialPenaltyShootout,
  normalizePenaltyShooters,
  recordPenaltyShot,
  type PenaltyShootoutState,
  type PenaltyShotOutcome,
} from "@/lib/penalty-shootout";
import {
  buildInitialMatchFacilityState,
  createEmptyMatchFacilityState,
  getTeamFacilities,
  type MatchFacilityState,
} from "@/lib/match-facility";

export type MatchStatus = "SETUP" | "PLAYING" | "FINISHED";

interface MatchState {
  homeTeam: UserClub | null;
  awayTeam: UserClub | null;
  homeScore: number;
  awayScore: number;
  currentTurn: number;
  matchStatus: MatchStatus;
  matchFormat: MatchFormat;
  timeOfDay: TimeOfDay;
  weather: WeatherCondition;
  matchBackgroundIndex: number;
  ballPossession: MatchSide;
  firstHalfKickoffSide: MatchSide | null;
  kickoffResolved: boolean;
  pitchSwapped: boolean;
  totalTurns: number;
  penaltyShootoutEnabled: boolean;
  penaltyShootout: PenaltyShootoutState | null;
  halfTimeCompleted: boolean;
  playerResources: PlayerResourcesMap;
  matchStats: MatchStats;
  substitutions: SubstitutionState;
  matchFacilityState: MatchFacilityState;
  burningPhaseActive: BurningPhaseState;
  burningPhaseUsed: BurningPhaseUsedState;
  setTeams: (homeTeam: UserClub, awayTeam: UserClub) => void;
  updateTeam: (side: "home" | "away", team: UserClub) => void;
  setMatchFormat: (format: MatchFormat) => void;
  setTimeOfDay: (timeOfDay: TimeOfDay) => void;
  setWeather: (weather: WeatherCondition) => void;
  setTotalTurns: (turns: number) => void;
  setPenaltyShootoutEnabled: (enabled: boolean) => void;
  setPenaltyShootoutLineup: (
    side: "home" | "away",
    shooters: number[],
    goalkeeperId: number,
  ) => void;
  confirmPenaltyShootoutSetup: (side: "home" | "away") => void;
  completePenaltyCoinToss: (firstShooterSide: MatchSide) => void;
  recordPenaltyShotOutcome: (outcome: PenaltyShotOutcome, viaDuel?: boolean) => void;
  reopenPenaltyShootoutSetup: (side: "home" | "away") => void;
  setBallPossession: (side: MatchSide) => void;
  completeKickoff: (ballPossession: MatchSide, pitchSwapped: boolean) => void;
  completeHalfTime: () => void;
  startMatch: () => void;
  addGoal: (
    team: "home" | "away",
    amount?: number,
    scorer?: { playerId: number; playerName: string },
  ) => void;
  nextTurn: () => void;
  prevTurn: () => void;
  applyDuelEffects: (effects: DuelEffects) => void;
  recordDuel: (duel: DuelRecord) => void;
  resetMatch: () => void;
  restartMatch: () => void;
  endMatch: () => void;
  getPlayerResources: (playerId: number) => PlayerMatchResources | null;
  spendPlayerResources: (playerId: number, cost: PlayerMatchResources) => boolean;
  restorePlayerResources: (snapshot: PlayerResourcesMap) => void;
  ensurePlayerResources: () => void;
  creditCurrentTurnParticipation: () => void;
  requestSubstitution: (
    side: "home" | "away",
    outPlayerId: number,
    inPlayerId: number,
  ) => boolean;
  cancelPendingSubstitution: (side: "home" | "away") => void;
  applyPendingSubstitutions: () => AppliedSubstitution[];
  findExhaustedPlayers: () => ExhaustionSubstitutionRequest[];
  applyExhaustionSubstitution: (
    side: "home" | "away",
    outPlayerId: number,
    inPlayerId: number,
  ) => AppliedSubstitution | null;
  applyHalftimeSubstitution: (
    side: "home" | "away",
    outPlayerId: number,
    inPlayerId: number,
  ) => AppliedSubstitution | null;
  useConsumableOnPlayer: (
    side: "home" | "away",
    playerId: number,
    consumableId: number,
  ) => { success: true } | { success: false; error: string };
  useMatchFacilityAbility: (
    side: "home" | "away",
    abilityId: MatchFacilityAbilityId,
  ) => { success: true } | { success: false; error: string };
  recordSuperMoveUsage: (side: "home" | "away", moveName: string) => void;
  recordMoveUsage: (usage: Omit<MoveUsageRecord, "turn"> & { turn?: number }) => void;
  applyClinicGpRecoveryIfNeeded: (
    side: "home" | "away",
    playerId: number,
  ) => void;
  activateBurningPhase: (
    side: "home" | "away",
  ) => { success: true } | { success: false; error: string };
}

function buildTurnAdvanceStats(state: MatchState) {
  const side = state.ballPossession;
  const newTurn = state.currentTurn + 1;
  const matchStats: MatchStats = {
    ...state.matchStats,
    possessionTurns: {
      ...state.matchStats.possessionTurns,
      [side]: state.matchStats.possessionTurns[side] + 1,
    },
    turnsPlayed: state.matchStats.turnsPlayed + 1,
  };

  return { newTurn, matchStats };
}

function applyClinicRecoveryAfterGpDrain(state: MatchState): Partial<MatchState> {
  if (!state.homeTeam || !state.awayTeam || !isOfficialMatch(state.matchFormat)) {
    return {};
  }

  const map = normalizePlayerResourcesMap(state.playerResources);
  const clinicGpRecoveryUsed = { ...state.matchFacilityState.clinicGpRecoveryUsed };
  let changed = false;

  const scanTeam = (team: UserClub, side: "home" | "away") => {
    if (getTeamFacilities(team).clinic < 3 || clinicGpRecoveryUsed[side]) return;

    const coach = getActiveCoach(team);
    for (const player of getStarterPlayers(team, state.matchFormat)) {
      const resources = resolvePlayerResources(map, player, coach);
      if (resources.gp > 0) continue;

      map[player.id] = {
        ...resources,
        gp: getClinicGpRecoveryAmount(getEffectiveStats(player, coach).gp),
      };
      clinicGpRecoveryUsed[side] = true;
      changed = true;
      break;
    }
  };

  scanTeam(state.homeTeam, "home");
  scanTeam(state.awayTeam, "away");

  if (!changed) return {};

  return {
    playerResources: map,
    matchFacilityState: {
      ...state.matchFacilityState,
      clinicGpRecoveryUsed,
    },
  };
}

function withTurnAdvanceAndFieldGpDrain(
  state: MatchState,
  turnAdvance: Partial<MatchState>,
): Partial<MatchState> {
  const homeFacilities = getTeamFacilities(state.homeTeam);
  const awayFacilities = getTeamFacilities(state.awayTeam);

  const drained = {
    ...turnAdvance,
    playerResources: drainFieldGpForTurnAdvance(
      state.playerResources,
      state.homeTeam,
      state.awayTeam,
      state.matchFormat,
      state.weather,
      homeFacilities,
      awayFacilities,
    ),
    matchFacilityState: {
      ...state.matchFacilityState,
      subBoostTurns: tickSubBoostTurns(state.matchFacilityState.subBoostTurns),
    },
  };

  const clinicRecovery = applyClinicRecoveryAfterGpDrain({
    ...state,
    ...drained,
  } as MatchState);

  return { ...drained, ...clinicRecovery };
}

function applySubEntryBoostToFacilityState(
  state: MatchFacilityState,
  playerId: number,
  side: "home" | "away",
  homeTeam: UserClub,
  awayTeam: UserClub,
  format: MatchFormat,
): MatchFacilityState {
  const facilities = getTeamFacilities(side === "home" ? homeTeam : awayTeam);
  if (!isOfficialMatch(format) || facilities.benches < 2) {
    return state;
  }

  return {
    ...state,
    subBoostTurns: {
      ...state.subBoostTurns,
      ...registerSubEntryBoost(playerId),
    },
  };
}

function applyHalftimeResourceRecovery(state: MatchState): PlayerResourcesMap {
  if (!state.homeTeam || !state.awayTeam || !isOfficialMatch(state.matchFormat)) {
    return normalizePlayerResourcesMap(state.playerResources);
  }

  const homeFacilities = getTeamFacilities(state.homeTeam);
  const awayFacilities = getTeamFacilities(state.awayTeam);
  const map = { ...normalizePlayerResourcesMap(state.playerResources) };

  const recoverTeam = (team: UserClub, side: "home" | "away") => {
    const coach = getActiveCoach(team);
    for (const player of getStarterPlayers(team, state.matchFormat)) {
      const stats = getEffectiveStats(player, coach);
      const max = { gp: stats.gp, tp: stats.tp };
      const current = map[player.id] ?? max;
      map[player.id] = applyHalftimeFacilityRecovery(
        current,
        max,
        side,
        homeFacilities,
        true,
      );
    }
  };

  recoverTeam(state.homeTeam, "home");
  recoverTeam(state.awayTeam, "away");

  return map;
}

function buildFinishedMatchState(
  matchStats: MatchStats,
  extra: Partial<MatchState> = {},
): Partial<MatchState> {
  return {
    matchStatus: "FINISHED",
    matchStats: {
      ...matchStats,
      finishedAt: new Date().toISOString(),
    },
    ...extra,
  };
}

function buildFinishedPenaltyShootoutState(
  state: MatchState,
  shootout: PenaltyShootoutState,
): Partial<MatchState> {
  return buildFinishedMatchState(state.matchStats, {
    penaltyShootout: shootout,
    matchStats: {
      ...state.matchStats,
      penaltyShootout: {
        homeScore: shootout.homeScore,
        awayScore: shootout.awayScore,
        shots: shootout.shots,
        winnerSide: shootout.winnerSide,
      },
    },
  });
}

function withMatchEndIfNeeded(
  state: MatchState,
  newTurn: number,
  matchStats: MatchStats,
  scores: { homeScore: number; awayScore: number } = {
    homeScore: state.homeScore,
    awayScore: state.awayScore,
  },
): Partial<MatchState> {
  if (newTurn > state.totalTurns) {
    if (
      shouldStartPenaltyShootout(
        state.penaltyShootoutEnabled,
        scores.homeScore,
        scores.awayScore,
      ) &&
      state.homeTeam &&
      state.awayTeam &&
      !state.penaltyShootout
    ) {
      return {
        currentTurn: newTurn,
        matchStats,
        penaltyShootout: createInitialPenaltyShootout(
          state.homeTeam,
          state.awayTeam,
          state.matchFormat,
        ),
      };
    }

    return buildFinishedMatchState(matchStats, { currentTurn: newTurn });
  }

  return { currentTurn: newTurn, matchStats };
}

const initialState = {
  homeTeam: null,
  awayTeam: null,
  homeScore: 0,
  awayScore: 0,
  currentTurn: 1,
  matchStatus: "SETUP" as MatchStatus,
  matchFormat: "11v11" as MatchFormat,
  timeOfDay: DEFAULT_TIME_OF_DAY,
  weather: DEFAULT_WEATHER,
  matchBackgroundIndex: 1,
  ballPossession: "home" as MatchSide,
  firstHalfKickoffSide: null as MatchSide | null,
  kickoffResolved: false,
  pitchSwapped: false,
  totalTurns: DEFAULT_TOTAL_TURNS,
  penaltyShootoutEnabled: false,
  penaltyShootout: null,
  halfTimeCompleted: false,
  playerResources: {} as PlayerResourcesMap,
  matchStats: createEmptyMatchStats(),
  substitutions: createEmptySubstitutionState(),
  matchFacilityState: createEmptyMatchFacilityState(),
  burningPhaseActive: createEmptyBurningPhaseState(),
  burningPhaseUsed: createEmptyBurningPhaseUsedState(),
};

export const useMatchStore = create<MatchState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setTeams: (homeTeam, awayTeam) =>
        set({
          homeTeam,
          awayTeam,
          homeScore: 0,
          awayScore: 0,
          currentTurn: 1,
          matchStatus: "SETUP",
          playerResources: {},
          matchStats: createEmptyMatchStats(),
          substitutions: createEmptySubstitutionState(),
          matchFacilityState: createEmptyMatchFacilityState(),
          burningPhaseActive: createEmptyBurningPhaseState(),
          burningPhaseUsed: createEmptyBurningPhaseUsedState(),
          penaltyShootout: null,
        }),
      updateTeam: (side, team) =>
        set((state) =>
          side === "home" ? { homeTeam: team } : { awayTeam: team },
        ),
      setMatchFormat: (format) => set({ matchFormat: format }),
      setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
      setWeather: (weather) => set({ weather }),
      setTotalTurns: (turns) => set({ totalTurns: normalizeTotalTurns(turns) }),
      setPenaltyShootoutEnabled: (enabled) => set({ penaltyShootoutEnabled: enabled }),
      setPenaltyShootoutLineup: (side, shooters, goalkeeperId) =>
        set((state) => {
          if (!state.penaltyShootout) return state;
          const team = side === "home" ? state.homeTeam : state.awayTeam;
          if (!team) return state;

          const normalizedShooters = normalizePenaltyShooters(
            team,
            state.matchFormat,
            goalkeeperId,
            shooters,
            state.penaltyShootout.kicksPerTeam,
          );

          return {
            penaltyShootout: {
              ...state.penaltyShootout,
              ...(side === "home"
                ? { homeShooters: normalizedShooters, homeGoalkeeperId: goalkeeperId }
                : { awayShooters: normalizedShooters, awayGoalkeeperId: goalkeeperId }),
            },
          };
        }),
      confirmPenaltyShootoutSetup: (side) =>
        set((state) => {
          if (!state.penaltyShootout) return state;
          const next = {
            ...state.penaltyShootout,
            ...(side === "home"
              ? { homeSetupConfirmed: true }
              : { awaySetupConfirmed: true }),
          };

          if (next.homeSetupConfirmed && next.awaySetupConfirmed) {
            return {
              penaltyShootout: {
                ...next,
                phase: "coin_toss",
              },
            };
          }

          return { penaltyShootout: next };
        }),
      completePenaltyCoinToss: (firstShooterSide) =>
        set((state) => {
          if (!state.penaltyShootout) return state;
          return {
            penaltyShootout: {
              ...state.penaltyShootout,
              phase: "shooting",
              firstShooterSide,
            },
          };
        }),
      recordPenaltyShotOutcome: (outcome, viaDuel = false) =>
        set((state) => {
          if (!state.penaltyShootout || state.penaltyShootout.phase !== "shooting") {
            return state;
          }

          const nextShootout = recordPenaltyShot(state.penaltyShootout, outcome, viaDuel);
          if (nextShootout.phase === "finished" && nextShootout.winnerSide) {
            return {
              penaltyShootout: nextShootout,
              ...buildFinishedPenaltyShootoutState(state, nextShootout),
            };
          }

          return { penaltyShootout: nextShootout };
        }),
      reopenPenaltyShootoutSetup: (side) =>
        set((state) => {
          if (!state.penaltyShootout || state.penaltyShootout.phase !== "setup") return state;
          return {
            penaltyShootout: {
              ...state.penaltyShootout,
              ...(side === "home"
                ? { homeSetupConfirmed: false }
                : { awaySetupConfirmed: false }),
            },
          };
        }),
      setBallPossession: (side) => set({ ballPossession: side }),
      completeKickoff: (ballPossession, pitchSwapped) =>
        set({ ballPossession, pitchSwapped, firstHalfKickoffSide: ballPossession, kickoffResolved: true }),
      completeHalfTime: () =>
        set((state) => ({
          pitchSwapped: !state.pitchSwapped,
          halfTimeCompleted: true,
          ballPossession: state.firstHalfKickoffSide
            ? getOppositeKickoffSide(state.firstHalfKickoffSide)
            : state.ballPossession,
          playerResources: applyHalftimeResourceRecovery(state),
        })),
      startMatch: () =>
        set((state) => {
          if (!state.homeTeam || !state.awayTeam) return state;
          return {
            matchStatus: "PLAYING",
            homeScore: 0,
            awayScore: 0,
            currentTurn: 1,
            kickoffResolved: false,
            pitchSwapped: false,
            halfTimeCompleted: false,
            firstHalfKickoffSide: null,
            ballPossession: "home",
            matchBackgroundIndex: pickRandomMatchBackground(),
            playerResources: buildPlayerResourcesFromTeams(state.homeTeam, state.awayTeam),
            matchStats: {
              ...createEmptyMatchStats(),
              startedAt: new Date().toISOString(),
            },
            substitutions: createEmptySubstitutionState(),
            matchFacilityState: buildInitialMatchFacilityState(
              state.homeTeam,
              state.matchFormat,
            ),
            burningPhaseActive: createEmptyBurningPhaseState(),
            burningPhaseUsed: createEmptyBurningPhaseUsedState(),
            penaltyShootout: null,
          };
        }),
      addGoal: (team, amount = 1, scorer) =>
        set((state) => {
          const nextHomeScore =
            team === "home"
              ? Math.max(0, state.homeScore + amount)
              : state.homeScore;
          const nextAwayScore =
            team === "away"
              ? Math.max(0, state.awayScore + amount)
              : state.awayScore;

          const goals = [...state.matchStats.goals];
          if (amount > 0) {
            for (let i = 0; i < amount; i += 1) {
              goals.push({
                side: team,
                turn: state.currentTurn,
                source: scorer ? "open_goal" : "manual",
                playerId: scorer?.playerId,
                playerName: scorer?.playerName,
              });
            }
          } else if (amount < 0) {
            for (let i = 0; i < Math.abs(amount); i += 1) {
              let removeIndex = -1;
              for (let j = goals.length - 1; j >= 0; j -= 1) {
                if (goals[j].side === team) {
                  removeIndex = j;
                  break;
                }
              }
              if (removeIndex >= 0) goals.splice(removeIndex, 1);
            }
          }

          const scoreUpdate = {
            homeScore: nextHomeScore,
            awayScore: nextAwayScore,
          };
          const updatedStats = { ...state.matchStats, goals };

          if (amount > 0 && scorer) {
            const concedingSide: MatchSide = team === "home" ? "away" : "home";
            const { newTurn, matchStats } = buildTurnAdvanceStats(state);
            const turnAdvance = withMatchEndIfNeeded(state, newTurn, matchStats, {
              homeScore: nextHomeScore,
              awayScore: nextAwayScore,
            });

            return withTurnAdvanceAndFieldGpDrain(state, {
              ...turnAdvance,
              ...scoreUpdate,
              matchStats: { ...turnAdvance.matchStats ?? matchStats, goals },
              ballPossession: concedingSide,
            });
          }

          return {
            ...scoreUpdate,
            matchStats: updatedStats,
          };
        }),
      nextTurn: () =>
        set((state) => {
          const { newTurn, matchStats } = buildTurnAdvanceStats(state);
          return withTurnAdvanceAndFieldGpDrain(
            state,
            withMatchEndIfNeeded(state, newTurn, matchStats),
          );
        }),
      prevTurn: () =>
        set((state) => {
          const minTurn = getMinRewindTurn(
            state.currentTurn,
            state.totalTurns,
            state.halfTimeCompleted,
            state.matchFormat,
          );
          if (state.currentTurn <= minTurn) return state;

          const side = state.ballPossession;
          const newCurrentTurn = state.currentTurn - 1;
          const burningPhase = adjustBurningPhaseOnRewind(
            state.burningPhaseActive,
            state.burningPhaseUsed,
            newCurrentTurn,
          );

          return {
            currentTurn: newCurrentTurn,
            burningPhaseActive: burningPhase.burningPhaseActive,
            burningPhaseUsed: burningPhase.burningPhaseUsed,
            matchStats: {
              ...state.matchStats,
              possessionTurns: {
                ...state.matchStats.possessionTurns,
                [side]: Math.max(0, state.matchStats.possessionTurns[side] - 1),
              },
              turnsPlayed: Math.max(0, state.matchStats.turnsPlayed - 1),
            },
          };
        }),
      recordDuel: (duel) =>
        set((state) => {
          const goals: GoalEvent[] = [...state.matchStats.goals];
          if (duel.goalScored && duel.goalSide) {
            goals.push({
              side: duel.goalSide,
              turn: duel.turn,
              source: "duel",
              playerId: duel.scorerId,
              playerName: duel.scorerName,
            });
          }

          return {
            matchStats: {
              ...state.matchStats,
              duels: [...state.matchStats.duels, duel],
              goals,
            },
          };
        }),
      applyDuelEffects: (effects) =>
        set((state) => {
          const { newTurn, matchStats } = buildTurnAdvanceStats(state);
          const nextHomeScore =
            effects.goalScored && effects.goalSide === "home"
              ? state.homeScore + 1
              : state.homeScore;
          const nextAwayScore =
            effects.goalScored && effects.goalSide === "away"
              ? state.awayScore + 1
              : state.awayScore;

          const turnAdvance = withMatchEndIfNeeded(state, newTurn, matchStats, {
            homeScore: nextHomeScore,
            awayScore: nextAwayScore,
          });

          const next: Partial<MatchState> = withTurnAdvanceAndFieldGpDrain(state, {
            ...turnAdvance,
            ballPossession: effects.newBallSide,
            homeScore: nextHomeScore,
            awayScore: nextAwayScore,
          });

          return next;
        }),
      resetMatch: () => set(initialState),
      restartMatch: () =>
        set((state) => {
          if (!state.homeTeam || !state.awayTeam) return state;

          return {
            homeScore: 0,
            awayScore: 0,
            currentTurn: 1,
            matchStatus: "PLAYING" as MatchStatus,
            kickoffResolved: false,
            pitchSwapped: false,
            halfTimeCompleted: false,
            firstHalfKickoffSide: null,
            ballPossession: "home" as MatchSide,
            matchBackgroundIndex: pickRandomMatchBackground(),
            playerResources: buildPlayerResourcesFromTeams(state.homeTeam, state.awayTeam),
            matchStats: {
              ...createEmptyMatchStats(),
              startedAt: new Date().toISOString(),
            },
            substitutions: createEmptySubstitutionState(),
            matchFacilityState: buildInitialMatchFacilityState(
              state.homeTeam,
              state.matchFormat,
            ),
            burningPhaseActive: createEmptyBurningPhaseState(),
            burningPhaseUsed: createEmptyBurningPhaseUsedState(),
            penaltyShootout: null,
          };
        }),
      endMatch: () =>
        set((state) =>
          buildFinishedMatchState(state.matchStats),
        ),
      getPlayerResources: (playerId) => {
        const { homeTeam, awayTeam, playerResources } = get();
        const map = normalizePlayerResourcesMap(playerResources);
        const stored = map[playerId];
        if (stored) return stored;

        const player = findPlayerInTeams(homeTeam, awayTeam, playerId);
        if (!player) return null;

        const coach = getCoachForPlayer(homeTeam, awayTeam, playerId);
        return resolvePlayerResources(map, player, coach);
      },
      spendPlayerResources: (playerId, cost) => {
        const state = get();
        const map = normalizePlayerResourcesMap(state.playerResources);
        const player = findPlayerInTeams(state.homeTeam, state.awayTeam, playerId);
        const coach = getCoachForPlayer(state.homeTeam, state.awayTeam, playerId);
        const current = player
          ? resolvePlayerResources(map, player, coach)
          : map[playerId];

        if (!canAffordResources(current, cost)) return false;

        set({
          playerResources: {
            ...map,
            [playerId]: {
              tp: current!.tp - cost.tp,
              gp: current!.gp - cost.gp,
            },
          },
        });

        const side = findPlayerTeamSide(state.homeTeam, state.awayTeam, playerId);
        if (side) {
          get().applyClinicGpRecoveryIfNeeded(side, playerId);
        }

        return true;
      },
      restorePlayerResources: (snapshot) =>
        set((state) => ({
          playerResources: {
            ...normalizePlayerResourcesMap(state.playerResources),
            ...normalizePlayerResourcesMap(snapshot),
          },
        })),
      ensurePlayerResources: () => {
        const { matchStatus, homeTeam, awayTeam, playerResources } = get();
        if (matchStatus !== "PLAYING" || !homeTeam || !awayTeam) return;

        const { map, changed } = mergeMissingPlayerResources(
          playerResources,
          homeTeam,
          awayTeam,
        );

        if (changed || Object.keys(map).length !== Object.keys(playerResources).length) {
          set({ playerResources: map });
        }
      },
      creditCurrentTurnParticipation: () =>
        set((state) => {
          if (!state.homeTeam || !state.awayTeam) return state;
          return {
            matchStats: {
              ...state.matchStats,
              playerParticipation: creditTurnParticipation(
                state.matchStats.playerParticipation ?? createEmptyPlayerParticipation(),
                state.homeTeam,
                state.awayTeam,
                state.matchFormat,
                state.ballPossession,
              ),
            },
          };
        }),
      requestSubstitution: (side, outPlayerId, inPlayerId) => {
        const state = get();
        const team = side === "home" ? state.homeTeam : state.awayTeam;
        if (!team) return false;

        const teamSub = state.substitutions[side];
        const error = canRequestSubstitution(
          teamSub,
          team,
          state.matchFormat,
          outPlayerId,
          inPlayerId,
        );
        if (error) return false;

        set({
          substitutions: {
            ...state.substitutions,
            [side]: {
              ...teamSub,
              pending: { outPlayerId, inPlayerId },
            },
          },
        });
        return true;
      },
      cancelPendingSubstitution: (side) =>
        set((state) => ({
          substitutions: {
            ...state.substitutions,
            [side]: {
              ...state.substitutions[side],
              pending: null,
            },
          },
        })),
      applyPendingSubstitutions: () => {
        const state = get();
        const applied: AppliedSubstitution[] = [];
        let homeTeam = state.homeTeam;
        let awayTeam = state.awayTeam;
        const nextSubs = { ...state.substitutions };
        let nextFacilityState = state.matchFacilityState;

        for (const side of ["home", "away"] as const) {
          const pending = state.substitutions[side].pending;
          if (!pending) continue;

          const team = side === "home" ? homeTeam : awayTeam;
          if (!team) continue;

          const result = applySubstitutionToTeam(
            team,
            state.matchFormat,
            pending.outPlayerId,
            pending.inPlayerId,
          );
          if (!result) continue;

          const outPlayer = team.roster.find((p) => p.id === pending.outPlayerId);
          const inPlayer = team.roster.find((p) => p.id === pending.inPlayerId);
          if (!outPlayer || !inPlayer) continue;

          if (side === "home") {
            homeTeam = result.team;
          } else {
            awayTeam = result.team;
          }

          const teamSub = nextSubs[side];
          nextSubs[side] = {
            used: teamSub.used + 1,
            subbedOutIds: [...teamSub.subbedOutIds, pending.outPlayerId],
            pending: null,
          };

          applied.push({
            side,
            outPlayer,
            inPlayer,
            position: result.position,
            reason: "manual",
          });

          if (homeTeam && awayTeam) {
            nextFacilityState = applySubEntryBoostToFacilityState(
              nextFacilityState,
              inPlayer.id,
              side,
              homeTeam,
              awayTeam,
              state.matchFormat,
            );
          }
        }

        if (applied.length > 0) {
          set({
            homeTeam,
            awayTeam,
            substitutions: nextSubs,
            matchFacilityState: nextFacilityState,
          });
        }

        return applied;
      },
      findExhaustedPlayers: () => {
        const state = get();
        if (!state.homeTeam || !state.awayTeam || state.matchStatus !== "PLAYING") {
          return [];
        }

        return findExhaustedStarters({
          homeTeam: state.homeTeam,
          awayTeam: state.awayTeam,
          playerResources: normalizePlayerResourcesMap(state.playerResources),
          matchFormat: state.matchFormat,
          homeCoach: getActiveCoach(state.homeTeam),
          awayCoach: getActiveCoach(state.awayTeam),
        });
      },
      applyExhaustionSubstitution: (side, outPlayerId, inPlayerId) => {
        const state = get();
        if (!state.homeTeam || !state.awayTeam || state.matchStatus !== "PLAYING") {
          return null;
        }

        const result = applySingleExhaustionSubstitution({
          side,
          homeTeam: state.homeTeam,
          awayTeam: state.awayTeam,
          matchFormat: state.matchFormat,
          substitutions: state.substitutions,
          outPlayerId,
          inPlayerId,
        });

        if (!result.applied) return null;

        set({
          homeTeam: result.homeTeam,
          awayTeam: result.awayTeam,
          substitutions: result.substitutions,
          matchFacilityState: applySubEntryBoostToFacilityState(
            state.matchFacilityState,
            inPlayerId,
            side,
            result.homeTeam,
            result.awayTeam,
            state.matchFormat,
          ),
        });

        return result.applied;
      },
      applyHalftimeSubstitution: (side, outPlayerId, inPlayerId) => {
        const state = get();
        if (!state.homeTeam || !state.awayTeam || state.matchStatus !== "PLAYING") {
          return null;
        }
        if (state.halfTimeCompleted) {
          return null;
        }

        const team = side === "home" ? state.homeTeam : state.awayTeam;
        const error = canRequestHalftimeSubstitution(
          state.substitutions[side],
          team,
          state.matchFormat,
          outPlayerId,
          inPlayerId,
        );
        if (error) return null;

        const result = applySubstitutionToTeam(
          team,
          state.matchFormat,
          outPlayerId,
          inPlayerId,
        );
        if (!result) return null;

        const outPlayer = team.roster.find((p) => p.id === outPlayerId);
        const inPlayer = team.roster.find((p) => p.id === inPlayerId);
        if (!outPlayer || !inPlayer) return null;

        const teamSub = state.substitutions[side];
        const nextSubs = {
          ...state.substitutions,
          [side]: {
            ...teamSub,
            subbedOutIds: updateSubbedOutIdsAfterHalftimeSub(
              teamSub.subbedOutIds,
              outPlayerId,
            ),
          },
        };

        const homeTeam = side === "home" ? result.team : state.homeTeam;
        const awayTeam = side === "away" ? result.team : state.awayTeam;

        const applied: AppliedSubstitution = {
          side,
          outPlayer,
          inPlayer,
          position: result.position,
          reason: "halftime",
        };

        set({
          homeTeam,
          awayTeam,
          substitutions: nextSubs,
          matchFacilityState: applySubEntryBoostToFacilityState(
            state.matchFacilityState,
            inPlayerId,
            side,
            homeTeam,
            awayTeam,
            state.matchFormat,
          ),
        });

        return applied;
      },
      useConsumableOnPlayer: (side, playerId, consumableId) => {
        const state = get();
        if (state.matchStatus !== "PLAYING") {
          return { success: false, error: "El partido no está en juego." };
        }

        const team = side === "home" ? state.homeTeam : state.awayTeam;
        if (!team) {
          return { success: false, error: "Equipo no encontrado." };
        }

        const player = team.roster.find((entry) => entry.id === playerId);
        if (!player) {
          return { success: false, error: "Jugador no encontrado." };
        }

        if (!isPlayerOnField(team, playerId, state.matchFormat)) {
          return { success: false, error: "Solo puedes usar consumibles en jugadores del campo." };
        }

        const usages = state.matchStats.consumableUsages ?? [];
        if (hasPlayerUsedConsumable(usages, playerId)) {
          return { success: false, error: "Este jugador ya ha usado un consumible en este partido." };
        }

        const available = getAvailableConsumablesForPlayer(team, playerId, usages);
        const inventoryEntry = available.find((entry) => entry.consumableId === consumableId);
        if (!inventoryEntry) {
          return { success: false, error: "No tienes este consumible en el inventario." };
        }

        const consumable = inventoryEntry.consumable;
        const facilities = getTeamFacilities(team);
        const effectiveEffectValue = getFacilityConsumableEffectValue(
          consumable.effectValue,
          facilities,
          isOfficialMatch(state.matchFormat),
        );

        const coach = getCoachForPlayer(state.homeTeam, state.awayTeam, playerId);
        const map = normalizePlayerResourcesMap(state.playerResources);
        const effectiveStats = getEffectiveStats(player, coach);
        const maxResources = { tp: effectiveStats.tp, gp: effectiveStats.gp };
        const current = map[playerId] ?? maxResources;
        const restored = applyConsumableToPlayerResources(
          current,
          maxResources,
          consumable.effect,
          effectiveEffectValue,
        );

        const usage = {
          turn: state.currentTurn,
          side,
          clubId: team.id,
          playerId,
          playerName: player.name,
          consumableId,
          consumableName: consumable.name,
          effect: consumable.effect,
          effectValue: effectiveEffectValue,
        };

        set({
          playerResources: {
            ...map,
            [playerId]: restored,
          },
          matchStats: {
            ...state.matchStats,
            consumableUsages: [...usages, usage],
          },
        });

        return { success: true };
      },
      useMatchFacilityAbility: (side, abilityId) => {
        const state = get();
        if (state.matchStatus !== "PLAYING") {
          return { success: false, error: "El partido no está en juego." };
        }

        const team = side === "home" ? state.homeTeam : state.awayTeam;
        if (!team) {
          return { success: false, error: "Equipo no encontrado." };
        }

        if (!isOfficialMatch(state.matchFormat)) {
          return { success: false, error: "Solo disponible en partidos oficiales." };
        }

        if (state.matchFacilityState.usedAbilities[abilityId]) {
          return { success: false, error: "Ya has usado esta mejora en este partido." };
        }

        const facilities = getTeamFacilities(team);
        const canUse =
          (abilityId === "NULLIFY_FOUL" && facilities.lab >= 1) ||
          (abilityId === "REVEAL_OPPONENT_COMMAND" && facilities.benches >= 3) ||
          (abilityId === "REPEAT_COIN_TOSS" && facilities.training >= 3);

        if (!canUse) {
          return { success: false, error: "Tu club no tiene esta mejora desbloqueada." };
        }

        set({
          matchFacilityState: {
            ...state.matchFacilityState,
            usedAbilities: {
              ...state.matchFacilityState.usedAbilities,
              [abilityId]: side,
            },
          },
        });

        return { success: true };
      },
      recordSuperMoveUsage: (side, moveName) => {
        const state = get();
        if (!isOfficialMatch(state.matchFormat)) return;

        const key = side === "home" ? "homeUsedSuperMoves" : "awayUsedSuperMoves";
        if (state.matchFacilityState[key].includes(moveName)) return;

        set({
          matchFacilityState: {
            ...state.matchFacilityState,
            [key]: [...state.matchFacilityState[key], moveName],
          },
        });
      },
      recordMoveUsage: (usage) => {
        const state = get();
        const entry: import("@inazuma/shared").MoveUsageRecord = {
          turn: usage.turn ?? state.currentTurn,
          side: usage.side,
          clubId: usage.clubId,
          playerId: usage.playerId,
          playerName: usage.playerName,
          moveId: usage.moveId,
          moveName: usage.moveName,
        };

        const nextUsages = [...(state.matchStats.moveUsages ?? []), entry];
        const teamKey = usage.side === "home" ? "homeTeam" : "awayTeam";
        const team = state[teamKey];

        const nextTeam =
          team != null
            ? {
                ...team,
                roster: applyPlayerMoveUsageToRoster(
                  team.roster,
                  usage.playerId,
                  usage.moveId,
                  nextUsages,
                ),
              }
            : null;

        set({
          ...(nextTeam ? { [teamKey]: nextTeam } : {}),
          matchStats: {
            ...state.matchStats,
            moveUsages: nextUsages,
          },
        });
      },
      applyClinicGpRecoveryIfNeeded: (side, playerId) => {
        const state = get();
        if (!isOfficialMatch(state.matchFormat)) return;

        const team = side === "home" ? state.homeTeam : state.awayTeam;
        if (!team) return;

        const facilities = getTeamFacilities(team);
        if (facilities.clinic < 3) return;
        if (state.matchFacilityState.clinicGpRecoveryUsed[side]) return;

        const player = team.roster.find((entry) => entry.id === playerId);
        if (!player) return;

        const coach = getCoachForPlayer(state.homeTeam, state.awayTeam, playerId);
        const map = normalizePlayerResourcesMap(state.playerResources);
        const current = resolvePlayerResources(map, player, coach);
        if (current.gp > 0) return;

        const maxGp = getEffectiveStats(player, coach).gp;
        const recoveredGp = getClinicGpRecoveryAmount(maxGp);

        set({
          playerResources: {
            ...map,
            [playerId]: { ...current, gp: recoveredGp },
          },
          matchFacilityState: {
            ...state.matchFacilityState,
            clinicGpRecoveryUsed: {
              ...state.matchFacilityState.clinicGpRecoveryUsed,
              [side]: true,
            },
          },
        });
      },
      activateBurningPhase: (side) => {
        const state = get();
        if (hasBurningPhaseBeenUsed(side, state.burningPhaseUsed)) {
          return {
            success: false,
            error: "Ya has usado la Fase de Furor en este partido.",
          };
        }
        if (isSideInBurningPhase(side, state.burningPhaseActive, state.currentTurn)) {
          return { success: false, error: "La Fase de Furor ya está activa." };
        }

        set({
          burningPhaseActive: {
            ...state.burningPhaseActive,
            [side]: state.currentTurn,
          },
          burningPhaseUsed: {
            ...state.burningPhaseUsed,
            [side]: true,
          },
        });

        return { success: true };
      },
    }),
    {
      name: "match-referee-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        homeTeam: state.homeTeam,
        awayTeam: state.awayTeam,
        homeScore: state.homeScore,
        awayScore: state.awayScore,
        currentTurn: state.currentTurn,
        matchStatus: state.matchStatus,
        matchFormat: state.matchFormat,
        timeOfDay: state.timeOfDay,
        weather: state.weather,
        matchBackgroundIndex: state.matchBackgroundIndex,
        ballPossession: state.ballPossession,
        firstHalfKickoffSide: state.firstHalfKickoffSide,
        kickoffResolved: state.kickoffResolved,
        pitchSwapped: state.pitchSwapped,
        totalTurns: state.totalTurns,
        penaltyShootoutEnabled: state.penaltyShootoutEnabled,
        penaltyShootout: state.penaltyShootout,
        halfTimeCompleted: state.halfTimeCompleted,
        playerResources: normalizePlayerResourcesMap(state.playerResources),
        matchStats: state.matchStats,
        substitutions: state.substitutions ?? createEmptySubstitutionState(),
        matchFacilityState: state.matchFacilityState ?? createEmptyMatchFacilityState(),
        burningPhaseActive: state.burningPhaseActive ?? createEmptyBurningPhaseState(),
        burningPhaseUsed: state.burningPhaseUsed ?? createEmptyBurningPhaseUsedState(),
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.playerResources = normalizePlayerResourcesMap(state.playerResources);
        if (!state.matchStats) {
          state.matchStats = createEmptyMatchStats();
        }
        if (!state.matchStats.playerParticipation) {
          state.matchStats.playerParticipation = createEmptyPlayerParticipation();
        }
        if (!state.matchStats.consumableUsages) {
          state.matchStats.consumableUsages = [];
        }
        if (!state.matchStats.moveUsages) {
          state.matchStats.moveUsages = [];
        }
        if (!state.timeOfDay) {
          state.timeOfDay = DEFAULT_TIME_OF_DAY;
        }
        if (!state.weather) {
          state.weather = DEFAULT_WEATHER;
        }
        if (!state.matchBackgroundIndex) {
          state.matchBackgroundIndex =
            state.matchStatus === "PLAYING"
              ? pickRandomMatchBackground()
              : 1;
        }
        if (!state.substitutions) {
          state.substitutions = createEmptySubstitutionState();
        }
        if (!state.matchFacilityState) {
          state.matchFacilityState = createEmptyMatchFacilityState();
        }
        if (state.kickoffResolved === undefined) {
          state.kickoffResolved =
            state.currentTurn > 1 || (state.matchStats?.turnsPlayed ?? 0) > 0;
        }
        if (state.firstHalfKickoffSide === undefined) {
          state.firstHalfKickoffSide = null;
        }
        if (state.pitchSwapped === undefined) {
          state.pitchSwapped = false;
        }
        if (!state.totalTurns) {
          state.totalTurns = DEFAULT_TOTAL_TURNS;
        } else {
          state.totalTurns = normalizeTotalTurns(state.totalTurns);
        }
        if (state.halfTimeCompleted === undefined) {
          state.halfTimeCompleted = false;
        }
        if (state.penaltyShootoutEnabled === undefined) {
          state.penaltyShootoutEnabled = false;
        }
        if (state.penaltyShootout === undefined) {
          state.penaltyShootout = null;
        }
        if (!state.burningPhaseActive) {
          state.burningPhaseActive = createEmptyBurningPhaseState();
        } else {
          state.burningPhaseActive = normalizeBurningPhaseState(
            state.burningPhaseActive,
            state.currentTurn,
          );
        }
        if (!state.burningPhaseUsed) {
          state.burningPhaseUsed = inferBurningPhaseUsedFromLegacyState(
            state.burningPhaseActive,
          );
        } else {
          state.burningPhaseUsed = inferBurningPhaseUsedFromLegacyState(
            state.burningPhaseActive,
            state.burningPhaseUsed,
          );
        }
      },
    },
  ),
);
