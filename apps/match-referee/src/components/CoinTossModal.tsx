"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Circle, Goal, LandPlot } from "lucide-react";
import { ClubShield } from "@/components/ClubShield";
import type { MatchSide } from "@/lib/match-turn";
import { useScreenOrientation } from "@/hooks/useScreenOrientation";
import {
  getFieldEndLabels,
  resolveKickoff,
  type FieldEnd,
} from "@/lib/match-kickoff";

type TossPhase = "flipping" | "winner" | "choice" | "side" | "summary";

type KickoffChoice = "field" | "ball";

interface CoinTossModalProps {
  homeTeamName: string;
  awayTeamName: string;
  homeShieldUrl?: string | null;
  awayShieldUrl?: string | null;
  onComplete: (result: {
    tossWinner: MatchSide;
    ballPossession: MatchSide;
    pitchSwapped: boolean;
  }) => void;
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
  const isEdge = scaleY < 0.14;

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
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-opacity duration-75"
          style={{
            height: 10,
            opacity: isEdge ? 1 : 0,
            background: "linear-gradient(180deg, #fde68a 0%, #f59e0b 50%, #b45309 100%)",
            boxShadow: "0 0 12px rgba(251,191,36,0.45)",
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}

function TeamBadge({
  side,
  name,
  shieldUrl,
  large,
}: {
  side: MatchSide;
  name: string;
  shieldUrl?: string | null;
  large?: boolean;
}) {
  const isHome = side === "home";
  return (
    <div className={`flex flex-col items-center gap-1 ${large ? "scale-110" : ""}`}>
      <ClubShield
        shieldUrl={shieldUrl}
        alt={name}
        className={`${large ? "w-14 h-14" : "w-10 h-10"} object-contain drop-shadow-lg`}
      />
      <span
        className={`font-black uppercase text-center truncate max-w-[120px] ${
          large ? "text-sm" : "text-[10px]"
        } ${isHome ? "text-blue-300" : "text-red-300"}`}
      >
        {name}
      </span>
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
        {isHome ? "Local" : "Visitante"}
      </span>
    </div>
  );
}

function ChoiceButton({
  icon,
  title,
  subtitle,
  color,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  color: "emerald" | "amber";
  onClick: () => void;
}) {
  const styles =
    color === "emerald"
      ? {
          border: "border-emerald-600/50 hover:border-emerald-500",
          bg: "bg-emerald-950/30 hover:bg-emerald-950/50",
          iconBg: "bg-emerald-900/50 border-emerald-600/40",
          title: "text-emerald-300",
        }
      : {
          border: "border-amber-600/50 hover:border-amber-500",
          bg: "bg-amber-950/30 hover:bg-amber-950/50",
          iconBg: "bg-amber-900/50 border-amber-600/40",
          title: "text-amber-300",
        };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3.5 rounded-2xl border-2 ${styles.border} ${styles.bg} active:scale-[0.98] transition-all`}
    >
      <div
        className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center ${styles.iconBg}`}
      >
        {icon}
      </div>
      <div className="text-left min-w-0 flex-1">
        <p className={`text-sm font-black ${styles.title}`}>{title}</p>
        <p className="text-[11px] text-slate-500 leading-snug">{subtitle}</p>
      </div>
    </button>
  );
}

