"use client";

import { useMemo } from "react";
import { Scale, Shield, Swords } from "lucide-react";
import type { Formation, FormationType } from "@inazuma/shared";
import { buildFieldSlots, formatFormationLines } from "@/lib/formation-field";

const TYPE_CONFIG: Record<
  FormationType,
  { label: string; badgeClass: string; dotClass: string; Icon: typeof Swords }
> = {
  OFFENSIVE: {
    label: "Ofensiva",
    badgeClass: "bg-red-500/15 text-red-300 border-red-500/30",
    dotClass: "bg-red-400 shadow-[0_0_4px_rgba(248,113,113,0.6)]",
    Icon: Swords,
  },
  DEFENSIVE: {
    label: "Defensiva",
    badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    dotClass: "bg-blue-400 shadow-[0_0_4px_rgba(96,165,250,0.6)]",
    Icon: Shield,
  },
  BALANCED: {
    label: "Equilibrada",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dotClass: "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]",
    Icon: Scale,
  },
};

interface FormationPreviewCardProps {
  formation: Formation;
}

export function FormationPreviewCard({ formation }: FormationPreviewCardProps) {
  const slots = useMemo(
    () => buildFieldSlots(formation, formation.playerCount, "portrait"),
    [formation],
  );

  const lines = formatFormationLines(formation.positions, formation.playerCount);
  const typeConfig = TYPE_CONFIG[formation.type];
  const { Icon } = typeConfig;

  return (
    <div className="flex gap-3 bg-purple-950/20 border border-purple-500/20 rounded-xl p-3">
      <div className="relative w-[72px] shrink-0 aspect-2/3 bg-emerald-950/80 border border-emerald-500/25 rounded-lg overflow-hidden">
        <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-500/15" />
        <div className="absolute top-0 left-1/2 w-8 h-3 border border-t-0 border-emerald-500/15 -translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-8 h-3 border border-b-0 border-emerald-500/15 -translate-x-1/2" />

        {Object.entries(slots).map(([slot, coord]) => (
          <div
            key={slot}
            className={`absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 ${typeConfig.dotClass}`}
            style={{ top: coord.top, left: coord.left }}
          />
        ))}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-bold text-slate-200 uppercase truncate">{formation.name}</p>
          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono shrink-0">
            {formation.playerCount}v{formation.playerCount}
          </span>
        </div>

        <p className="text-lg font-black font-mono tracking-wider text-white leading-none">
          {lines}
        </p>

        <span
          className={`inline-flex items-center gap-1 self-start text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${typeConfig.badgeClass}`}
        >
          <Icon size={10} />
          {typeConfig.label}
        </span>
      </div>
    </div>
  );
}
