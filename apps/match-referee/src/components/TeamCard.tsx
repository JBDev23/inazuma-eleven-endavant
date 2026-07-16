// src/components/TeamCard.tsx
import { Shield, Trophy, ChevronRight, Swords, ShieldHalf, Zap } from 'lucide-react';
import { UserClub, getEffectiveStats, getActiveCoach } from '@inazuma/shared';
import { MatchFormat } from './MatchFormatSelector';
import { ClubShield } from './ClubShield';

interface TeamCardProps {
  side: 'home' | 'away';
  club: UserClub | null;
  matchFormat: MatchFormat;
  onClick: () => void;
}

export function TeamCard({ side, club, matchFormat, onClick }: TeamCardProps) {
  const isHome = side === 'home';

  // --- LÓGICA DE CÁLCULO DE STATS ---
  let avgAtaque = 0;
  let avgDefensa = 0;
  let avgVelocidad = 0;

  if (club && club.roster) {
    const coach = getActiveCoach(club);
    // 1. Filtramos solo a los jugadores titulares según el formato seleccionado
    const starters = club.roster.filter((player) => {
      if (matchFormat === '11v11') {
        return player.position11 && player.position11 >= 1 && player.position11 <= 11;
      } else {
        return player.position4 && player.position4 >= 1 && player.position4 <= 4;
      }
    });
    
    // 2. Si hay titulares, calculamos la media de sus estadísticas efectivas (con entrenador)
    if (starters.length > 0) {
      const totalKick = starters.reduce((acc, p) => acc + (getEffectiveStats(p, coach).kick || 0), 0);
      const totalGuard = starters.reduce((acc, p) => acc + (getEffectiveStats(p, coach).guard || 0), 0);
      const totalSpeed = starters.reduce((acc, p) => acc + (getEffectiveStats(p, coach).speed || 0), 0);

      avgAtaque = Math.round(totalKick / starters.length);
      avgDefensa = Math.round(totalGuard / starters.length);
      avgVelocidad = Math.round(totalSpeed / starters.length);
    }
  }

  return (
    <div 
      onClick={onClick}
      // VVV --- EL CAMBIO ESTÁ AQUÍ (aspect-square y max-h-[500px]) --- VVV
      className={`relative flex-1 group cursor-pointer w-full aspect-square max-h-[500px] rounded-3xl p-1 transition-all duration-300 transform hover:scale-[1.02] active:scale-95
        ${club 
          ? `bg-linear-to-br ${isHome ? 'from-blue-600 to-blue-900' : 'from-red-600 to-red-900'} shadow-[0_0_40px_rgba(${isHome ? '37,99,235' : '220,38,38'},0.3)]` 
          : 'bg-slate-800/50 border-2 border-dashed border-slate-600 hover:border-slate-400'
        }`}
    >
      <div className="absolute inset-0 bg-black/20 rounded-[22px] z-0" />
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 md:p-6 text-center">
        {club ? (
          <>
            {/* Header: Local / Visitante */}
            <div className="mb-auto w-full flex justify-center items-center opacity-70">
              <span className="font-black uppercase tracking-widest text-xl">
                {isHome ? 'LOCAL' : 'VISITANTE'}
              </span>
            </div>
            
            {/* Escudo y Nombre */}
            <ClubShield
              shieldUrl={club.shieldUrl}
              alt={club.name}
              className="w-20 h-20 md:w-24 md:h-24 mt-2 mb-2 md:mb-4 object-contain drop-shadow-2xl"
            />
            
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white drop-shadow-lg leading-none">
              {club.name}
            </h2>

            {/* Cajas de Estadísticas Medias */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[250px] mt-6 md:mt-8  bg-black/30 p-2 rounded-2xl backdrop-blur-sm border border-white/10">
              {/* Ataque */}
              <div className="flex flex-col items-center justify-center p-1 md:p-2">
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-none mb-1">ATA</span>
                <span className="text-lg md:text-xl font-black text-white leading-none">{avgAtaque}</span>
              </div>
              
              {/* Defensa */}
              <div className="flex flex-col items-center justify-center p-1 md:p-2 border-x border-white/10">
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-none mb-1">DEF</span>
                <span className="text-lg md:text-xl font-black text-white leading-none">{avgDefensa}</span>
              </div>

              {/* Velocidad */}
              <div className="flex flex-col items-center justify-center p-1 md:p-2">
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-none mb-1">VEL</span>
                <span className="text-lg md:text-xl font-black text-white leading-none">{avgVelocidad}</span>
              </div>
            </div>
            
            {/* Botón Inferior */}
            <div className="mt-auto w-full pt-4 md:pt-6">
              <div className="bg-black/40 backdrop-blur-md py-2 px-4 rounded-xl text-xs md:text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-black/60 transition-colors border border-white/5">
                Cambiar Club <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mb-4 group-hover:bg-slate-600 transition-colors">
              <Shield className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">
              Elegir {isHome ? 'Local' : 'Visitante'}
            </h3>
          </>
        )}
      </div>
    </div>
  );
}