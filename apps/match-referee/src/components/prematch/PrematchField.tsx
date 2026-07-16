"use client";

import { Plus } from "lucide-react";
import { PlayerSpriteAvatar } from "@/components/PlayerSpriteAvatar";
import { formatFormationLines, type SlotCoord } from "@/lib/formation-field";
import type { Formation, PlayerWithDetails } from "@inazuma/shared";

interface PrematchFieldProps {
  activeFormation: Formation;
  playerCount: number;
  slotsConfig: Record<number, SlotCoord>;
  getPlayerInSlot: (slot: number) => PlayerWithDetails | undefined;
  onSelectSlot: (slot: number) => void;
  onRemoveFromSlot: (slot: number) => void;
}

export function PrematchField({
  activeFormation,
  playerCount,
  slotsConfig,
  getPlayerInSlot,
  onSelectSlot,
  onRemoveFromSlot,
}: PrematchFieldProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="relative w-full aspect-2/3 bg-emerald-950 border-4 border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1)_0%,transparent_100%)]">
        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-500/20 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-emerald-500/20 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-0 left-1/2 w-40 h-16 border-2 border-t-0 border-emerald-500/20 -translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-40 h-16 border-2 border-b-0 border-emerald-500/20 -translate-x-1/2 pointer-events-none" />

        {Object.entries(slotsConfig).map(([slotStr, coord]) => {
          const slot = parseInt(slotStr, 10);
          const player = getPlayerInSlot(slot);

          return (
            <div
              key={slot}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10"
              style={{ top: coord.top, left: coord.left }}
            >
              {player ? (
                <div className="flex flex-col items-center group">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => onSelectSlot(slot)}
                      className="w-12 h-12 md:w-14 md:h-14 overflow-hidden bg-slate-900 rounded-xl border-2 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border-slate-700 hover:border-amber-400/60 p-0"
                    >
                      <PlayerSpriteAvatar
                        spriteUrl={player.spriteUrl}
                        alt={player.name}
                        shape="rounded"
                        className="w-full h-full"
                        imgClassName="drop-shadow-md"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveFromSlot(slot)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border border-slate-900 shadow-md"
                    >
                      ✕
                    </button>
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black uppercase text-white bg-slate-950/90 px-1.5 py-0.5 rounded-md mt-1 border border-slate-800 max-w-[60px] md:max-w-[72px] truncate shadow-sm">
                    {player.name.split(" ")[0]}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className="w-11 h-11 md:w-12 md:h-12 rounded-full border-2 border-dashed flex flex-col items-center justify-center transition-all bg-black/20 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/10 text-emerald-500/60"
                >
                  <Plus size={12} />
                  <span className="text-[7px] font-black font-mono tracking-tighter mt-0.5">
                    {coord.role}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-[10px] text-slate-500 font-mono uppercase tracking-wider">
        {activeFormation.name} · {formatFormationLines(activeFormation.positions, playerCount)}
      </p>
    </div>
  );
}
