import { Handle, Position } from "@xyflow/react";
import { DoorOpen, Lock, ArrowDown, Key } from "lucide-react";

export default function ViewerGatewayNode({ data }: any) {
  // Leemos si el backend nos ha bloqueado la puerta por falta de "llaves"
  const isLocked = data.isLocked;
  const keysAcquired = data.keysAcquired || 0;
  const keysRequired = data.keysRequired || 0;

  return (
    <div 
      className={`w-48 rounded-xl border-4 flex flex-col items-center justify-center p-4 relative transition-all group select-none
        ${isLocked 
          ? 'bg-slate-950 border-slate-800 cursor-not-allowed opacity-60 shadow-none' 
          : 'bg-slate-900 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer hover:bg-slate-800 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]'
        }`}
    >
      
      {/* Conectores invisibles (Entrada y Salida) */}
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
      
      {/* Icono dinámico: Candado si está bloqueado, Puerta abierta si no */}
      {isLocked ? (
        <Lock size={32} className="mb-2 text-slate-700 drop-shadow-none" />
      ) : (
        <DoorOpen size={32} className="mb-2 text-purple-400 group-hover:text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-colors" />
      )}
      
      {/* Texto superior ("BLOQUEADO" o "VIAJAR A") */}
      <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${isLocked ? 'text-slate-700' : 'text-purple-400'}`}>
        {isLocked ? 'BLOQUEADO' : 'VIAJAR A'}
      </span>
      
      {isLocked && keysRequired > 0 && (
        <div className="mt-3 mb-3 flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 shadow-inner">
          <Key size={12} className={keysAcquired > 0 ? "text-yellow-500" : "text-slate-600"} />
          <span className={`text-xs font-black tabular-nums ${keysAcquired > 0 ? "text-yellow-500" : "text-slate-600"}`}>
            {keysAcquired} / {keysRequired}
          </span>
        </div>
      )}

      {/* Nombre del destino */}
      <h3 className={`font-black uppercase tracking-widest text-sm text-center ${isLocked ? 'text-slate-600' : 'text-white'}`}>
        {data.targetName || "SIGUIENTE ZONA"}
      </h3>
      
      {/* Flecha inferior animada (solo se renderiza si la puerta está desbloqueada) */}
      {!isLocked && (
        <div className="absolute -bottom-3 bg-purple-600 rounded-full p-1 border-2 border-slate-900 group-hover:translate-y-1 transition-transform">
          <ArrowDown size={16} className="text-white" />
        </div>
      )}

    </div>
  );
}