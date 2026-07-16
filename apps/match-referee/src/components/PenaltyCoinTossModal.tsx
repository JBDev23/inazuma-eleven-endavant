"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Circle } from "lucide-react";
import { ClubShield } from "@/components/ClubShield";
import type { MatchSide } from "@/lib/match-turn";

interface PenaltyCoinTossModalProps {
  homeTeamName: string;
  awayTeamName: string;
  homeShieldUrl?: string | null;
  awayShieldUrl?: string | null;
  onComplete: (firstShooterSide: MatchSide) => void;
}

const FLIP_DURATION_MS = 2800;
const COIN_SIZE = 120;

function CoinDisc({ side }: { side: MatchSide }) {
  const isHome = side === "home";
  return (
    <div
      className={`rounded-full flex flex-col items-center justify-center border-[3px] border-amber-400 ${
        isHome
          ? "bg-linear-to-br from-blue-400 via-blue-600 to-blue-900"
          : "bg-linear-to-br from-red-400 via-red-600 to-red-900"
      }`}
      style={{
        width: COIN_SIZE,
        height: COIN_SIZE,
        boxShadow:
          "0 8px 24px rgba(0,0,0,0.45), inset 0 2px 8px rgba(255,255,255,0.3), inset 0 -3px 8px rgba(0,0,0,0.3)",
      }}
    >
      <span className="text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
        {isHome ? "L" : "V"}
      </span>
      <span className="text-[9px] font-black uppercase tracking-wider text-white/70 mt-1">
        {isHome ? "Local" : "Visita"}
      </span>
    </div>
  );
}

function AnimatedCoin({
  targetWinner,
  settled,
}: {
  targetWinner: MatchSide;
  settled: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const endHalfRotationsRef = useRef(
    (() => {
      const fullFlips = 5 + Math.floor(Math.random() * 3);
      return targetWinner === "away" ? fullFlips * 2 + 1 : fullFlips * 2;
    })(),
  );

  useEffect(() => {
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / FLIP_DURATION_MS);
      const eased = 1 - (1 - t) ** 3;
      setProgress(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetWinner]);

  const halfRotations = progress * endHalfRotationsRef.current;
  const scaleY = Math.max(0.03, Math.abs(Math.cos(halfRotations * Math.PI)));

  const displaySide: MatchSide =
    progress >= 0.99
      ? targetWinner
      : Math.floor(halfRotations) % 2 === 0
        ? "home"
        : "away";

  const lift = settled ? 0 : Math.sin(progress * Math.PI) * 64;
  const shadowScale = 0.45 + (1 - lift / 64) * 0.55;

  return (
    <div
      className="relative flex items-center justify-center py-2"
      style={{ width: COIN_SIZE, height: COIN_SIZE + 40 }}
    >
      <div
        className="absolute bottom-2 left-1/2 rounded-[100%] bg-black/50 blur-md"
        style={{
          width: COIN_SIZE * 0.7,
          height: 14,
          transform: `translateX(-50%) scaleX(${shadowScale})`,
          opacity: 0.35 + shadowScale * 0.45,
        }}
        aria-hidden
      />
      <div
        className="relative"
        style={{
          transform: `translateY(${-lift}px)`,
          width: COIN_SIZE,
          height: COIN_SIZE,
        }}
      >
        <div style={{ transform: `scaleY(${scaleY})`, transformOrigin: "center center" }}>
          <CoinDisc side={displaySide} />
        </div>
      </div>
    </div>
  );
}

export function PenaltyCoinTossModal({
  homeTeamName,
  awayTeamName,
  homeShieldUrl,
  awayShieldUrl,
  onComplete,
}: PenaltyCoinTossModalProps) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<"flipping" | "result">("flipping");
  const [flipTarget] = useState<MatchSide>(() => (Math.random() < 0.5 ? "home" : "away"));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (phase !== "flipping") return;
    const timer = window.setTimeout(() => setPhase("result"), FLIP_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" aria-hidden />

      <div className="relative w-full max-w-md rounded-3xl border-2 border-amber-500/40 bg-slate-950 shadow-[0_0_60px_rgba(245,158,11,0.15)] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 bg-linear-to-r from-amber-950/40 to-slate-950 text-center">
          <h2 className="text-lg font-black uppercase tracking-widest text-amber-300">
            Sorteo de penaltis
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-wider">
            ¿Quién lanza primero?
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 px-2">
            <div className="flex flex-col items-center gap-1">
              <ClubShield shieldUrl={homeShieldUrl} alt={homeTeamName} className="w-10 h-10 object-contain" />
              <span className="text-[10px] font-black uppercase text-blue-300 truncate max-w-[100px]">{homeTeamName}</span>
            </div>
            <Circle className="w-6 h-6 text-amber-500 shrink-0" />
            <div className="flex flex-col items-center gap-1">
              <ClubShield shieldUrl={awayShieldUrl} alt={awayTeamName} className="w-10 h-10 object-contain" />
              <span className="text-[10px] font-black uppercase text-red-300 truncate max-w-[100px]">{awayTeamName}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5 py-2">
            <AnimatedCoin targetWinner={flipTarget} settled={phase === "result"} />

            {phase === "flipping" && (
              <p className="text-sm font-black text-amber-400 uppercase tracking-widest animate-pulse">
                Girando la moneda...
              </p>
            )}

            {phase === "result" && (
              <div className="text-center space-y-3 w-full animate-in fade-in">
                <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">
                  Lanza primero
                </p>
                <p
                  className={`text-xl font-black uppercase truncate px-2 ${
                    flipTarget === "home" ? "text-blue-300" : "text-red-300"
                  }`}
                >
                  {flipTarget === "home" ? homeTeamName : awayTeamName}
                </p>
                <button
                  type="button"
                  onClick={() => onComplete(flipTarget)}
                  className="w-full py-3.5 rounded-xl font-black text-sm bg-linear-to-r from-emerald-500 to-emerald-600 border-b-4 border-emerald-800 text-emerald-950 active:scale-[0.98] transition-all"
                >
                  Comenzar penaltis
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
