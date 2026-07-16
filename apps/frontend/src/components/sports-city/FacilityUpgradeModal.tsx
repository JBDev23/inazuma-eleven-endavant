'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Hammer, X, ChevronUp, Lock, CheckCircle2 } from 'lucide-react';
import {
  FACILITY_BENEFITS,
  FACILITY_LABELS,
  LEVEL_LABELS,
  getUpgradeCost,
  type ClubFacilityRecord,
  type FacilityId,
  type FacilityLevel,
} from './types';
import type { ClubResources } from '@inazuma/shared';
import { canAffordResource } from '@inazuma/shared';
import { ResourceCostBadge } from '@/components/economy/ResourceCostBadge';
import { PitchElementSelector } from './PitchElementSelector';
import type { NormalizedElement } from '@inazuma/shared';

type FacilityUpgradeModalProps = {
  facilityId: FacilityId;
  facility: ClubFacilityRecord;
  resources: ClubResources;
  onClose: () => void;
  onUpgrade: (facilityId: FacilityId) => Promise<void>;
  onSetPitchElement?: (pitchElement: NormalizedElement) => Promise<void>;
  isLoading?: boolean;
  isSavingPitchElement?: boolean;
};

const LEVEL_STYLES: Record<FacilityLevel, { border: string; bg: string; text: string }> = {
  0: { border: 'border-stone-600', bg: 'bg-stone-900/60', text: 'text-stone-400' },
  1: { border: 'border-amber-700', bg: 'bg-amber-950/40', text: 'text-amber-400' },
  2: { border: 'border-sky-600', bg: 'bg-sky-950/40', text: 'text-sky-400' },
  3: { border: 'border-yellow-500', bg: 'bg-yellow-950/40', text: 'text-yellow-400' },
};

export function FacilityUpgradeModal({
  facilityId,
  facility,
  resources,
  onClose,
  onUpgrade,
  onSetPitchElement,
  isLoading = false,
  isSavingPitchElement = false,
}: FacilityUpgradeModalProps) {
  const { level, upgradingTo } = facility;
  const isConstructing = upgradingTo != null;
  const nextLevel = (level + 1) as FacilityLevel;
  const canUpgrade = level < 3 && !isConstructing;
  const cost = canUpgrade ? getUpgradeCost(level) : null;
  const canAfford = cost != null ? canAffordResource(resources, cost, 'pp') : false;
  const benefits = FACILITY_BENEFITS[facilityId];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border-4 border-amber-700/80 bg-linear-to-b from-amber-950/90 via-slate-900 to-slate-950 shadow-[0_0_60px_rgba(251,191,36,0.15)] overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: 'inset 0 2px 0 rgba(251,191,36,0.3), 0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Cabecera estilo CoC */}
        <div className="relative px-5 pt-5 pb-4 border-b-4 border-amber-800/60 bg-linear-to-r from-amber-900/50 via-amber-950/30 to-amber-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/80 border-2 border-amber-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:border-amber-500 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-3 pr-10">
            <div className="w-14 h-14 rounded-2xl bg-slate-950 border-3 border-amber-600/60 flex items-center justify-center shadow-inner shrink-0">
              <span className="text-2xl font-black text-amber-400">{level}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.2em]">Instalación</p>
              <h2 className="text-lg font-black text-white uppercase leading-tight tracking-wide">
                {FACILITY_LABELS[facilityId]}
              </h2>
              <p className="text-xs font-bold text-amber-400/90 mt-0.5">
                Nv.{level} · {LEVEL_LABELS[level]}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de niveles / beneficios */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
          {benefits.map((benefit) => {
            const isUnlocked = level >= benefit.level;
            const isCurrent = level === benefit.level;
            const isNext = !isConstructing && level + 1 === benefit.level;
            const styles = LEVEL_STYLES[benefit.level];

            return (
              <div
                key={benefit.level}
                className={`
                  relative rounded-2xl border-2 p-3 transition-all
                  ${isUnlocked ? `${styles.border} ${styles.bg}` : 'border-slate-800 bg-slate-950/50 opacity-60'}
                  ${isCurrent ? 'ring-2 ring-amber-500/50' : ''}
                  ${isNext ? 'ring-2 ring-emerald-500/40' : ''}
                `}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`
                      w-9 h-9 rounded-xl border-2 flex items-center justify-center shrink-0 font-black text-sm
                      ${isUnlocked ? `${styles.border} ${styles.text}` : 'border-slate-700 text-slate-600'}
                    `}
                  >
                    {isUnlocked ? (
                      <CheckCircle2 size={18} className={styles.text} />
                    ) : (
                      <Lock size={14} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${isUnlocked ? styles.text : 'text-slate-500'}`}>
                        Nivel {benefit.level}
                      </span>
                      {isCurrent && (
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          Actual
                        </span>
                      )}
                      {isNext && (
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          Siguiente
                        </span>
                      )}
                    </div>
                    <p className={`text-sm font-black mt-0.5 ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                      {benefit.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium leading-snug mt-1">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {facilityId === 'field' && level >= 2 && onSetPitchElement && (
          <div className="shrink-0 px-4 pb-4 border-t border-emerald-800/30 pt-4">
            <PitchElementSelector
              value={facility.pitchElement}
              onChange={onSetPitchElement}
              disabled={isConstructing}
              isLoading={isSavingPitchElement}
            />
            {!facility.pitchElement && (
              <p className="text-[10px] text-amber-400/90 font-bold mt-2 text-center">
                Elige un elemento para activar el terreno elemental en partido.
              </p>
            )}
          </div>
        )}

        {/* Acción inferior */}
        <div className="shrink-0 p-4 border-t-4 border-amber-800/40 bg-slate-950/80">
          {isConstructing ? (
            <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-amber-950/50 border-2 border-amber-600/40">
              <Hammer size={22} className="text-amber-400 animate-pulse" />
              <div>
                <p className="text-sm font-black text-amber-300 uppercase">Obra en curso</p>
                <p className="text-[11px] text-amber-500/80 font-bold">
                  Mejorando a Nv.{upgradingTo} · Pendiente de aprobación del admin
                </p>
              </div>
            </div>
          ) : level >= 3 ? (
            <div className="text-center py-3">
              <p className="text-sm font-black text-yellow-400 uppercase">¡Nivel máximo alcanzado!</p>
              <p className="text-[11px] text-slate-500 font-bold mt-1">Todas las mejoras desbloqueadas</p>
            </div>
          ) : (
            <button
              type="button"
              disabled={!canAfford || isLoading}
              onClick={() => onUpgrade(facilityId)}
              className={`
                w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-3 font-black uppercase tracking-wider text-sm transition-all
                ${canAfford && !isLoading
                  ? 'bg-linear-to-b from-amber-500 to-amber-700 border-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-600 active:scale-[0.98] shadow-[0_4px_0_#92400e]'
                  : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                }
              `}
            >
              {isLoading ? (
                <span>Iniciando obra...</span>
              ) : (
                <>
                  <ChevronUp size={20} />
                  <span>Mejorar a Nv.{nextLevel}</span>
                  {cost != null && <ResourceCostBadge amount={cost} resource="pp" />}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
