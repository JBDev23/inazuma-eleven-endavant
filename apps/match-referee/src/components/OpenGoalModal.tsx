"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { PlayerWithDetails, UserClub } from "@inazuma/shared";
import { Goal, X } from "lucide-react";
import { PlayerSpriteAvatar } from "@/components/PlayerSpriteAvatar";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import type { MatchSide } from "@/lib/match-turn";
import { isGoalkeeperSlot } from "@/lib/duel-context";
import { getStarterPlayers } from "@/lib/match-substitutions";
import { getPositionKey } from "@/lib/roster-utils";

interface OpenGoalModalProps {
  attackingSide: MatchSide;
  team: UserClub;
  teamName: string;
  format: MatchFormat;
  currentTurn: number;
  onConfirm: (player: PlayerWithDetails) => void;
  onClose: () => void;
}

export function OpenGoalModal({
  attackingSide,
  team,
  teamName,
  format,
  currentTurn,
  onConfirm,
  onClose,
}: OpenGoalModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const candidates = useMemo(
    () =>
      getStarterPlayers(team, format).filter(
        (player) => !isGoalkeeperSlot(player, format),
      ),
    [team, format],
  );

  const posKey = getPositionKey(format);
  const isHome = attackingSide === "home";
  const accentClass = isHome ? "text-blue-400" : "text-red-400";
  const borderSelected = isHome ? "border-blue-400" : "border-red-400";
  const selectedPlayer = candidates.find((p) => p.id === selectedPlayerId) ?? null;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-700 w-full max-w-lg rounded-3xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        <div className="p-5 border-b border-slate-800 flex justify-between items-start gap-4 bg-slate-900">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Goal className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-black uppercase tracking-tight text-white">
                Tiro a puerta vacía
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Turno {currentTurn} · Sin portero ·{" "}
              <span className={`font-bold ${accentClass}`}>{teamName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <p className="text-sm text-slate-400 text-center">
            Elige al jugador que marca el gol. No hay duelo ni resolución de poder.
          </p>

          {candidates.length === 0 ? (
            <p className="text-center text-sm text-red-400/80 py-6">
              No hay jugadores de campo disponibles en el once.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {candidates.map((player) => {
                const selected = selectedPlayerId === player.id;
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => setSelectedPlayerId(player.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                      selected
                        ? `${borderSelected} bg-slate-800 ring-2 ring-emerald-500/30`
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                    }`}
                  >
                    <PlayerSpriteAvatar
                      spriteUrl={player.spriteUrl}
                      alt={player.name}
                      className="w-12 h-12 border-2 border-slate-600 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white truncate">{player.name}</p>
                      <p className="text-[10px] font-mono text-slate-500 uppercase">
                        POS {player[posKey]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-800 bg-slate-900/80 flex flex-col gap-2">
          <button
            type="button"
            disabled={!selectedPlayer}
            onClick={() => selectedPlayer && onConfirm(selectedPlayer)}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-linear-to-r from-emerald-500 to-emerald-600 border-b-4 border-emerald-800 text-emerald-950 shadow-[0_0_30px_rgba(16,185,129,0.25)] enabled:hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]"
          >
            Confirmar gol
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold uppercase tracking-widest text-sm text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
