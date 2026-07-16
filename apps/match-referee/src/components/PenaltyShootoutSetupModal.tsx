"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Pencil,
  Shield,
  Target,
  UserRound,
} from "lucide-react";
import { getActiveCoach, getEffectiveStats, type PlayerWithDetails, type UserClub } from "@inazuma/shared";
import { ClubShield } from "@/components/ClubShield";
import { PlayerSpriteAvatar } from "@/components/PlayerSpriteAvatar";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import type { PenaltyShootoutState } from "@/lib/penalty-shootout";
import {
  findPlayerInTeam,
  formatPenaltyPlayerLine,
  getAvailableShootersForSlot,
  getGoalkeeperCandidates,
  isPenaltyLineupComplete,
  moveShooterInList,
} from "@/lib/penalty-shootout";

interface PenaltyShootoutSetupModalProps {
  homeTeam: UserClub;
  awayTeam: UserClub;
  format: MatchFormat;
  shootout: PenaltyShootoutState;
  onUpdateLineup: (
    side: "home" | "away",
    shooters: number[],
    goalkeeperId: number,
  ) => void;
  onConfirmSetup: (side: "home" | "away") => void;
  onReopenSetup: (side: "home" | "away") => void;
}

function StatBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "kick" | "guard";
}) {
  const styles =
    tone === "kick"
      ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
      : "text-cyan-300 bg-cyan-500/10 border-cyan-500/30";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black tabular-nums ${styles}`}>
      {label} {value}
    </span>
  );
}

function PlayerPickButton({
  player,
  team,
  format,
  selected,
  disabled,
  statTone,
  onClick,
}: {
  player: PlayerWithDetails;
  team: UserClub;
  format: MatchFormat;
  selected: boolean;
  disabled?: boolean;
  statTone: "kick" | "guard";
  onClick: () => void;
}) {
  const coach = getActiveCoach(team);
  const stats = getEffectiveStats(player, coach);
  const statValue = statTone === "kick" ? stats.kick : stats.guard;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full p-2.5 rounded-xl border-2 text-left transition-all ${
        disabled
          ? "opacity-40 cursor-not-allowed border-slate-800 bg-slate-900/40"
          : selected
            ? "border-amber-400 ring-2 ring-amber-400/40 bg-amber-500/10"
            : "border-slate-700 bg-slate-900/70 hover:border-slate-500 active:scale-[0.99]"
      }`}
    >
      <PlayerSpriteAvatar
        spriteUrl={player.spriteUrl}
        alt={player.name}
        className="w-10 h-10 border border-slate-600"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{player.name}</p>
        <p className="text-[10px] font-bold uppercase text-slate-500 truncate">
          {formatPenaltyPlayerLine(player, format)}
        </p>
      </div>
      <StatBadge label={statTone === "kick" ? "Tiro" : "Par"} value={statValue} tone={statTone} />
    </button>
  );
}