export function CoinTossModal({
  homeTeamName,
  awayTeamName,
  homeShieldUrl,
  awayShieldUrl,
  onComplete,
}: CoinTossModalProps) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<TossPhase>("flipping");
  const [tossWinner, setTossWinner] = useState<MatchSide | null>(null);
  const [flipTarget, setFlipTarget] = useState<MatchSide>(() =>
    Math.random() < 0.5 ? "home" : "away",
  );
  const [choice, setChoice] = useState<KickoffChoice | null>(null);
  const [fieldEnd, setFieldEnd] = useState<FieldEnd | null>(null);

  const orientation = useScreenOrientation();
  const endLabels = useMemo(() => getFieldEndLabels(orientation), [orientation]);

  const sideChooser: MatchSide | null =
    choice && tossWinner
      ? choice === "field"
        ? tossWinner
        : tossWinner === "home"
          ? "away"
          : "home"
      : null;

  const summary =
    tossWinner && choice && fieldEnd
      ? resolveKickoff({ tossWinner, choice, fieldEnd })
      : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (phase !== "flipping") return;

    const timer = window.setTimeout(() => {
      setTossWinner(flipTarget);
      setPhase("winner");
    }, FLIP_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [phase, flipTarget]);

  const handleConfirmSummary = () => {
    if (!tossWinner || !summary) return;
    onComplete({
      tossWinner,
      ballPossession: summary.ballPossession,
      pitchSwapped: summary.pitchSwapped,
    });
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" aria-hidden />

      <div className="relative w-full max-w-md rounded-3xl border-2 border-amber-500/40 bg-slate-950 shadow-[0_0_60px_rgba(245,158,11,0.15)] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 bg-linear-to-r from-amber-950/40 to-slate-950 text-center">
          <h2 className="text-lg font-black uppercase tracking-widest text-amber-300">
            Sorteo inicial
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-wider">
            Cara o cruz
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 px-2">
            <TeamBadge side="home" name={homeTeamName} shieldUrl={homeShieldUrl} large={tossWinner === "home"} />
            <div className="flex flex-col items-center gap-1 shrink-0">
              <Circle className="w-6 h-6 text-amber-500" />
              <span className="text-[9px] font-black text-slate-600 uppercase">VS</span>
            </div>
            <TeamBadge side="away" name={awayTeamName} shieldUrl={awayShieldUrl} large={tossWinner === "away"} />
          </div>

          {(phase === "flipping" || phase === "winner") && (
            <div className="flex flex-col items-center gap-5 py-2">
              <AnimatedCoin targetWinner={flipTarget} settled={phase === "winner"} />

              {phase === "flipping" && (
                <p className="text-sm font-black text-amber-400 uppercase tracking-widest animate-pulse">
                  Girando la moneda...
                </p>
              )}

              {phase === "winner" && tossWinner && (
                <div className="text-center space-y-3 w-full animate-in fade-in">
                  <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">
                    ¡Gana el sorteo!
                  </p>
                  <p
                    className={`text-xl font-black uppercase truncate px-2 ${
                      tossWinner === "home" ? "text-blue-300" : "text-red-300"
                    }`}
                  >
                    {tossWinner === "home" ? homeTeamName : awayTeamName}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPhase("choice")}
                    className="w-full py-3.5 rounded-xl font-black text-sm bg-linear-to-r from-amber-500 to-amber-600 border-b-4 border-amber-800 text-amber-950 active:scale-[0.98] transition-all"
                  >
                    Continuar
                  </button>
                </div>
              )}
            </div>
          )}

          {phase === "choice" && tossWinner && (
            <div className="space-y-3 animate-in fade-in">
              <p className="text-center text-sm text-slate-300 px-1">
                <span
                  className={`font-black ${
                    tossWinner === "home" ? "text-blue-300" : "text-red-300"
                  }`}
                >
                  {tossWinner === "home" ? homeTeamName : awayTeamName}
                </span>
                {" "}elige primero:
              </p>
              <div className="flex flex-col gap-2">
                <ChoiceButton
                  color="emerald"
                  title="Campo"
                  subtitle="Tú eliges en qué lado jugar"
                  icon={<LandPlot className="w-5 h-5 text-emerald-400" />}
                  onClick={() => {
                    setChoice("field");
                    setPhase("side");
                  }}
                />
                <ChoiceButton
                  color="amber"
                  title="Pelota"
                  subtitle="Saque inicial — el rival elige lado"
                  icon={<Goal className="w-5 h-5 text-amber-400" />}
                  onClick={() => {
                    setChoice("ball");
                    setPhase("side");
                  }}
                />
              </div>
            </div>
          )}

          {phase === "side" && sideChooser && choice && (
            <div className="space-y-4 animate-in fade-in">
              <p className="text-center text-sm text-slate-300 px-1">
                <span
                  className={`font-black ${
                    sideChooser === "home" ? "text-blue-300" : "text-red-300"
                  }`}
                >
                  {sideChooser === "home" ? homeTeamName : awayTeamName}
                </span>
                {" "}elige el lado:
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFieldEnd("endA");
                    setPhase("summary");
                  }}
                  className="py-3.5 px-4 rounded-2xl border-2 border-slate-700 bg-slate-900/60 hover:border-amber-500/60 hover:bg-slate-900 active:scale-[0.98] transition-all text-left"
                >
                  <span className="text-sm font-bold text-white">{endLabels.endA}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFieldEnd("endB");
                    setPhase("summary");
                  }}
                  className="py-3.5 px-4 rounded-2xl border-2 border-slate-700 bg-slate-900/60 hover:border-amber-500/60 hover:bg-slate-900 active:scale-[0.98] transition-all text-left"
                >
                  <span className="text-sm font-bold text-white">{endLabels.endB}</span>
                </button>
              </div>
            </div>
          )}

          {phase === "summary" && tossWinner && summary && fieldEnd && (
            <div className="space-y-4 animate-in fade-in">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex justify-between items-center gap-3 text-sm">
                  <span className="text-slate-500 font-bold text-[10px] uppercase shrink-0">
                    Saque
                  </span>
                  <span
                    className={`font-black text-right truncate ${
                      summary.ballPossession === "home" ? "text-blue-300" : "text-red-300"
                    }`}
                  >
                    {summary.ballPossession === "home" ? homeTeamName : awayTeamName}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-3 text-sm">
                  <span className="text-slate-500 font-bold text-[10px] uppercase shrink-0">
                    Local
                  </span>
                  <span className="font-bold text-blue-300 text-xs text-right">
                    {summary.pitchSwapped ? endLabels.endA : endLabels.endB}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-3 text-sm">
                  <span className="text-slate-500 font-bold text-[10px] uppercase shrink-0">
                    Visitante
                  </span>
                  <span className="font-bold text-red-300 text-xs text-right">
                    {summary.pitchSwapped ? endLabels.endB : endLabels.endA}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleConfirmSummary}
                className="w-full py-3.5 rounded-xl font-black text-sm bg-linear-to-r from-emerald-500 to-emerald-600 border-b-4 border-emerald-800 text-emerald-950 active:scale-[0.98] transition-all"
              >
                ¡Comenzar partido!
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
