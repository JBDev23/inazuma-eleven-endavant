// src/components/MatchFormatSelector.tsx
import { Users, Zap } from 'lucide-react';

export type MatchFormat = '11v11' | '4v4';

interface MatchFormatSelectorProps {
  format: MatchFormat;
  onChange: (format: MatchFormat) => void;
}

export function MatchFormatSelector({ format, onChange }: MatchFormatSelectorProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl mx-auto mb-10">
      
      {/* Opción 11 vs 11 */}
      <button
        onClick={() => onChange('11v11')}
        className={`relative flex-1 flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden group active:scale-95
          ${format === '11v11' 
            ? 'bg-slate-800 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]' 
            : 'bg-slate-900/50 border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100'
          }`}
      >
        {/* Resplandor de fondo si está activo */}
        {format === '11v11' && (
          <div className="absolute inset-0 bg-linear-to-r from-amber-500/10 to-transparent z-0" />
        )}
        
        <div className="relative z-10 flex flex-col text-left">
          <span className={`text-sm font-bold tracking-widest uppercase mb-1 ${format === '11v11' ? 'text-amber-400' : 'text-slate-400'}`}>
            Partido Oficial
          </span>
          <span className="text-2xl font-black text-white uppercase tracking-wider">
            11 vs 11
          </span>
        </div>
        
        <div className="relative z-10 bg-slate-950 p-3 rounded-full shadow-inner">
          <Users className={`w-8 h-8 ${format === '11v11' ? 'text-amber-400' : 'text-slate-500'}`} />
        </div>
      </button>

      {/* Opción Pachanga 4 vs 4 */}
      <button
        onClick={() => onChange('4v4')}
        className={`relative flex-1 flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden group active:scale-95
          ${format === '4v4' 
            ? 'bg-slate-800 border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.2)]' 
            : 'bg-slate-900/50 border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100'
          }`}
      >
        {/* Resplandor de fondo si está activo */}
        {format === '4v4' && (
          <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 to-transparent z-0" />
        )}
        
        <div className="relative z-10 flex flex-col text-left">
          <span className={`text-sm font-bold tracking-widest uppercase mb-1 ${format === '4v4' ? 'text-blue-400' : 'text-slate-400'}`}>
            Duelo Rápido
          </span>
          <span className="text-2xl font-black text-white uppercase tracking-wider">
            Pachanga 4v4
          </span>
        </div>
        
        <div className="relative z-10 bg-slate-950 p-3 rounded-full shadow-inner flex items-center justify-center">
          <Zap className={`w-8 h-8 ${format === '4v4' ? 'text-blue-400' : 'text-slate-500'}`} />
        </div>
      </button>

    </div>
  );
}