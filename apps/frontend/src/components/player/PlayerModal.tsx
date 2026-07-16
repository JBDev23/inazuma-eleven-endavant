"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Lock,
  Shield,
  Activity,
  Zap,
  Heart,
  X,
  Target,
  Sparkles,
  CircleDot,
  Wind,
  Battery,
  Flame,
  Bug,
  ChevronDown,
  Mountain,
  Leaf,
  CircleDashed,
  Star,
  TrendingUp,
  type LucideIcon,
  Hand,
  Package,
} from "lucide-react";
// 🎯 Importamos tu nuevo tipo PlayerWithDetails
import type { Player, StatKey, PlayerWithDetails, PlayerMoveWithProgress, ClubResources, Coach, ClubItemWithDetails, ClubFacilityRecord } from "@inazuma/shared";
import { getDisplayStats, getEffectiveStats, getStatsWithItems, getStatModifierKind, getTotalStats, hasItemStatChanges, hasStatBonuses, applyStatBonuses, canAffordResource, getFreeMarketPlayerPrice, resolveClubFacilities } from "@inazuma/shared";
import { api } from "@/services/api";
import { ResourceCostBadge } from "@/components/economy/ResourceCostBadge";
import { PlayerLevelPeSection, PlayerLevelBar } from "@/components/player/PlayerLevelPeSection";
import { PlayerPcSection } from "@/components/player/PlayerPcSection";
import { PlayerEquipmentSection } from "@/components/player/PlayerEquipmentSection";

type DebugAction = "buy" | "sell" | "make-rival-toll";

interface PlayerModalProps {
  // 🎯 Extendemos el tipo para que acepte los moves enriquecidos
  player: (Player | PlayerWithDetails) & { price?: number; moves?: PlayerMoveWithProgress[] };
  status: string;
  onClose: () => void;
  onAction: (action: "buy" | "toll" | "sell", nickname: string) => void;
  isLoading: boolean;
  resources: ClubResources;
  clubId: string;
  activeCoach?: Coach | null;
  clubInventory?: ClubItemWithDetails[];
  onEquipmentChange?: () => void | Promise<void>;
  onDebugComplete?: () => void | Promise<void>;
  onPeRedeemComplete?: (updated: { level: number; experience: number }) => void | Promise<void>;
  onPcSpendComplete?: (updated: Partial<Record<StatKey, number>>) => void | Promise<void>;
  facilities?: ClubFacilityRecord[];
}

type StatusConfig = {
  color: string;
  border: string;
  bg: string;
  glow: string;
};

const STATUS_MAP: Record<string, StatusConfig> = {
  owned: { color: "text-blue-400", border: "border-blue-500", bg: "bg-blue-900/30", glow: "shadow-[0_0_40px_rgba(59,130,246,0.25)]" },
  unlocked: { color: "text-emerald-400", border: "border-emerald-500", bg: "bg-emerald-900/30", glow: "shadow-[0_0_40px_rgba(16,185,129,0.25)]" },
  available: { color: "text-yellow-400", border: "border-yellow-500", bg: "bg-yellow-900/30", glow: "shadow-[0_0_40px_rgba(234,179,8,0.25)]" },
  toll: { color: "text-red-400", border: "border-red-500", bg: "bg-red-900/30", glow: "shadow-[0_0_40px_rgba(239,68,68,0.25)]" },
  locked: { color: "text-slate-500", border: "border-slate-700", bg: "bg-slate-900/50", glow: "" },
  admin: { color: "text-white", border: "border-white", bg: "bg-white/10", glow: "shadow-[0_0_40px_rgba(255,255,255,0.25)]" },
};

const ELEMENT_STYLES: Record<string, string> = {
  Fire: "bg-orange-500/20 text-orange-300 border-orange-500/50",
  Wind: "bg-sky-500/20 text-sky-300 border-sky-500/50",
  Wood: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
  Earth: "bg-amber-500/20 text-amber-300 border-amber-500/50",
};

