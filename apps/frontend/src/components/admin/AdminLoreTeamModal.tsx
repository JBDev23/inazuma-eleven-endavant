"use client";

import { useState } from "react";
import type { Team } from "@inazuma/shared";
import { getApiErrorMessage } from "@/services/api";

interface AdminLoreTeamModalProps {
  team: Team;
  onClose: () => void;
  onSave: (teamId: number, data: Partial<Pick<Team, "name" | "slug" | "type">>) => Promise<void>;
}

export default function AdminLoreTeamModal({ team, onClose, onSave }: AdminLoreTeamModalProps) {
  const [formData, setFormData] = useState({
    name: team.name,
    slug: team.slug,
    type: team.type,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      await onSave(team.id, {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        type: formData.type,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo guardar."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[92dvh] sm:max-h-none overflow-y-auto shadow-2xl">
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-black text-white uppercase">Editar equipo lore</h3>
            <p className="text-[10px] text-slate-500 font-mono">ID: {team.id}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-sm focus:border-amber-500 focus:outline-hidden"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Usado como equipo base de clubs de usuario y rutas del mapa.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "CLUB" })}
                className={`px-3 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-colors ${
                  formData.type === "CLUB"
                    ? "bg-slate-700 text-white border-slate-500"
                    : "bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-600"
                }`}
              >
                Club
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "CENTRAL" })}
                className={`px-3 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-colors ${
                  formData.type === "CENTRAL"
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-950 text-slate-500 border-slate-800 hover:border-amber-500/40"
                }`}
              >
                Central
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Los centrales aparecen como destinos de nodos gateway en el editor de mapas.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400 font-bold">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl transition-colors"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
