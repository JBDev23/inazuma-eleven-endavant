"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Formation, FormationWithClubStatus, PlayerWithDetails, UserClub } from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import { buildFieldSlots, getFallbackFormation } from "@/lib/formation-field";
import { getActiveFormationId, getPositionKey, serializeLineup } from "@/lib/roster-utils";
import { api } from "@/services/api";

interface UsePrematchTeamOptions {
  club: UserClub;
  matchFormat: MatchFormat;
}

export function usePrematchTeam({ club, matchFormat }: UsePrematchTeamOptions) {
  const [roster, setRoster] = useState<PlayerWithDetails[]>(club.roster);
  const [clubFormations, setClubFormations] = useState<FormationWithClubStatus[]>([]);
  const [loadingFormations, setLoadingFormations] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const playerCount = matchFormat === "11v11" ? 11 : 4;
  const posKey = getPositionKey(matchFormat);

  const [selectedFormationId, setSelectedFormationId] = useState<number | null>(
    () => getActiveFormationId(club, matchFormat),
  );
  const [savedFormationId, setSavedFormationId] = useState<number | null>(
    () => getActiveFormationId(club, matchFormat),
  );
  const [savedLineupKey, setSavedLineupKey] = useState(() =>
    serializeLineup(club.roster, matchFormat),
  );

  const resetFromClub = useCallback(
    (nextClub: UserClub) => {
      const formationId = getActiveFormationId(nextClub, matchFormat);
      setRoster(nextClub.roster);
      setSelectedFormationId(formationId);
      setSavedFormationId(formationId);
      setSavedLineupKey(serializeLineup(nextClub.roster, matchFormat));
      setSelectedSlot(null);
    },
    [matchFormat],
  );

  useEffect(() => {
    resetFromClub(club);
  }, [club, matchFormat, resetFromClub]);

  useEffect(() => {
    let cancelled = false;

    const loadFormations = async () => {
      setLoadingFormations(true);
      try {
        const formations = await api.clubs.getFormations(club.id);
        if (!cancelled) setClubFormations(formations);
      } catch (err) {
        console.error(err);
        if (!cancelled) setClubFormations([]);
      } finally {
        if (!cancelled) setLoadingFormations(false);
      }
    };

    void loadFormations();
    return () => {
      cancelled = true;
    };
  }, [club.id]);

  const availableFormations = useMemo(
    () => clubFormations.filter((f) => f.unlocked && f.playerCount === playerCount),
    [clubFormations, playerCount],
  );

  const activeFormation = useMemo((): Formation => {
    const fromList = availableFormations.find((f) => f.id === selectedFormationId);
    if (fromList) return fromList;

    if (availableFormations.length > 0) return availableFormations[0];

    const clubFormation = matchFormat === "11v11" ? club.formation11 : club.formation4;
    if (clubFormation) return clubFormation;

    return getFallbackFormation(playerCount);
  }, [
    availableFormations,
    selectedFormationId,
    club.formation11,
    club.formation4,
    matchFormat,
    playerCount,
  ]);

  const slotsConfig = useMemo(
    () => buildFieldSlots(activeFormation, playerCount, "portrait"),
    [activeFormation, playerCount],
  );

  const hasChanges = useMemo(
    () =>
      serializeLineup(roster, matchFormat) !== savedLineupKey ||
      selectedFormationId !== savedFormationId,
    [roster, matchFormat, savedLineupKey, selectedFormationId, savedFormationId],
  );

  const handleAssignPlayer = useCallback(
    (playerId: number) => {
      if (selectedSlot === null) return;

      setRoster((prev) =>
        prev.map((player) => {
          if (player[posKey] === selectedSlot) {
            return { ...player, [posKey]: null };
          }
          if (player.id === playerId && player.isActiveRoster) {
            return { ...player, [posKey]: selectedSlot };
          }
          return player;
        }),
      );
      setSelectedSlot(null);
    },
    [selectedSlot, posKey],
  );

  const handleRemoveFromSlot = useCallback(
    (slot: number) => {
      setRoster((prev) =>
        prev.map((p) => (p[posKey] === slot ? { ...p, [posKey]: null } : p)),
      );
    },
    [posKey],
  );

  const handleFormationChange = useCallback((formationId: number) => {
    setSelectedFormationId(formationId);
  }, []);

  const save = useCallback(async (): Promise<UserClub> => {
    setSaving(true);
    try {
      if (selectedFormationId !== savedFormationId && selectedFormationId !== null) {
        await api.clubs.activateFormation(club.id, selectedFormationId);
      }

      const updatedClub = await api.clubs.updateRoster(club.id, {
        roster: roster.map((p) => ({
          playerId: p.id,
          isActiveRoster: p.isActiveRoster,
          position11: p.position11,
          position4: p.position4,
        })),
      });

      const formationId = getActiveFormationId(updatedClub, matchFormat);
      setRoster(updatedClub.roster);
      setSavedFormationId(formationId);
      setSelectedFormationId(formationId);
      setSavedLineupKey(serializeLineup(updatedClub.roster, matchFormat));

      return updatedClub;
    } finally {
      setSaving(false);
    }
  }, [club.id, matchFormat, roster, savedFormationId, selectedFormationId]);

  const getPlayerInSlot = useCallback(
    (slot: number) => roster.find((p) => p[posKey] === slot),
    [roster, posKey],
  );

  const availablePlayers = useMemo(
    () => roster.filter((p) => p.isActiveRoster && !p[posKey]),
    [roster, posKey],
  );

  const bench = useMemo(
    () =>
      roster
        .filter((p) => p.isActiveRoster && !p[posKey])
        .sort((a, b) => a.name.localeCompare(b.name)),
    [roster, posKey],
  );

  const starterCount = useMemo(
    () =>
      roster.filter((p) => {
        const pos = p[posKey];
        return pos !== null && pos >= 1 && pos <= playerCount;
      }).length,
    [roster, posKey, playerCount],
  );

  return {
    roster,
    loadingFormations,
    saving,
    selectedSlot,
    setSelectedSlot,
    activeFormation,
    availableFormations,
    slotsConfig,
    hasChanges,
    handleAssignPlayer,
    handleRemoveFromSlot,
    handleFormationChange,
    save,
    getPlayerInSlot,
    availablePlayers,
    bench,
    starterCount,
    playerCount,
    usingFallback: activeFormation.id === 0,
  };
}
