import { MAX_COACH_LEVEL } from './coach-stats';
import { addExperience, getXpRequiredForLevel } from './xp.utils';

/** XP por defecto que otorga cada YE al canjearlo. */
export const YE_XP_PER_POINT = 100;

export interface YeAllocation {
  coachId: number;
}

export interface YeCoachPreview {
  coachId: number;
  coachName: string;
  currentLevel: number;
  currentXp: number;
  newLevel: number;
  newXp: number;
  levelsGained: number;
  xpGained: number;
  yeCount: number;
  isMaxLevel: boolean;
  xpToNextLevel: number;
}

export interface YeRedemptionPreview {
  totalYe: number;
  totalXp: number;
  xpPerYe: number;
  remainingYe: number;
  coaches: YeCoachPreview[];
  warnings: string[];
}

type CoachForPreview = {
  id: number;
  name: string;
  level: number;
  experience: number;
};

export function buildYeRedemptionPreview(
  allocations: YeAllocation[],
  coaches: CoachForPreview[],
  availableYe: number,
  xpPerYe: number = YE_XP_PER_POINT,
): YeRedemptionPreview {
  const warnings: string[] = [];
  const coachById = new Map(coaches.map((c) => [c.id, c]));
  const yeByCoach = new Map<number, number>();

  for (const { coachId } of allocations) {
    if (!coachById.has(coachId)) {
      warnings.push(`El entrenador #${coachId} no pertenece a tu plantilla.`);
      continue;
    }
    yeByCoach.set(coachId, (yeByCoach.get(coachId) ?? 0) + 1);
  }

  const totalYe = allocations.length;

  if (totalYe > availableYe) {
    warnings.push(`No tienes suficientes YE. Disponibles: ${availableYe}, solicitados: ${totalYe}.`);
  }

  if (totalYe === 0) {
    warnings.push('Debes asignar al menos 1 YE.');
  }

  const previews: YeCoachPreview[] = [];

  for (const [coachId, yeCount] of yeByCoach) {
    const coach = coachById.get(coachId)!;
    const isMaxLevel = coach.level >= MAX_COACH_LEVEL;
    const xpGained = yeCount * xpPerYe;

    if (isMaxLevel) {
      warnings.push(`${coach.name} ya está al nivel máximo. La XP de ${yeCount} YE se perderá.`);
    }

    const { level, experience, levelsGained } = addExperience(
      coach.level,
      coach.experience,
      isMaxLevel ? 0 : xpGained,
      MAX_COACH_LEVEL,
    );

    previews.push({
      coachId,
      coachName: coach.name,
      currentLevel: coach.level,
      currentXp: coach.experience,
      newLevel: level,
      newXp: experience,
      levelsGained: isMaxLevel ? 0 : levelsGained,
      xpGained: isMaxLevel ? 0 : xpGained,
      yeCount,
      isMaxLevel,
      xpToNextLevel: getXpRequiredForLevel(level, MAX_COACH_LEVEL),
    });
  }

  previews.sort((a, b) => a.coachName.localeCompare(b.coachName, 'es'));

  return {
    totalYe,
    totalXp: totalYe * xpPerYe,
    xpPerYe,
    remainingYe: availableYe - totalYe,
    coaches: previews,
    warnings,
  };
}
