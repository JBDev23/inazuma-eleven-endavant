"use client";

import { Minus, Plus, Timer } from "lucide-react";
import {
  DEFAULT_TOTAL_TURNS,
  MAX_TOTAL_TURNS,
  MIN_TOTAL_TURNS,
  normalizeTotalTurns,
} from "@/lib/match-turns";

interface TurnCountSelectorProps {
  value: number;
  onChange: (turns: number) => void;
}

export function TurnCountSelector({ value, onChange }: TurnCountSelectorProps) {
  const normalized = normalizeTotalTurns(value);
  const halfTurns = normalized / 2;

  const step = (delta: number) => {
    const next = normalizeTotalTurns(normalized + delta * 2);
    onChange(next);
  };

  const atMin = normalized <= MIN_TOTAL_TURNS;
  const atMax = normalized >= MAX_TOTAL_TURNS;

  return (
    <div className="w-full max-w-2xl mx-auto mb-10">
      <div className="flex items-center gap-3 mb-3 px-1">
        <Timer className="w-5 h-5 text-emerald-400" />
        <span className="text-sm font-bold tracking-widest uppercase text-slate-400">
          Duración del partido
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 p-5 rounded-2xl border-2 border-slate-700 bg-slate-900/50">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={atMin}
          className="p-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
          aria-label="Menos turnos"
        >
          <Minus className="w-5 h-5" />
        </button>

        <div className="flex-1 text-center">
          <p className="text-4xl font-black text-white tabular-nums">{normalized}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mt-1">
            turnos totales
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2">
            {halfTurns} por parte · número par
          </p>
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          disabled={atMax}
          className="p-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
          aria-label="Más turnos"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {value !== normalized && (
        <p className="text-[10px] text-amber-400/80 text-center mt-2 font-bold uppercase tracking-widest">
          Se ajustará a {normalized} (debe ser par)
        </p>
      )}
    </div>
  );
}

export { DEFAULT_TOTAL_TURNS };
