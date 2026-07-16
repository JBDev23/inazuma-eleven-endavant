// apps/frontend/src/components/GatewayNode.tsx
import { Handle, Position, useEdges, useReactFlow } from "@xyflow/react";
import { DoorOpen, Settings } from "lucide-react";
import { useState } from "react";
import { Team } from "@inazuma/shared";

export default function GatewayNode({ id, data }: any) {
  const edges = useEdges();
  
  // Hook nativo de React Flow para actualizar este nodo
  const { updateNodeData } = useReactFlow();

  // Estado para controlar si mostramos el texto o el selector
  const [isEditing, setIsEditing] = useState(false);

  const incomingCount = edges.filter((e) => e.target === id).length;

  const teamsList = data.allTeams || [];
    
  const centralTeamsOnly = teamsList.filter((t: Team) => t.type === 'CENTRAL');

  // 🎯 Ahora el doble clic solo abre el modo edición
  const handleDoubleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const selectedTeam = teamsList.find((t: Team) => t.id === parseInt(selectedId));
    
    updateNodeData(id, { 
      targetMapId: selectedId, 
      targetName: selectedTeam?.name,
      targetTeamSlug: selectedTeam?.slug,
      sourceTeamSlug: data.sourceTeamSlug,
      keys: incomingCount,
    });
    
    setIsEditing(false);

    if (data.onMarkUnsaved) data.onMarkUnsaved();
  };

  return (
    <div 
      onDoubleClick={handleDoubleClick}
      className="w-56 bg-slate-800 rounded-xl border-4 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] flex flex-col items-center justify-center p-4 relative group hover:bg-slate-700 transition-all cursor-pointer"
      title="Doble clic para asignar o cambiar destino"
    >
      
      {/* ❌ BOTÓN DE BORRAR */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (data.onDeleteNode) data.onDeleteNode(id);
        }}
        className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold shadow-md hover:bg-red-600 z-20"
      >
        ✕
      </button>

      {/* 🎯 CONECTOR SUPERIOR */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top"
        className="w-32 h-4 -top-2 bg-blue-500 rounded-full border-2 border-slate-800 z-10 cursor-crosshair hover:bg-blue-400 transition-colors" 
      />

      <div className="text-center w-full flex flex-col items-center">
        <DoorOpen size={32} className={`mb-2 transition-colors drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] ${data.targetMapId ? 'text-purple-400 group-hover:text-purple-300' : 'text-slate-500'}`} />
        
        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-1">
          DESTINO
        </span>

        {/* LÓGICA CONDICIONAL: SELECTOR VS TEXTO */}
        {isEditing ? (
          <select 
            className="nodrag w-full bg-slate-900 text-white border border-purple-500 rounded p-1 mt-1 text-xs font-bold text-center cursor-pointer outline-none"
            onChange={handleSelectChange}
            value={data.targetMapId || ""}
            onClick={(e) => e.stopPropagation()} 
            onDoubleClick={(e) => e.stopPropagation()}
            onBlur={() => setIsEditing(false)} // 🎯 Si el usuario hace clic fuera, se cierra
          >
            <option value="" disabled>-- Selecciona un equipo --</option>
            {centralTeamsOnly.map((team: Team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2 group/text relative">
            <h3 className={`font-black uppercase tracking-widest text-lg ${data.targetMapId ? 'text-white' : 'text-slate-500'}`}>
              {data.targetName || "SIN ASIGNAR"}
            </h3>
            
            {/* Pequeño engranaje para reasignar si ya tiene destino */}
            {data.targetMapId && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="absolute -right-6 text-slate-400 hover:text-purple-400 opacity-0 group-hover/text:opacity-100 transition-opacity"
                title="Cambiar destino"
              >
                <Settings size={14} />
              </button>
            )}
          </div>
        )}
        
        {/* 🔢 CONTADOR DE LLAVES */}
        <div className="mt-2 font-bold text-[10px] px-2 py-1 rounded-sm border border-purple-500/50 bg-purple-500/10 text-purple-300 uppercase tracking-widest">
          {incomingCount === 0 
            ? "SIN CONEXIONES" 
            : `${incomingCount} ${incomingCount === 1 ? 'LLAVE' : 'LLAVES'} ASIGNADAS`
          }
        </div>
      </div>
    </div>
  );
}