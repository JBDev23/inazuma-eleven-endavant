"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { MatchXpResult, MatchWinnerRewards } from "@inazuma/shared";
import { calculateMatchXp, resolveMatchWinnerClubId } from "@inazuma/shared";
import { useMatchStore } from "@/store/useMatchStore";
import { useMatchStoreHydration } from "@/hooks/useMatchStoreHydration";
import { PostMatchView } from "@/components/postmatch/PostMatchView";
import { api } from "@/services/api";
import { previewMatchXp } from "@/lib/match-xp";
import { applyConsumableDecrementsToTeam } from "@/lib/match-consumables";
import { buildPendingMatchUpload } from "@/lib/match-upload";
import {
  addPendingUpload,
  fetchAndCacheGameSettings,
  getCachedGameSettings,
  hasPendingUpload,
  isBrowserOnline,
  isMatchXpApplied,
  markMatchXpApplied,
  removePendingUpload,
  subscribePendingUploads,
} from "@/lib/offline-storage";

function buildWinnerRewardsPreview(
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
  settings: NonNullable<ReturnType<typeof getCachedGameSettings>>,
  penaltyWinnerSide?: "home" | "away" | null,
): MatchWinnerRewards | null {
  const sessionConfig =
    settings.sessionConfigs.find((c) => c.session === settings.currentSession) ?? null;
  const winnerClubId = penaltyWinnerSide
    ? penaltyWinnerSide === "home"
      ? homeTeamId
      : awayTeamId
    : resolveMatchWinnerClubId(
        homeTeamId,
        awayTeamId,
        homeScore,
        awayScore,
      );

  if (
    !winnerClubId ||
    !sessionConfig ||
    (sessionConfig.winnerRewardPp <= 0 && sessionConfig.winnerRewardYens <= 0)
  ) {
    return null;
  }

  return {
    clubId: winnerClubId,
    pp: sessionConfig.winnerRewardPp,
    yens: sessionConfig.winnerRewardYens,
  };
}

function buildOfflinePreview(
  homeTeam: NonNullable<ReturnType<typeof useMatchStore.getState>["homeTeam"]>,
  awayTeam: NonNullable<ReturnType<typeof useMatchStore.getState>["awayTeam"]>,
  matchStats: ReturnType<typeof useMatchStore.getState>["matchStats"],
  matchFormat: ReturnType<typeof useMatchStore.getState>["matchFormat"],
  totalTurns: number,
  homeScore: number,
  awayScore: number,
  settings: NonNullable<ReturnType<typeof getCachedGameSettings>>,
): { matchXp: MatchXpResult; winnerRewards: MatchWinnerRewards | null } {
  const matchXp = previewMatchXp(
    matchFormat,
    totalTurns,
    settings,
    homeTeam,
    awayTeam,
    matchStats,
    { home: homeScore, away: awayScore },
  );

  return {
    matchXp,
    winnerRewards: buildWinnerRewardsPreview(
      homeTeam.id,
      awayTeam.id,
      homeScore,
      awayScore,
      settings,
      matchStats.penaltyShootout?.winnerSide ?? null,
    ),
  };
}

