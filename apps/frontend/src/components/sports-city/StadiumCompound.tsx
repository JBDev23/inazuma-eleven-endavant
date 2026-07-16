'use client';

import { Sofa, Sparkles, Users } from 'lucide-react';
import { ConstructionOverlay } from './ConstructionOverlay';
import { StadiumIllustration } from './illustrations/StadiumIllustration';
import { FACILITY_LABELS, LEVEL_LABELS, type FacilityId, type FacilityLevel } from './types';

type StadiumCompoundProps = {
  fieldLevel: FacilityLevel;
  standsLevel: FacilityLevel;
  benchesLevel: FacilityLevel;
  construction?: Partial<Record<FacilityId, FacilityLevel>>;
  selectedId: FacilityId | null;
  onSelect: (id: FacilityId) => void;
};

const STADIUM_TABS: { id: FacilityId; icon: typeof Sparkles; color: string; selectedBg: string; ring: string }[] = [
  { id: 'field', icon: Sparkles, color: 'text-emerald-400', selectedBg: 'bg-emerald-500/20', ring: 'ring-emerald-400' },
  { id: 'stands', icon: Users, color: 'text-blue-400', selectedBg: 'bg-blue-500/20', ring: 'ring-blue-400' },
  { id: 'benches', icon: Sofa, color: 'text-amber-400', selectedBg: 'bg-amber-500/20', ring: 'ring-amber-400' },
];

