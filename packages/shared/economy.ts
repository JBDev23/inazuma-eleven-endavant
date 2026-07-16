export type ClubResourceKey = 'pp' | 'pe' | 'yens' | 'pc';

export interface ClubResources {
  pp: number;
  pe: number;
  yens: number;
  pc: number;
}

export interface ClubResourceMeta {
  key: ClubResourceKey;
  short: string;
  name: string;
}

export const CLUB_RESOURCES: ClubResourceMeta[] = [
  { key: 'pp', short: 'PP', name: 'Puntos de Pasión' },
  { key: 'pe', short: 'PE', name: 'Puntos de Experiencia' },
  { key: 'yens', short: '¥', name: 'Yenes' },
  { key: 'pc', short: 'PC', name: 'Puntos de Característica' },
];

export const CLUB_RESOURCE_META = Object.fromEntries(
  CLUB_RESOURCES.map((resource) => [resource.key, resource]),
) as Record<ClubResourceKey, ClubResourceMeta>;

export function pickClubResources(source: Partial<ClubResources>): ClubResources {
  return {
    pp: source.pp ?? 0,
    pe: source.pe ?? 0,
    yens: source.yens ?? 0,
    pc: source.pc ?? 0,
  };
}

export function formatResourceCost(amount: number, resource: ClubResourceKey = 'pp'): string {
  const { short } = CLUB_RESOURCE_META[resource];
  return `${amount} ${short}`;
}

/** Coste en PC de +1 permanente a una stat */
export const PC_COST_PER_STAT = 1;

export function canAffordResource(
  resources: ClubResources,
  amount: number,
  resource: ClubResourceKey = 'pp',
): boolean {
  return resources[resource] >= amount;
}
