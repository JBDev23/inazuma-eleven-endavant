"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { MarketRequestState } from "@/components/market/MarketRequestState";
import { buildFieldSlots, getFallbackFormation } from "@/lib/formation-field";
import type { Coach, FormationWithClubStatus, PlayerWithDetails, UserClub } from "@inazuma/shared";
import { AlignmentPanel } from "@/components/tactics/AlignmentPanel";
import { ConvocadosPanel } from "@/components/tactics/ConvocadosPanel";
import { CoachPanel } from "@/components/tactics/CoachPanel";
import { SaveStrategyModal } from "@/components/tactics/SaveStrategyModal";
import { TacticsHeader } from "@/components/tactics/TacticsHeader";
import { TacticsPageTabs } from "@/components/tactics/TacticsPageTabs";
import { useFieldOrientation } from "@/components/tactics/use-field-orientation";
import {
  MAX_CONVOCADOS,
  type PageTab,
  type SaveModalState,
  type TacticsMode,
} from "@/components/tactics/types";
import { getPositionKey, getSaveWarnings, serializeRoster } from "@/components/tactics/utils";

export default function TacticsPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const orientation = useFieldOrientation();
  const isLandscape = orientation === "landscape";

  const [club, setClub] = useState<UserClub | null>(null);
  const [roster, setRoster] = useState<PlayerWithDetails[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [clubFormations, setClubFormations] = useState<FormationWithClubStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [savedRosterKey, setSavedRosterKey] = useState("");
  const [selectedFormation11Id, setSelectedFormation11Id] = useState<number | null>(null);
  const [selectedFormation4Id, setSelectedFormation4Id] = useState<number | null>(null);
  const [savedFormation11Id, setSavedFormation11Id] = useState<number | null>(null);
  const [savedFormation4Id, setSavedFormation4Id] = useState<number | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);
  const [savedCoachId, setSavedCoachId] = useState<number | null>(null);
  const [saveModal, setSaveModal] = useState<SaveModalState>(null);

  const [pageTab, setPageTab] = useState<PageTab>("alineacion");
  const [mode, setMode] = useState<TacticsMode>("11vs11");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const playerCount = mode === "11vs11" ? 11 : 4;
  const posKey = getPositionKey(mode);

  const availableFormations = useMemo(
    () => clubFormations.filter((f) => f.unlocked && f.playerCount === playerCount),
    [clubFormations, playerCount],
  );

  const activeFormation = useMemo((): FormationWithClubStatus => {
    const activeId = mode === "11vs11" ? selectedFormation11Id : selectedFormation4Id;

    const fromList = availableFormations.find((f) => f.id === activeId);
    if (fromList) return fromList;

    if (availableFormations.length > 0) return availableFormations[0];

    return {
      ...getFallbackFormation(playerCount),
      unlocked: false,
      unlockedByCoach: false,
      ownedByClub: false,
      isActive11: false,
      isActive4: false,
    };
  }, [mode, selectedFormation11Id, selectedFormation4Id, availableFormations, playerCount]);

  const slotsConfig = useMemo(
    () => buildFieldSlots(activeFormation, playerCount, orientation),
    [activeFormation, playerCount, orientation],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [clubData, formationsData] = await Promise.all([
        api.market.getUserClub(clubId),
        api.market.getClubFormations(clubId),
      ]);
      const initialRoster = clubData.roster || [];
      const initialCoaches = clubData.coaches || [];
      setClub(clubData);
      setRoster(initialRoster);
      setCoaches(initialCoaches);
      setSavedRosterKey(serializeRoster(initialRoster));
      setSelectedFormation11Id(clubData.activeFormation11Id);
      setSelectedFormation4Id(clubData.activeFormation4Id);
      setSavedFormation11Id(clubData.activeFormation11Id);
      setSavedFormation4Id(clubData.activeFormation4Id);
      setSelectedCoachId(clubData.activeCoachId ?? null);
      setSavedCoachId(clubData.activeCoachId ?? null);
      setClubFormations(formationsData);
    } catch (err) {
      console.error(err);
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssignPlayer = (playerId: number) => {
    if (selectedSlot === null) return;

    setRoster((prev) =>
      prev.map((player) => {
        if (player[posKey] === selectedSlot) {
          return { ...player, [posKey]: null };
        }
        if (player.id === playerId) {
          return { ...player, [posKey]: selectedSlot, isActiveRoster: true };
        }
        return player;
      }),
    );

    setSelectedSlot(null);
  };

  const handleRemovePlayerFromSlot = (slot: number) => {
    setRoster((prev) =>
      prev.map((p) => (p[posKey] === slot ? { ...p, [posKey]: null } : p)),
    );
  };

  const convocadosCount = useMemo(
    () => roster.filter((p) => p.isActiveRoster).length,
    [roster],
  );

  const hasChanges = useMemo(
    () =>
      serializeRoster(roster) !== savedRosterKey ||
      selectedFormation11Id !== savedFormation11Id ||
      selectedFormation4Id !== savedFormation4Id ||
      selectedCoachId !== savedCoachId,
    [
      roster,
      savedRosterKey,
      selectedFormation11Id,
      selectedFormation4Id,
      savedFormation11Id,
      savedFormation4Id,
      selectedCoachId,
      savedCoachId,
    ],
  );

  const handleToggleConvocado = (playerId: number) => {
    setRoster((prev) => {
      const player = prev.find((p) => p.id === playerId);
      if (!player) return prev;

      if (player.isActiveRoster) {
        return prev.map((p) =>
          p.id === playerId
            ? { ...p, isActiveRoster: false, position11: null, position4: null }
            : p,
        );
      }

      if (convocadosCount >= MAX_CONVOCADOS) {
        alert(`❌ Máximo ${MAX_CONVOCADOS} jugadores convocados`);
        return prev;
      }

      return prev.map((p) => (p.id === playerId ? { ...p, isActiveRoster: true } : p));
    });
  };

  const handleFormationChange = (formationId: number) => {
    if (formationId === activeFormation.id) return;

    if (mode === "11vs11") {
      setSelectedFormation11Id(formationId);
    } else {
      setSelectedFormation4Id(formationId);
    }
  };

  const executeSave = async () => {
    setSaving(true);
    try {
      let activeFormation11Id = savedFormation11Id;
      let activeFormation4Id = savedFormation4Id;
      let activeCoachId = savedCoachId;
      let formationsData: FormationWithClubStatus[] | null = null;

      if (selectedCoachId !== savedCoachId) {
        const updatedClubCoach = await api.market.updateUserClub(clubId, {
          activeCoachId: selectedCoachId,
        });
        activeCoachId = updatedClubCoach.activeCoachId ?? null;
        formationsData = await api.market.getClubFormations(clubId);
      }

      if (selectedFormation11Id !== savedFormation11Id && selectedFormation11Id !== null) {
        const result = await api.market.activateFormation(clubId, selectedFormation11Id);
        activeFormation11Id = result.activeFormation11Id;
        activeFormation4Id = result.activeFormation4Id;
      }

      if (selectedFormation4Id !== savedFormation4Id && selectedFormation4Id !== null) {
        const result = await api.market.activateFormation(clubId, selectedFormation4Id);
        activeFormation11Id = result.activeFormation11Id;
        activeFormation4Id = result.activeFormation4Id;
      }

      const updatedClub = await api.market.updateRoster(clubId, {
        roster: roster.map((p) => ({
          playerId: p.id,
          isActiveRoster: p.isActiveRoster,
          position11: p.position11,
          position4: p.position4,
        })),
      });
      const savedRoster = updatedClub.roster || [];
      const savedCoaches = updatedClub.coaches || coaches;
      setClub(updatedClub);
      setRoster(savedRoster);
      setCoaches(savedCoaches);
      setSavedRosterKey(serializeRoster(savedRoster));
      setSelectedFormation11Id(activeFormation11Id);
      setSelectedFormation4Id(activeFormation4Id);
      setSavedFormation11Id(activeFormation11Id);
      setSavedFormation4Id(activeFormation4Id);
      setSelectedCoachId(activeCoachId ?? null);
      setSavedCoachId(activeCoachId ?? null);
      if (formationsData) {
        setClubFormations(
          formationsData.map((f) => ({
            ...f,
            isActive11: activeFormation11Id === f.id,
            isActive4: activeFormation4Id === f.id,
          })),
        );
      } else {
        setClubFormations((prev) =>
          prev.map((f) => ({
            ...f,
            isActive11: activeFormation11Id === f.id,
            isActive4: activeFormation4Id === f.id,
          })),
        );
      }
      setSaveModal({ type: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setSaveModal({ type: "error", message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (!hasChanges || saving) return;

    const warnings = getSaveWarnings(roster);
    if (warnings.length > 0) {
      setSaveModal({ type: "confirm", warnings });
      return;
    }

    void executeSave();
  };

  const handlePageTabChange = (tab: PageTab) => {
    setPageTab(tab);
    setSelectedSlot(null);
  };

  const handleModeChange = (newMode: TacticsMode) => {
    setMode(newMode);
    setSelectedSlot(null);
  };

  if (loading) {
    return <MarketRequestState title="Abriendo pizarra..." loadingLabel="Estamos cargando la alineacion, las formaciones y tu plantilla." accentClassName="text-blue-500" />;
  }

  if (loadError) {
    return (
      <MarketRequestState
        title="Abriendo pizarra..."
        error={loadError}
        onRetry={loadData}
      />
    );
  }

  const getPlayerInSlot = (slot: number) => roster.find((p) => p[posKey] === slot);
  const availablePlayers = roster.filter((p) => p.isActiveRoster && !p[posKey]);
  const usingFallback = activeFormation.id === 0;
  const selectedSlotConfig = selectedSlot !== null ? slotsConfig[selectedSlot] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-8">
      <TacticsHeader
        clubId={clubId}
        clubName={club?.name}
        hasChanges={hasChanges}
        saving={saving}
        onSave={handleSaveClick}
      />

      <TacticsPageTabs activeTab={pageTab} onTabChange={handlePageTabChange} />

      {pageTab === "convocados" && (
        <ConvocadosPanel
          roster={roster}
          convocadosCount={convocadosCount}
          onToggleConvocado={handleToggleConvocado}
        />
      )}

      {pageTab === "alineacion" && (
        <AlignmentPanel
          mode={mode}
          isLandscape={isLandscape}
          activeFormation={activeFormation}
          availableFormations={availableFormations}
          playerCount={playerCount}
          usingFallback={usingFallback}
          activatingFormation={saving}
          slotsConfig={slotsConfig}
          selectedSlot={selectedSlot}
          selectedSlotRole={selectedSlotConfig?.role ?? null}
          availablePlayers={availablePlayers}
          getPlayerInSlot={getPlayerInSlot}
          onModeChange={handleModeChange}
          onFormationChange={handleFormationChange}
          onSelectSlot={setSelectedSlot}
          onCloseSlot={() => setSelectedSlot(null)}
          onAssignPlayer={handleAssignPlayer}
          onRemoveFromSlot={handleRemovePlayerFromSlot}
        />
      )}

      {pageTab === "entrenador" && (
        <CoachPanel
          coaches={coaches}
          selectedCoachId={selectedCoachId}
          onSelectCoach={setSelectedCoachId}
        />
      )}

      {saveModal && (
        <SaveStrategyModal
          state={saveModal}
          saving={saving}
          onConfirm={() => void executeSave()}
          onClose={() => setSaveModal(null)}
        />
      )}
    </div>
  );
}
