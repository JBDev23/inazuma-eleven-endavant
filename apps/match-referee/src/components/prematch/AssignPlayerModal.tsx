"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Users, X } from "lucide-react";
import { PlayerSpriteAvatar } from "@/components/PlayerSpriteAvatar";
import type { PlayerWithDetails } from "@inazuma/shared";

interface AssignPlayerModalProps {
  slot: number;
  role: string;
  players: PlayerWithDetails[];
  onAssign: (playerId: number) => void;
  onClose: () => void;
}

export function AssignPlayerModal({ slot, role, players, onAssign, onClose }: AssignPlayerModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-player-title"
    >
      <div
        className="absolute inset-0 z-0 cursor-pointer bg-slate-950/90 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 p-5 border-b border-slate-800 flex items-start justify-between gap-3">
          <div>
            <h3
              id="assign-player-title"
              className="font-black text-lg text-white uppercase tracking-tight flex items-center gap-2"
            >
              <Users size={18} className="text-yellow-400" />
              Posición {slot}
            </h3>
            <p className="text-xs text-slate-500 font-mono uppercase mt-1">
              Rol {role} · Solo jugadores convocados
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 gap-2">
          {players.length === 0 ? (
            <p className="text-center py-10 text-sm font-bold text-slate-500 uppercase tracking-widest">
              No hay convocados disponibles para esta posición
            </p>
          ) : (
            players.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => onAssign(player.id)}
                className="w-full bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 p-3 rounded-xl flex items-center justify-between transition-colors text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PlayerSpriteAvatar
                    spriteUrl={player.spriteUrl}
                    alt={player.name}
                    shape="rounded"
                    className="w-12 h-12 border border-slate-800 shrink-0 group-hover:border-blue-500/30"
                  />
                  <div className="min-w-0">
                    <p className="font-black text-sm text-white uppercase truncate">{player.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase font-bold">
                      {player.position} · Nv.{player.level}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase bg-blue-600/20 text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/30 shrink-0 ml-2">
                  Asignar
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
