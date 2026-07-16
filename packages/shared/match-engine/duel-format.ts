/** Redondea valores de duelo para evitar artefactos de coma flotante (p. ej. 1.2000000000000002). */
export function roundDuelStat(value: number): number {
  return Math.round(value * 100) / 100;
}

export function roundDuelMultiplier(value: number): number {
  return Math.round(value * 10) / 10;
}

export function formatDuelStatValue(value: number): string {
  const rounded = roundDuelStat(value);
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

export function formatDuelMultiplier(value: number): string {
  return roundDuelMultiplier(value).toFixed(1);
}

export function isNeutralMultiplier(value: number): boolean {
  return Math.abs(roundDuelMultiplier(value) - 1) < 1e-9;
}
