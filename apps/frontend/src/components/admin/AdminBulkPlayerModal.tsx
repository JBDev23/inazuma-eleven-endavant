"use client";

import { useState } from "react";
import type { Player, UserClub } from "@inazuma/shared";

export interface BulkPlayerUpdatePayload {
  level?: number;
  experience?: number;
  price?: number;
  isFreeAgent?: boolean;
  ownerId?: string | null;
}

interface AdminBulkPlayerModalProps {
  players: Player[];
  clubs: UserClub[];
  onClose: () => void;
  onSave: (playerIds: number[], updatedData: BulkPlayerUpdatePayload) => Promise<void>;
}

interface FieldToggle {
  level: boolean;
  experience: boolean;
  price: boolean;
  ownership: boolean;
}

export default function AdminBulkPlayerModal({
  players,
  clubs,
  onClose,
  onSave,
}: AdminBulkPlayerModalProps) {
  const [applyFields, setApplyFields] = useState<FieldToggle>({
    level: false,
    experience: false,
    price: false,
    ownership: false,
  });

  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [price, setPrice] = useState(100);
  const [isFreeAgent, setIsFreeAgent] = useState(false);
  const [ownerId, setOwnerId] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const previewNames = players.slice(0, 5).map((p) => p.name);
  const remaining = players.length - previewNames.length;

  const hasAnyField = Object.values(applyFields).some(Boolean);

  const toggleField = (key: keyof FieldToggle) => {
    setApplyFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasAnyField) return;

    const payload: BulkPlayerUpdatePayload = {};

    if (applyFields.level) payload.level = level;
    if (applyFields.experience) payload.experience = experience;
    if (applyFields.price) payload.price = price;
    if (applyFields.ownership) {
      payload.isFreeAgent = isFreeAgent;
      payload.ownerId = isFreeAgent ? null : ownerId || null;
    }

    setIsSaving(true);
    try {
      await onSave(
        players.map((p) => p.id),
        payload,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl">
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-black text-white uppercase">Edición múltiple</h3>
            <p className="text-xs text-blue-400 font-bold mt-0.5">
              {players.length} jugador{players.length !== 1 ? "es" : ""} seleccionado
              {players.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800 shrink-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Jugadores</p>
          <p className="text-sm text-slate-300">
            {previewNames.join(", ")}
            {remaining > 0 && (
              <span className="text-slate-500"> y {remaining} más</span>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <p className="text-xs text-slate-400">
            Marca los campos que quieras aplicar a todos los jugadores seleccionados.
            Los demás no se modificarán.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyFields.level}
                  onChange={() => toggleField("level")}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-xs font-bold text-slate-400 uppercase">Nivel</span>
              </label>
              <input
                type="number"
                min="1"
                max="50"
                disabled={!applyFields.level}
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-blue-500 focus:outline-hidden disabled:opacity-40"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyFields.experience}
                  onChange={() => toggleField("experience")}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-xs font-bold text-slate-400 uppercase">XP</span>
              </label>
              <input
                type="number"
                min="0"
                disabled={!applyFields.experience}
                value={experience}
                onChange={(e) => setExperience(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-blue-500 focus:outline-hidden disabled:opacity-40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applyFields.price}
                onChange={() => toggleField("price")}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-xs font-bold text-slate-400 uppercase">
                Precio mercado (🪙)
              </span>
            </label>
            <input
              type="number"
              min="0"
              disabled={!applyFields.price}
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-yellow-500 font-black focus:border-yellow-500 focus:outline-hidden disabled:opacity-40"
            />
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applyFields.ownership}
                onChange={() => toggleField("ownership")}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-xs font-bold text-slate-400 uppercase">Propiedad</span>
            </label>

            <label
              className={`flex items-center gap-3 cursor-pointer group ${!applyFields.ownership ? "opacity-40 pointer-events-none" : ""}`}
            >
              <input
                type="checkbox"
                checked={isFreeAgent}
                disabled={!applyFields.ownership}
                onChange={(e) => {
                  setIsFreeAgent(e.target.checked);
                  if (e.target.checked) setOwnerId("");
                }}
                className="w-5 h-5 accent-blue-600 bg-slate-900 border-slate-700 rounded"
              />
              <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                Agente libre (mercado)
              </span>
            </label>

            <div className={!applyFields.ownership ? "opacity-40 pointer-events-none" : ""}>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">
                Club propietario
              </label>
              <select
                disabled={!applyFields.ownership || isFreeAgent}
                value={ownerId}
                onChange={(e) => {
                  setOwnerId(e.target.value);
                  if (e.target.value) setIsFreeAgent(false);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:border-blue-500 focus:outline-hidden appearance-none"
              >
                <option value="">-- Sin club asignado --</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-3 rounded-lg font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors uppercase text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !hasAnyField}
              className="flex-1 p-3 rounded-lg font-black text-white bg-blue-600 hover:bg-blue-500 transition-colors uppercase text-sm shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50"
            >
              {isSaving ? "Aplicando..." : `Aplicar a ${players.length}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
