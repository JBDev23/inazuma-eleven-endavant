// src/app/match/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { DuelResolution } from "@inazuma/shared";
import { useMatchStore } from "@/store/useMatchStore";
import { useMatchStoreHydration } from "@/hooks/useMatchStoreHydration";
import { MatchDebugMenu } from "@/components/MatchDebugMenu";
import { MatchFacilityAbilitiesPanel } from "@/components/MatchFacilityAbilitiesPanel";
import { BurningPhaseControls } from "@/components/BurningPhaseControls";
import { BurningPhaseIndicator } from "@/components/BurningPhaseIndicator";
import { Swords, Plus, Minus, ChevronLeft, ChevronRight, Hash, User, Loader2, Flag, ArrowRightLeft } from "lucide-react";
import { ClubShield } from "@/components/ClubShield";
import Image from "next/image";
import {
  Player,
  UserClub,
  type PlayerWithDetails,
  getPlayerMatchModifiers,
  isOfficialMatch,
  type MatchFacilityState,
  isSideInBurningPhase,
  BURNING_PHASE_DURATION_TURNS,
} from "@inazuma/shared";
import { getTeamFacilities } from "@/lib/match-facility";
import { PlayerMatchModifiersBadge } from "@/components/PlayerMatchModifiersBadge";
import { MatchFormat } from "@/components/MatchFormatSelector";
import { useScreenOrientation } from "@/hooks/useScreenOrientation";
import { parseFormationLines, type FieldOrientation } from "@/lib/formation-field";
import { getPitchEnvironmentVisuals, type TimeOfDay, type WeatherCondition } from "@/lib/match-environment";
import { PitchEnvironmentEffects } from "@/components/PitchEnvironmentEffects";
import { MatchEnvironmentBadge } from "@/components/MatchEnvironmentBadge";
import { resolveDuelPlayer } from "@/lib/roster-players";
import { PlayerSpriteAvatar } from "@/components/PlayerSpriteAvatar";
import { DuelModal } from "@/components/DuelModal";
import { PlayerStatsModal } from "@/components/PlayerStatsModal";
import { detectDuelType, getDuelTypeLabel, resolveDuelContext } from "@/lib/duel-context";
import type { DuelActionPick } from "@/lib/duel-actions";
import { buildDuelRecord } from "@/lib/match-stats";
import { MAX_SUBSTITUTIONS, getBenchPlayers, getPlayerPosition } from "@/lib/match-substitutions";
import type { AppliedSubstitution } from "@/lib/match-substitutions";
import type { ExhaustionSubstitutionRequest } from "@/lib/match-exhaustion";
import { REQUIRED_STARTERS } from "@/lib/roster-utils";
import { SubstitutionModal } from "@/components/SubstitutionModal";
import { SubstitutionOverlay } from "@/components/SubstitutionOverlay";
import { CoinTossModal } from "@/components/CoinTossModal";
import { PenaltyCoinTossModal } from "@/components/PenaltyCoinTossModal";
import { PenaltyShootoutSetupModal } from "@/components/PenaltyShootoutSetupModal";
import { PenaltyShootoutPanel } from "@/components/PenaltyShootoutPanel";
import { HalfTimeModal } from "@/components/HalfTimeModal";
import { OpenGoalModal } from "@/components/OpenGoalModal";
import { getMatchBackgroundSrc } from "@/lib/match-background";
import { shouldShowHalfTime, isMatchTurnsComplete, canRewindTurn, hasHalftime } from "@/lib/match-turns";
import {
  findPlayerInTeam,
  getCurrentGoalkeeperId,
  getCurrentShooterId,
  getShootingSide,
} from "@/lib/penalty-shootout";
import type { MatchSide } from "@/lib/match-turn";

function PitchMarkings({ orientation, snow = false }: { orientation: FieldOrientation; snow?: boolean }) {
  const lineColor = snow ? "bg-slate-600/40" : "bg-white/30";
  const borderColor = snow ? "border-slate-600/40" : "border-white/30";
  const areaBg = snow ? "bg-slate-500/10" : "bg-white/5";

  if (orientation === "landscape") {
    return (
      <>
        <div className={`absolute inset-y-0 left-1/2 w-0.5 ${lineColor} -translate-x-1/2 pointer-events-none`} />
        <div className={`absolute top-1/2 left-1/2 w-24 h-24 md:w-32 md:h-32 border-2 ${borderColor} rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none`} />
        <div className={`absolute left-0 top-1/2 w-16 h-40 md:w-24 md:h-48 border-2 border-l-0 ${borderColor} -translate-y-1/2 pointer-events-none ${areaBg}`} />
        <div className={`absolute left-16 md:left-24 top-1/2 w-10 h-20 border-2 border-l-0 ${borderColor} rounded-r-full -translate-y-1/2 pointer-events-none`} />
        <div className={`absolute right-0 top-1/2 w-16 h-40 md:w-24 md:h-48 border-2 border-r-0 ${borderColor} -translate-y-1/2 pointer-events-none ${areaBg}`} />
        <div className={`absolute right-16 md:right-24 top-1/2 w-10 h-20 border-2 border-r-0 ${borderColor} rounded-l-full -translate-y-1/2 pointer-events-none`} />
      </>
    );
  }

  return (
    <>
      <div className={`absolute inset-x-0 top-1/2 h-0.5 ${lineColor} -translate-y-1/2 pointer-events-none`} />
      <div className={`absolute top-1/2 left-1/2 w-24 h-24 md:w-32 md:h-32 border-2 ${borderColor} rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none`} />
      <div className={`absolute top-0 left-1/2 w-40 h-16 md:w-48 md:h-24 border-2 border-t-0 ${borderColor} -translate-x-1/2 pointer-events-none ${areaBg}`} />
      <div className={`absolute top-16 md:top-24 left-1/2 w-20 h-10 border-2 border-t-0 ${borderColor} rounded-b-full -translate-x-1/2 pointer-events-none`} />
      <div className={`absolute bottom-0 left-1/2 w-40 h-16 md:w-48 md:h-24 border-2 border-b-0 ${borderColor} -translate-x-1/2 pointer-events-none ${areaBg}`} />
      <div className={`absolute bottom-16 md:bottom-24 left-1/2 w-20 h-10 border-2 border-b-0 ${borderColor} rounded-t-full -translate-x-1/2 pointer-events-none`} />
    </>
  );
}

