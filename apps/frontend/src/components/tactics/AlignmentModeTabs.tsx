import { Trophy, Zap } from "lucide-react";
import type { TacticsMode } from "./types";

interface AlignmentModeTabsProps {
  mode: TacticsMode;
  onModeChange: (mode: TacticsMode) => void;
}

export function AlignmentModeTabs({ mode, onModeChange }: AlignmentModeTabsProps) {
  return (
    <div className="px-4 max-w-3xl mx-auto w-full grid grid-cols-2 gap-2 shrink-0">
      <button
        onClick={() => onModeChange("11vs11")}
        className={`py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all border flex items-center justify-center gap-2 ${
          mode === "11vs11"
            ? "bg-blue-600 text-white border-blue-500 shadow-lg"
            : "bg-slate-900 text-slate-400 border-slate-800"
        }`}
      >
        <Trophy size={16} /> Oficial (11)
      </button>
      <button
        onClick={() => onModeChange("pachanga")}
        className={`py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all border flex items-center justify-center gap-2 ${
          mode === "pachanga"
            ? "bg-purple-600 text-white border-purple-500 shadow-lg"
            : "bg-slate-900 text-slate-400 border-slate-800"
        }`}
      >
        <Zap size={16} /> Pachanga (4)
      </button>
    </div>
  );
}
