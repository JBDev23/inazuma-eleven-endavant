"use client";

import { useState } from "react";
import type { Formation, FormationType } from "@inazuma/shared";
import { parseFormationLines } from "@/lib/formation-field";

interface AdminFormationModalProps {
  formation: Formation | Partial<Formation>;
  onClose: () => void;
  onSave: (formationData: Partial<Formation>) => Promise<void>;
}

function positionsToInput(positions: unknown): string {
  if (typeof positions === "string") return positions;
  if (Array.isArray(positions)) return positions.join("-");
  return "";
}

function validatePositions(positionsInput: string, playerCount: number): string | null {
  const trimmed = positionsInput.trim();
  if (!trimmed) return "Indica las líneas de campo (ej: 4-3-3).";

  const lines = parseFormationLines(trimmed, playerCount);
  const outfieldCount = lines.reduce((sum, n) => sum + n, 0);
  const expectedOutfield = playerCount - 1;

  if (outfieldCount !== expectedOutfield) {
    return `Las líneas deben sumar ${expectedOutfield} jugadores de campo (+ portero = ${playerCount}). Actual: ${outfieldCount}.`;
  }

  return null;
}

export default function AdminFormationModal({
  formation,
  onClose,
  onSave,
}: AdminFormationModalProps) {
  const isNew = !formation.id;
  const [formData, setFormData] = useState({
    name: formation.name ?? "",
    playerCount: formation.playerCount ?? 11,
    type: (formation.type ?? "BALANCED") as FormationType,
    price: formation.price ?? 0,
    positionsInput: positionsToInput(formation.positions),
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const positionsError = validatePositions(formData.positionsInput, formData.playerCount);
    if (positionsError) {
      setValidationError(positionsError);
      return;
    }

    setValidationError(null);
    setIsSaving(true);
    try {
      const payload: Partial<Formation> = {
        name: formData.name.trim(),
        playerCount: formData.playerCount,
        type: formData.type,
        price: formData.price,
        positions: formData.positionsInput.trim(),
      };

      if (!isNew && formation.id) {
        payload.id = formation.id;
      }

      await onSave(payload);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm overflow-y-auto p-0 sm:p-4">
      <div className="bg-slate-900 border-2 border-orange-900/50 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92dvh] sm:max-h-none overflow-y-auto shadow-2xl my-0 sm:my-auto">
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-black text-white uppercase">
              {isNew ? "Crear Formación" : "Editar Formación"}
            </h3>
            {!isNew && (
              <p className="text-[10px] text-slate-500 font-mono">ID: {formation.id}</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Modo
              </label>
              <select
                value={formData.playerCount}
                onChange={(e) =>
                  setFormData({ ...formData, playerCount: parseInt(e.target.value, 10) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-orange-500 focus:outline-hidden appearance-none"
              >
                <option value={11}>11 vs 11</option>
                <option value={4}>4 vs 4 (Pachanga)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as FormationType })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-orange-500 focus:outline-hidden appearance-none"
              >
                <option value="OFFENSIVE">Ofensiva</option>
                <option value="DEFENSIVE">Defensiva</option>
                <option value="BALANCED">Equilibrada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Líneas de campo
            </label>
            <input
              type="text"
              required
              placeholder={formData.playerCount === 4 ? "1-1-1" : "4-3-3"}
              value={formData.positionsInput}
              onChange={(e) => setFormData({ ...formData, positionsInput: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-black tracking-wider focus:border-orange-500 focus:outline-hidden"
            />
            <p className="mt-1.5 text-[10px] text-slate-500">
              Sin contar al portero. Ej: 4-3-3 suma 10 + portero = 11 jugadores.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Precio (PP)
            </label>
            <input
              type="number"
              min={0}
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-yellow-500 font-black focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          {validationError && (
            <p className="text-sm text-red-400 font-bold">{validationError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-sm bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white border border-orange-500/50 shadow-[0_0_15px_rgba(234,88,12,0.3)] transition-colors"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
