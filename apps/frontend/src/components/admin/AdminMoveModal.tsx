"use client";

import { useState } from "react";
import type { Move } from "@inazuma/shared";

interface AdminMoveModalProps {
  move: Move | Partial<Move>;
  onClose: () => void;
  onSave: (moveData: Partial<Move>) => Promise<void>;
}

export default function AdminMoveModal({ move, onClose, onSave }: AdminMoveModalProps) {
  const isNew = !move.id;
  const [formData, setFormData] = useState<Partial<Move>>({
    name: move.name || "",
    type: move.type || "SHOOT",
    element: move.element || "Neutro",
    tpCost: move.tpCost || 0,
    basePower: move.basePower || 0,
    maxPower: move.maxPower || 0,
    foulRate: move.foulRate || 0,
    evolutionPath: move.evolutionPath || "NONE",
    evolutionSpeed: move.evolutionSpeed || "NONE",
    secondaryType: move.secondaryType || "",
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border-2 border-purple-900/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto">
        
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-black text-white uppercase">{isNew ? "Crear Técnica" : "Editar Técnica"}</h3>
            {!isNew && <p className="text-[10px] text-slate-500 font-mono">ID: {move.id}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Bloque Básico */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-purple-500 focus:outline-hidden" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-purple-500 focus:outline-hidden appearance-none">
                <option value="SHOOT">Tiro</option>
                <option value="DRIBBLE">Regate</option>
                <option value="BLOCK">Defensa</option>
                <option value="CATCH">Parada</option>
                <option value="SKILL">Pasiva</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Elemento</label>
              <select value={formData.element} onChange={(e) => setFormData({...formData, element: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-purple-500 focus:outline-hidden appearance-none">
                <option value="Fuego">Fuego</option>
                <option value="Bosque">Bosque</option>
                <option value="Montaña">Montaña</option>
                <option value="Aire">Aire</option>
                <option value="Neutro">Neutro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Coste (TP)</label>
              <input type="number" min="0" value={formData.tpCost} onChange={(e) => setFormData({...formData, tpCost: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-yellow-500 font-black focus:border-purple-500 focus:outline-hidden" />
            </div>
          </div>

          {/* Bloque de Combate y Poder */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Poder Base</label>
              <input type="number" min="0" value={formData.basePower} onChange={(e) => setFormData({...formData, basePower: parseInt(e.target.value) || 0})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-purple-400 uppercase mb-1">Poder Máx</label>
              <input type="number" min="0" value={formData.maxPower} onChange={(e) => setFormData({...formData, maxPower: parseInt(e.target.value) || 0})} className="w-full bg-purple-950/20 border border-purple-900/50 rounded-lg p-2 text-purple-400 font-black" />
            </div>
            <div>
              <label className="block text-xs font-bold text-red-400 uppercase mb-1">Tasa Falta (%)</label>
              <input type="number" min="0" max="100" step="0.1" value={formData.foulRate} onChange={(e) => setFormData({...formData, foulRate: parseFloat(e.target.value) || 0})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-red-400 font-mono" />
            </div>
          </div>

          {/* Bloque de Evolución */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ruta Evolución</label>
              <select value={formData.evolutionPath} onChange={(e) => setFormData({...formData, evolutionPath: e.target.value as any})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-300 text-sm focus:border-purple-500 focus:outline-hidden appearance-none">
                <option value="NONE">Sin Evolución</option>
                <option value="SHIN">SHIN (Normal/Kai/Shin)</option>
                <option value="L_G">Niveles (L1-L5 / G1-G5)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Velocidad Crecimiento</label>
              <select value={formData.evolutionSpeed} onChange={(e) => setFormData({...formData, evolutionSpeed: e.target.value as any})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-300 text-sm focus:border-purple-500 focus:outline-hidden appearance-none">
                <option value="NONE">Ninguna</option>
                <option value="FAST">Rápida (Fast)</option>
                <option value="MEDIUM">Media (Medium)</option>
                <option value="SLOW">Lenta (Slow)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3 border-t border-slate-800 mt-6">
            <button type="button" onClick={onClose} className="flex-1 p-3 rounded-lg font-bold text-slate-400 bg-slate-800 hover:bg-slate-700">CANCELAR</button>
            <button type="submit" disabled={isSaving} className="flex-1 p-3 rounded-lg font-black text-white bg-purple-600 hover:bg-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.4)] disabled:opacity-50">
              {isSaving ? "GUARDANDO..." : "GUARDAR TÉCNICA"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}