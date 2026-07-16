'use client';

import { Hammer } from 'lucide-react';
import type { FacilityLevel } from './types';

type ConstructionOverlayProps = {
  targetLevel?: FacilityLevel;
  className?: string;
};

export function ConstructionOverlay({ targetLevel, className = '' }: ConstructionOverlayProps) {
  return (
    <div
      className={`absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-[inherit] ${className}`}
      aria-hidden
    >
      {/* Andamios */}
      <div className="absolute inset-0 bg-amber-950/55 backdrop-blur-[1px]" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, rgba(251,191,36,0.15) 0, rgba(251,191,36,0.15) 8px, transparent 8px, transparent 16px),
            repeating-linear-gradient(-45deg, rgba(251,191,36,0.1) 0, rgba(251,191,36,0.1) 8px, transparent 8px, transparent 16px)
          `,
        }}
      />

      {/* Cinta de obra */}
      <div className="absolute top-0 left-0 right-0 h-5 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#1e293b_10px,#1e293b_20px)] opacity-90" />
      <div className="absolute bottom-0 left-0 right-0 h-5 bg-[repeating-linear-gradient(-45deg,#fbbf24,#fbbf24_10px,#1e293b_10px,#1e293b_20px)] opacity-90" />

      {/* Badge central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-slate-950/85 border-2 border-amber-500/60 shadow-lg animate-pulse">
          <Hammer size={20} className="text-amber-400" />
          <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest">En construcción</span>
          {targetLevel != null && (
            <span className="text-[8px] font-bold text-amber-500/80">→ Nv.{targetLevel}</span>
          )}
        </div>
      </div>
    </div>
  );
}
