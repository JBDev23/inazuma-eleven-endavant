// apps/frontend/src/components/nodes/EntryNode.tsx
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { LogIn, Settings, Plus } from "lucide-react";
import { useState } from "react";
import { Team } from "@inazuma/shared";

export default function EntryNode({ id, data }: any) {
  const { updateNodeData } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);

  const teamsList = data.allTeams || [];
  const baseClubsOnly = teamsList.filter((t: Team) => t.type === 'CLUB');

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const selectedTeam = teamsList.find((c: Team) => c.id.toString() === selectedId);
    
    updateNodeData(id, { 
      sourceMapId: selectedId, 
      sourceName: selectedTeam?.name,
      sourceTeamSlug: selectedTeam?.slug,
    });
    
    setIsEditing(false);
    if (data.onMarkUnsaved) data.onMarkUnsaved();
  };

  const handleDoubleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  return (
    <div 
      onDoubleClick={handleDoubleClick}
      className="w-48 bg-slate-800 rounded-xl border-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex flex-col items-center justify-center p-4 relative group cursor-pointer hover:bg-slate-700 transition-all"
      title="Doble clic para asignar el club de origen"
    >
      
      <div className="text-center w-full flex flex-col items-center mb-2">
        <LogIn size={32} className={`mb-2 transition-colors drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] ${data.sourceMapId ? 'text-emerald-400' : 'text-slate-500'}`} />
        
        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">
          LLEGADA DESDE
        </span>

        {isEditing ? (
          <select 
            className="nodrag w-full bg-slate-900 text-white border border-emerald-500 rounded p-1 mt-1 text-xs font-bold text-center cursor-pointer outline-none"
            onChange={handleSelectChange}
            value={data.sourceMapId || ""}
            onClick={(e) => e.stopPropagation()} 
            onDoubleClick={(e) => e.stopPropagation()}
            onBlur={() => setIsEditing(false)}
          >
            <option value="" disabled>-- Selecciona un equipo --</option>
            {baseClubsOnly.map((team: Team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2 group/text relative">
            <h3 className={`font-black uppercase tracking-widest text-sm text-center ${data.sourceMapId ? 'text-white' : 'text-slate-500'}`}>
              {data.sourceName || "SIN ASIGNAR"}
            </h3>
            
            {data.sourceMapId && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="absolute -right-6 text-slate-400 hover:text-emerald-400 opacity-0 group-hover/text:opacity-100 transition-opacity"
                title="Cambiar origen"
              >
                <Settings size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        className="opacity-0 w-8 h-8 -bottom-1 left-1/2 -translate-x-1/2 pointer-events-none" 
      />

      {/* ➕ BOTÓN DE EXPANSIÓN (CENTRADO Y ABAJO) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (data.onAddChild) data.onAddChild(id);
        }}
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-500 shadow-xl border-4 border-slate-900 transition-transform hover:scale-110 z-20 cursor-pointer"
        title="Añadir jugador inicial"
      >
        <Plus size={20} strokeWidth={3} />
      </button>
    </div>
  );
}