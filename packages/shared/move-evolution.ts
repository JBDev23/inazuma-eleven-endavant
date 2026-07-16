import type { EvolutionPath, EvolutionSpeed } from './types';

/** Usos necesarios para subir del nivel N al N+1, indexado por nivel actual (1-based). */
const USES_TO_NEXT_LEVEL: Record<EvolutionSpeed, number[]> = {
  FAST: [5, 8, 12, 15, 18],
  MEDIUM: [8, 12, 18, 24, 30],
  SLOW: [12, 18, 25, 32, 40],
  NONE: [],
};

export function getMaxMoveLevel(evolutionPath: EvolutionPath): number {
  switch (evolutionPath) {
    case 'SHIN':
      return 3;
    case 'L_G':
      return 5;
    default:
      return 1;
  }
}

export function getUsesRequiredForNextLevel(
  evolutionSpeed: EvolutionSpeed,
  currentLevel: number,
  evolutionPath: EvolutionPath,
): number | null {
  if (evolutionPath === 'NONE' || evolutionSpeed === 'NONE') return null;
  if (currentLevel >= getMaxMoveLevel(evolutionPath)) return null;

  const table = USES_TO_NEXT_LEVEL[evolutionSpeed];
  const index = currentLevel - 1;
  return table[index] ?? null;
}

export type MoveUsageProgressResult = {
  uses: number;
  moveLevel: number;
  leveledUp: boolean;
  levelsGained: number;
};

/** Aplica usos acumulados y resuelve subidas de nivel (el exceso de usos se arrastra). */
export function applyMoveUsageProgress(
  currentUses: number,
  currentLevel: number,
  evolutionPath: EvolutionPath,
  evolutionSpeed: EvolutionSpeed,
  timesUsed: number,
): MoveUsageProgressResult {
  let uses = currentUses + timesUsed;
  let moveLevel = currentLevel;
  let levelsGained = 0;
  const maxLevel = getMaxMoveLevel(evolutionPath);

  while (moveLevel < maxLevel) {
    const required = getUsesRequiredForNextLevel(evolutionSpeed, moveLevel, evolutionPath);
    if (required == null || uses < required) break;
    uses -= required;
    moveLevel += 1;
    levelsGained += 1;
  }

  return {
    uses,
    moveLevel,
    leveledUp: levelsGained > 0,
    levelsGained,
  };
}

export interface ApplyMatchMoveUsage {
  clubId: string;
  playerId: number;
  moveId: number;
  turn: number;
}

export interface MoveUsageRecord {
  turn: number;
  side: 'home' | 'away';
  clubId: string;
  playerId: number;
  playerName: string;
  moveId: number;
  moveName: string;
}

export function getMoveEvolutionLabel(
  evolutionPath: EvolutionPath,
  level: number,
): string | null {
  if (level <= 1 || evolutionPath === 'NONE') return null;

  if (evolutionPath === 'SHIN') {
    if (level === 2) return 'Kai';
    if (level >= 3) return 'Shin';
  }

  if (evolutionPath === 'L_G') {
    return level >= 5 ? `G${level}` : `L${level}`;
  }

  return `Nv.${level}`;
}

export type MoveLevelUpPreview = {
  playerId: number;
  playerName: string;
  moveId: number;
  moveName: string;
  element: string;
  moveType: string;
  evolutionPath: EvolutionPath;
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
};

/** Detecta si un uso más de esta técnica provoca subida de nivel (vista previa en partido). */
export function previewMoveLevelUp(
  currentUses: number,
  currentLevel: number,
  evolutionPath: EvolutionPath,
  evolutionSpeed: EvolutionSpeed,
  usesAlreadyInMatch: number,
): Omit<MoveLevelUpPreview, 'playerId' | 'playerName' | 'moveId' | 'moveName' | 'element' | 'moveType'> | null {
  const before = applyMoveUsageProgress(
    currentUses,
    currentLevel,
    evolutionPath,
    evolutionSpeed,
    usesAlreadyInMatch,
  );
  const after = applyMoveUsageProgress(
    currentUses,
    currentLevel,
    evolutionPath,
    evolutionSpeed,
    usesAlreadyInMatch + 1,
  );

  if (after.moveLevel <= before.moveLevel) return null;

  return {
    evolutionPath,
    previousLevel: before.moveLevel,
    newLevel: after.moveLevel,
    levelsGained: after.levelsGained,
  };
}

export type MoveUsageGrant = {
  playerId: number;
  moveId: number;
  moveName: string;
  usesAdded: number;
  newUses: number;
  newMoveLevel: number;
  leveledUp: boolean;
  levelsGained: number;
};

/** Agrupa usos repetidos de la misma técnica en un mismo partido. */
export function aggregateMoveUsages(
  usages: ApplyMatchMoveUsage[],
): Map<string, { playerId: number; moveId: number; count: number }> {
  const map = new Map<string, { playerId: number; moveId: number; count: number }>();

  for (const usage of usages) {
    const key = `${usage.playerId}:${usage.moveId}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { playerId: usage.playerId, moveId: usage.moveId, count: 1 });
    }
  }

  return map;
}
