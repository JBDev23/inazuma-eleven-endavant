import type { MoveType, PlayerMoveWithProgress, PlayerWithDetails, UserClub } from './types';

export type RawPlayerWithMoves = Record<string, unknown>;

type RawPlayerMoveEntry = {
  unlockLevel?: number;
  moveLevel?: number;
  currentLevel?: number;
  uses?: number;
  isUnlocked?: boolean;
  move?: Record<string, unknown>;
  id?: number | string;
  type?: string;
};

function parseNumericId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function parseMoveType(entry: RawPlayerMoveEntry): string | undefined {
  if (typeof entry.type === 'string' && entry.type.length > 0) {
    return entry.type;
  }

  const nestedType = entry.move?.type;
  if (typeof nestedType === 'string' && nestedType.length > 0) {
    return nestedType;
  }

  return undefined;
}

export function isValidPlayerMove(move: unknown): move is PlayerMoveWithProgress {
  if (!move || typeof move !== 'object') return false;
  const entry = move as RawPlayerMoveEntry;
  return parseNumericId(entry.id) != null && parseMoveType(entry) != null;
}

function formatPlayerMove(
  entry: RawPlayerMoveEntry,
  playerLevel: number,
): PlayerMoveWithProgress | null {
  const unlockLevel = entry.unlockLevel ?? 1;
  const moveId = parseNumericId(entry.id);
  const moveType = parseMoveType(entry);

  if (moveId != null && moveType) {
    return {
      ...(entry as PlayerMoveWithProgress),
      id: moveId,
      type: moveType as MoveType,
      unlockLevel,
      currentLevel: entry.currentLevel ?? entry.moveLevel ?? 1,
      uses: entry.uses ?? 0,
      isUnlocked: playerLevel >= unlockLevel,
    };
  }

  if (entry.move && typeof entry.move === 'object') {
    const nestedId = parseNumericId(entry.move.id);
    const nestedType = parseMoveType({
      type: entry.move.type as string | undefined,
      move: entry.move,
    });

    if (nestedId == null || !nestedType) return null;

    return {
      ...(entry.move as Omit<
        PlayerMoveWithProgress,
        'unlockLevel' | 'currentLevel' | 'uses' | 'isUnlocked'
      >),
      id: nestedId,
      type: nestedType as MoveType,
      unlockLevel,
      currentLevel: entry.moveLevel ?? 1,
      uses: entry.uses ?? 0,
      isUnlocked: playerLevel >= unlockLevel,
    } as PlayerMoveWithProgress;
  }

  return null;
}

export function normalizePlayerMoves(
  player: { level?: number; moves?: unknown[] },
): PlayerMoveWithProgress[] {
  const playerLevel = Number(player.level ?? 1);

  return (player.moves ?? [])
    .map((entry) => formatPlayerMove(entry as RawPlayerMoveEntry, playerLevel))
    .filter((move): move is PlayerMoveWithProgress => move != null);
}

export function normalizePlayerWithMoves(
  player: PlayerWithDetails,
): PlayerWithDetails {
  return {
    ...player,
    moves: normalizePlayerMoves(player),
  };
}

export function rosterHasBrokenMoves(team: UserClub | null | undefined): boolean {
  if (!team?.roster?.length) return false;

  return team.roster.some((player) => {
    const rawMoves = player.moves ?? [];
    if (rawMoves.length === 0) return false;
    return rawMoves.some((move) => !isValidPlayerMove(move));
  });
}

export function formatPlayerWithMoves(
  rawPlayer: RawPlayerWithMoves | null | undefined,
): PlayerWithDetails | null {
  if (!rawPlayer) return null;

  const { moves: rawMoves, ...playerData } = rawPlayer;
  const playerLevel = Number(rawPlayer.level ?? 1);

  const moves =
    (rawMoves as RawPlayerMoveEntry[] | undefined)
      ?.map((entry) => formatPlayerMove(entry, playerLevel))
      .filter((move): move is PlayerMoveWithProgress => move != null) ?? [];

  return {
    ...(playerData as Omit<PlayerWithDetails, 'moves'>),
    moves,
  } as PlayerWithDetails;
}

export function formatPlayersWithMoves(
  rawPlayers: RawPlayerWithMoves[],
): PlayerWithDetails[] {
  return rawPlayers.map((player) => formatPlayerWithMoves(player)!);
}
