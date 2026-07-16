import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

interface TacticsHeaderProps {
  clubId: string;
  clubName?: string;
  hasChanges: boolean;
  saving: boolean;
  onSave: () => void;
}

export function TacticsHeader({ clubId, clubName, hasChanges, saving, onSave }: TacticsHeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-40 flex justify-between items-center shadow-md">
      <div className="flex items-center gap-3">
        <Link
          href={`/market/${clubId}`}
          className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Estrategia</h1>
          <p className="text-[10px] text-slate-500 font-mono uppercase">{clubName}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={!hasChanges || saving}
        className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all disabled:cursor-not-allowed ${
          hasChanges
            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-70"
            : "bg-slate-800 text-slate-500 disabled:opacity-100"
        }`}
      >
        <Save size={16} />
        {saving ? "Guardando..." : hasChanges ? "Guardar" : "Sin cambios"}
      </button>
    </header>
  );
}
