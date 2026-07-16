"use client";

import { Target } from "lucide-react";

interface PenaltyShootoutSelectorProps {
  value: boolean;
  onChange: (enabled: boolean) => void;
}

export function PenaltyShootoutSelector({ value, onChange }: PenaltyShootoutSelectorProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-10">
      <div className="flex items-center gap-3 mb-3 px-1">
        <Target className="w-5 h-5 text-amber-400" />
        <span className="text-sm font-bold tracking-widest uppercase text-slate-400">
          Desempate
        </span>
      </div>

      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-full flex items-center justify-between gap-4 p-5 rounded-2xl border-2 transition-all duration-200 active:scale-[0.99] text-left
          ${value
            ? "border-amber-400/60 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
            : "border-slate-700 bg-slate-900/50 hover:border-slate-500"
          }`}
      >
        <div className="flex-1">
          <p className={`text-lg font-black uppercase tracking-wide ${value ? "text-amber-300" : "text-white"}`}>
            Tanda de penaltis
          </p>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-1 leading-relaxed">
            Si el partido termina en empate, se juega una tanda de penaltis para decidir el ganador
          </p>
        </div>

        <div
          className={`relative w-14 h-8 rounded-full border-2 shrink-0 transition-colors
            ${value ? "bg-amber-500/30 border-amber-400/60" : "bg-slate-800 border-slate-600"}`}
          aria-hidden
        >
          <div
            className={`absolute top-0.5 w-6 h-6 rounded-full transition-all duration-200
              ${value ? "left-7 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]" : "left-0.5 bg-slate-500"}`}
          />
        </div>
      </button>
    </div>
  );
}
