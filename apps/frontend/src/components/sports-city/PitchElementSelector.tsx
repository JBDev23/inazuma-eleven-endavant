'use client';

import { Flame, Leaf, Mountain, Wind } from 'lucide-react';
import {
  ELEMENT_LABELS,
  PITCH_ELEMENTS,
  type NormalizedElement,
} from '@inazuma/shared';

const ELEMENT_STYLES: Record<
  NormalizedElement,
  { icon: typeof Flame; active: string; idle: string }
> = {
  fire: {
    icon: Flame,
    active: 'border-orange-500 bg-orange-500/20 text-orange-300 ring-orange-500/50',
    idle: 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-orange-500/40 hover:bg-orange-500/10',
  },
  wood: {
    icon: Leaf,
    active: 'border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-emerald-500/50',
    idle: 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-emerald-500/40 hover:bg-emerald-500/10',
  },
  wind: {
    icon: Wind,
    active: 'border-sky-500 bg-sky-500/20 text-sky-300 ring-sky-500/50',
    idle: 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-sky-500/40 hover:bg-sky-500/10',
  },
  earth: {
    icon: Mountain,
    active: 'border-amber-600 bg-amber-600/20 text-amber-300 ring-amber-600/50',
    idle: 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-amber-600/40 hover:bg-amber-600/10',
  },
};

type PitchElementSelectorProps = {
  value: string | null | undefined;
  onChange: (element: NormalizedElement) => void;
  disabled?: boolean;
  isLoading?: boolean;
};

export function PitchElementSelector({
  value,
  onChange,
  disabled = false,
  isLoading = false,
}: PitchElementSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-emerald-400/90 uppercase tracking-widest">
        Terreno elemental
      </p>
      <p className="text-[11px] text-slate-400 font-medium leading-snug">
        Elige el elemento de tu césped. Los jugadores de ese elemento reciben +5% de stats en casa.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {PITCH_ELEMENTS.map((element) => {
          const { icon: Icon, active, idle } = ELEMENT_STYLES[element];
          const isSelected = value === element;

          return (
            <button
              key={element}
              type="button"
              disabled={disabled || isLoading}
              onClick={() => onChange(element)}
              className={`
                flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-all font-bold text-xs uppercase tracking-wide
                ${isSelected ? `${active} ring-2` : idle}
                ${disabled || isLoading ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98]'}
              `}
            >
              <Icon size={16} className="shrink-0" />
              <span>{ELEMENT_LABELS[element]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
