import { Users } from "lucide-react";
import type { PlayerWithDetails } from "@inazuma/shared";
import { MAX_CONVOCADOS } from "./types";
import { PlayerRosterCard } from "./PlayerRosterCard";

interface ConvocadosPanelProps {
  roster: PlayerWithDetails[];
  convocadosCount: number;
  onToggleConvocado: (playerId: number) => void;
}

export function ConvocadosPanel({ roster, convocadosCount, onToggleConvocado }: ConvocadosPanelProps) {
  const convocados = roster.filter((p) => p.isActiveRoster);
  const noConvocados = roster.filter((p) => !p.isActiveRoster);
  const atMax = convocadosCount >= MAX_CONVOCADOS;

  return (
    <div className="px-4 max-w-3xl mx-auto w-full flex-1 pb-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <Users size={12} />
          Plantilla convocada
        </p>
        <span
          className={`text-xs font-black uppercase px-3 py-1 rounded-lg border ${
            atMax
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          }`}
        >
          {convocadosCount}/{MAX_CONVOCADOS}
        </span>
      </div>

      {convocados.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">
            Convocados ({convocados.length})
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {convocados.map((player) => (
              <PlayerRosterCard
                key={player.id}
                player={player}
                variant="convocado"
                onToggle={() => onToggleConvocado(player.id)}
              />
            ))}
          </div>
        </section>
      )}

      {noConvocados.length > 0 && (
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
            Disponibles ({noConvocados.length})
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {noConvocados.map((player) => (
              <PlayerRosterCard
                key={player.id}
                player={player}
                variant="disponible"
                disabled={atMax}
                onToggle={() => onToggleConvocado(player.id)}
              />
            ))}
          </div>
        </section>
      )}

      {roster.length === 0 && (
        <p className="text-center py-16 text-sm font-bold text-slate-500 uppercase tracking-widest">
          No tienes jugadores en la plantilla
        </p>
      )}

      <p className="text-center text-[10px] text-slate-600 font-mono uppercase mt-6 tracking-wider">
        Solo los convocados aparecen al asignar posiciones en la alineación
      </p>
    </div>
  );
}
