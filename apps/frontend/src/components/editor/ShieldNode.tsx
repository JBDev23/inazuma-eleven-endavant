// apps/frontend/src/components/ShieldNode.tsx
import { Handle, Position } from "@xyflow/react";
import { Plus } from "lucide-react";

export default function ShieldNode({ id, data }: any) {
  const logoPath = `/teams/${(data.teamSlug || "default").toLowerCase()}_shield.webp`;

  return (
    <div className="w-40 h-40 bg-slate-900 rounded-full border-8 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] flex items-center justify-center p-4 relative group">
      
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(234,179,8,0.2)_0%,transparent_70%)] opacity-50" />
      </div>

      <div className="absolute inset-2 z-0 ">
        <img 
          src={logoPath} 
          alt="Escudo" 
          className="w-full h-full object-contain"
        />
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