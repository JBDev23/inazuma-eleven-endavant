"use client";

import { useState } from "react";
import type { UserClub, Team } from "@inazuma/shared";
import { ClubShield } from "@/components/club/ClubShield";

interface AdminClubModalProps {
  club: UserClub | Partial<UserClub>;
  teams: Team[];
  onClose: () => void;
  onSave: (clubId: string | null, updatedData: Partial<UserClub> & { password?: string }) => Promise<void>;
}

export default function AdminClubModal({ club, teams, onClose, onSave }: AdminClubModalProps) {
  const clubId = (club as UserClub).id;
  const isNew = !clubId;

  const [formData, setFormData] = useState({
    name: club.name ?? "",
    password: isNew ? "1234" : "",
    pp: club.pp ?? 1000,
    baseTeamSlug: club.baseTeamSlug || "",
    shieldUrl: club.shieldUrl || "",
    hiddenFromResources: club.hiddenFromResources ?? false,
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (isNew && !formData.password.trim()) return;

    setIsSaving(true);
    try {
      const payload: Partial<UserClub> & { password?: string } = {
        name: formData.name.trim(),
        pp: formData.pp,
        baseTeamSlug: formData.baseTeamSlug === "" ? null : formData.baseTeamSlug,
        shieldUrl: formData.shieldUrl.trim() || undefined,
        hiddenFromResources: formData.hiddenFromResources,
      };

      if (isNew || formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      await onSave(isNew ? null : clubId, payload);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[92dvh] sm:max-h-none overflow-y-auto shadow-2xl">
        
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-black text-white uppercase">{isNew ? "Nuevo Club" : "Editar Club"}</h3>
            {!isNew && <p className="text-[10px] text-slate-500 font-mono">ID: {clubId}</p>}
            {isNew && (
              <p className="text-[10px] text-slate-500">Ideal para equipos NPC de pachangas y partidos.</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre del Club</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-yellow-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              PIN / Contraseña {isNew ? "" : "(dejar vacío para no cambiar)"}
            </label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={isNew}
              placeholder={isNew ? "1234" : "••••"}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-yellow-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Puntos de Pasión (PP)</label>
            <input 
              type="number" 
              min="0"
              value={formData.pp}
              onChange={(e) => setFormData({...formData, pp: parseInt(e.target.value) || 0})}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-yellow-500 font-black focus:border-yellow-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Equipo Base</label>
            <select 
              value={formData.baseTeamSlug || ""}
              onChange={(e) => setFormData({...formData, baseTeamSlug: e.target.value})}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-300 font-bold text-sm focus:border-yellow-500 focus:outline-hidden appearance-none"
            >
              <option value="">-- (Sin equipo asignado) --</option>
              {teams.map(team => (
                <option key={team.id} value={team.slug}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">URL del Escudo</label>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-slate-950 border border-slate-700 rounded-xl flex items-center justify-center shrink-0 p-1.5">
                <ClubShield
                  shieldUrl={formData.shieldUrl}
                  alt={formData.name || club.name || "Club"}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                Pega la URL de la imagen (p. ej. Cloudinary) para actualizar el escudo del club.
              </p>
            </div>
            <input
              type="url"
              value={formData.shieldUrl || ""}
              onChange={(e) => setFormData({ ...formData, shieldUrl: e.target.value })}
              placeholder="https://..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-300 text-sm font-mono focus:border-yellow-500 focus:outline-hidden"
            />
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-950 p-3 cursor-pointer hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={formData.hiddenFromResources}
              onChange={(e) => setFormData({ ...formData, hiddenFromResources: e.target.checked })}
              className="mt-0.5 size-4 accent-yellow-500"
            />
            <span>
              <span className="block text-xs font-bold text-slate-200 uppercase">Ocultar en Recursos</span>
              <span className="block text-[10px] text-slate-500 mt-0.5 leading-snug">
                El club seguirá disponible en mercado y admin, pero no aparecerá en la pantalla pública de Recursos.
              </span>
            </span>
          </label>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 p-3 rounded-lg font-bold text-slate-400 bg-slate-800 hover:bg-slate-700">CANCELAR</button>
            <button type="submit" disabled={isSaving} className="flex-1 p-3 rounded-lg font-black text-slate-900 bg-yellow-500 hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] disabled:opacity-50">
              {isSaving ? "GUARDANDO..." : isNew ? "CREAR" : "GUARDAR"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
