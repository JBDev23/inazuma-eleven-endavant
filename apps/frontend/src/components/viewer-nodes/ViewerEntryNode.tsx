import { Handle, Position } from "@xyflow/react";
import { LogIn } from "lucide-react";

export default function ViewerEntryNode({ data }: any) {
  return (
    <div className="w-48 bg-slate-900 rounded-xl border-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex flex-col items-center justify-center p-4 relative">
      
      <div className="text-center w-full flex flex-col items-center">
        <LogIn size={32} className="mb-2 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        
        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">
          LLEGADA DESDE
        </span>
        
        <h3 className="font-black uppercase tracking-widest text-sm text-center text-white">
          {data.sourceName || "DESCONOCIDO"}
        </h3>
      </div>

      {/* Conector invisible de salida */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="opacity-0 pointer-events-none" 
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top" 
        className="opacity-0 pointer-events-none" 
      />
    </div>
  );
}