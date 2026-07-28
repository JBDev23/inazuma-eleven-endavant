"use client";

import { useState } from "react";
import type { Player } from "@inazuma/shared";
import type { UserClub } from "@inazuma/shared";

interface AdminPlayerModalProps {
  player: Player;
  clubs: UserClub[];
  onClose: () => void;
  onSave: (playerId: number, updatedData: Partial<Player>) => Promise<void>;
}

export default function AdminPlayerModal({ player, clubs, onClose, onSave }: AdminPlayerModalProps) {
  // Manejamos el estado del formulario de forma local en el modal
  const [formData, setFormData] = useState<Partial<Player>>({
    level: player.level ?? 1,
    experience: player.experience ?? 0,
    price: player.price ?? 0,
    isFreeAgent: player.isFreeAgent ?? false,
    ownerId: player.ownerId || "",
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Pasamos el ID y los datos modificados al padre
      await onSave(player.id, {
        ...formData,
        // Si es freeAgent, forzamos ownerId a null. Si está vacío, también a null.
        ownerId: formData.isFreeAgent ? null : (formData.ownerId || null),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[92dvh] sm:max-h-none overflow-y-auto shadow-2xl">
        
        {/* Cabecera del Modal */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={player.spriteUrl || "/sprites/default.webp"} alt="sprite" className="w-8 h-8 object-contain" />
            <div>
              <h3 className="font-black text-white uppercase">{player.name}</h3>
              <p className="text-[10px] text-slate-500 font-mono">ID: {player.id}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Formulario de Edición */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Bloque RPG: Nivel y Experiencia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nivel</label>
              <input 
                type="number" 
                min="1" max="50"
                value={formData.level}
                onChange={(e) => setFormData({...formData, level: parseInt(e.target.value) || 1})}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">XP Actual</label>
              <input 
                type="number" 
                min="0"
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Bloque Economía: Precio */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Precio Mercado (🪙)</label>
            <input 
              type="number" 
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-yellow-500 font-black focus:border-yellow-500 focus:outline-hidden"
            />
          </div>

          {/* Bloque Propiedad */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <label className="block text-xs font-bold text-slate-400 uppercase">Propiedad</label>
            
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                checked={formData.isFreeAgent}
                onChange={(e) => setFormData({
                  ...formData, 
                  isFreeAgent: e.target.checked,
                  ownerId: e.target.checked ? "" : formData.ownerId
                })}
                className="w-5 h-5 accent-blue-600 bg-slate-900 border-slate-700 rounded"
              />
              <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                Es Agente Libre (Aparece en tienda)
              </span>
            </label>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1 mt-2">Club Propietario</label>
              
              {/* 🎯 Sustituimos el input por un SELECT */}
              <select 
                disabled={formData.isFreeAgent}
                value={formData.ownerId || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  ownerId: e.target.value,
                  isFreeAgent: e.target.value ? false : formData.isFreeAgent,
                })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:border-blue-500 focus:outline-hidden appearance-none"
              >
                <option value="">-- Sin Club asignado --</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>

            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 p-3 rounded-lg font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors uppercase text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-1 p-3 rounded-lg font-black text-white bg-blue-600 hover:bg-blue-500 transition-colors uppercase text-sm shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}