import type { FacilityLevel } from '../types';

export const GROUND = '#1a2e1a';
export const GROUND_LIGHT = '#243824';
export const GRASS = '#14532d';
export const PATH = '#57534e';
export const RUBBLE = '#44403c';

export type AccentPalette = { main: string; light: string; dark: string; glow: string };

export const ACCENTS: Record<string, AccentPalette> = {
  cyan: { main: '#06b6d4', light: '#22d3ee', dark: '#0e7490', glow: '#67e8f9' },
  purple: { main: '#a855f7', light: '#c084fc', dark: '#7e22ce', glow: '#d8b4fe' },
  rose: { main: '#f43f5e', light: '#fb7185', dark: '#be123c', glow: '#fda4af' },
  violet: { main: '#8b5cf6', light: '#a78bfa', dark: '#6d28d9', glow: '#c4b5fd' },
};

export function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Suelo base común a todas las parcelas */
export function GroundPlate({ w = 160, h = 100 }: { w?: number; h?: number }) {
  return (
    <>
      <rect x="0" y="0" width={w} height={h} fill={GROUND} rx="4" />
      <rect x="4" y="4" width={w - 8} height={h - 8} fill={GRASS} opacity="0.35" rx="3" />
    </>
  );
}

export function RuinsPlot({ w = 160, h = 100, label = 'RUINAS' }: { w?: number; h?: number; label?: string }) {
  return (
    <g opacity="0.65">
      {Array.from({ length: 5 }).map((_, i) => (
        <rect
          key={i}
          x={18 + i * 22}
          y={30 + (i % 2) * 18}
          width={20 + (i % 3) * 6}
          height={10 + (i % 2) * 4}
          fill={RUBBLE}
          rx="1"
          transform={`rotate(${i % 2 === 0 ? -4 : 3} ${28 + i * 22} ${35 + (i % 2) * 18})`}
        />
      ))}
      <rect x="20" y={h - 22} width={w - 40} height="5" fill={PATH} opacity="0.25" rx="1" />
      <text x={w / 2} y={h / 2} textAnchor="middle" fill="#a8a29e" fontSize="7" fontWeight="bold">
        {label}
      </text>
    </g>
  );
}

export function PerimeterPath({
  x,
  y,
  w,
  h,
  level,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  level: FacilityLevel;
}) {
  if (level < 2) return null;
  return (
    <rect
      x={x - 3}
      y={y - 3}
      width={w + 6}
      height={h + 6}
      fill="none"
      stroke={level >= 3 ? '#facc15' : '#64748b'}
      strokeWidth={level >= 3 ? 1 : 0.6}
      strokeDasharray={level >= 3 ? undefined : '3 2'}
      opacity={0.6}
      rx="2"
    />
  );
}

export function EliteGlow({ x, y, w, h, color }: { x: number; y: number; w: number; h: number; color: string }) {
  return (
    <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} fill="none" stroke={color} strokeWidth="1" opacity="0.45" rx="3" />
  );
}

export function FacilityLabel({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  return (
    <g>
      <rect x={x - 22} y={y - 6} width="44" height="8" fill="#0f172a" fillOpacity="0.9" rx="2" />
      <text x={x} y={y} textAnchor="middle" fill={color} fontSize="4.5" fontWeight="bold" letterSpacing="0.5">
        {text}
      </text>
    </g>
  );
}
