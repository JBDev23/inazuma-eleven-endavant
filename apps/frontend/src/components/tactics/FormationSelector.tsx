import { ChevronDown, LayoutGrid, UserCircle2 } from "lucide-react";
import { formatFormationLines } from "@/lib/formation-field";
import type { FormationWithClubStatus } from "@inazuma/shared";

interface FormationSelectorProps {
  activeFormation: FormationWithClubStatus;
  availableFormations: FormationWithClubStatus[];
  playerCount: number;
  usingFallback: boolean;
  activating: boolean;
  onFormationChange: (formationId: number) => void;
}

function formatFormationLabel(
  formation: FormationWithClubStatus,
  playerCount: number,
): string {
  const base = `${formation.name} (${formatFormationLines(formation.positions, playerCount)})`;
  return formation.unlockedByCoach ? `${base} · Entrenador` : base;
}

export function FormationSelector({
  activeFormation,
  availableFormations,
  playerCount,
  usingFallback,
  activating,
  onFormationChange,
}: FormationSelectorProps) {
  return (
    <div className="px-4 max-w-3xl mt-3 mx-auto w-full shrink-0">
      <label className="flex text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 items-center gap-1.5">
        <LayoutGrid size={12} />
        Formación
        {usingFallback && (
          <span className="text-amber-500/80 normal-case tracking-normal font-bold">
            · sin formaciones desbloqueadas
          </span>
        )}
      </label>
      {availableFormations.length > 0 ? (
        <div className="space-y-2">
          <div className="relative">
            <select
              value={activeFormation.id || ""}
              disabled={activating}
              onChange={(e) => onFormationChange(Number(e.target.value))}
              className="w-full appearance-none bg-slate-900 border border-slate-700 text-white font-bold text-sm rounded-xl py-3 pl-4 pr-10 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              {availableFormations.map((formation) => (
                <option key={formation.id} value={formation.id}>
                  {formatFormationLabel(formation, playerCount)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
          </div>
          {activeFormation.unlockedByCoach && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/30">
              <UserCircle2 size={11} />
              Desbloqueada por entrenador
            </span>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 flex items-center justify-between">
          <span className="font-bold text-sm text-slate-300">
            {activeFormation.name} ({formatFormationLines(activeFormation.positions, playerCount)})
          </span>
          <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
            Por defecto
          </span>
        </div>
      )}
    </div>
  );
}
