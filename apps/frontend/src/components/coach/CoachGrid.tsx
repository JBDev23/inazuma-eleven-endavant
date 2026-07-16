"use client";

import { useMemo, useState } from "react";
import { Search, UserCircle2, Zap, Shield, Activity } from "lucide-react";
import type { Coach } from "@inazuma/shared";
import { getDisplayModifiers } from "@inazuma/shared";

interface CoachGridProps {
  coaches: Coach[];
  renderActionNode?: (coach: Coach) => React.ReactNode;
  onCoachClick?: (coach: Coach) => void;
}

export default function CoachGrid({ coaches, renderActionNode, onCoachClick }: CoachGridProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCoaches = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return coaches.filter((coach) => {
      const displayName = coach.nickname ?? coach.name;
      return (
        coach.name.toLowerCase().includes(lower) ||
        displayName.toLowerCase().includes(lower)
      );
    });
  }, [coaches, searchTerm]);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-lg">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar entrenador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
        </div>
      </div>

      {filteredCoaches.length === 0 ? (
        <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest border-2 border-dashed border-slate-800 rounded-2xl">
          No se encontraron entrenadores
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCoaches.map((coach) => {
            const displayName = coach.nickname ? `${coach.nickname} (${coach.name})` : coach.name;
            const modifiers = getDisplayModifiers(coach);

            return (
              <div
                key={coach.id}
                onClick={() => onCoachClick?.(coach)}
                className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col hover:border-purple-500/50 hover:shadow-xl transition-all group cursor-pointer"
              >
                <div className="h-32 bg-slate-950/50 flex items-center justify-center p-2 relative">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.08)_0%,transparent_70%)]" />
                  {coach.spriteUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coach.spriteUrl}
                      alt={displayName}
                      className="h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <UserCircle2 size={64} className="text-purple-400/60" />
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-black text-white uppercase text-base mb-1 text-center tracking-wider truncate">
                    {displayName}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase text-center mb-4 tracking-widest">
                    Nv. {coach.level} · Temp. {coach.season}
                  </p>

                  <div className="flex justify-between px-2 mb-4">
                    <div className="flex flex-col items-center">
                      <Zap size={18} className="text-yellow-400 mb-0.5" />
                      <span className="text-xs font-bold text-white tabular-nums">×{modifiers.kick}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Shield size={18} className="text-blue-400 mb-0.5" />
                      <span className="text-xs font-bold text-white tabular-nums">×{modifiers.guard}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Activity size={18} className="text-emerald-400 mb-0.5" />
                      <span className="text-xs font-bold text-white tabular-nums">×{modifiers.speed}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-2">
                    {renderActionNode?.(coach)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
