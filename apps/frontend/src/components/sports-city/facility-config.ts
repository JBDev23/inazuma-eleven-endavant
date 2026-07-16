import type { LucideIcon } from 'lucide-react';
import {
  FlaskConical,
  HeartPulse,
  Landmark,
  ShoppingBag,
  Sofa,
  Sparkles,
  Users,
} from 'lucide-react';
import type { FacilityId } from './types';

export type FacilityConfig = {
  id: FacilityId;
  icon: LucideIcon;
  accent: string;
  accentGlow: string;
  gridArea: string;
  size: 'hero' | 'large' | 'medium' | 'small';
  /** Rendered inside StadiumCompound instead of the grid */
  embeddedInStadium?: boolean;
};

export const STADIUM_FACILITY_IDS: FacilityId[] = ['field', 'stands', 'benches'];

export const FACILITY_CONFIG: FacilityConfig[] = [
  {
    id: 'field',
    icon: Sparkles,
    accent: 'emerald',
    accentGlow: 'rgba(16,185,129,0.4)',
    gridArea: 'stadium',
    size: 'hero',
    embeddedInStadium: true,
  },
  {
    id: 'stands',
    icon: Users,
    accent: 'blue',
    accentGlow: 'rgba(59,130,246,0.4)',
    gridArea: 'stadium',
    size: 'hero',
    embeddedInStadium: true,
  },
  {
    id: 'benches',
    icon: Sofa,
    accent: 'amber',
    accentGlow: 'rgba(245,158,11,0.4)',
    gridArea: 'stadium',
    size: 'hero',
    embeddedInStadium: true,
  },
  {
    id: 'shop',
    icon: ShoppingBag,
    accent: 'cyan',
    accentGlow: 'rgba(6,182,212,0.4)',
    gridArea: 'shop',
    size: 'medium',
  },
  {
    id: 'training',
    icon: Landmark,
    accent: 'purple',
    accentGlow: 'rgba(168,85,247,0.4)',
    gridArea: 'training',
    size: 'large',
  },
  {
    id: 'clinic',
    icon: HeartPulse,
    accent: 'rose',
    accentGlow: 'rgba(244,63,94,0.4)',
    gridArea: 'clinic',
    size: 'medium',
  },
  {
    id: 'lab',
    icon: FlaskConical,
    accent: 'violet',
    accentGlow: 'rgba(139,92,246,0.4)',
    gridArea: 'lab',
    size: 'large',
  },
];

export function getFacilityConfig(id: FacilityId): FacilityConfig {
  return FACILITY_CONFIG.find((f) => f.id === id)!;
}
