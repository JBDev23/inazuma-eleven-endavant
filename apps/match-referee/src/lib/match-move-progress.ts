import {
  applyMoveUsageProgress,
  previewMoveLevelUp,
  type EvolutionPath,
  type EvolutionSpeed,
  type MoveLevelUpPreview,
  type MoveUsageRecord,
  type PlayerMoveWithProgress,
  type PlayerWithDetails,
} from "@inazuma/shared";

export type MatchMoveLevelUpEvent = MoveLevelUpPreview & {
  side: "home" | "away";
};

export function countMatchMoveUsages(
  usages: MoveUsageRecord[],
  playerId: number,
  moveId: number,
): number {
  return usages.filter((u) => u.playerId === playerId && u.moveId === moveId).length;
}

function readMoveEvolution(move: PlayerMoveWithProgress): {
  evolutionPath: EvolutionPath;
  evolutionSpeed: EvolutionSpeed;
} {
  return {
    evolutionPath: (move.evolutionPath ?? "NONE") as EvolutionPath,
    evolutionSpeed: (move.evolutionSpeed ?? "NONE") as EvolutionSpeed,
  };
}

export function previewPlayerMoveLevelUp(
  player: PlayerWithDetails,
  moveId: number,
  matchUsages: MoveUsageRecord[],
): Omit<MatchMoveLevelUpEvent, "side"> | null {
  const move = player.moves.find((m) => m.id === moveId);
  if (!move) return null;

  const { evolutionPath, evolutionSpeed } = readMoveEvolution(move);
  const usesInMatch = countMatchMoveUsages(matchUsages, player.id, moveId);
  const preview = previewMoveLevelUp(
    move.uses ?? 0,
    move.currentLevel ?? 1,
    evolutionPath,
    evolutionSpeed,
    usesInMatch,
  );

  if (!preview) return null;

  return {
    playerId: player.id,
    playerName: player.name,
    moveId: move.id,
    moveName: move.name,
    element: move.element,
    moveType: move.type,
    ...preview,
  };
}

export function applyPlayerMoveUsageToRoster(
  roster: PlayerWithDetails[],
  playerId: number,
  moveId: number,
  matchUsages: MoveUsageRecord[],
): PlayerWithDetails[] {
  return roster.map((player) => {
    if (player.id !== playerId) return player;

    const move = player.moves.find((m) => m.id === moveId);
    if (!move) return player;

    const { evolutionPath, evolutionSpeed } = readMoveEvolution(move);
    const usesInMatch = countMatchMoveUsages(matchUsages, playerId, moveId);
    const progress = applyMoveUsageProgress(
      move.uses ?? 0,
      move.currentLevel ?? 1,
      evolutionPath,
      evolutionSpeed,
      usesInMatch,
    );

    return {
      ...player,
      moves: player.moves.map((m) =>
        m.id === moveId
          ? { ...m, uses: progress.uses, currentLevel: progress.moveLevel }
          : m,
      ),
    };
  });
}
