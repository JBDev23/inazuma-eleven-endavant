"use client";

import { useState } from "react";
import { Bug, RotateCcw, Flag, X } from "lucide-react";

interface MatchDebugMenuProps {
  onRestart: () => void;
  onEnd: () => void;
}

export function MatchDebugMenu({ onRestart, onEnd }: MatchDebugMenuProps) {
  const [open, setOpen] = useState(false);

  const handleRestart = () => {
    const confirmed = window.confirm(
      "¿Reiniciar el partido? Se borrarán goles, turnos y recursos de jugadores.",
    );
    if (!confirmed) return;

    onRestart();
    setOpen(false);
  };

  const handleEnd = () => {
    const confirmed = window.confirm(
      "¿Terminar el partido? Verás el resumen con estadísticas.",
    );
    if (!confirmed) return;

    onEnd();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-950/90 border border-violet-500/50 text-violet-200 text-xs font-black uppercase tracking-widest shadow-lg hover:bg-violet-900/90 transition-colors"
        aria-label="Menú de debug"
      >
        <Bug size={16} />
        Debug
      </button>

      {open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-violet-500/40 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-violet-950/40">
              <h2 className="text-sm font-black uppercase tracking-widest text-violet-200">
                Debug del partido
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <button
                type="button"
                onClick={handleRestart}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 font-black uppercase tracking-widest text-sm hover:bg-amber-500/25 transition-colors"
              >
                <RotateCcw size={18} />
                Reiniciar partido
              </button>

              <button
                type="button"
                onClick={handleEnd}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 font-black uppercase tracking-widest text-sm hover:bg-red-500/25 transition-colors"
              >
                <Flag size={18} />
                Terminar partido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