export default function PostMatchPage() {
  const router = useRouter();
  const hydrated = useMatchStoreHydration();
  const appliedRef = useRef(false);
  const [matchXp, setMatchXp] = useState<MatchXpResult | null>(null);
  const [matchXpLoading, setMatchXpLoading] = useState(true);
  const [matchXpError, setMatchXpError] = useState<string | null>(null);
  const [matchXpApplied, setMatchXpApplied] = useState(false);
  const [matchXpPending, setMatchXpPending] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [winnerRewards, setWinnerRewards] = useState<MatchWinnerRewards | null>(null);

  const {
    matchStatus,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    currentTurn,
    totalTurns,
    matchFormat,
    matchStats,
    resetMatch,
    restartMatch,
    updateTeam,
  } = useMatchStore();

  const finishedAt = matchStats.finishedAt;

  const applyRosterUpdates = useCallback(
    (
      result: Awaited<ReturnType<typeof api.gameSettings.applyMatchXp>>,
      currentHome: NonNullable<typeof homeTeam>,
      currentAway: NonNullable<typeof awayTeam>,
    ) => {
      const applyMoveGrants = (roster: typeof currentHome.roster) =>
        roster.map((p) => {
          const grant = result.grants.find((g) => g.playerId === p.id);
          const moveGrantsForPlayer = (result.moveGrants ?? []).filter(
            (g) => g.playerId === p.id,
          );
          const moves =
            moveGrantsForPlayer.length > 0
              ? p.moves.map((move) => {
                  const moveGrant = moveGrantsForPlayer.find((g) => g.moveId === move.id);
                  if (!moveGrant) return move;
                  return {
                    ...move,
                    uses: moveGrant.newUses,
                    currentLevel: moveGrant.newMoveLevel,
                  };
                })
              : p.moves;

          if (!grant && moveGrantsForPlayer.length === 0) return p;

          const breakdown = result.matchXp.players.find((b) => b.playerId === p.id);
          return {
            ...p,
            moves,
            ...(grant
              ? {
                  level: grant.newLevel,
                  experience: breakdown?.newExperience ?? p.experience,
                }
              : {}),
          };
        });

      const homeRoster = applyMoveGrants(currentHome.roster);
      const awayRoster = applyMoveGrants(currentAway.roster);

      updateTeam("home", {
        ...currentHome,
        roster: homeRoster,
        consumables: applyConsumableDecrementsToTeam(
          currentHome,
          matchStats.consumableUsages ?? [],
        ).consumables,
      });
      updateTeam("away", {
        ...currentAway,
        roster: awayRoster,
        consumables: applyConsumableDecrementsToTeam(
          currentAway,
          matchStats.consumableUsages ?? [],
        ).consumables,
      });
    },
    [updateTeam, matchStats.consumableUsages],
  );

  const saveAsPending = useCallback(() => {
    if (!homeTeam || !awayTeam || !finishedAt) return;

    addPendingUpload(
      buildPendingMatchUpload(
        homeTeam,
        awayTeam,
        matchStats,
        matchFormat,
        totalTurns,
        homeScore,
        awayScore,
      ),
    );
    setMatchXpPending(true);
  }, [
    homeTeam,
    awayTeam,
    finishedAt,
    matchStats,
    matchFormat,
    totalTurns,
    homeScore,
    awayScore,
  ]);

  const showOfflinePreview = useCallback(() => {
    if (!homeTeam || !awayTeam) return false;

    const settings = getCachedGameSettings();
    if (!settings) {
      setMatchXpError(
        "Sin conexión y sin datos de sesión en caché. Conecta a internet para subir el resultado.",
      );
      return false;
    }

    const preview = buildOfflinePreview(
      homeTeam,
      awayTeam,
      matchStats,
      matchFormat,
      totalTurns,
      homeScore,
      awayScore,
      settings,
    );
    setMatchXp(preview.matchXp);
    setWinnerRewards(preview.winnerRewards);
    return true;
  }, [
    homeTeam,
    awayTeam,
    matchStats,
    matchFormat,
    totalTurns,
    homeScore,
    awayScore,
  ]);

  const grantXp = useCallback(async () => {
    if (!homeTeam || !awayTeam || !finishedAt) return;

    setMatchXpLoading(true);
    setMatchXpError(null);
    setMatchXpPending(false);

    try {
      let settings = getCachedGameSettings();
      if (isBrowserOnline()) {
        try {
          settings = await fetchAndCacheGameSettings(() => api.gameSettings.get());
        } catch {
          if (!settings) throw new Error("No se pudo obtener la configuración de sesión");
        }
      } else if (!settings) {
        throw new Error("Sin conexión. El resultado se guardará para subirlo después.");
      }

      if (isMatchXpApplied(finishedAt)) {
        const preview = buildOfflinePreview(
          homeTeam,
          awayTeam,
          matchStats,
          matchFormat,
          totalTurns,
          homeScore,
          awayScore,
          settings!,
        );
        setMatchXp(preview.matchXp);
        setWinnerRewards(preview.winnerRewards);
        setMatchXpApplied(true);
        return;
      }

      if (hasPendingUpload(finishedAt) && !isBrowserOnline()) {
        saveAsPending();
        showOfflinePreview();
        setMatchXpError("Sin conexión. Resultado guardado localmente.");
        return;
      }

      const payload = buildPendingMatchUpload(
        homeTeam,
        awayTeam,
        matchStats,
        matchFormat,
        totalTurns,
        homeScore,
        awayScore,
      ).payload;

      const result = await api.gameSettings.applyMatchXp(payload);

      setMatchXp(result.matchXp);
      setWinnerRewards(result.winnerRewards);
      setMatchXpApplied(true);
      markMatchXpApplied(finishedAt);
      removePendingUpload(finishedAt);
      applyRosterUpdates(result, homeTeam, awayTeam);
    } catch (err) {
      saveAsPending();
      const previewShown = showOfflinePreview();

      if (!previewShown) return;

      const message =
        err instanceof Error ? err.message : "Error al aplicar XP";
      setMatchXpError(
        isBrowserOnline()
          ? `${message}. Resultado guardado para reintentar.`
          : "Sin conexión. Resultado guardado localmente.",
      );
    } finally {
      setMatchXpLoading(false);
    }
  }, [
    homeTeam,
    awayTeam,
    finishedAt,
    matchStats,
    matchFormat,
    totalTurns,
    homeScore,
    awayScore,
    saveAsPending,
    showOfflinePreview,
    applyRosterUpdates,
  ]);

  useEffect(() => {
    if (!hydrated) return;

    if (matchStatus !== "FINISHED" || !homeTeam || !awayTeam) {
      router.replace("/");
    }
  }, [hydrated, matchStatus, homeTeam, awayTeam, router]);

  useEffect(() => {
    if (!hydrated || matchStatus !== "FINISHED" || !homeTeam || !awayTeam) return;
    if (appliedRef.current) return;
    appliedRef.current = true;

    void grantXp();
  }, [hydrated, matchStatus, homeTeam, awayTeam, grantXp]);

  useEffect(() => {
    if (!finishedAt) return;

    return subscribePendingUploads(() => {
      if (isMatchXpApplied(finishedAt)) {
        setMatchXpApplied(true);
        setMatchXpPending(false);
        setMatchXpError(null);
      } else if (hasPendingUpload(finishedAt)) {
        setMatchXpPending(true);
      }
    });
  }, [finishedAt]);

  const handleRetryUpload = async () => {
    if (!homeTeam || !awayTeam || !finishedAt || isRetrying) return;

    setIsRetrying(true);
    setMatchXpError(null);

    try {
      appliedRef.current = false;
      await grantXp();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleGoHome = () => {
    if (!matchXpApplied && homeTeam && awayTeam) {
      saveAsPending();
    }
    resetMatch();
    router.replace("/");
  };

  const handleRematch = () => {
    if (!matchXpApplied && homeTeam && awayTeam) {
      saveAsPending();
    }
    restartMatch();
    router.replace("/match");
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (matchStatus !== "FINISHED" || !homeTeam || !awayTeam) {
    return null;
  }

  return (
    <PostMatchView
      homeTeamName={homeTeam.name}
      awayTeamName={awayTeam.name}
      homeClubId={homeTeam.id}
      awayClubId={awayTeam.id}
      homeShieldUrl={homeTeam.shieldUrl}
      awayShieldUrl={awayTeam.shieldUrl}
      homeScore={homeScore}
      awayScore={awayScore}
      matchFormat={matchFormat}
      currentTurn={currentTurn}
      matchStats={matchStats}
      matchXp={matchXp}
      matchXpLoading={matchXpLoading}
      matchXpError={matchXpError}
      matchXpApplied={matchXpApplied}
      matchXpPending={matchXpPending}
      isOnline={isBrowserOnline()}
      isRetrying={isRetrying}
      onRetryUpload={() => void handleRetryUpload()}
      winnerRewards={winnerRewards}
      onGoHome={handleGoHome}
      onRematch={handleRematch}
    />
  );
}
