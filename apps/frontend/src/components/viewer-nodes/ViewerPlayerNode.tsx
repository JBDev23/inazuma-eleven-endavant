// apps/frontend/src/components/viewer-nodes/ViewerPlayerNode.tsx
import { Handle, Position } from '@xyflow/react';
import Image from 'next/image';
import { Lock, Unlock, Check, ShieldAlert, Key } from 'lucide-react';

export default function ViewerPlayerNode({ data }: any) {
  const { player, status, onAction } = data; 

  return (
    <div className={`w-48 border-2 rounded-xl shadow-md relative flex flex-col items-center pb-2 transition-all
      ${status === 'locked' ? 'bg-slate-800 border-slate-700 opacity-60 grayscale' : ''}
      ${status === 'available' ? 'bg-slate-900 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' : ''}
      ${status === 'owned' ? 'bg-blue-950 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''}
      ${status === 'unlocked' ? 'bg-emerald-950 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : ''}
      ${status === 'toll' ? 'bg-red-950 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}
    `}>
      
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top" 
        className="opacity-0 pointer-events-none" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom" 
        className="opacity-0 pointer-events-none" 
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        id="left" 
        className="opacity-0 pointer-events-none" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right" 
        className="opacity-0 pointer-events-none" 
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left" 
        className="opacity-0 pointer-events-none" 
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        id="right" 
        className="opacity-0 pointer-events-none" 
      />

      <div className="p-3 w-full text-center relative flex flex-col items-center mt-2">
        <div className={`w-24 h-24 rounded-full mx-auto mb-2 flex items-center justify-center overflow-hidden border-2
          ${status === 'locked' ? 'border-slate-600 bg-slate-700' : 'border-slate-500 bg-slate-800'}
        `}>
          <Image
            src={player?.spriteUrl || '/sprites/placeholder.webp'}
            alt={player?.name || 'Jugador'}
            width={96}
            height={96}
            className="object-cover"
          />
        </div>

        <div className="absolute top-14 -right-1 text-[10px] font-black px-1.5 py-0.5 rounded text-white border z-10 bg-slate-800 border-slate-600">
          {player?.position || '??'}
        </div>

        <h3 className={`font-bold text-sm truncate w-full ${status === 'locked' ? 'text-slate-400' : 'text-white'}`}>
          {player?.name || 'Desconocido'}
        </h3>
      </div>

      <div className="mt-2 w-full px-3">
        {status === 'locked' && (
          <div className="w-full py-1.5 bg-slate-800 rounded-lg flex justify-center items-center gap-2 text-slate-500 text-xs font-bold">
            <Lock size={14} /> Bloqueado
          </div>
        )}

        {status === 'available' && (
          <div className="w-full py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-lg flex justify-center items-center gap-2 text-xs font-black transition-colors">
            <Unlock size={14} /> {player.price} 🪙
          </div>
        )}

        {status === 'owned' && (
          <div className="w-full py-1.5 bg-blue-600 rounded-lg flex justify-center items-center gap-2 text-white text-xs font-bold">
            <Check size={14} /> Fichado
          </div>
        )}

        {status === 'unlocked' && (
          <div className="w-full py-1.5 bg-emerald-600 rounded-lg flex justify-center items-center gap-2 text-white text-xs font-bold">
            <Key size={14} /> Paso Abierto
          </div>
        )}

        {status === 'toll' && (
          <div className="w-full py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg flex justify-center items-center gap-1 text-[10px] font-black transition-colors leading-tight">
            <ShieldAlert size={14} /> PEAJE: {Math.floor((player.price ?? 0) / 2)} 🪙
          </div>
        )}
      </div>
    </div>
  );
}