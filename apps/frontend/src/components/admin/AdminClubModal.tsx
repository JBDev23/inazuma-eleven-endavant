"use client";

import { useState } from "react";
import type { UserClub, Team } from "@inazuma/shared";
import { ClubShield } from "@/components/club/ClubShield";

interface AdminClubModalProps {
  club: UserClub;
  teams: Team[];
  onClose: () => void;
  onSave: (clubId: string, updatedData: Partial<UserClub>) => Promise<void>;
}

export default function AdminClubModal({ club, teams, onClose, onSave }: AdminClubModalProps) {
  const [formData, setFormData] = useState<Partial<UserClub>>({
    name: club.name,
    pp: club.pp ?? 1000,
    baseTeamSlug: club.baseTeamSlug || "",
    shieldUrl: club.shieldUrl || "",
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(club.id, {
        ...formData,
        baseTeamSlug: formData.baseTeamSlug === "" ? undefined : formData.baseTeamSlug
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-black text-white uppercase">Editar Club</h3>
            <p className="text-[10px] text-slate-500 font-mono">ID: {club.id}</p>
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
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-yellow-500 focus:outline-hidden"
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

          {/* 🎯 2. Reemplazamos el input por un SELECT */}
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
                  alt={formData.name || club.name}
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

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 p-3 rounded-lg font-bold text-slate-400 bg-slate-800 hover:bg-slate-700">CANCELAR</button>
            <button type="submit" disabled={isSaving} className="flex-1 p-3 rounded-lg font-black text-slate-900 bg-yellow-500 hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] disabled:opacity-50">
              {isSaving ? "GUARDANDO..." : "GUARDAR"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}