type DuelSelection = {
  home: PlayerWithDetails | null;
  away: PlayerWithDetails | null;
};

// --- COMPONENTE INTERNO: CAMPO COMPLETO (FULL PITCH) ---
function FullPitch({ 
  homeTeam, 
  awayTeam, 
  format,
  timeOfDay,
  weather,
  showFaces,
  duelSelecting,
  duelSelection,
  onDuelPlayerSelect,
  onPlayerInspect,
  pitchSwapped = false,
  matchFacilityState,
}: { 
  homeTeam: UserClub; 
  awayTeam: UserClub; 
  format: MatchFormat;
  timeOfDay: TimeOfDay;
  weather: WeatherCondition;
  showFaces: boolean;
  duelSelecting: boolean;
  duelSelection: DuelSelection;
  onDuelPlayerSelect: (player: Player, isHome: boolean) => void;
  onPlayerInspect: (player: Player, isHome: boolean) => void;
  pitchSwapped?: boolean;
  matchFacilityState: MatchFacilityState;
}) {
  const orientation = useScreenOrientation();
  const isLandscape = orientation === "landscape";
  const envVisuals = getPitchEnvironmentVisuals(timeOfDay, weather);
  const isSnow = weather === "snow";
  const homeFacilities = getTeamFacilities(homeTeam);
  const awayFacilities = getTeamFacilities(awayTeam);
  const showFacilityModifiers = isOfficialMatch(format);
  
  const getTeamLines = (club: UserClub) => {
    const starters = club.roster
      .filter((p) => {
        if (format === "11v11") return p.position11 && p.position11 >= 1 && p.position11 <= 11;
        return p.position4 && p.position4 >= 1 && p.position4 <= 4;
      })
      .sort((a, b) => {
        const posA = format === "11v11" ? a.position11! : a.position4!;
        const posB = format === "11v11" ? b.position11! : b.position4!;
        return posA - posB;
      });

    const playerCount = format === "11v11" ? 11 : 4;
    const clubFormation = format === "11v11" ? club.formation11 : club.formation4;
    const positionsArray = [1, ...parseFormationLines(clubFormation?.positions, playerCount)];
    
    const lines: typeof starters[] = [];
    let currentIndex = 0;
    for (const count of positionsArray) {
      lines.push(starters.slice(currentIndex, currentIndex + count));
      currentIndex += count;
    }

    return lines;
  };

  const awayLines = getTeamLines(awayTeam);
  const homeLines = getTeamLines(homeTeam);

  const topLines = pitchSwapped ? homeLines : awayLines;
  const bottomLines = [...(pitchSwapped ? awayLines : homeLines)].reverse();
  const topIsHome = pitchSwapped;
  const bottomIsHome = !pitchSwapped;

  const PlayerIcon = ({ player, isHome }: { player: Player, isHome: boolean }) => {
    const positionNum = format === "11v11" ? player.position11 : player.position4;
    const isSelected = isHome
      ? duelSelection.home?.id === player.id
      : duelSelection.away?.id === player.id;
    const facilityModifiers = showFacilityModifiers
      ? getPlayerMatchModifiers({
          playerId: player.id,
          playerElement: player.element,
          side: isHome ? "home" : "away",
          format,
          matchFacilityState,
          homeFacilities,
          awayFacilities,
        })
      : [];

    return (
      <button
        type="button"
        onClick={() =>
          duelSelecting
            ? onDuelPlayerSelect(player, isHome)
            : onPlayerInspect(player, isHome)
        }
        className={`flex flex-col items-center group relative transition-transform cursor-pointer active:scale-95
          ${isSelected ? "scale-110" : ""}`}
      >
        <div className="relative">
          {facilityModifiers.length > 0 && (
            <div className="absolute -top-2 -right-2 z-10">
              <PlayerMatchModifiersBadge modifiers={facilityModifiers} size="compact" />
            </div>
          )}
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center shadow-lg bg-slate-900 overflow-hidden
            ${isHome ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'}
            ${duelSelecting && !isSelected ? "ring-2 ring-amber-400/60 ring-offset-2 ring-offset-emerald-900 animate-pulse" : ""}
            ${isSelected ? "ring-4 ring-amber-400 ring-offset-2 ring-offset-emerald-900" : ""}`}>
            {showFaces ? (
              <PlayerSpriteAvatar
                spriteUrl={player.spriteUrl}
                alt={player.name}
                className="w-full h-full"
                imgClassName="drop-shadow-md"
              />
            ) : (
              <span className="text-xl md:text-2xl font-black text-slate-200 tracking-tighter">
                {positionNum}
              </span>
            )}
          </div>
        </div>
        <span className="text-[8px] md:text-[9px] font-black uppercase text-white bg-slate-950/90 px-1.5 py-0.5 rounded border border-slate-800 max-w-[50px] md:max-w-[60px] truncate mt-1">
          {player.name.split(" ")[0]}
        </span>
      </button>
    );
  };

  return (
    <div
      className={`relative w-full ${envVisuals.pitchClass} border-4 rounded-3xl overflow-hidden shadow-2xl ${envVisuals.pitchGradient} flex ${
        isLandscape
          ? "max-w-5xl aspect-3/2 flex-row justify-between px-4"
          : "max-w-2xl aspect-2/3 flex-col justify-between py-4"
      }`}
    >
      {timeOfDay === "night" && (
        <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,200,0.08)_0%,transparent_50%)]" aria-hidden />
      )}
      {envVisuals.overlayClass && (
        <div className={`absolute inset-0 pointer-events-none z-10 ${envVisuals.overlayClass}`} aria-hidden />
      )}
      <PitchEnvironmentEffects effect={envVisuals.effect} />
      <PitchMarkings orientation={orientation} snow={isSnow} />

      {/* --- MITAD SUPERIOR --- */}
      <div
        className={`relative z-10 ${
          isLandscape
            ? "flex flex-row justify-between h-full w-1/2 pr-4"
            : "flex flex-col justify-between h-1/2 w-full pb-4"
        }`}
      >
        {topLines.map((line, i) => (
          <div
            key={`top-line-${i}`}
            className={
              isLandscape
                ? "flex flex-col justify-around gap-2 md:gap-4 h-full"
                : "flex justify-around gap-2 md:gap-4 w-full px-2"
            }
          >
            {line.map((player) => (
              <PlayerIcon key={player.id} player={player} isHome={topIsHome} />
            ))}
          </div>
        ))}
      </div>

      {/* --- MITAD INFERIOR --- */}
      <div
        className={`relative z-10 ${
          isLandscape
            ? "flex flex-row justify-between h-full w-1/2 pl-4"
            : "flex flex-col justify-between h-1/2 w-full pt-4"
        }`}
      >
        {bottomLines.map((line, i) => (
          <div
            key={`bottom-line-${i}`}
            className={
              isLandscape
                ? "flex flex-col justify-around gap-2 md:gap-4 h-full"
                : "flex justify-around gap-2 md:gap-4 w-full px-2"
            }
          >
            {line.map((player) => (
              <PlayerIcon key={player.id} player={player} isHome={bottomIsHome} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL MATCH ---
export default function MatchPage() {
  const router = useRouter();
  const hydrated = useMatchStoreHydration();
  const { 
    matchStatus, matchFormat, timeOfDay, weather, matchBackgroundIndex,
    homeTeam, awayTeam,
    homeScore, awayScore, currentTurn, 
    ballPossession, setBallPossession,
    kickoffResolved, pitchSwapped, totalTurns, halfTimeCompleted, completeHalfTime,
    penaltyShootout,
    matchStats,
    matchFacilityState,
    addGoal, nextTurn, prevTurn, ensurePlayerResources, applyDuelEffects, recordDuel,
    restartMatch, endMatch, updateTeam,
    setPenaltyShootoutLineup, confirmPenaltyShootoutSetup, completePenaltyCoinToss,
    recordPenaltyShotOutcome, reopenPenaltyShootoutSetup,
    substitutions, requestSubstitution, cancelPendingSubstitution, applyPendingSubstitutions,
    findExhaustedPlayers, applyExhaustionSubstitution, applyHalftimeSubstitution,
    creditCurrentTurnParticipation,
    completeKickoff,
    burningPhaseActive,
  } = useMatchStore();

  useEffect(() => {
    ensurePlayerResources();
  }, [ensurePlayerResources]);

  // El partido funciona 100% offline con los datos precargados en setup/prematch.

  // Estado para controlar la vista del campo (Caras vs Números)
  const [showFaces, setShowFaces] = useState(true);

  // Estado para selección de duelo
  const [duelSelecting, setDuelSelecting] = useState(false);
  const [duelSelection, setDuelSelection] = useState<DuelSelection>({ home: null, away: null });
  const [inPenaltyArea, setInPenaltyArea] = useState(false);
  const [goalkeeperInSmallArea, setGoalkeeperInSmallArea] = useState(true);
  const [isDuelModalOpen, setIsDuelModalOpen] = useState(false);
  const [openGoalSide, setOpenGoalSide] = useState<MatchSide | null>(null);
  const [inspectedPlayer, setInspectedPlayer] = useState<{
    player: PlayerWithDetails;
    isHome: boolean;
  } | null>(null);
  const [substitutionSide, setSubstitutionSide] = useState<"home" | "away" | null>(null);
  const [substitutionPreselectOut, setSubstitutionPreselectOut] = useState<number | null>(null);
  const [subAnimation, setSubAnimation] = useState<AppliedSubstitution[]>([]);
  const [subAnimationKey, setSubAnimationKey] = useState(0);
  const [exhaustionQueue, setExhaustionQueue] = useState<ExhaustionSubstitutionRequest[]>([]);
  const [showHalfTime, setShowHalfTime] = useState(false);
  const [isPenaltyDuelOpen, setIsPenaltyDuelOpen] = useState(false);

  const isPenaltyShootoutActive = penaltyShootout != null && penaltyShootout.phase !== "finished";

  const playSubAnimation = useCallback((subs: AppliedSubstitution[]) => {
    if (subs.length === 0) return;
    setSubAnimation(subs);
    setSubAnimationKey((key) => key + 1);
  }, []);

  const handleSubAnimationComplete = useCallback(() => {
    setSubAnimation([]);
  }, []);

  const currentExhaustion = exhaustionQueue[0] ?? null;
  const showExhaustionModal =
    currentExhaustion !== null && subAnimation.length === 0 && substitutionSide === null;

  const isHalfTimeBlocking = showHalfTime || (
    shouldShowHalfTime(currentTurn, totalTurns, halfTimeCompleted, matchFormat) && kickoffResolved
  );

  useEffect(() => {
    if (
      kickoffResolved &&
      shouldShowHalfTime(currentTurn, totalTurns, halfTimeCompleted, matchFormat)
    ) {
      setShowHalfTime(true);
    }
  }, [currentTurn, totalTurns, halfTimeCompleted, kickoffResolved, matchFormat]);

  const openSubstitution = (side: "home" | "away", outPlayerId?: number) => {
    setSubstitutionPreselectOut(outPlayerId ?? null);
    setSubstitutionSide(side);
    setInspectedPlayer(null);
  };

  const closeSubstitution = () => {
    setSubstitutionSide(null);
    setSubstitutionPreselectOut(null);
  };

  const startExhaustionQueue = (queue: ExhaustionSubstitutionRequest[]) => {
    if (queue.length === 0) return;
    setExhaustionQueue(queue);
    setSubstitutionSide(null);
    setSubstitutionPreselectOut(null);
    setInspectedPlayer(null);
  };

  const advanceExhaustionQueue = () => {
    setExhaustionQueue((queue) => queue.slice(1));
  };

  const runTurnAdvance = (advance: () => void) => {
    if (showExhaustionModal) return;

    creditCurrentTurnParticipation();
    const pending = applyPendingSubstitutions();
    advance();
    const exhausted = findExhaustedPlayers();

    if (pending.length > 0) {
      playSubAnimation(pending);
      if (exhausted.length > 0) {
        setExhaustionQueue(exhausted);
      }
      return;
    }

    startExhaustionQueue(exhausted);
  };

  const handleExhaustionApply = (outId: number, inId: number) => {
    if (!currentExhaustion) return;

    const applied = applyExhaustionSubstitution(
      currentExhaustion.side,
      outId,
      inId,
    );

    advanceExhaustionQueue();

    if (applied) {
      playSubAnimation([applied]);
    }
  };

  const handleExhaustionSkip = () => {
    advanceExhaustionQueue();
  };

  const handleNextTurn = () => runTurnAdvance(nextTurn);

  const handlePrevTurn = () => {
    if (!canRewindTurn(currentTurn, totalTurns, halfTimeCompleted, matchFormat)) return;
    prevTurn();
  };

  const resetDuelSelection = () => {
    setDuelSelecting(false);
    setDuelSelection({ home: null, away: null });
    setInPenaltyArea(false);
    setGoalkeeperInSmallArea(true);
  };

  const handleDuelButtonClick = () => {
    if (showExhaustionModal) return;
    if (duelSelecting) {
      resetDuelSelection();
      return;
    }
    setInspectedPlayer(null);
    setDuelSelecting(true);
    setDuelSelection({ home: null, away: null });
    setInPenaltyArea(false);
    setGoalkeeperInSmallArea(true);
  };

  const handleDuelPlayerSelect = (player: Player, isHome: boolean) => {
    const nextSelection: DuelSelection = isHome
      ? { ...duelSelection, home: player as PlayerWithDetails }
      : { ...duelSelection, away: player as PlayerWithDetails };

    setDuelSelection(nextSelection);
  };

  const handlePlayerInspect = (player: Player, isHome: boolean) => {
    const team = isHome ? homeTeam : awayTeam;
    if (!team) return;
    const resolved = resolveDuelPlayer(team, player as PlayerWithDetails);
    setInspectedPlayer({ player: resolved, isHome });
  };

  const duelHomePlayer =
    duelSelection.home && homeTeam
      ? resolveDuelPlayer(homeTeam, duelSelection.home)
      : null;
  const duelAwayPlayer =
    duelSelection.away && awayTeam
      ? resolveDuelPlayer(awayTeam, duelSelection.away)
      : null;

  const canStartDuel = duelHomePlayer && duelAwayPlayer && homeTeam && awayTeam;
  const pendingDuelType = canStartDuel
    ? detectDuelType(duelHomePlayer, duelAwayPlayer, matchFormat)
    : null;

  const handleStartDuel = () => {
    if (!canStartDuel) return;
    setIsDuelModalOpen(true);
  };

  const duelContext = canStartDuel
    ? resolveDuelContext(
        duelHomePlayer,
        duelAwayPlayer,
        matchFormat,
        ballPossession,
        inPenaltyArea,
        goalkeeperInSmallArea,
      )
    : null;

  const handleOpenGoalConfirm = (side: MatchSide, player: PlayerWithDetails) => {
    setOpenGoalSide(null);
    runTurnAdvance(() =>
      addGoal(side, 1, { playerId: player.id, playerName: player.name }),
    );
  };

  const handleApplyDuel = (
    resolution: DuelResolution,
    picks: {
      home: DuelActionPick;
      away: DuelActionPick;
      goalkeeper?: DuelActionPick;
    },
    extras?: {
      goalkeeperPlayer?: PlayerWithDetails;
      penaltyAreaShotBlock?: import("@inazuma/shared").PenaltyAreaShotBlockResult;
    },
  ) => {
    if (isPenaltyDuelOpen && penaltyShootout && homeTeam && awayTeam) {
      const shootingSide = getShootingSide(penaltyShootout);
      const shooterId = getCurrentShooterId(penaltyShootout);
      const goalkeeperId = getCurrentGoalkeeperId(penaltyShootout);

      if (shootingSide && shooterId != null && goalkeeperId != null) {
        const shootingTeam = shootingSide === "home" ? homeTeam : awayTeam;
        const defendingTeam = shootingSide === "home" ? awayTeam : homeTeam;
        const shooter = findPlayerInTeam(shootingTeam, shooterId);
        const goalkeeper = findPlayerInTeam(defendingTeam, goalkeeperId);

        if (shooter && goalkeeper) {
          const duelHomePlayer = shootingSide === "home" ? shooter : goalkeeper;
          const duelAwayPlayer = shootingSide === "home" ? goalkeeper : shooter;
          const penaltyDuelContext = resolveDuelContext(
            duelHomePlayer,
            duelAwayPlayer,
            matchFormat,
            shootingSide,
            false,
            true,
          );

          recordDuel(
            buildDuelRecord({
              turn: currentTurn,
              duelContext: penaltyDuelContext,
              homePlayer: duelHomePlayer,
              awayPlayer: duelAwayPlayer,
              resolution,
              format: matchFormat,
              homeAction: picks.home,
              awayAction: picks.away,
              goalkeeperPlayer: extras?.goalkeeperPlayer ?? goalkeeper,
            }),
          );
        }
      }

      recordPenaltyShotOutcome(resolution.effects.goalScored ? "goal" : "miss", true);
      setIsPenaltyDuelOpen(false);
      return;
    }

    if (duelHomePlayer && duelAwayPlayer && duelContext) {
      recordDuel(
        buildDuelRecord({
          turn: currentTurn,
          duelContext,
          homePlayer: duelHomePlayer,
          awayPlayer: duelAwayPlayer,
          resolution,
          format: matchFormat,
          homeAction: picks.home,
          awayAction: picks.away,
          goalkeeperPlayer: extras?.goalkeeperPlayer,
        }),
      );
    }
    runTurnAdvance(() => applyDuelEffects(resolution.effects));
    resetDuelSelection();
    setIsDuelModalOpen(false);
  };

  useEffect(() => {
    if (!hydrated) return;

    if (matchStatus === "FINISHED") {
      router.replace("/postmatch");
      return;
    }

    if (!homeTeam || !awayTeam || matchStatus !== "PLAYING") {
      router.replace("/setup");
    }
  }, [hydrated, homeTeam, awayTeam, matchStatus, router]);

  const handleRestartMatch = () => {
    restartMatch();
    resetDuelSelection();
    setIsDuelModalOpen(false);
    setInspectedPlayer(null);
    setSubstitutionSide(null);
    setSubstitutionPreselectOut(null);
    setSubAnimation([]);
    setExhaustionQueue([]);
    setShowHalfTime(false);
  };

  const handleEndMatch = () => {
    const confirmed = window.confirm(
      "¿Terminar el partido? Verás el resumen con estadísticas.",
    );
    if (!confirmed) return;
    endMatch();
    router.replace("/postmatch");
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!homeTeam || !awayTeam || matchStatus !== "PLAYING") return null;

  const inspectedSide = inspectedPlayer?.isHome ? "home" : "away";
  const inspectedTeam = inspectedPlayer?.isHome ? homeTeam : awayTeam;
  const inspectedSubState = inspectedSide ? substitutions[inspectedSide] : null;
  const inspectedOnField =
    inspectedPlayer &&
    (() => {
      const pos = getPlayerPosition(inspectedPlayer.player, matchFormat);
      const required = REQUIRED_STARTERS[matchFormat];
      return pos !== null && pos >= 1 && pos <= required;
    })();
  const canSubstituteInspected =
    !!inspectedPlayer &&
    !!inspectedTeam &&
    !!inspectedSubState &&
    !!inspectedOnField &&
    inspectedSubState.used < MAX_SUBSTITUTIONS &&
    !inspectedSubState.pending &&
    getBenchPlayers(inspectedTeam, matchFormat).length > 0;

  const handleHalfTimeContinue = () => {
    completeHalfTime();
    setShowHalfTime(false);
  };

  // Variables para la barra de turnos
  const turnDisplay = currentTurn > totalTurns ? totalTurns : currentTurn;
  const isSecondHalf = hasHalftime(matchFormat) && currentTurn > totalTurns / 2;
  const canGoBackTurn = canRewindTurn(currentTurn, totalTurns, halfTimeCompleted, matchFormat);
  const canAdvanceTurn =
    !isMatchTurnsComplete(currentTurn, totalTurns) &&
    !showExhaustionModal &&
    !isPenaltyShootoutActive;

  const penaltyShootingSide =
    penaltyShootout?.phase === "shooting" ? getShootingSide(penaltyShootout) : null;
  const penaltyShooterId =
    penaltyShootout?.phase === "shooting" ? getCurrentShooterId(penaltyShootout) : null;
  const penaltyGoalkeeperId =
    penaltyShootout?.phase === "shooting" ? getCurrentGoalkeeperId(penaltyShootout) : null;

  const penaltyDuelHomePlayer =
    penaltyShootingSide && penaltyShooterId != null && penaltyGoalkeeperId != null && homeTeam && awayTeam
      ? (() => {
          const shootingTeam = penaltyShootingSide === "home" ? homeTeam : awayTeam;
          const defendingTeam = penaltyShootingSide === "home" ? awayTeam : homeTeam;
          const shooter = findPlayerInTeam(shootingTeam, penaltyShooterId);
          const goalkeeper = findPlayerInTeam(defendingTeam, penaltyGoalkeeperId);
          if (!shooter || !goalkeeper) return null;
          return penaltyShootingSide === "home" ? shooter : goalkeeper;
        })()
      : null;

  const penaltyDuelAwayPlayer =
    penaltyShootingSide && penaltyShooterId != null && penaltyGoalkeeperId != null && homeTeam && awayTeam
      ? (() => {
          const shootingTeam = penaltyShootingSide === "home" ? homeTeam : awayTeam;
          const defendingTeam = penaltyShootingSide === "home" ? awayTeam : homeTeam;
          const shooter = findPlayerInTeam(shootingTeam, penaltyShooterId);
          const goalkeeper = findPlayerInTeam(defendingTeam, penaltyGoalkeeperId);
          if (!shooter || !goalkeeper) return null;
          return penaltyShootingSide === "home" ? goalkeeper : shooter;
        })()
      : null;

  const penaltyDuelContext =
    penaltyDuelHomePlayer && penaltyDuelAwayPlayer && penaltyShootingSide
      ? resolveDuelContext(
          penaltyDuelHomePlayer,
          penaltyDuelAwayPlayer,
          matchFormat,
          penaltyShootingSide,
          false,
          true,
        )
      : null;
  const homeFuryActive = isSideInBurningPhase("home", burningPhaseActive, currentTurn);
  const awayFuryActive = isSideInBurningPhase("away", burningPhaseActive, currentTurn);
  const anyFuryActive = homeFuryActive || awayFuryActive;

  return (
    <div className={`min-h-screen text-white flex flex-col items-center py-6 px-4 pb-32 ${!kickoffResolved || isHalfTimeBlocking || isPenaltyShootoutActive ? "pointer-events-none select-none" : ""}`}>
      <MatchDebugMenu onRestart={handleRestartMatch} onEnd={handleEndMatch} />
      <MatchFacilityAbilitiesPanel />
      {/* Fondo Fijo */}
      <div className="fixed inset-0 -z-10 bg-slate-950">
        <Image
          src={getMatchBackgroundSrc(matchBackgroundIndex)}
          fill
          alt="background"
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/80 via-transparent to-slate-950/80" />
      </div>

      {/* --- NUEVO MARCADOR Y BARRA DE TURNOS --- */}
      <div className="w-full max-w-4xl bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 md:p-6 mb-6 border-2 border-slate-700 shadow-2xl flex flex-col gap-5">
        <MatchEnvironmentBadge timeOfDay={timeOfDay} weather={weather} />
        
        {/* Fila Principal de Marcador */}
        <div className="flex items-center justify-between w-full">
          
          {/* Local */}
          <div className="flex flex-col items-center gap-1 w-1/4 md:w-1/3">
            <ClubShield
              shieldUrl={homeTeam.shieldUrl}
              alt={homeTeam.name}
              className="w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-lg"
            />
            <span className="text-[10px] md:text-xl font-black uppercase text-center w-full truncate">
              {homeTeam.name}
            </span>
            <BurningPhaseIndicator
              side="home"
              burningPhaseActive={burningPhaseActive}
              currentTurn={currentTurn}
            />
          </div>

          {/* Zona Central (Goles) */}
          <div className="flex items-center justify-center gap-2 md:gap-6 w-2/4 md:w-1/3 bg-slate-950 py-2 px-4 rounded-2xl border-b-2 border-slate-800">
            {/* Controles Goles Local */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setOpenGoalSide("home")}
                className="p-1 hover:bg-slate-700 bg-slate-800 rounded text-slate-300"
                title="Gol a puerta vacía (local)"
              >
                <Plus size={16} />
              </button>
              <button onClick={() => addGoal("home", -1)} className="p-1 hover:bg-slate-700 bg-slate-800 rounded text-slate-500"><Minus size={16} /></button>
            </div>
            
            <span className="text-4xl md:text-6xl font-black w-10 md:w-16 text-center">{homeScore}</span>
            <span className="text-2xl text-slate-600 font-black">-</span>
            <span className="text-4xl md:text-6xl font-black w-10 md:w-16 text-center">{awayScore}</span>

            {/* Controles Goles Visitante */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setOpenGoalSide("away")}
                className="p-1 hover:bg-slate-700 bg-slate-800 rounded text-slate-300"
                title="Gol a puerta vacía (visitante)"
              >
                <Plus size={16} />
              </button>
              <button onClick={() => addGoal("away", -1)} className="p-1 hover:bg-slate-700 bg-slate-800 rounded text-slate-500"><Minus size={16} /></button>
            </div>
          </div>

          {/* Visitante */}
          <div className="flex flex-col items-center gap-1 w-1/4 md:w-1/3">
            <ClubShield
              shieldUrl={awayTeam.shieldUrl}
              alt={awayTeam.name}
              className="w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-lg"
            />
            <span className="text-[10px] md:text-xl font-black uppercase text-center w-full truncate">
              {awayTeam.name}
            </span>
            <BurningPhaseIndicator
              side="away"
              burningPhaseActive={burningPhaseActive}
              currentTurn={currentTurn}
            />
          </div>

        </div>

        {/* Fila de Barra de Turnos */}
        <div className="w-full flex flex-col gap-2 pt-2 border-t border-slate-800">
          <div className="flex justify-between items-center px-2">
            <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:block">
              {isPenaltyShootoutActive
                ? "Penaltis"
                : hasHalftime(matchFormat)
                  ? (isSecondHalf ? "Segunda Parte" : "Primera Parte")
                  : "Partido"}
            </span>
            
            {/* Indicador de Turno Actual */}
            <div className="flex-1 flex justify-center items-center gap-2">
              <button
                type="button"
                onClick={handlePrevTurn}
                disabled={!canGoBackTurn}
                title="Retroceder turno"
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className={`text-sm font-black uppercase tracking-widest px-4 py-1 rounded-full border tabular-nums ${
                isPenaltyShootoutActive
                  ? "text-amber-300 bg-amber-500/15 border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
                  : anyFuryActive
                  ? "text-orange-300 bg-orange-500/15 border-orange-400/50 shadow-[0_0_20px_rgba(249,115,22,0.35)] animate-pulse"
                  : "text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.1)]"
              }`}>
                {isPenaltyShootoutActive
                  ? penaltyShootout?.phase === "shooting"
                    ? `Penaltis ${penaltyShootout.homeScore}-${penaltyShootout.awayScore}`
                    : "Tanda de penaltis"
                  : `Turno ${currentTurn} / ${totalTurns}`}
              </span>
              <button
                type="button"
                onClick={handleNextTurn}
                disabled={!canAdvanceTurn}
                title="Avanzar turno"
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:block">
              {isPenaltyShootoutActive
                ? "Desempate"
                : hasHalftime(matchFormat)
                  ? (isSecondHalf ? "Final" : "Mitad")
                  : "Fin"}
            </span>
          </div>
          
          {/* Barra segmentada */}
          <div className={`w-full h-3 md:h-4 bg-slate-950 rounded-full flex overflow-hidden border p-0.5 gap-0.5 ${
            isPenaltyShootoutActive ? "border-amber-500/50" : "border-slate-800"
          }`}>
            {isPenaltyShootoutActive ? (
              <div className="flex-1 rounded-sm bg-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
            ) : (
            Array.from({ length: totalTurns }).map((_, i) => {
              const isFirstHalf = i < (totalTurns / 2);
              const isPast = i < turnDisplay;
              const isCurrent = i === turnDisplay - 1;
              const segmentFury =
                (homeFuryActive &&
                  burningPhaseActive.home > 0 &&
                  i >= burningPhaseActive.home - 1 &&
                  i < burningPhaseActive.home + BURNING_PHASE_DURATION_TURNS - 1) ||
                (awayFuryActive &&
                  burningPhaseActive.away > 0 &&
                  i >= burningPhaseActive.away - 1 &&
                  i < burningPhaseActive.away + BURNING_PHASE_DURATION_TURNS - 1);
              return (
                <div 
                  key={i} 
                  className={`flex-1 rounded-sm transition-colors duration-300 ${
                    isCurrent && anyFuryActive
                      ? "bg-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.9)] ring-1 ring-orange-300/80"
                      : segmentFury
                        ? "bg-orange-500/70 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                        : isPast 
                          ? (isFirstHalf 
                              ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' 
                              : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]') 
                          : 'bg-slate-800/50'
                  }`} 
                />
              );
            })
            )}
          </div>
        </div>

        {/* Cambios pendientes */}
        {(substitutions.home.pending || substitutions.away.pending) && (
          <div className="w-full flex flex-wrap justify-center gap-2 pt-2 border-t border-slate-800">
            {substitutions.home.pending && (
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-300/90 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-full">
                Local: cambio pendiente
              </span>
            )}
            {substitutions.away.pending && (
              <span className="text-[10px] font-black uppercase tracking-widest text-red-300/90 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-full">
                Visitante: cambio pendiente
              </span>
            )}
          </div>
        )}

        <BurningPhaseControls />

        {/* Posesión del balón */}
        <div className="w-full flex flex-col items-center gap-3 pt-2 border-t border-slate-800">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Posesión del balón
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setBallPossession("home")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                ballPossession === "home"
                  ? "bg-blue-600 border-2 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                  : "bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              Local
            </button>
            <button
              type="button"
              onClick={() => setBallPossession("away")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                ballPossession === "away"
                  ? "bg-red-600 border-2 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  : "bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              Visitante
            </button>
            <button
              type="button"
              onClick={() => openSubstitution("home")}
              title="Cambios local"
              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-slate-800 border border-blue-600/50 text-blue-300 hover:bg-blue-950/50 hover:border-blue-500 flex flex-col items-center gap-0.5 min-w-[52px]"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="tabular-nums">{MAX_SUBSTITUTIONS - substitutions.home.used}</span>
            </button>
            <button
              type="button"
              onClick={() => openSubstitution("away")}
              title="Cambios visitante"
              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-slate-800 border border-red-600/50 text-red-300 hover:bg-red-950/50 hover:border-red-500 flex flex-col items-center gap-0.5 min-w-[52px]"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="tabular-nums">{MAX_SUBSTITUTIONS - substitutions.away.used}</span>
            </button>
            <button
              type="button"
              onClick={handleEndMatch}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-slate-800 border border-emerald-600/50 text-emerald-300 hover:bg-emerald-950/50 hover:border-emerald-500 flex items-center gap-1.5"
            >
              <Flag className="w-3.5 h-3.5" />
              Final
            </button>
          </div>
        </div>

      </div>

      {/* --- BOTÓN DE TOGGLE (CARAS VS NÚMEROS) --- */}
      <div className="w-full max-w-4xl flex justify-center mb-4 px-2">
        <button
          onClick={() => setShowFaces(!showFaces)}
          className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-xl text-sm font-bold text-slate-300 transition-colors shadow-lg active:scale-95"
        >
          {showFaces ? <Hash size={16} className="text-amber-400" /> : <User size={16} className="text-blue-400" />}
          {showFaces ? "Ver Posiciones" : "Ver Caras"}
        </button>
      </div>

      {/* --- AVISO MODO DUELO --- */}
      {duelSelecting && (
        <div className="w-full max-w-4xl mb-4 px-2">
          <div className="bg-amber-500/15 border border-amber-400/40 rounded-2xl px-4 py-3 text-center space-y-3">
            <p className="text-sm md:text-base font-black text-amber-300 uppercase tracking-widest">
              Selecciona un jugador de cada equipo
            </p>
            <p className="text-xs text-amber-200/70">
              {!duelSelection.home && !duelSelection.away && "Toca un jugador local y uno visitante"}
              {duelSelection.home && !duelSelection.away && `${duelSelection.home.name} elegido — falta visitante`}
              {!duelSelection.home && duelSelection.away && `${duelSelection.away.name} elegido — falta local`}
              {canStartDuel && duelContext && `${getDuelTypeLabel(duelContext)} — configura y confirma`}
            </p>

            {canStartDuel && pendingDuelType === "FIELD" && (
              <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-700">
                <input
                  type="checkbox"
                  checked={inPenaltyArea}
                  onChange={(e) => setInPenaltyArea(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Choque en área de penalti (permite tiros al atacante)
                </span>
              </label>
            )}

            {canStartDuel &&
              (pendingDuelType === "GOAL" || (pendingDuelType === "FIELD" && inPenaltyArea)) && (
              <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-700">
                <input
                  type="checkbox"
                  checked={goalkeeperInSmallArea}
                  onChange={(e) => setGoalkeeperInSmallArea(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Portero dentro del área pequeña (tiro/parada)
                </span>
              </label>
            )}

            {canStartDuel && (
              <button
                type="button"
                onClick={handleStartDuel}
                className="w-full max-w-xs mx-auto py-3 rounded-xl font-black uppercase tracking-widest text-sm bg-linear-to-r from-amber-500 to-amber-600 border-b-4 border-amber-800 text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 transition-all"
              >
                Iniciar duelo
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- CAMPO CENTRAL --- */}
      <FullPitch
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        format={matchFormat}
        timeOfDay={timeOfDay}
        weather={weather}
        showFaces={showFaces}
        duelSelecting={duelSelecting}
        duelSelection={duelSelection}
        onDuelPlayerSelect={handleDuelPlayerSelect}
        onPlayerInspect={handlePlayerInspect}
        pitchSwapped={pitchSwapped}
        matchFacilityState={matchFacilityState}
      />

      {/* --- CONTROLES INFERIORES FLOTANTES --- */}
      <div className="fixed bottom-0 inset-x-0 p-4 md:p-6 bg-linear-to-t from-slate-950 via-slate-950/90 to-transparent flex flex-col items-center justify-end z-40 pointer-events-none">
        
        <div className="flex items-center gap-3 w-full max-w-md pointer-events-auto">
          {/* Botón Pasar Turno */}
          <button 
            onClick={handleNextTurn}
            disabled={!canAdvanceTurn}
            className="flex-1 bg-slate-800 border-2 border-slate-600 hover:border-slate-400 text-white font-bold py-4 rounded-2xl uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
          >
            Turno <ChevronRight size={20} className="-ml-1" />
          </button>
          
          {/* Botón Iniciar / Cancelar Duelo */}
          <button 
            onClick={handleDuelButtonClick}
            className={`flex-2 font-black py-4 rounded-2xl uppercase tracking-widest text-xl md:text-2xl transition-all flex items-center justify-center gap-2 active:scale-95 ${
              duelSelecting
                ? "bg-slate-700 border-2 border-slate-500 text-slate-200 hover:bg-slate-600"
                : "bg-linear-to-r from-amber-500 to-amber-600 border-b-4 border-amber-800 text-amber-950 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_50px_rgba(245,158,11,0.6)] hover:scale-105"
            }`}
          >
            <Swords size={28} /> {duelSelecting ? "CANCELAR" : "DUELO"}
          </button>
        </div>
        
      </div>

      {openGoalSide && homeTeam && awayTeam && (
        <OpenGoalModal
          attackingSide={openGoalSide}
          team={openGoalSide === "home" ? homeTeam : awayTeam}
          teamName={openGoalSide === "home" ? homeTeam.name : awayTeam.name}
          format={matchFormat}
          currentTurn={currentTurn}
          onConfirm={(player) => handleOpenGoalConfirm(openGoalSide, player)}
          onClose={() => setOpenGoalSide(null)}
        />
      )}

      {isDuelModalOpen && duelHomePlayer && duelAwayPlayer && duelContext && (
        <DuelModal 
          homePlayer={duelHomePlayer} 
          awayPlayer={duelAwayPlayer}
          homeTeamName={homeTeam.name}
          awayTeamName={awayTeam.name}
          currentTurn={currentTurn}
          duelContext={duelContext}
          format={matchFormat}
          onClose={() => {
            setIsDuelModalOpen(false);
            resetDuelSelection();
          }}
          onApplyDuel={handleApplyDuel}
        />
      )}

      {inspectedPlayer && (
        <PlayerStatsModal
          player={inspectedPlayer.player}
          isHome={inspectedPlayer.isHome}
          teamName={inspectedPlayer.isHome ? homeTeam.name : awayTeam.name}
          format={matchFormat}
          onClose={() => setInspectedPlayer(null)}
          canSubstitute={canSubstituteInspected}
          substitutionsRemaining={
            inspectedSubState ? MAX_SUBSTITUTIONS - inspectedSubState.used : undefined
          }
          onSubstitute={() =>
            openSubstitution(inspectedPlayer.isHome ? "home" : "away", inspectedPlayer.player.id)
          }
          canUseConsumables={matchStatus === "PLAYING"}
        />
      )}

      {substitutionSide && homeTeam && awayTeam && (
        <SubstitutionModal
          side={substitutionSide}
          teamName={substitutionSide === "home" ? homeTeam.name : awayTeam.name}
          team={substitutionSide === "home" ? homeTeam : awayTeam}
          format={matchFormat}
          subState={substitutions[substitutionSide]}
          initialOutPlayerId={substitutionPreselectOut}
          mode={showHalfTime ? "halftime" : "manual"}
          onRequest={(outId, inId) => requestSubstitution(substitutionSide, outId, inId)}
          onApplyHalftime={(outId, inId) => {
            applyHalftimeSubstitution(substitutionSide, outId, inId);
          }}
          onCancelPending={() => cancelPendingSubstitution(substitutionSide)}
          onClose={closeSubstitution}
        />
      )}

      {showExhaustionModal && currentExhaustion && (
        <SubstitutionModal
          side={currentExhaustion.side}
          teamName={currentExhaustion.side === "home" ? homeTeam.name : awayTeam.name}
          team={currentExhaustion.side === "home" ? homeTeam : awayTeam}
          format={matchFormat}
          subState={substitutions[currentExhaustion.side]}
          initialOutPlayerId={currentExhaustion.outPlayer.id}
          mode="exhaustion"
          onRequest={() => {}}
          onApplyExhaustion={handleExhaustionApply}
          onCancelPending={() => {}}
          onClose={handleExhaustionSkip}
        />
      )}

      {subAnimation.length > 0 && (
        <SubstitutionOverlay
          key={subAnimationKey}
          substitutions={subAnimation}
          onComplete={handleSubAnimationComplete}
        />
      )}

      {!kickoffResolved && (
        <CoinTossModal
          homeTeamName={homeTeam.name}
          awayTeamName={awayTeam.name}
          homeShieldUrl={homeTeam.shieldUrl}
          awayShieldUrl={awayTeam.shieldUrl}
          onComplete={({ ballPossession: possession, pitchSwapped: swapped }) =>
            completeKickoff(possession, swapped)
          }
        />
      )}

      {showHalfTime && homeTeam && awayTeam && (
        <HalfTimeModal
          homeTeamName={homeTeam.name}
          awayTeamName={awayTeam.name}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          format={matchFormat}
          homeShieldUrl={homeTeam.shieldUrl}
          awayShieldUrl={awayTeam.shieldUrl}
          homeScore={homeScore}
          awayScore={awayScore}
          totalTurns={totalTurns}
          matchStats={matchStats}
          homeHasBench={getBenchPlayers(homeTeam, matchFormat).length > 0}
          awayHasBench={getBenchPlayers(awayTeam, matchFormat).length > 0}
          onOpenSubstitutions={(side) => openSubstitution(side)}
          onContinue={handleHalfTimeContinue}
        />
      )}

      {penaltyShootout?.phase === "setup" && homeTeam && awayTeam && (
        <PenaltyShootoutSetupModal
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          format={matchFormat}
          shootout={penaltyShootout}
          onUpdateLineup={setPenaltyShootoutLineup}
          onConfirmSetup={confirmPenaltyShootoutSetup}
          onReopenSetup={reopenPenaltyShootoutSetup}
        />
      )}

      {penaltyShootout?.phase === "coin_toss" && homeTeam && awayTeam && (
        <PenaltyCoinTossModal
          homeTeamName={homeTeam.name}
          awayTeamName={awayTeam.name}
          homeShieldUrl={homeTeam.shieldUrl}
          awayShieldUrl={awayTeam.shieldUrl}
          onComplete={completePenaltyCoinToss}
        />
      )}

      {penaltyShootout?.phase === "shooting" && homeTeam && awayTeam && (
        <PenaltyShootoutPanel
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          format={matchFormat}
          shootout={penaltyShootout}
          onMiss={() => recordPenaltyShotOutcome("miss")}
          onGoal={() => recordPenaltyShotOutcome("goal")}
          onDuel={() => setIsPenaltyDuelOpen(true)}
        />
      )}

      {isPenaltyDuelOpen && penaltyDuelHomePlayer && penaltyDuelAwayPlayer && penaltyDuelContext && (
        <DuelModal
          homePlayer={penaltyDuelHomePlayer}
          awayPlayer={penaltyDuelAwayPlayer}
          homeTeamName={homeTeam.name}
          awayTeamName={awayTeam.name}
          currentTurn={currentTurn}
          duelContext={penaltyDuelContext}
          format={matchFormat}
          onClose={() => setIsPenaltyDuelOpen(false)}
          onApplyDuel={handleApplyDuel}
        />
      )}

    </div>
  );
}