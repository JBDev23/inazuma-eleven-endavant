export type NormalizedElement = 'fire' | 'wood' | 'wind' | 'earth';

export const PITCH_ELEMENTS: NormalizedElement[] = ['fire', 'wood', 'wind', 'earth'];

export const ELEMENT_LABELS: Record<NormalizedElement, string> = {
  fire: 'Fuego',
  wood: 'Bosque',
  wind: 'Aire',
  earth: 'Montaña',
};

const ELEMENT_ALIASES: Record<string, NormalizedElement> = {
  fire: 'fire',
  fuego: 'fire',
  wood: 'wood',
  bosque: 'wood',
  forest: 'wood',
  wind: 'wind',
  aire: 'wind',
  earth: 'earth',
  montaña: 'earth',
  montana: 'earth',
  mountain: 'earth',
};

/** Fuego > Bosque > Aire > Montaña > Fuego */
const ELEMENT_BEATS: Record<NormalizedElement, NormalizedElement> = {
  fire: 'wood',
  wood: 'wind',
  wind: 'earth',
  earth: 'fire',
};

export function normalizeElement(element: string | null | undefined): NormalizedElement | null {
  if (!element) return null;
  return ELEMENT_ALIASES[element.trim().toLowerCase()] ?? null;
}

export function getElementMultiplier(
  actorElement: string,
  opponentElement: string,
): number {
  const actor = normalizeElement(actorElement);
  const opponent = normalizeElement(opponentElement);
  if (!actor || !opponent || actor === opponent) return 1;

  if (ELEMENT_BEATS[actor] === opponent) return 1.1;
  if (ELEMENT_BEATS[opponent] === actor) return 0.9;
  return 1;
}

export function getElementAdvantageLabel(
  actorElement: string,
  opponentElement: string,
): 'advantage' | 'disadvantage' | 'neutral' {
  const multiplier = getElementMultiplier(actorElement, opponentElement);
  if (multiplier > 1) return 'advantage';
  if (multiplier < 1) return 'disadvantage';
  return 'neutral';
}
