'use client';

import type { CSSProperties } from 'react';
import { BuildingIllustration } from './illustrations/BuildingIllustration';
import { ConstructionOverlay } from './ConstructionOverlay';
import { getFacilityConfig } from './facility-config';
import { FACILITY_LABELS, LEVEL_LABELS, type FacilityId, type FacilityLevel } from './types';

type FacilityZoneProps = {
  id: FacilityId;
  level: FacilityLevel;
  selected?: boolean;
  underConstruction?: boolean;
  constructionTarget?: FacilityLevel;
  onSelect?: (id: FacilityId) => void;
};

const ACCENT_CLASSES: Record<string, { border: string; bg: string; text: string; badge: string; ring: string }> = {
  cyan: {
    border: 'border-cyan-600/40 hover:border-cyan-400/60',
    bg: 'bg-cyan-950/30',
    text: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    ring: 'ring-cyan-400',
  },
  purple: {
    border: 'border-purple-600/40 hover:border-purple-400/60',
    bg: 'bg-purple-950/30',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    ring: 'ring-purple-400',
  },
  rose: {
    border: 'border-rose-600/40 hover:border-rose-400/60',
    bg: 'bg-rose-950/30',
    text: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    ring: 'ring-rose-400',
  },
  violet: {
    border: 'border-violet-600/40 hover:border-violet-400/60',
    bg: 'bg-violet-950/30',
    text: 'text-violet-400',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    ring: 'ring-violet-400',
  },
};

const SIZE_CLASSES: Record<string, string> = {
  hero: 'min-h-[180px] md:min-h-[220px]',
  large: 'min-h-[120px] sm:min-h-[130px] md:min-h-[150px]',
  medium: 'min-h-[110px] md:min-h-[130px]',
  small: 'min-h-[100px] sm:min-h-[90px]',
};

const FEATURE_HINTS: Partial<Record<FacilityId, Record<FacilityLevel, string>>> = {
  shop: { 0: 'Abandonada', 1: 'Mostrador básico', 2: 'Estanterías y caja', 3: 'Outlet y vitrinas' },
  training: { 0: 'Abandonado', 1: 'Escotilla oculta', 2: 'Búnker reforzado', 3: 'Centro subterráneo' },
  clinic: { 0: 'Abandonada', 1: 'Sala y camilla', 2: 'Piscina recovery', 3: 'Nutrición deportiva' },
  lab: { 0: 'Abandonado', 1: 'Pantallas básicas', 2: 'Pizarra táctica', 3: 'Sala de servidores' },
};

export function FacilityZone({ id, level, selected, underConstruction, constructionTarget, onSelect }: FacilityZoneProps) {
  const config = getFacilityConfig(id);
  const styles = ACCENT_CLASSES[config.accent] ?? ACCENT_CLASSES.cyan;
  const Icon = config.icon;
  const isRuins = level === 0;
  const isElite = level === 3;
  const hint = FEATURE_HINTS[id]?.[level];

  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      className={`
        group relative w-full h-full flex flex-col rounded-xl border transition-all duration-300 overflow-hidden
        ${SIZE_CLASSES[config.size]}
        ${isRuins ? 'border-stone-700/50 bg-stone-950/50' : `${styles.border} ${styles.bg}`}
        ${selected ? `ring-2 ${styles.ring} ring-offset-1 ring-offset-emerald-950 scale-[1.01]` : ''}
        hover:scale-[1.005] active:scale-[0.98] cursor-pointer touch-manipulation
        ${isElite ? 'shadow-[0_0_20px_var(--glow)]' : ''}
      `}
      style={{ '--glow': config.accentGlow } as CSSProperties}
    >
      {isElite && (
        <div
          className="absolute inset-0 pointer-events-none opacity-15"
          style={{ background: `radial-gradient(ellipse at center, ${config.accentGlow}, transparent 70%)` }}
        />
      )}

      {/* Cabecera compacta — mismo estilo que estadio */}
      <div className="relative z-10 flex items-center justify-between gap-1 px-2 py-1.5 bg-slate-950/75 border-b border-slate-800/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon size={12} className={`${isRuins ? 'text-stone-500' : styles.text} shrink-0`} />
          <p className={`text-[8px] font-black uppercase truncate ${isRuins ? 'text-stone-500' : 'text-white'}`}>
            {FACILITY_LABELS[id]}
          </p>
        </div>
        <span
          className={`shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border ${
            isRuins ? 'bg-stone-900 text-stone-600 border-stone-700' : styles.badge
          }`}
        >
          Nv.{level}
        </span>
      </div>

      {/* Vista cenital */}
      <div className="relative z-10 flex-1 p-1.5 min-h-0 flex items-center justify-center">
        <BuildingIllustration facilityId={id} level={level} accent={config.accent} />
      </div>

      {hint && !underConstruction && (
        <p className="relative z-10 text-[7px] font-bold text-slate-600 uppercase tracking-wide text-center pb-1 px-1 leading-tight">
          {hint}
        </p>
      )}

      {underConstruction && <ConstructionOverlay targetLevel={constructionTarget} />}
    </button>
  );
}
