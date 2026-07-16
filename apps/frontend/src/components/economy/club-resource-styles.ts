import type { ClubResourceKey } from '@inazuma/shared';

export const CLUB_RESOURCE_STYLES: Record<
  ClubResourceKey,
  { text: string; border: string; bg: string; badge: string }
> = {
  pp: {
    text: 'text-yellow-400',
    border: 'border-yellow-500/40',
    bg: 'bg-yellow-500/10',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  },
  pe: {
    text: 'text-purple-400',
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  },
  yens: {
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
  },
  pc: {
    text: 'text-rose-400',
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
  },
};
