import type { Coach } from "@inazuma/shared";
import { UserCircle2 } from "lucide-react";

interface CoachPanelProps {
  coaches: Coach[];
  selectedCoachId: number | null;
  onSelectCoach: (coachId: number | null) => void;
}

export function CoachPanel({ coaches, selectedCoachId, onSelectCoach }: CoachPanelProps) {
  const hasCoaches = coaches.length > 0;

  return (
    <div className="px-4 max-w-3xl mx-auto w-full flex-1 pb-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <UserCircle2 size={12} />
          Entrenador principal
        </p>
        {selectedCoachId !== null && (
          <span className="text-[10px] font-black uppercase px-3 py-1 rounded-lg border bg-purple-500/10 text-purple-300 border-purple-500/40">
            Entrenador activo
          </span>
        )}
      </div>

      {!hasCoaches && (
        <p className="text-center py-16 text-sm font-bold text-slate-500 uppercase tracking-widest">
          Aún no tienes entrenadores fichados
        </p>
      )}

      {hasCoaches && (
        <div className="grid grid-cols-1 gap-3">
          {coaches.map((coach) => {
            const isActive = coach.id === selectedCoachId;
            const displayName = coach.nickname ? `${coach.nickname} (${coach.name})` : coach.name;

            return (
              <button
                key={coach.id}
                type="button"
                onClick={() => onSelectCoach(isActive ? null : coach.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all text-left ${
                  isActive
                    ? "bg-purple-600/20 border-purple-500 text-white shadow-lg"
                    : "bg-slate-900 border-slate-800 text-slate-200 hover:border-purple-400 hover:bg-slate-800"
                }`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
                  {coach.spriteUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coach.spriteUrl}
                      alt={displayName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <UserCircle2 className={isActive ? "text-purple-300" : "text-slate-400"} size={28} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black uppercase tracking-widest truncate">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Temp. {coach.season} · Nv. {coach.level}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-black uppercase px-2 py-1 rounded-lg border bg-slate-900 text-slate-300 border-slate-700">
                    {coach.price} PP
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-purple-500 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {isActive ? "Seleccionado" : "Elegir"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-center text-[10px] text-slate-600 font-mono uppercase mt-6 tracking-wider">
        El entrenador activo aplica sus bonificaciones tácticas en los partidos.
      </p>
    </div>
  );
}