// ==========================================
// 🎨 HELPERS DE SUPERTÉCNICAS
// ==========================================
const getMoveElementStyle = (element: string, isUnlocked: boolean) => {
  if (!isUnlocked) return "border-slate-800 bg-slate-900/80 text-slate-600 grayscale opacity-75";
  
  switch (element?.toLowerCase()) {
    case "fuego": case "fire": return "border-red-900/50 bg-red-950/30 text-red-400";
    case "bosque": case "wood": return "border-green-900/50 bg-green-950/30 text-green-400";
    case "aire": case "wind": return "border-blue-900/50 bg-blue-950/30 text-blue-400";
    case "montaña": case "earth": return "border-amber-900/50 bg-amber-950/30 text-amber-500";
    default: return "border-slate-700 bg-slate-800/50 text-slate-300";
  }
};

const MoveElementIcon = ({ element, size = 16 }: { element: string, size?: number }) => {
  switch (element?.toLowerCase()) {
    case "fuego": case "fire": return <Flame size={size} />;
    case "bosque": case "wood": return <Leaf size={size} />;
    case "aire": case "wind": return <Wind size={size} />;
    case "montaña": case "earth": return <Mountain size={size} />;
    default: return <CircleDashed size={size} />;
  }
};

const MoveTypeIcon = ({ type, size = 12, className = "" }: { type: string, size?: number, className?: string }) => {
  switch (type?.toUpperCase()) {
    case "SHOOT": return <Target size={size} className={className} />;
    case "DRIBBLE": return <Activity size={size} className={className} />;
    case "BLOCK": return <Shield size={size} className={className} />;
    case "CATCH": return <Hand size={size} className={className} />;
    case "SKILL": return <Sparkles size={size} className={className} />;
    default: return <Shield size={size} className={className} />;
  }
};

const getEvolutionBadge = (path: string, level: number) => {
  // Si está a nivel 1 o no evoluciona, no mostramos nada
  if (level <= 1 || path === "NONE") return null;

  if (path === "SHIN") {
    if (level === 2) return { text: "Kai", style: "text-emerald-400 bg-emerald-950/40 border-emerald-900/50" };
    if (level >= 3) return { text: "Shin", style: "text-purple-400 bg-purple-950/40 border-purple-900/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]" }; // Nivel Máximo
  }

  if (path === "L_G") {
    if (level >= 5) return { text: `L${level}`, style: "text-yellow-400 bg-yellow-950/40 border-yellow-900/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]" }; // Nivel Máximo
    return { text: `L${level}`, style: "text-blue-400 bg-blue-950/40 border-blue-900/50" };
  }

  // Fallback por si acaso
  return { text: `Lv.${level}`, style: "text-slate-400 bg-slate-800/80 border-slate-700" };
};

const EpicEvolution = ({ path, level }: { path: string; level: number }) => {
  if (level <= 1 || path === "NONE") return null;

  let text = "";
  let style = "";

  if (path === "SHIN") {
    if (level === 2) {
      text = "Kai";
      style = "bg-gradient-to-r from-emerald-400 to-teal-300 drop-shadow-[0_0_3px_rgba(52,211,153,0.5)]";
    }
    if (level >= 3) {
      text = "Shin";
      style = "bg-gradient-to-r from-fuchsia-500 to-purple-400 drop-shadow-[0_0_8px_rgba(192,38,211,0.8)] text-[15px]"; // Un pelín más grande
    }
  }

  if (path === "L_G") {
    text = `G${level}`;
    if (level < 5) {
      style = "bg-gradient-to-r from-sky-400 to-blue-400 drop-shadow-[0_0_3px_rgba(56,189,248,0.5)]";
    } else {
      style = "bg-gradient-to-r from-amber-300 to-yellow-500 drop-shadow-[0_0_8px_rgba(252,211,77,0.8)] text-[15px]";
    }
  }

  return (
    <span className={`ml-1.5 italic font-black tracking-wider bg-clip-text text-transparent ${style}`}>
      {text}
    </span>
  );
};

type StatDef = {
  key: StatKey;
  label: string;
  icon: LucideIcon;
  bar: string;
  iconColor: string;
  max: number;
};

