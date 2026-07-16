"use client";

import { PlayerWithDetails } from '@inazuma/shared';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Plus, X } from 'lucide-react';
import Image from 'next/image'; // 🎯 Importamos el componente de Next.js
import { useState } from 'react';

interface PlayerNodeProps {
  id: string;
  data: {
    player: PlayerWithDetails; 
    onFillNode: (nodeId: string, player: any) => void; 
    onAddChild: (parentId: string) => void;
    onDeleteNode: (nodeId: string) => void;
    isTerminal?: boolean;
  };
}

export default function PlayerNode({ id, data }: PlayerNodeProps) {
  const { updateNodeData } = useReactFlow();
  
  // Estado para manejar el error de imagen (si el sprite no existe)
  const [imgError, setImgError] = useState(false);
  
  const isFilled = data.player !== null && data.player !== undefined;
  const isTerminal = data.isTerminal || false;

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const playerDataString = e.dataTransfer.getData('playerData');
    if (playerDataString && data.onFillNode) {
      const player = JSON.parse(playerDataString);
      data.onFillNode(id, player);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFilled) {
      updateNodeData(id, { isTerminal: !isTerminal });
    }
  };

  // ESTADO 1: NODO VACÍO (Se queda igual)
  if (!isFilled) {
    return (
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="w-48 h-24 border-2 border-dashed border-slate-400 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold text-sm text-center p-4 shadow-sm hover:border-yellow-400 hover:bg-yellow-50 transition-colors relative group"
      >
        <Handle type="target" position={Position.Top} className="opacity-0 w-full h-2 pointer-events-none" />
        
        {id !== 'root-1' && (
          <button 
            onClick={() => data.onDeleteNode(id)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
          >
            <X size={14} strokeWidth={3} />
          </button>
        )}
        <span>Arrastra un<br/>jugador aquí</span>
        <Handle type="source" position={Position.Bottom} className="opacity-0 w-full h-2 pointer-events-none" />
      </div>
    );
  }

  // ESTADO 2: NODO LLENO (CARTA DE JUGADOR)
  return (
    <div 
      onDoubleClick={handleDoubleClick}
      className={`w-48 bg-white border-2 rounded-xl shadow-md relative flex flex-col items-center pb-2 group transition-colors cursor-pointer
        ${isTerminal ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-yellow-400'}
      `}
    >
      {/* Conectores (Se quedan igual) */}
      <Handle type="target" position={Position.Top} id="top" className="opacity-0 w-4 h-4 -top-2 bg-blue-500 rounded-full border-2 border-white transition-opacity cursor-crosshair z-10" />
      
      {isTerminal ? (
        <Handle type="source" position={Position.Bottom} id="bottom" className="w-4 h-4 -bottom-2 bg-purple-500 rounded-full border-2 border-white z-10 cursor-crosshair hover:bg-purple-400 hover:scale-110 transition-all" />
      ) : (
        <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0 group-hover:opacity-100 w-4 h-4 -bottom-2 bg-blue-500 rounded-full border-2 border-white transition-opacity cursor-crosshair z-10" />
      )}

      <Handle type="target" position={Position.Left} id="left" className="opacity-0 group-hover:opacity-100 w-3 h-8 -left-2 bg-blue-500 rounded-full border-2 border-white transition-opacity cursor-crosshair z-10" />
      <Handle type="source" position={Position.Right} id="right" className="opacity-0 group-hover:opacity-100 w-3 h-8 -right-2 bg-blue-500 rounded-full border-2 border-white transition-opacity cursor-crosshair z-10" />

      {/* Botón de Borrar */}
      <button 
        onClick={() => data.onDeleteNode(id)}
        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-20"
        title={id === 'root-1' ? 'Vaciar nodo' : 'Borrar nodo'}
      >
        <X size={14} strokeWidth={3} />
      </button>

      {/* Contenido de la Carta con la Imagen */}
      <div className="p-3 w-full text-center pointer-events-none relative flex flex-col items-center">
        
        {/* 🎯 CONTENEDOR DE LA IMAGEN */}
        <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center overflow-hidden border-2 transition-colors relative
          ${isTerminal ? 'bg-purple-100 border-purple-500' : 'bg-slate-100 border-yellow-400'}
        `}>
          {!imgError ? (
            // Asumimos que el nombre del archivo es el nombre del jugador en minúsculas y sin espacios
            // Ej: "Mark Evans" -> "mark_evans.webp"
            <Image
              src={data.player.spriteUrl || ''}
              alt={`Sprite de ${data.player.name}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 64px, 64px"
              onError={() => setImgError(true)} // Si no existe, activamos el fallback
            />
          ) : (
            // Fallback si no hay imagen: mostramos las iniciales
            <span className="text-xl font-black text-slate-400">
              {data.player.name.substring(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        
        {/* Etiqueta de la posición flotante sobre la imagen */}
        <div className={`absolute top-12 -right-1 text-[10px] font-black px-1.5 py-0.5 rounded text-white border z-10
          ${data.player.position === 'PR' ? 'bg-amber-500 border-amber-700' : 
            data.player.position === 'DF' ? 'bg-emerald-500 border-emerald-700' : 
            data.player.position === 'MD' ? 'bg-blue-500 border-blue-700' : 
            'bg-red-500 border-red-700'}
        `}>
          {data.player.position}
        </div>

        <h3 className="font-bold text-slate-800 text-sm truncate w-full" title={data.player.name}>
          {data.player.name}
        </h3>
        <p className="text-xs text-slate-500 truncate w-full">
          {data.player.team?.name || 'Sin equipo'}
        </p>
      </div>

      {/* ➕ BOTÓN DE EXPANSIÓN */}
      {!isTerminal && (
        <button
          onClick={(e) => {
            e.stopPropagation(); 
            data.onAddChild(id);
          }}
          className="absolute -bottom-3 -right-3 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-500 shadow-md border-2 border-white transition-transform hover:scale-110 z-20"
          title="Añadir rama automática"
        >
          <Plus size={14} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}