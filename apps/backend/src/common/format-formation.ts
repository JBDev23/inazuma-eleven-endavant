import type { Formation, FormationLines } from '@inazuma/shared';

type RawFormation = {
  id: number;
  name: string;
  playerCount: number;
  type: Formation['type'];
  price: number;
  positions: unknown;
};

export function formatFormation(raw: RawFormation): Formation {
  return {
    ...raw,
    positions: raw.positions as FormationLines,
  };
}
