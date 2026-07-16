import { MAX_PLAYER_LEVEL } from './player-stats';

/**
 * 🎯 CURVA EXPONENCIAL DE XP
 * Calcula cuánta experiencia se necesita para pasar DEL nivel actual AL siguiente.
 * Ejemplos: Nvl 1 -> 100 XP | Nvl 10 -> ~3,162 XP | Nvl 49 -> ~34,300 XP
 */
export function getXpRequiredForLevel(
  level: number,
  maxLevel: number = MAX_PLAYER_LEVEL,
): number {
  if (level >= maxLevel) return 0;

  // Base de 100 XP modificada por el nivel elevado a 1.5
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * 🎯 MOTOR DE LEVEL UP
 * Procesa la ganancia de XP y calcula si el jugador sube uno o varios niveles.
 */
export function addExperience(
  currentLevel: number,
  currentXp: number,
  xpToAdd: number,
  maxLevel: number = MAX_PLAYER_LEVEL,
) {
  let level = currentLevel;
  let experience = currentXp + xpToAdd;
  const initialLevel = level;

  // Bucle por si gana tanta XP que sube más de 1 nivel de golpe
  while (level < maxLevel) {
    const xpNeeded = getXpRequiredForLevel(level, maxLevel);

    if (experience >= xpNeeded) {
      experience -= xpNeeded; // Consumimos la XP de este nivel
      level++;                // ¡Subimos de nivel!
    } else {
      break; // Ya no tiene suficiente XP para el siguiente nivel, salimos del bucle
    }
  }

  // Cap de seguridad por si es nivel máximo
  if (level >= maxLevel) {
    level = maxLevel;
    experience = 0; // A nivel máximo la barra se queda limpia
  }

  return {
    level,
    experience,
    leveledUp: level > initialLevel,
    levelsGained: level - initialLevel
  };
}   