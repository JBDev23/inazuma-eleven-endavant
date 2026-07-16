"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AppliedSubstitution } from "@/lib/match-substitutions";
import {
  hasSubEntryFacilityBoost,
  SUB_ENTRY_BOOST_TURNS,
  SUB_ENTRY_STAT_MULTIPLIER,
} from "@inazuma/shared";
import { ArrowDown, ArrowUp, ArrowUpCircle, BatteryWarning } from "lucide-react";
import { PlayerSpriteAvatar } from "@/components/PlayerSpriteAvatar";
import { useMatchStore } from "@/store/useMatchStore";
import { getTeamFacilities } from "@/lib/match-facility";

interface SubstitutionOverlayProps {
  substitutions: AppliedSubstitution[];
  onComplete: () => void;
}

function getSubstitutionSignature(substitutions: AppliedSubstitution[]): string {
  return substitutions
    .map(
      (sub) =>
        `${sub.side}:${sub.outPlayer.id}:${sub.inPlayer.id}:${sub.reason ?? "manual"}`,
    )
    .join("|");
}

function SingleSubBoard({
  sub,
  visible,
  hasSubBoost,
}: {
  sub: AppliedSubstitution;
  visible: boolean;
  hasSubBoost: boolean;
}) {
  const isHome = sub.side === "home";
  const isExhaustion = sub.reason === "exhaustion";

  return (
    <div
      className={`flex items-stretch gap-0 rounded-2xl overflow-hidden border-2 shadow-2xl transition-all duration-500 ${
        visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
      } ${
        isExhaustion
          ? "border-amber-500/70 shadow-[0_0_40px_rgba(245,158,11,0.35)]"
          : isHome
            ? "border-blue-500/60"
            : "border-red-500/60"
      }`}
    >
      <div
        className={`px-3 py-4 flex flex-col justify-center items-center min-w-[72px] ${
          isExhaustion
            ? "bg-amber-950/95"
            : isHome
              ? "bg-blue-950/90"
              : "bg-red-950/90"
        }`}
      >
        {isExhaustion ? (
          <>
            <BatteryWarning className="w-5 h-5 text-amber-400 mb-1 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-300 text-center leading-tight">
              Agotado
            </span>
          </>
        ) : (
          <>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Cambio
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-wider ${
                isHome ? "text-blue-300" : "text-red-300"
              }`}
            >
              {isHome ? "Local" : "Visit."}
            </span>
          </>
        )}
      </div>

      <div className="bg-slate-950/95 px-4 py-3 flex flex-col gap-2 min-w-[200px]">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 shrink-0 overflow-hidden ${
              isExhaustion
                ? "bg-slate-900/90 border-amber-500/60 grayscale animate-[pulse_1.5s_ease-in-out_infinite]"
                : "bg-red-950/80 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
            }`}
          >
            {isExhaustion ? (
              <PlayerSpriteAvatar
                spriteUrl={sub.outPlayer.spriteUrl}
                alt={sub.outPlayer.name}
                shape="square"
                className="w-full h-full"
                imgClassName="opacity-80"
              />
            ) : (
              <span className="text-xl font-black text-red-400 tabular-nums">{sub.position}</span>
            )}
          </div>
          <ArrowDown className={`w-4 h-4 shrink-0 ${isExhaustion ? "text-amber-500" : "text-red-500"}`} />
          <span
            className={`text-sm font-bold truncate flex-1 ${
              isExhaustion ? "text-amber-200/90 line-through decoration-amber-500/60" : "text-red-300"
            }`}
          >
            {sub.outPlayer.name.split(" ")[0]}
          </span>
        </div>

        <div className="h-px bg-slate-800" />

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 shrink-0 overflow-hidden ${
              isExhaustion
                ? "bg-emerald-950/80 border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.45)]"
                : "bg-emerald-950/80 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
            }`}
          >
            {isExhaustion ? (
              <PlayerSpriteAvatar
                spriteUrl={sub.inPlayer.spriteUrl}
                alt={sub.inPlayer.name}
                shape="square"
                className="w-full h-full"
              />
            ) : (
              <span className="text-xl font-black text-emerald-400 tabular-nums">{sub.position}</span>
            )}
          </div>
          <ArrowUp className={`w-4 h-4 shrink-0 ${isExhaustion ? "text-emerald-400" : "text-emerald-500"}`} />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-emerald-300 truncate block">
              {sub.inPlayer.name.split(" ")[0]}
            </span>
            {hasSubBoost && (
              <span
                className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-300/50 bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-200"
                title="Banquillos Nv.2: entrada en caliente"
              >
                <ArrowUpCircle className="w-3 h-3" />
                +{Math.round((SUB_ENTRY_STAT_MULTIPLIER - 1) * 100)}% · {SUB_ENTRY_BOOST_TURNS}T
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SubstitutionOverlay({ substitutions, onComplete }: SubstitutionOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const signature = getSubstitutionSignature(substitutions);
  const isExhaustion = substitutions.some((sub) => sub.reason === "exhaustion");
  const matchFormat = useMatchStore((state) => state.matchFormat);
  const homeTeam = useMatchStore((state) => state.homeTeam);
  const awayTeam = useMatchStore((state) => state.awayTeam);
  const homeFacilities = getTeamFacilities(homeTeam);
  const awayFacilities = getTeamFacilities(awayTeam);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!signature) return;

    setVisible(false);

    const showTimer = window.setTimeout(() => setVisible(true), 80);
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(() => onCompleteRef.current(), 450);
    }, isExhaustion ? 3600 : 3000);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [signature, isExhaustion]);

  if (!mounted || substitutions.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-500 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="relative flex flex-col gap-3 items-center px-4">
        {substitutions.map((sub, i) => (
          <SingleSubBoard
            key={`${sub.side}-${sub.outPlayer.id}-${sub.inPlayer.id}-${i}`}
            sub={sub}
            visible={visible}
            hasSubBoost={hasSubEntryFacilityBoost(
              sub.side,
              matchFormat,
              homeFacilities,
              awayFacilities,
            )}
          />
        ))}
      </div>
    </div>,
    document.body,
  );
}
