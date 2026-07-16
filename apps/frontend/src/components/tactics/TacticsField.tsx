import { Plus } from "lucide-react";
import { formatFormationLines, type SlotCoord } from "@/lib/formation-field";
import type { Formation, PlayerWithDetails } from "@inazuma/shared";

interface TacticsFieldProps {
  isLandscape: boolean;
  activeFormation: Formation;
  playerCount: number;
  slotsConfig: Record<number, SlotCoord>;
  getPlayerInSlot: (slot: number) => PlayerWithDetails | undefined;
  onSelectSlot: (slot: number) => void;
  onRemoveFromSlot: (slot: number) => void;
}

function FieldMarkings({ landscape }: { landscape: boolean }) {
  if (landscape) {
    return (
      <>
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-emerald-500/20 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-emerald-500/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute left-0 top-1/2 w-16 h-40 border-2 border-l-0 border-emerald-500/20 -translate-y-1/2" />
        <div className="absolute right-0 top-1/2 w-16 h-40 border-2 border-r-0 border-emerald-500/20 -translate-y-1/2" />
      </>
    );
  }

  return (
    <>
      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-500/20 -translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-emerald-500/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-0 left-1/2 w-40 h-16 border-2 border-t-0 border-emerald-500/20 -translate-x-1/2" />
      <div className="absolute bottom-0 left-1/2 w-40 h-16 border-2 border-b-0 border-emerald-500/20 -translate-x-1/2" />
    </>
  );
}

export function TacticsField({
  isLandscape,
  activeFormation,
  playerCount,
  slotsConfig,
  getPlayerInSlot,
  onSelectSlot,
  onRemoveFromSlot,
}: TacticsFieldProps) {
  return (
    <div
      className={`flex-1 mx-auto w-full px-4 flex flex-col justify-center py-4 ${
        isLandscape ? "max-w-4xl" : "max-w-md"
      }`}
    >
      <div
        className={`relative w-full bg-emerald-950 border-4 border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1)_0%,transparent_100%)] ${
          isLandscape ? "aspect-3/2" : "aspect-2/3"
        }`}
      >
        <FieldMarkings landscape={isLandscape} />

        {Object.entries(slotsConfig).map(([slotStr, coord]) => {
          const slot = parseInt(slotStr);
          const player = getPlayerInSlot(slot);

          return (
            <div
              key={slot}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{ top: coord.top, left: coord.left }}
            >
              {player ? (
                <div className="flex flex-col items-center group">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => onSelectSlot(slot)}
                      className="w-14 h-14 md:w-16 md:h-16 bg-slate-900 rounded-2xl border-2 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border-slate-700 hover:border-yellow-400/60"
                    >
                      <img
                        src={player.spriteUrl || "/sprites/default.webp"}
                        alt={player.name}
                        className="h-10 w-10 md:h-11 md:w-11 object-contain"
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
                  <span className="text-[10px] font-black uppercase text-white bg-slate-950/90 px-1.5 py-0.5 rounded-md mt-1 border border-slate-800 max-w-[72px] truncate shadow-sm">
                    {player.name.split(" ")[0]}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-dashed flex flex-col items-center justify-center transition-all bg-black/20 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/10 text-emerald-500/60"
                >
                  <Plus size={14} />
                  <span className="text-[8px] font-black font-mono tracking-tighter mt-0.5">
                    {coord.role}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-[10px] text-slate-600 font-mono uppercase mt-3 tracking-wider">
        {isLandscape ? "Vista apaisada" : "Vista vertical"} ·{" "}
        {formatFormationLines(activeFormation.positions, playerCount)}
      </p>
    </div>
  );
}
