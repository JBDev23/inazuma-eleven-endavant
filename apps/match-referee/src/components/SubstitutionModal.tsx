"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { PlayerWithDetails, UserClub } from "@inazuma/shared";
import { getActiveCoach, getEffectiveStats } from "@inazuma/shared";
import { X, ArrowRightLeft, Users, BatteryWarning, Target, Sparkles } from "lucide-react";
import { PlayerSpriteAvatar } from "@/components/PlayerSpriteAvatar";
import type { MatchFormat } from "./MatchFormatSelector";
import { useMatchStore } from "@/store/useMatchStore";
import { resolvePlayerResources } from "@/lib/match-player-resources";
import {
  MAX_SUBSTITUTIONS,
  canRequestHalftimeSubstitution,
  canRequestSubstitution,
  getBenchPlayers,
  getPlayerPosition,
  getStarterPlayers,
  type TeamSubstitutionState,
} from "@/lib/match-substitutions";
import { getExhaustionBenchCandidates } from "@/lib/match-exhaustion";

const SCROLL_AREA =
  "overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

function PlayerResourceIndicators({
  gp,
  maxGp,
  tp,
  maxTp,
}: {
  gp: number;
  maxGp: number;
  tp: number;
  maxTp: number;
}) {
  return (
    <div className="flex flex-col items-end gap-0.5 shrink-0">
      <span
        className={`text-[10px] font-black tabular-nums leading-none ${
          gp <= 0 ? "text-red-400" : "text-amber-300"
        }`}
      >
        <Target className="inline w-2.5 h-2.5 mr-0.5 opacity-80" />
        {gp}
        <span className="text-slate-600 font-bold">/{maxGp}</span>
      </span>
      <span
        className={`text-[10px] font-black tabular-nums leading-none ${
          tp <= 0 ? "text-red-400" : "text-violet-300"
        }`}
      >
        <Sparkles className="inline w-2.5 h-2.5 mr-0.5 opacity-80" />
        {tp}
        <span className="text-slate-600 font-bold">/{maxTp}</span>
      </span>
    </div>
  );
}

interface SubstitutionModalProps {
  side: "home" | "away";
  teamName: string;
  team: UserClub;
  format: MatchFormat;
  subState: TeamSubstitutionState;
  initialOutPlayerId?: number | null;
  mode?: "manual" | "exhaustion" | "halftime";
  onRequest: (outPlayerId: number, inPlayerId: number) => void;
  onApplyExhaustion?: (outPlayerId: number, inPlayerId: number) => void;
  onApplyHalftime?: (outPlayerId: number, inPlayerId: number) => void;
  onCancelPending: () => void;
  onClose: () => void;
}

function PlayerOption({
  player,
  position,
  selected,
  disabled,
  disabledReason,
  variant,
  gp,
  maxGp,
  tp,
  maxTp,
  onClick,
}: {
  player: PlayerWithDetails;
  position?: number | null;
  selected: boolean;
  disabled?: boolean;
  disabledReason?: string;
  variant: "out" | "in";
  gp: number;
  maxGp: number;
  tp: number;
  maxTp: number;
  onClick: () => void;
}) {
  const borderColor =
    variant === "out"
      ? selected
        ? "border-red-400 ring-2 ring-red-400/50"
        : "border-slate-700 hover:border-red-500/60"
      : selected
        ? "border-emerald-400 ring-2 ring-emerald-400/50"
        : "border-slate-700 hover:border-emerald-500/60";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={disabledReason}
      className={`flex items-center gap-3 w-full p-2.5 rounded-xl border-2 bg-slate-900/80 transition-all text-left ${
        disabled ? "opacity-40 cursor-not-allowed" : "active:scale-[0.98]"
      } ${borderColor}`}
    >
      <PlayerSpriteAvatar
        spriteUrl={player.spriteUrl}
        alt={player.name}
        className="w-9 h-9 border border-slate-600"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{player.name}</p>
        <p className="text-[10px] text-slate-500 uppercase font-bold">{player.position}</p>
      </div>
      {position != null && (
        <span
          className={`text-lg font-black tabular-nums ${
            variant === "out" ? "text-red-400" : "text-emerald-400"
          }`}
        >
          {position}
        </span>
      )}
      <PlayerResourceIndicators gp={gp} maxGp={maxGp} tp={tp} maxTp={maxTp} />
    </button>
  );
}

