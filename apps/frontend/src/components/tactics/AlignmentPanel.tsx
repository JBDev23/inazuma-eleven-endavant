import type { FormationWithClubStatus, PlayerWithDetails } from "@inazuma/shared";
import type { SlotCoord } from "@/lib/formation-field";
import type { TacticsMode } from "./types";
import { AlignmentModeTabs } from "./AlignmentModeTabs";
import { FormationSelector } from "./FormationSelector";
import { TacticsField } from "./TacticsField";
import { AssignPlayerModal } from "./AssignPlayerModal";

interface AlignmentPanelProps {
  mode: TacticsMode;
  isLandscape: boolean;
  activeFormation: FormationWithClubStatus;
  availableFormations: FormationWithClubStatus[];
  playerCount: number;
  usingFallback: boolean;
  activatingFormation: boolean;
  slotsConfig: Record<number, SlotCoord>;
  selectedSlot: number | null;
  selectedSlotRole: string | null;
  availablePlayers: PlayerWithDetails[];
  getPlayerInSlot: (slot: number) => PlayerWithDetails | undefined;
  onModeChange: (mode: TacticsMode) => void;
  onFormationChange: (formationId: number) => void;
  onSelectSlot: (slot: number) => void;
  onCloseSlot: () => void;
  onAssignPlayer: (playerId: number) => void;
  onRemoveFromSlot: (slot: number) => void;
}

export function AlignmentPanel({
  mode,
  isLandscape,
  activeFormation,
  availableFormations,
  playerCount,
  usingFallback,
  activatingFormation,
  slotsConfig,
  selectedSlot,
  selectedSlotRole,
  availablePlayers,
  getPlayerInSlot,
  onModeChange,
  onFormationChange,
  onSelectSlot,
  onCloseSlot,
  onAssignPlayer,
  onRemoveFromSlot,
}: AlignmentPanelProps) {
  return (
    <>
      <AlignmentModeTabs mode={mode} onModeChange={onModeChange} />

      <FormationSelector
        activeFormation={activeFormation}
        availableFormations={availableFormations}
        playerCount={playerCount}
        usingFallback={usingFallback}
        activating={activatingFormation}
        onFormationChange={onFormationChange}
      />

      <TacticsField
        isLandscape={isLandscape}
        activeFormation={activeFormation}
        playerCount={playerCount}
        slotsConfig={slotsConfig}
        getPlayerInSlot={getPlayerInSlot}
        onSelectSlot={onSelectSlot}
        onRemoveFromSlot={onRemoveFromSlot}
      />

      {selectedSlot !== null && selectedSlotRole && (
        <AssignPlayerModal
          slot={selectedSlot}
          role={selectedSlotRole}
          players={availablePlayers}
          onAssign={onAssignPlayer}
          onClose={onCloseSlot}
        />
      )}
    </>
  );
}