const STATS: StatDef[] = [
  { key: "gp", label: "GP", icon: Target, bar: "bg-gradient-to-r from-amber-600 to-yellow-400", iconColor: "text-amber-400", max: 220 },
  { key: "tp", label: "TP", icon: Sparkles, bar: "bg-gradient-to-r from-violet-600 to-purple-400", iconColor: "text-violet-400", max: 220 },
  { key: "kick", label: "Tiro", icon: Zap, bar: "bg-gradient-to-r from-yellow-600 to-amber-300", iconColor: "text-yellow-400", max: 90 },
  { key: "body", label: "Físico", icon: Heart, bar: "bg-gradient-to-r from-rose-600 to-pink-400", iconColor: "text-rose-400", max: 90 },
  { key: "control", label: "Control", icon: CircleDot, bar: "bg-gradient-to-r from-cyan-600 to-teal-400", iconColor: "text-cyan-400", max: 90 },
  { key: "guard", label: "Defensa", icon: Shield, bar: "bg-gradient-to-r from-blue-600 to-indigo-400", iconColor: "text-blue-400", max: 90 },
  { key: "speed", label: "Velocidad", icon: Wind, bar: "bg-gradient-to-r from-sky-600 to-blue-300", iconColor: "text-sky-400", max: 90 },
  { key: "stamina", label: "Resistencia", icon: Battery, bar: "bg-gradient-to-r from-emerald-600 to-green-400", iconColor: "text-emerald-400", max: 90 },
  { key: "guts", label: "Determinación", icon: Flame, bar: "bg-gradient-to-r from-orange-600 to-red-400", iconColor: "text-orange-400", max: 90 },
];

