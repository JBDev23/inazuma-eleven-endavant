// apps/frontend/src/components/viewer-nodes/ViewerShieldNode.tsx
import { Handle, Position } from "@xyflow/react";

export default function ViewerShieldNode({ data }: any) {
  // Pillamos el slug del equipo para la imagen, igual que en el editor
  const logoPath = `/teams/${(data.teamSlug || "default").toLowerCase()}_shield.webp`;

  return (
    <div className="w-40 h-40 bg-slate-900 rounded-full border-8 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.4)] flex items-center justify-center p-4 relative group">
      
      {/* Brillo interior */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(234,179,8,0.2)_0%,transparent_70%)] opacity-50" />
      </div>

      {/* Imagen del Escudo */}
      <div className="absolute inset-2 z-10 flex items-center justify-center">
        <img 
          src={logoPath} 
          alt={data.label || "Escudo"} 
          className="w-3/4 h-3/4 object-contain drop-shadow-2xl"
        />
      </div>

      {/* Conector invisible */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom" 
        className="opacity-0 pointer-events-none" 
      />
    </div>
  );
}