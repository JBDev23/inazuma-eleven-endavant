export const MATCH_BACKGROUND_COUNT = 6;

export function pickRandomMatchBackground(): number {
  return Math.floor(Math.random() * MATCH_BACKGROUND_COUNT) + 1;
}

export function getMatchBackgroundSrc(index: number): string {
  const clamped = Math.min(
    MATCH_BACKGROUND_COUNT,
    Math.max(1, Math.round(index)),
  );
  return `/match_${clamped}_back.webp`;
}
