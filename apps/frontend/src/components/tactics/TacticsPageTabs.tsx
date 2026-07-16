import { ClipboardList, LayoutTemplate, UserCircle2 } from "lucide-react";
import type { PageTab } from "./types";

interface TacticsPageTabsProps {
  activeTab: PageTab;
  onTabChange: (tab: PageTab) => void;
}

export function TacticsPageTabs({ activeTab, onTabChange }: TacticsPageTabsProps) {
  return (
    <div className="p-4 max-w-3xl mx-auto w-full grid grid-cols-3 gap-2 shrink-0">
      <button
        onClick={() => onTabChange("convocados")}
        className={`py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all border flex items-center justify-center gap-2 ${
          activeTab === "convocados"
            ? "bg-emerald-600 text-white border-emerald-500 shadow-lg"
            : "bg-slate-900 text-slate-400 border-slate-800"
        }`}
      >
        <ClipboardList size={16} /> Convocatoria
      </button>
      <button
        onClick={() => onTabChange("alineacion")}
        className={`py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all border flex items-center justify-center gap-2 ${
          activeTab === "alineacion"
            ? "bg-blue-600 text-white border-blue-500 shadow-lg"
            : "bg-slate-900 text-slate-400 border-slate-800"
        }`}
      >
        <LayoutTemplate size={16} /> Alineación
      </button>
      <button
        onClick={() => onTabChange("entrenador")}
        className={`py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all border flex items-center justify-center gap-2 ${
          activeTab === "entrenador"
            ? "bg-purple-600 text-white border-purple-500 shadow-lg"
            : "bg-slate-900 text-slate-400 border-slate-800"
        }`}
      >
        <UserCircle2 size={16} /> Entrenador
      </button>
    </div>
  );
}
