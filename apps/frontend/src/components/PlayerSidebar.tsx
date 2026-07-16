"use client";

import type { PlayerWithDetails } from '@inazuma/shared';
import { useEditor } from '@/context/EditorContext';
import Image from 'next/image';
import { useState } from 'react';

type PlayerWithTeam = PlayerWithDetails & { team: { name: string } };

// 🎯 1. EXTRAEMOS EL ITEM A UN SUB-COMPONENTE
// Esto nos permite tener un estado de "imgError" independiente para cada jugador del banquillo
function SidebarPlayerItem({ 
  player, 
  isUsed, 
  onDragStart 
}: { 
  player: PlayerWithTeam; 
  isUsed: boolean; 
  onDragStart: (event: React.DragEvent, player: PlayerWithTeam) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      draggable={!isUsed}
      onDragStart={(event) => onDragStart(event, player)}
      className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-colors shadow-sm
        ${isUsed 
          ? 'bg-slate-800/50 border-slate-700 opacity-40 grayscale cursor-not-allowed' 
          : 'bg-slate-800 border-slate-600 cursor-grab hover:border-yellow-400 hover:bg-slate-700 active:cursor-grabbing'
        }`}
    >
      {/* 🎯 2. CONTENEDOR DE LA IMAGEN */}
      <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center font-bold text-slate-400 text-sm overflow-hidden border-2 border-slate-500 relative shrink-0">
        {!imgError && player.spriteUrl ? (
          <Image
            src={player.spriteUrl}
            alt={`Sprite de ${player.name}`}
            fill
            className="object-cover"
            sizes="48px"
            onError={() => setImgError(true)}
          />
        ) : (
          // Fallback si no hay URL o la imagen falla
          <span>{player.position}</span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm truncate" title={player.name}>
          {player.name}
        </h3>
        <p className="text-xs text-blue-300 truncate flex items-center gap-2">
          {player.team?.name || 'Sin equipo'}
          {/* Pequeña etiqueta de posición */}
          <span className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-black border border-slate-600">
            {player.position}
          </span>
        </p>
      </div>

      {isUsed && (
        <div className="text-[10px] font-bold text-red-400 border border-red-500/50 bg-red-500/10 px-2 py-1 rounded">
          EN USO
        </div>
      )}
    </div>
  );
}

// 🎯 3. COMPONENTE PRINCIPAL
export default function PlayerSidebar({ players }: { players: PlayerWithTeam[] }) {
  const { usedPlayerIds } = useEditor();

  const onDragStart = (event: React.DragEvent, player: PlayerWithTeam) => {
    if (usedPlayerIds.includes(player.id.toString())) {
      event.preventDefault();
      return;
    }
    
    event.dataTransfer.setData('application/reactflow', 'playerNode');
    event.dataTransfer.setData('playerData', JSON.stringify(player));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-80 h-screen bg-slate-900 text-slate-100 border-r-4 border-slate-700 flex flex-col z-10 relative shadow-2xl">
      <div className="p-4 bg-slate-800 border-b border-slate-700 shadow-md">
        <h2 className="text-xl font-black text-yellow-400 tracking-wider">
          {players[0]?.team?.name ? `BANQUILLO ${players[0].team.name.toUpperCase()}` : 'BANQUILLO'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">Arrastra los jugadores al lienzo</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {players.map((player) => {
          const isUsed = usedPlayerIds.includes(player.id.toString());
          
          // Renderizamos nuestro nuevo sub-componente
          return (
            <SidebarPlayerItem 
              key={player.id} 
              player={player} 
              isUsed={isUsed} 
              onDragStart={onDragStart} 
            />
          );
        })}
      </div>
    </aside>
  );
}