function StatBar({
  stat,
  value,
  baseValue,
}: {
  stat: StatDef;
  value: number;
  baseValue?: number;
}) {
  const pct = Math.min(100, Math.round((value / stat.max) * 100));
  const Icon = stat.icon;
  const kind =
    baseValue != null ? getStatModifierKind(baseValue, value) : "neutral";
  const valueClass =
    kind === "boost"
      ? "text-emerald-400"
      : kind === "nerf"
        ? "text-red-400"
        : "text-white";
  const borderClass =
    kind === "boost"
      ? "border-emerald-500/40 ring-1 ring-emerald-500/20"
      : kind === "nerf"
        ? "border-red-500/40 ring-1 ring-red-500/20"
        : "border-slate-700/50";

  return (
    <div className={`group flex items-center gap-3 rounded-lg bg-slate-800/60 px-3 py-2 border hover:border-slate-600 transition-colors ${borderClass}`}>
      <Icon size={16} className={`shrink-0 ${stat.iconColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
          <span className={`text-sm font-black tabular-nums ${valueClass}`}>
            {value}
            {kind !== "neutral" && baseValue != null && (
              <span className="ml-1.5 text-[10px] font-bold line-through text-slate-500">{baseValue}</span>
            )}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-950/80 overflow-hidden">
          <div className={`h-full rounded-full ${stat.bar} transition-all duration-500 ease-out`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

const DEBUG_ACTIONS: { action: DebugAction; label: string; className: string }[] = [
  { action: "buy", label: "Fichar (debug)", className: "bg-emerald-700 hover:bg-emerald-600 border-emerald-900" },
  { action: "sell", label: "Liberar", className: "bg-slate-700 hover:bg-slate-600 border-slate-900" },
  { action: "make-rival-toll", label: "Peaje rival", className: "bg-red-800 hover:bg-red-700 border-red-950" },
];

function PlayerLevelIndicator({ level = 1, experience = 0 }: { level?: number; experience?: number }) {
  return (
    <div className="mb-6">
      <PlayerLevelBar level={level} experience={experience} />
    </div>
  );
}

export default function PlayerModal({
  player,
  status,
  onClose,
  onAction,
  isLoading,
  resources,
  clubId,
  activeCoach = null,
  clubInventory = [],
  onEquipmentChange,
  onDebugComplete,
  onPeRedeemComplete,
  onPcSpendComplete,
  facilities = [],
}: PlayerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugLoading, setDebugLoading] = useState(false);
  const [liveLevel, setLiveLevel] = useState(player?.level ?? 1);
  const [liveExperience, setLiveExperience] = useState(player?.experience ?? 0);
  const [liveStatBonuses, setLiveStatBonuses] = useState(player?.statBonuses ?? {});

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (player) {
      setLiveLevel(player.level);
      setLiveExperience(player.experience);
      setLiveStatBonuses(player.statBonuses ?? {});
    }
  }, [player?.id, player?.level, player?.experience, player?.statBonuses]);

  useEffect(() => {
    if (!player) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [player, onClose]);

  if (!player || !mounted) return null;

  const isLocked = status === "locked";
  const isToll = status === "toll";
  const statusConfig = STATUS_MAP[status] ?? STATUS_MAP.locked;
  const elementClass = ELEMENT_STYLES[player.element] ?? "bg-slate-700/50 text-slate-300 border-slate-600";
  const playerWithBonuses = { ...player, statBonuses: liveStatBonuses };
  const levelStats = getDisplayStats(player);
  const statsWithPc = applyStatBonuses(levelStats, liveStatBonuses);
  const statsWithItems = getStatsWithItems(playerWithBonuses);
  const displayStats = getEffectiveStats(playerWithBonuses, activeCoach);
  const totalStats = getTotalStats(displayStats);
  const hasPcBonuses = hasStatBonuses(liveStatBonuses);
  const hasItemBonuses = hasItemStatChanges(statsWithPc, statsWithItems);
  const buyPrice = getFreeMarketPlayerPrice(
    player.price ?? 0,
    resolveClubFacilities(facilities),
  );
  const hasCoachBonuses = activeCoach != null && STATS.some((s) => statsWithItems[s.key] !== displayStats[s.key]);
  const showDebug = process.env.NODE_ENV === "development" && !!player.nickname && status === "admin";

  const handleDebugAction = async (action: DebugAction) => {
    if (!player.nickname) return;
    try {
      setDebugLoading(true);
      await api.market.debugTogglePlayer(clubId, player.nickname, action);
      await onDebugComplete?.();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error en debug";
      alert(`🛠 ${message}`);
    } finally {
      setDebugLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="player-modal-title">
      <div className="absolute inset-0 z-0 cursor-pointer bg-slate-950/90 backdrop-blur-sm" aria-hidden onClick={onClose} />
      <div className={`relative z-10 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border-2 bg-slate-900 shadow-2xl ${statusConfig.border} ${statusConfig.glow}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-slate-800/90 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          <X size={20} />
        </button>

        <div className={`shrink-0 h-44 flex items-center justify-center relative ${statusConfig.bg}`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,transparent_70%)]" />
          {isLocked  ? (
            <div className="flex flex-col items-center animate-pulse">
              <Lock size={56} className="text-slate-600 mb-3" />
              <span className="font-black tracking-widest text-slate-600 uppercase text-base">Desconocido</span>
            </div>
          ) : (
            <img src={player.spriteUrl || "/sprites/default.webp"} alt={player.name} className="h-36 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)] relative z-1" />
          )}
        </div>

        <div className="p-6 overflow-y-auto flex-1 scrollbar-hide">
          <h2 id="player-modal-title" className={`text-3xl font-black uppercase tracking-wider text-center mb-3 ${isLocked ? "text-slate-700" : "text-white"}`}>
            {isLocked ? "???" : player.name}
          </h2>

          {!isLocked && (
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${statusConfig.color} ${statusConfig.border} bg-slate-800/80`}>{player.position}</span>
              {player.element && <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${elementClass}`}>{player.element}</span>}
              <span className="text-xs font-black uppercase px-3 py-1 rounded-full border border-slate-600 bg-slate-800/80 text-slate-400">Total {totalStats}</span>
            </div>
          )}

          {!isLocked && status !== "toll" && (
            status === "owned" ? (
              <PlayerLevelPeSection
                player={{
                  id: player.id,
                  name: player.name,
                  level: liveLevel,
                  experience: liveExperience,
                }}
                availablePe={resources.pe}
                clubId={clubId}
                enablePeRedeem
                onRedeemComplete={async (updated) => {
                  setLiveLevel(updated.level);
                  setLiveExperience(updated.experience);
                  await onPeRedeemComplete?.(updated);
                }}
              />
            ) : (
              <PlayerLevelIndicator level={player.level} experience={player.experience} />
            )
          )}

          {!isLocked && status === "owned" && (
            <PlayerPcSection
              player={{
                id: player.id,
                name: player.name,
                level: liveLevel,
                baseStats: player.baseStats,
                maxStats: player.maxStats,
                statBonuses: liveStatBonuses,
              }}
              availablePc={resources.pc}
              clubId={clubId}
              enablePcSpend
              onSpendComplete={async (updated) => {
                setLiveStatBonuses(updated);
                await onPcSpendComplete?.(updated);
              }}
            />
          )}

          {isLocked || isToll ? (
            <p className={`text-base font-bold uppercase text-center mb-4 ${statusConfig.color}`}>
              {isLocked ? "Camino Bloqueado" : "Peaje"}
            </p>
          ) : (
            <>
              {hasPcBonuses && (
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 text-center mb-2 flex items-center justify-center gap-1.5">
                  <TrendingUp size={12} />
                  Stats con mejoras permanentes (PC)
                </p>
              )}
              {hasItemBonuses && (
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 text-center mb-2 flex items-center justify-center gap-1.5">
                  <Package size={12} />
                  Stats con bonificadores de objetos equipados
                </p>
              )}
              {hasCoachBonuses && (
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 text-center mb-3 flex items-center justify-center gap-1.5">
                  <Sparkles size={12} />
                  Stats con bonificaciones del entrenador activo
                </p>
              )}
              {/* BLOQUE DE ESTADÍSTICAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {STATS.map((stat) => (
                  <StatBar
                    key={stat.key}
                    stat={stat}
                    value={displayStats[stat.key]}
                    baseValue={
                      activeCoach
                        ? statsWithItems[stat.key]
                        : hasItemBonuses
                          ? statsWithPc[stat.key]
                          : hasPcBonuses
                            ? levelStats[stat.key]
                            : undefined
                    }
                  />
                ))}
              </div>

              {status === "owned" && (
                <PlayerEquipmentSection
                  player={player}
                  clubId={clubId}
                  inventory={clubInventory}
                  onUpdated={async () => {
                    await onEquipmentChange?.();
                  }}
                />
              )}

              {/* 🎯 BLOQUE DE SUPERTÉCNICAS (Nuevo) */}
              <div className="mb-6">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Star size={16} className="text-purple-500" /> Supertécnicas
                </h4>
                
                <div className="grid grid-cols-1 gap-2">
                  {player.moves && player.moves.length > 0 ? (
                    player.moves.map((moveData, index) => {
                      const isUnlocked = moveData.isUnlocked;
                      const style = getMoveElementStyle(moveData.element, isUnlocked);

                      return (
                        <div key={index} className={`relative p-3 rounded-xl border flex flex-col gap-2 transition-all ${style}`}>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 w-full">
                              <MoveElementIcon element={moveData.element} />
                              
                              <div className="flex items-center">
                                <h5 className="font-black text-sm uppercase tracking-wide truncate">
                                  {isUnlocked ? moveData.name : "?????????"}
                                </h5>
                                
                                {isUnlocked && (
                                  <EpicEvolution path={moveData.evolutionPath} level={moveData.currentLevel} />
                                )}
                              </div>
                            </div>
                            
                            {!isUnlocked ? (
                              <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded text-[10px] font-bold text-slate-500 border border-slate-800 shrink-0">
                                <Lock size={10} /> Nv. {moveData.unlockLevel}
                              </div>
                            ) : (
                              (() => {
                                const badge = getEvolutionBadge(moveData.evolutionPath, moveData.currentLevel);
                                if (!badge) return null;
                                
                                return (
                                  <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${badge.style}`}>
                                    {badge.text}
                                  </span>
                                );
                              })()
                            )}
                          </div>

                          {isUnlocked || showDebug ? (
                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-current/10">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-xs font-bold" title={`Poder Base (${moveData.type})`}>
                                  <MoveTypeIcon type={moveData.type} size={12} className="opacity-70" /> 
                                  {moveData.basePower}
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-60 bg-black/20 px-1.5 py-0.5 rounded">
                                  {moveData.type}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-xs font-black bg-black/20 px-2 py-1 rounded-md">
                                {moveData.tpCost} <Zap size={12} className="text-yellow-500" />
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 pt-2 border-t border-slate-800/50">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">
                                Requiere más nivel
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center border border-dashed border-slate-700 bg-slate-800/30 rounded-xl">
                      <p className="text-xs font-bold text-slate-500">Sin técnicas registradas.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* BOTONES DE ACCIÓN */}
          {status === "available" && (
            <button type="button" disabled={isLoading || !player.nickname || !canAffordResource(resources, buyPrice, 'pp')} onClick={() => player.nickname && onAction("buy", player.nickname)} className="w-full flex items-center justify-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-lg font-black uppercase p-4 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-wait">
              <span>Fichar por</span>
              <ResourceCostBadge amount={buyPrice} resource="pp" size="lg" />
              {buyPrice < (player.price ?? 0) && (
                <span className="text-xs line-through opacity-70">{player.price} PP</span>
              )}
            </button>
          )}

          {isToll && (
            <button type="button" disabled={isLoading || !player.nickname || !canAffordResource(resources, Math.floor((player.price ?? 0) / 2), 'pp')} onClick={() => player.nickname && onAction("toll", player.nickname)} className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 text-white text-lg font-black uppercase p-4 rounded-xl transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(220,38,38,0.5)] disabled:opacity-50 disabled:cursor-wait">
              <span>Pagar peaje</span>
              <ResourceCostBadge amount={Math.floor((player.price ?? 0) / 2)} resource="pp" size="lg" className="bg-white/15! text-white! border-white/30!" />
            </button>
          )}

          {(status === "owned" || status === "unlocked") && (
            <div className={`w-full p-4 rounded-xl font-black uppercase text-center text-base border-2 ${statusConfig.border} ${statusConfig.color}`}>
              {status === "owned" ? "✓ Jugador en Propiedad" : "✓ Camino Desbloqueado"}
            </div>
          )}

          {status === "owned" && (
            <button type="button" disabled={isLoading || !player.nickname} onClick={() => player.nickname && onAction("sell", player.nickname)} className="w-full flex items-center justify-center mt-3 gap-3 bg-slate-700 hover:bg-slate-600 text-white text-lg font-black uppercase p-4 rounded-xl transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(30,41,59,0.5)] disabled:opacity-50 disabled:cursor-wait">
              <span>Vender por</span>
              <ResourceCostBadge amount={Math.floor((player.price ?? 0) / 2)} resource="pp" size="lg" className="bg-white/10! text-white! border-white/20!" />
            </button>
          )}

          {isLocked && (
            <p className="text-sm text-slate-500 font-bold text-center mt-3">Desbloquea los nodos anteriores para revelar a este jugador.</p>
          )}

          {/* DEBUG MENU */}
          {showDebug && (
            <div className="mt-4 border-t border-dashed border-violet-500/40 pt-4">
              <button type="button" onClick={() => setDebugOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 text-xs font-black uppercase tracking-wider text-violet-400 hover:text-violet-300">
                <span className="flex items-center gap-2"><Bug size={14} /> Menú debug</span>
                <ChevronDown size={16} className={`transition-transform ${debugOpen ? "rotate-180" : ""}`} />
              </button>
              {debugOpen && (
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] font-mono text-slate-500 truncate" title={player.nickname ?? ""}>{player.nickname}</p>
                  {DEBUG_ACTIONS.map(({ action, label, className }) => (
                    <button key={action} type="button" disabled={debugLoading || isLoading} onClick={() => handleDebugAction(action)} className={`w-full text-xs font-black uppercase px-3 py-2 rounded-lg border-2 text-white transition-colors disabled:opacity-50 ${className}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}