function TeamLineupEditor({
  side,
  team,
  format,
  shooters,
  goalkeeperId,
  kicksPerTeam,
  confirmed,
  onUpdate,
  onConfirm,
  onReopen,
}: {
  side: "home" | "away";
  team: UserClub;
  format: MatchFormat;
  shooters: number[];
  goalkeeperId: number;
  kicksPerTeam: number;
  confirmed: boolean;
  onUpdate: (shooters: number[], goalkeeperId: number) => void;
  onConfirm: () => void;
  onReopen: () => void;
}) {
  const isHome = side === "home";
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const gkCandidates = useMemo(
    () => getGoalkeeperCandidates(team, format),
    [team, format],
  );

  const lineupComplete = isPenaltyLineupComplete(shooters, goalkeeperId, kicksPerTeam);
  const locked = confirmed;

  useEffect(() => {
    if (locked) setEditingSlot(null);
  }, [locked]);

  const setGoalkeeper = (playerId: number) => {
    onUpdate(shooters, playerId);
  };

  const setShooterAt = (slotIndex: number, playerId: number) => {
    const next = [...shooters];
    next[slotIndex] = playerId;
    onUpdate(next, goalkeeperId);
    setEditingSlot(null);
  };

  const moveShooter = (index: number, direction: -1 | 1) => {
    onUpdate(moveShooterInList(shooters, index, index + direction), goalkeeperId);
  };

  const slots = Array.from({ length: kicksPerTeam }, (_, index) => shooters[index] ?? null);

  return (
    <div
      className={`rounded-2xl border-2 p-4 space-y-4 ${
        isHome ? "border-blue-500/40 bg-blue-950/20" : "border-red-500/40 bg-red-950/20"
      }`}
    >
      <div className="flex items-center gap-3">
        <ClubShield shieldUrl={team.shieldUrl} alt={team.name} className="w-8 h-8 object-contain" />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-black uppercase truncate ${isHome ? "text-blue-300" : "text-red-300"}`}>
            {team.name}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {isHome ? "Local" : "Visitante"}
          </p>
        </div>
        {confirmed ? (
          <button
            type="button"
            onClick={onReopen}
            className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-slate-300 bg-slate-800 border border-slate-600 px-2.5 py-1.5 rounded-full hover:border-amber-500/50"
          >
            <Pencil className="w-3 h-3" /> Editar
          </button>
        ) : lineupComplete ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-full">
            <Check className="w-3 h-3" /> Completo
          </span>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Shield className="w-3.5 h-3.5" /> Portero
        </label>
        <div className="space-y-2 max-h-44 overflow-y-auto scrollbar-hide pr-1">
          {gkCandidates.map((player) => (
            <PlayerPickButton
              key={player.id}
              player={player}
              team={team}
              format={format}
              selected={player.id === goalkeeperId}
              disabled={locked}
              statTone="guard"
              onClick={() => setGoalkeeper(player.id)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Target className="w-3.5 h-3.5" /> Orden de tiradores
        </label>

        <div className="space-y-2">
          {slots.map((shooterId, index) => {
            const player = shooterId != null ? findPlayerInTeam(team, shooterId) : null;
            const isEditing = editingSlot === index;
            const slotOptions = getAvailableShootersForSlot(
              team,
              format,
              goalkeeperId,
              shooters,
              index,
            );

            return (
              <div key={index} className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden">
                <div className="flex items-center gap-2 px-2 py-2">
                  <span className="w-6 text-center text-xs font-black text-amber-400 tabular-nums shrink-0">
                    {index + 1}
                  </span>

                  {player ? (
                    <>
                      <PlayerSpriteAvatar
                        spriteUrl={player.spriteUrl}
                        alt={player.name}
                        className="w-9 h-9 border border-slate-600 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{player.name}</p>
                        <p className="text-[10px] font-bold uppercase text-slate-500 truncate">
                          {formatPenaltyPlayerLine(player, format)}
                        </p>
                      </div>
                      {!locked && (
                        <button
                          type="button"
                          onClick={() => setEditingSlot(isEditing ? null : index)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-600 hover:border-amber-500/50"
                        >
                          {isEditing ? "Cerrar" : "Cambiar"}
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => setEditingSlot(index)}
                      className="flex-1 flex items-center gap-2 py-2 px-2 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:border-amber-500/50 hover:text-amber-300 disabled:opacity-40"
                    >
                      <UserRound className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-black uppercase">Elegir jugador</span>
                    </button>
                  )}

                  {!locked && player && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveShooter(index, -1)}
                        className="p-1 rounded-lg bg-slate-800 text-slate-400 disabled:opacity-30"
                        aria-label="Subir tirador"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === slots.length - 1 || !slots[index + 1]}
                        onClick={() => moveShooter(index, 1)}
                        className="p-1 rounded-lg bg-slate-800 text-slate-400 disabled:opacity-30"
                        aria-label="Bajar tirador"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {isEditing && !locked && (
                  <div className="border-t border-slate-800 p-2 space-y-2 max-h-48 overflow-y-auto scrollbar-hide bg-slate-950/50">
                    {slotOptions.length === 0 ? (
                      <p className="text-xs text-slate-500 font-bold px-2 py-3 text-center">
                        No hay jugadores disponibles
                      </p>
                    ) : (
                      slotOptions.map((candidate) => (
                        <PlayerPickButton
                          key={candidate.id}
                          player={candidate}
                          team={team}
                          format={format}
                          selected={candidate.id === shooterId}
                          statTone="kick"
                          onClick={() => setShooterAt(index, candidate.id)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!confirmed && (
        <button
          type="button"
          disabled={!lineupComplete}
          onClick={onConfirm}
          className="w-full py-3 rounded-xl font-black text-sm bg-linear-to-r from-amber-500 to-amber-600 border-b-4 border-amber-800 text-amber-950 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all"
        >
          Confirmar {isHome ? "local" : "visitante"}
        </button>
      )}
    </div>
  );
}

export function PenaltyShootoutSetupModal({
  homeTeam,
  awayTeam,
  format,
  shootout,
  onUpdateLineup,
  onConfirmSetup,
  onReopenSetup,
}: PenaltyShootoutSetupModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const bothConfirmed = shootout.homeSetupConfirmed && shootout.awaySetupConfirmed;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 overflow-y-auto scrollbar-hide">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" aria-hidden />

      <div className="relative w-full max-w-5xl rounded-3xl border-2 border-amber-500/40 bg-slate-950 shadow-[0_0_60px_rgba(245,158,11,0.15)] overflow-hidden my-4">
        <div className="px-5 sm:px-6 py-5 border-b border-slate-800 bg-linear-to-r from-amber-950/40 to-slate-950 text-center">
          <h2 className="text-lg font-black uppercase tracking-widest text-amber-300">
            Tanda de penaltis
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-wider">
            Elige portero y orden de tiradores · Titulares y banquillo
          </p>
          {bothConfirmed && (
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400 mt-2">
              Ambos equipos listos — sorteo en breve
            </p>
          )}
        </div>

        <div className="p-3 sm:p-6 grid lg:grid-cols-2 gap-4">
          <TeamLineupEditor
            side="home"
            team={homeTeam}
            format={format}
            shooters={shootout.homeShooters}
            goalkeeperId={shootout.homeGoalkeeperId}
            kicksPerTeam={shootout.kicksPerTeam}
            confirmed={shootout.homeSetupConfirmed}
            onUpdate={(shooters, goalkeeperId) => onUpdateLineup("home", shooters, goalkeeperId)}
            onConfirm={() => onConfirmSetup("home")}
            onReopen={() => onReopenSetup("home")}
          />
          <TeamLineupEditor
            side="away"
            team={awayTeam}
            format={format}
            shooters={shootout.awayShooters}
            goalkeeperId={shootout.awayGoalkeeperId}
            kicksPerTeam={shootout.kicksPerTeam}
            confirmed={shootout.awaySetupConfirmed}
            onUpdate={(shooters, goalkeeperId) => onUpdateLineup("away", shooters, goalkeeperId)}
            onConfirm={() => onConfirmSetup("away")}
            onReopen={() => onReopenSetup("away")}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
