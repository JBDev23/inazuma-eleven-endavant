import type { FacilityLevel } from './types';

export type InfrastructureTier = 0 | 1 | 2 | 3;

export function getInfrastructureTier(levels: FacilityLevel[]): InfrastructureTier {
  if (levels.length === 0) return 0;
  const avg = levels.reduce((sum, l) => sum + l, 0 as number) / levels.length;
  if (avg < 0.5) return 0;
  if (avg < 1.5) return 1;
  if (avg < 2.5) return 2;
  return 3;
}

export const ROAD_STYLES: Record<InfrastructureTier, { surface: string; border: string; marking: string }> = {
  0: {
    surface: 'bg-stone-800/60',
    border: 'border-stone-700/50 border-dashed',
    marking: 'bg-stone-600/30',
  },
  1: {
    surface: 'bg-stone-600/80',
    border: 'border-stone-500/60',
    marking: 'bg-stone-400/40',
  },
  2: {
    surface: 'bg-slate-500/90',
    border: 'border-slate-400/70',
    marking: 'bg-yellow-400/50',
  },
  3: {
    surface: 'bg-slate-400',
    border: 'border-slate-300/80',
    marking: 'bg-yellow-300/70',
  },
};

export const GRASS_STYLES: Record<InfrastructureTier, string> = {
  0: 'from-emerald-950 via-emerald-900 to-emerald-950',
  1: 'from-emerald-900 via-emerald-800 to-emerald-900',
  2: 'from-emerald-800 via-emerald-700 to-emerald-800',
  3: 'from-emerald-700 via-emerald-600 to-emerald-700',
};

export const INFRASTRUCTURE_LABELS: Record<InfrastructureTier, string> = {
  0: 'Decrépita',
  1: 'Básica',
  2: 'Desarrollada',
  3: 'De élite',
};

export const PATH_NETWORK_STYLES: Record<
  InfrastructureTier,
  { surface: string; edge: string; marking: string; grass: string; width: number; dash?: string }
> = {
  0: { surface: '#44403c', edge: '#292524', marking: '#57534e', grass: '#14532d', width: 1.8, dash: '2 2' },
  1: { surface: '#57534e', edge: '#3f3f46', marking: '#78716c', grass: '#166534', width: 2.2 },
  2: { surface: '#6b7280', edge: '#4b5563', marking: '#eab308', grass: '#15803d', width: 2.8 },
  3: { surface: '#9ca3af', edge: '#6b7280', marking: '#facc15', grass: '#16a34a', width: 3.4 },
};

export const PARKING_STYLES: Record<InfrastructureTier, { slots: number; filled: number; lit: boolean }> = {
  0: { slots: 4, filled: 0, lit: false },
  1: { slots: 6, filled: 1, lit: false },
  2: { slots: 8, filled: 3, lit: true },
  3: { slots: 12, filled: 6, lit: true },
};
