"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Save, X } from "lucide-react";
import type { SaveModalState } from "./types";

interface SaveStrategyModalProps {
  state: NonNullable<SaveModalState>;
  saving: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function SaveStrategyModal({ state, saving, onConfirm, onClose }: SaveStrategyModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, saving]);

  if (!mounted) return null;

  const isConfirm = state.type === "confirm";
  const isSuccess = state.type === "success";
  const isError = state.type === "error";

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-strategy-title"
    >
      <div
        className="absolute inset-0 z-0 cursor-pointer bg-slate-950/90 backdrop-blur-sm"
        aria-hidden
        onClick={saving ? undefined : onClose}
      />
      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 p-5 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {isConfirm && <AlertTriangle size={22} className="text-amber-400 shrink-0 mt-0.5" />}
            {isSuccess && <CheckCircle2 size={22} className="text-emerald-400 shrink-0 mt-0.5" />}
            {isError && <AlertTriangle size={22} className="text-red-400 shrink-0 mt-0.5" />}
            <div className="min-w-0">
              <h3
                id="save-strategy-title"
                className="font-black text-lg text-white uppercase tracking-tight"
              >
                {isConfirm && "¿Guardar estrategia?"}
                {isSuccess && "¡Estrategia guardada!"}
                {isError && "Error al guardar"}
              </h3>
              <p className="text-xs text-slate-500 font-mono uppercase mt-1">
                {isConfirm && "Hay avisos antes de confirmar"}
                {isSuccess && "Los cambios se han aplicado correctamente"}
                {isError && "No se pudieron guardar los cambios"}
              </p>
            </div>
          </div>
          {!saving && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="p-5">
          {isConfirm && (
            <ul className="space-y-2 mb-5">
              {state.warnings.map((warning) => (
                <li
                  key={warning}
                  className="flex items-start gap-2 text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5"
                >
                  <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          )}

          {isSuccess && (
            <p className="text-sm text-slate-300 mb-5">
              Tu convocatoria y alineaciones están listas, míster.
            </p>
          )}

          {isError && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 mb-5">
              {state.message}
            </p>
          )}

          <div className="flex gap-2 justify-end">
            {isConfirm ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Save size={14} />
                  {saving ? "Guardando..." : "Guardar de todos modos"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                Entendido
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
