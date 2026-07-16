import { MAX_PLAYER_LEVEL } from './player-stats';
import { addExperience, getXpRequiredForLevel } from './xp.utils';

/** XP que otorga cada PE al canjearlo. Modificable desde un solo sitio. */
export const PE_XP_PER_POINT = 250;

export interface PeAllocation {
  playerId: number;
}

export interface PePlayerPreview {
  playerId: number;
  playerName: string;
  currentLevel: number;
  currentXp: number;
  newLevel: number;
  newXp: number;
  levelsGained: number;
  xpGained: number;
  peCount: number;
  isMaxLevel: boolean;
  xpToNextLevel: number;
}

export interface PeRedemptionPreview {
  totalPe: number;
  totalXp: number;
  xpPerPe: number;
  remainingPe: number;
  players: PePlayerPreview[];
  warnings: string[];
}

type PlayerForPreview = {
  id: number;
  name: string;
  level: number;
  experience: number;
};

export function buildPeRedemptionPreview(
  allocations: PeAllocation[],
  players: PlayerForPreview[],
  availablePe: number,
  xpPerPe: number = PE_XP_PER_POINT,
): PeRedemptionPreview {
  const warnings: string[] = [];
  const playerById = new Map(players.map((p) => [p.id, p]));
  const peByPlayer = new Map<number, number>();

  for (const { playerId } of allocations) {
    if (!playerById.has(playerId)) {
      warnings.push(`El jugador #${playerId} no pertenece a tu plantilla.`);
      continue;
    }
    peByPlayer.set(playerId, (peByPlayer.get(playerId) ?? 0) + 1);
  }

  const totalPe = allocations.length;

  if (totalPe > availablePe) {
    warnings.push(`No tienes suficientes PE. Disponibles: ${availablePe}, solicitados: ${totalPe}.`);
  }

  if (totalPe === 0) {
    warnings.push('Debes asignar al menos 1 PE.');
  }

  const previews: PePlayerPreview[] = [];

  for (const [playerId, peCount] of peByPlayer) {
    const player = playerById.get(playerId)!;
    const isMaxLevel = player.level >= MAX_PLAYER_LEVEL;
    const xpGained = peCount * xpPerPe;

    if (isMaxLevel) {
      warnings.push(`${player.name} ya está al nivel máximo. La XP de ${peCount} PE se perderá.`);
    }

    const { level, experience, levelsGained } = addExperience(
      player.level,
      player.experience,
      isMaxLevel ? 0 : xpGained,
    );

    previews.push({
      playerId,
      playerName: player.name,
      currentLevel: player.level,
      currentXp: player.experience,
      newLevel: level,
      newXp: experience,
      levelsGained: isMaxLevel ? 0 : levelsGained,
      xpGained: isMaxLevel ? 0 : xpGained,
      peCount,
      isMaxLevel,
      xpToNextLevel: getXpRequiredForLevel(level),
    });
  }

  previews.sort((a, b) => a.playerName.localeCompare(b.playerName, 'es'));

  return {
    totalPe,
    totalXp: totalPe * xpPerPe,
    xpPerPe,
    remainingPe: availablePe - totalPe,
    players: previews,
    warnings,
  };
}