export function StadiumCompound({
  fieldLevel,
  standsLevel,
  benchesLevel,
  construction = {},
  selectedId,
  onSelect,
}: StadiumCompoundProps) {
  const levels = { field: fieldLevel, stands: standsLevel, benches: benchesLevel };

  return (
    <div className="relative w-full h-full min-h-[260px] sm:min-h-[300px] md:min-h-[360px] rounded-xl border border-emerald-600/40 bg-emerald-950/40 shadow-[0_0_20px_rgba(16,185,129,0.1)] overflow-hidden">
      {fieldLevel >= 3 && standsLevel >= 3 && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{ background: 'radial-gradient(ellipse at center, rgba(250,204,21,0.2), transparent 65%)' }}
        />
      )}

      {/* Triple header: campo · gradas · banquillos */}
      <div className="relative z-20 flex items-stretch border-b border-slate-700/50 bg-slate-950/70 backdrop-blur-sm divide-x divide-slate-700/50">
        {STADIUM_TABS.map(({ id, icon: Icon, color, selectedBg, ring }) => {
          const isSelected = selectedId === id;
          const level = levels[id as keyof typeof levels];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`
                flex-1 flex items-center gap-1.5 px-2 py-2.5 transition-all min-w-0 touch-manipulation active:opacity-80
                ${isSelected ? `${selectedBg} ring-inset ring-1 ${ring}` : 'hover:bg-slate-800/50'}
              `}
            >
              <Icon size={13} className={`${color} shrink-0`} />
              <div className="text-left min-w-0">
                <p className={`text-[8px] font-black ${color} uppercase tracking-wider truncate opacity-80`}>
                  {FACILITY_LABELS[id]}
                </p>
                <p className="text-[9px] font-black text-white truncate">
                  Nv.{level} · {LEVEL_LABELS[level]}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="relative flex-1 p-2 sm:p-3 md:p-4" style={{ minHeight: 'min(240px, 45vw)' }}>
        <StadiumIllustration fieldLevel={fieldLevel} standsLevel={standsLevel} benchesLevel={benchesLevel} />

        {/* Click zones */}
        <div
          className="absolute inset-2 z-10 grid pointer-events-none"
          style={{ gridTemplateRows: '1fr 4fr 1.2fr', gridTemplateColumns: '1fr 4fr 1fr' }}
        >
          {/* Gradas — perímetro */}
          <button
            type="button"
            aria-label={FACILITY_LABELS.stands}
            onClick={() => onSelect('stands')}
            className={`col-span-3 pointer-events-auto rounded-t-xl transition-all relative overflow-hidden ${selectedId === 'stands' ? 'ring-1 ring-inset ring-blue-400/60' : 'hover:bg-blue-400/5'}`}
          >
            {construction.stands != null && <ConstructionOverlay targetLevel={construction.stands} />}
          </button>
          <button
            type="button"
            aria-label={FACILITY_LABELS.stands}
            onClick={() => onSelect('stands')}
            className={`pointer-events-auto rounded-l-xl transition-all relative overflow-hidden ${selectedId === 'stands' ? 'ring-1 ring-inset ring-blue-400/60' : 'hover:bg-blue-400/5'}`}
          >
            {construction.stands != null && <ConstructionOverlay targetLevel={construction.stands} />}
          </button>
          {/* Campo — centro */}
          <button
            type="button"
            aria-label={FACILITY_LABELS.field}
            onClick={() => onSelect('field')}
            className={`pointer-events-auto rounded-xl transition-all relative overflow-hidden ${selectedId === 'field' ? 'ring-2 ring-emerald-400 bg-emerald-400/5' : 'hover:bg-emerald-400/5'}`}
          >
            {construction.field != null && <ConstructionOverlay targetLevel={construction.field} />}
          </button>
          <button
            type="button"
            aria-label={FACILITY_LABELS.stands}
            onClick={() => onSelect('stands')}
            className={`pointer-events-auto rounded-r-xl transition-all relative overflow-hidden ${selectedId === 'stands' ? 'ring-1 ring-inset ring-blue-400/60' : 'hover:bg-blue-400/5'}`}
          >
            {construction.stands != null && <ConstructionOverlay targetLevel={construction.stands} />}
          </button>
          {/* Banquillos */}
          <button
            type="button"
            aria-label={FACILITY_LABELS.benches}
            onClick={() => onSelect('benches')}
            className={`col-start-2 pointer-events-auto rounded-b-xl transition-all relative overflow-hidden ${selectedId === 'benches' ? 'ring-2 ring-amber-400 bg-amber-400/5' : 'hover:bg-amber-400/5'}`}
          >
            {construction.benches != null && <ConstructionOverlay targetLevel={construction.benches} />}
          </button>
        </div>
      </div>

      {/* Level hints */}
      <div className="relative z-10 grid grid-cols-3 gap-1 px-2 pb-2 border-t border-slate-800/50 pt-2">
        <LevelHint label="Campo" color="emerald" feature={FIELD_FEATURES[fieldLevel]} />
        <LevelHint label="Gradas" color="blue" feature={STANDS_FEATURES[standsLevel]} />
        <LevelHint label="Banquillos" color="amber" feature={BENCHES_FEATURES[benchesLevel]} />
      </div>
    </div>
  );
}

function LevelHint({
  label,
  color,
  feature,
}: {
  label: string;
  color: 'emerald' | 'blue' | 'amber';
  feature: string;
}) {
  const textColor =
    color === 'emerald' ? 'text-emerald-400' : color === 'blue' ? 'text-blue-400' : 'text-amber-400';
  return (
    <div className="text-center">
      <p className={`text-[7px] font-black uppercase tracking-widest ${textColor} mb-0.5`}>{label}</p>
      <p className="text-[8px] text-slate-500 font-bold leading-tight">{feature}</p>
    </div>
  );
}

const FIELD_FEATURES: Record<FacilityLevel, string> = {
  0: 'Terreno abandonado',
  1: 'Césped y porterías',
  2: 'Terreno elemental',
  3: 'Techo retráctil',
};

const STANDS_FEATURES: Record<FacilityLevel, string> = {
  0: 'Sin gradas',
  1: 'Cuadrado N/S',
  2: 'Cuadrado 4 lados',
  3: 'Óvalo cerrado',
};

const BENCHES_FEATURES: Record<FacilityLevel, string> = {
  0: 'Sin zona técnica',
  1: 'Local y visitante',
  2: 'Zona técnica',
  3: 'Banquillo cubierto',
};