export function SubstitutionModal({
  side,
  teamName,
  team,
  format,
  subState,
  initialOutPlayerId = null,
  mode = "manual",
  onRequest,
  onApplyExhaustion,
  onApplyHalftime,
  onCancelPending,
  onClose,
}: SubstitutionModalProps) {
  const isExhaustion = mode === "exhaustion";
  const isHalftime = mode === "halftime";
  const [mounted, setMounted] = useState(false);
  const [outId, setOutId] = useState<number | null>(initialOutPlayerId);
  const [inId, setInId] = useState<number | null>(null);
  const playerResources = useMatchStore((state) => state.playerResources);
  const coach = getActiveCoach(team);

  const getPlayerResourceDisplay = (player: PlayerWithDetails) => {
    const current = resolvePlayerResources(playerResources, player, coach);
    const max = getEffectiveStats(player, coach);
    return {
      gp: current.gp,
      maxGp: max.gp,
      tp: current.tp,
      maxTp: max.tp,
    };
  };

  const isHome = side === "home";
  const remaining = MAX_SUBSTITUTIONS - subState.used;
  const starters = useMemo(() => getStarterPlayers(team, format), [team, format]);
  const bench = useMemo(() => getBenchPlayers(team, format), [team, format]);
  const lockedOutPlayer = isExhaustion && initialOutPlayerId
    ? team.roster.find((player) => player.id === initialOutPlayerId)
    : null;
  const exhaustionBench = useMemo(() => {
    if (!isExhaustion || !lockedOutPlayer) return bench;
    return getExhaustionBenchCandidates(team, format, lockedOutPlayer, subState.subbedOutIds);
  }, [bench, format, isExhaustion, lockedOutPlayer, subState.subbedOutIds, team]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOutId(initialOutPlayerId);
    setInId(null);
  }, [initialOutPlayerId, side, mode]);

  const validationError =
    outId !== null && inId !== null
      ? isExhaustion
        ? (() => {
            if (!lockedOutPlayer) return "Jugador agotado no encontrado.";
            if (!exhaustionBench.some((player) => player.id === inId)) {
              return "Este suplente no puede entrar en esta posición.";
            }
            if (outId === inId) return "Selecciona un suplente distinto.";
            return null;
          })()
        : isHalftime
          ? canRequestHalftimeSubstitution(subState, team, format, outId, inId)
          : canRequestSubstitution(subState, team, format, outId, inId)
      : null;

  const canConfirm = outId !== null && inId !== null && !validationError;

  const pendingOut = subState.pending
    ? team.roster.find((p) => p.id === subState.pending!.outPlayerId)
    : null;
  const pendingIn = subState.pending
    ? team.roster.find((p) => p.id === subState.pending!.inPlayerId)
    : null;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4">
      {!isExhaustion && (
        <button
          type="button"
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Cerrar"
        />
      )}
      {isExhaustion && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden />
      )}

      <div
        className={`relative w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border-2 bg-slate-950 shadow-2xl ${
          isExhaustion
            ? "border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.2)]"
            : isHalftime
              ? "border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
              : isHome
                ? "border-blue-500/40"
                : "border-red-500/40"
        }`}
      >
        <div
          className={`sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-slate-800 ${
            isExhaustion
              ? "bg-amber-950/60"
              : isHalftime
                ? "bg-emerald-950/60"
                : isHome
                  ? "bg-blue-950/50"
                  : "bg-red-950/50"
          }`}
        >
          <div className="flex items-center gap-2">
            {isExhaustion ? (
              <BatteryWarning className="w-5 h-5 text-amber-400 animate-pulse" />
            ) : (
              <ArrowRightLeft
                className={`w-5 h-5 ${
                  isHalftime
                    ? "text-emerald-400"
                    : isHome
                      ? "text-blue-400"
                      : "text-red-400"
                }`}
              />
            )}
            <div>
              <h2 className="text-base font-black uppercase tracking-wide">
                {isExhaustion
                  ? "Jugador agotado"
                  : isHalftime
                    ? "Cambios de entretiempo"
                    : "Cambios"}
              </h2>
              <p
                className={`text-xs font-bold ${
                  isExhaustion
                    ? "text-amber-300/80"
                    : isHalftime
                      ? "text-emerald-300/80"
                      : isHome
                        ? "text-blue-300/80"
                        : "text-red-300/80"
                }`}
              >
                {teamName}
              </p>
            </div>
          </div>
          {!isExhaustion && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className={`p-5 space-y-5 flex-1 min-h-0 overflow-y-auto ${SCROLL_AREA}`}>
          {isExhaustion ? (
            <>
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-amber-300">
                  Sin GP — elige quién entra
                </p>
                {lockedOutPlayer && (
                  <p className="text-sm text-amber-100/90">
                    <span className="font-black text-amber-300">{lockedOutPlayer.name}</span>
                    {" "}debe salir del campo.
                  </p>
                )}
              </div>

              {exhaustionBench.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-4">
                  No hay suplentes disponibles. El jugador permanecerá agotado en el campo.
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                      <Users size={12} />
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Elige suplente
                    </p>
                    <div className="space-y-2">
                      {exhaustionBench.map((player) => {
                        const resources = getPlayerResourceDisplay(player);
                        return (
                        <PlayerOption
                          key={player.id}
                          player={player}
                          selected={inId === player.id}
                          variant="in"
                          {...resources}
                          onClick={() => setInId(player.id)}
                        />
                        );
                      })}
                    </div>
                  </div>

                  {validationError && inId && (
                    <p className="text-xs font-bold text-red-400 text-center">{validationError}</p>
                  )}

                  <button
                    type="button"
                    disabled={!canConfirm}
                    onClick={() => {
                      if (!canConfirm || outId === null || inId === null) return;
                      onApplyExhaustion?.(outId, inId);
                    }}
                    className="w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-sm bg-linear-to-r from-amber-500 to-amber-600 border-b-4 border-amber-800 text-amber-950 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                  >
                    Confirmar cambio
                  </button>
                </>
              )}

              {exhaustionBench.length === 0 && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-black uppercase tracking-widest text-sm bg-slate-800 border border-slate-700 text-slate-300"
                >
                  Continuar sin cambio
                </button>
              )}
            </>
          ) : isHalftime ? (
            <>
              <div className="flex items-center justify-between bg-emerald-500/10 rounded-xl px-4 py-3 border border-emerald-500/30">
                <span className="text-xs font-bold text-emerald-300/90 uppercase tracking-widest">
                  Sin coste de cambios
                </span>
                <span className="text-sm font-black text-emerald-300 uppercase tracking-widest">
                  Gratis
                </span>
              </div>

              {bench.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-4">
                  No hay jugadores en el banquillo.
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Sale del campo
                    </p>
                    <div className="space-y-2">
                      {starters.map((player) => {
                        const resources = getPlayerResourceDisplay(player);
                        return (
                        <PlayerOption
                          key={player.id}
                          player={player}
                          position={getPlayerPosition(player, format)}
                          selected={outId === player.id}
                          variant="out"
                          {...resources}
                          onClick={() => {
                            setOutId(player.id);
                            if (inId === player.id) setInId(null);
                          }}
                        />
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                      <Users size={12} />
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Entra del banquillo
                    </p>
                    <div className="space-y-2">
                      {bench.map((player) => {
                        const blocked = subState.subbedOutIds.includes(player.id);
                        const resources = getPlayerResourceDisplay(player);
                        return (
                        <PlayerOption
                          key={player.id}
                          player={player}
                          selected={inId === player.id}
                          disabled={blocked}
                          disabledReason="Ya jugó y fue retirado"
                          variant="in"
                          {...resources}
                          onClick={() => setInId(player.id)}
                        />
                        );
                      })}
                    </div>
                  </div>

                  {validationError && outId && inId && (
                    <p className="text-xs font-bold text-red-400 text-center">{validationError}</p>
                  )}

                  <button
                    type="button"
                    disabled={!canConfirm}
                    onClick={() => {
                      if (!canConfirm || outId === null || inId === null) return;
                      onApplyHalftime?.(outId, inId);
                      setOutId(null);
                      setInId(null);
                    }}
                    className="w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-sm bg-linear-to-r from-emerald-500 to-emerald-600 border-b-4 border-emerald-800 text-emerald-950 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                  >
                    Confirmar cambio
                  </button>
                  <p className="text-[10px] text-center text-slate-600">
                    Puedes hacer varios cambios antes de empezar la segunda parte.
                  </p>
                </>
              )}
            </>
          ) : (
            <>
          <div className="flex items-center justify-between bg-slate-900/60 rounded-xl px-4 py-3 border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Cambios restantes
            </span>
            <span className="text-2xl font-black text-amber-400 tabular-nums">
              {remaining}
              <span className="text-sm text-slate-600 font-bold">/{MAX_SUBSTITUTIONS}</span>
            </span>
          </div>

          {subState.pending && pendingOut && pendingIn && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-amber-300">
                Cambio pendiente (próximo turno)
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-black text-red-400 tabular-nums">
                  {getPlayerPosition(pendingOut, format) ?? "?"}
                </span>
                <span className="text-slate-500">→</span>
                <span className="font-bold text-emerald-300 truncate">{pendingIn.name.split(" ")[0]}</span>
              </div>
              <button
                type="button"
                onClick={onCancelPending}
                className="text-xs font-bold text-amber-400/80 hover:text-amber-300 underline"
              >
                Cancelar cambio pendiente
              </button>
            </div>
          )}

          {remaining === 0 ? (
            <p className="text-center text-sm text-slate-500 py-4">
              No quedan cambios disponibles.
            </p>
          ) : bench.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-4">
              No hay jugadores en el banquillo.
            </p>
          ) : !subState.pending ? (
            <>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Sale del campo
                </p>
                <div className="space-y-2">
                  {starters.map((player) => {
                    const resources = getPlayerResourceDisplay(player);
                    return (
                    <PlayerOption
                      key={player.id}
                      player={player}
                      position={getPlayerPosition(player, format)}
                      selected={outId === player.id}
                      variant="out"
                      {...resources}
                      onClick={() => {
                        setOutId(player.id);
                        if (inId === player.id) setInId(null);
                      }}
                    />
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                  <Users size={12} />
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Entra del banquillo
                </p>
                <div className="space-y-2">
                  {bench.map((player) => {
                    const blocked = subState.subbedOutIds.includes(player.id);
                    const resources = getPlayerResourceDisplay(player);
                    return (
                      <PlayerOption
                        key={player.id}
                        player={player}
                        selected={inId === player.id}
                        disabled={blocked}
                        disabledReason="Ya jugó y fue retirado"
                        variant="in"
                        {...resources}
                        onClick={() => setInId(player.id)}
                      />
                    );
                  })}
                </div>
              </div>

              {validationError && outId && inId && (
                <p className="text-xs font-bold text-red-400 text-center">{validationError}</p>
              )}

              <button
                type="button"
                disabled={!canConfirm}
                onClick={() => {
                  if (!canConfirm || outId === null || inId === null) return;
                  onRequest(outId, inId);
                  onClose();
                }}
                className="w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-sm bg-linear-to-r from-amber-500 to-amber-600 border-b-4 border-amber-800 text-amber-950 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
              >
                Solicitar cambio
              </button>
              <p className="text-[10px] text-center text-slate-600">
                El cambio se hará efectivo al pasar el turno.
              </p>
            </>
          ) : null}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
