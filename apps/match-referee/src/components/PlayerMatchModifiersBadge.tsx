"use client";

import type { PlayerMatchModifier } from "@inazuma/shared";
import {
  ArrowUpCircle,
  Brain,
  FlaskConical,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<PlayerMatchModifier["icon"], LucideIcon> = {
  sub_boost: ArrowUpCircle,
  pitch_element: Sparkles,
  guts_boost: Brain,
  guts_nerf: Brain,
  lab_shield: FlaskConical,
};

const TONE_CLASSES: Record<PlayerMatchModifier["tone"], string> = {
  positive:
    "bg-emerald-500/90 border-emerald-300/60 text-emerald-950 shadow-[0_0_8px_rgba(16,185,129,0.45)]",
  negative:
    "bg-red-500/90 border-red-300/60 text-red-950 shadow-[0_0_8px_rgba(239,68,68,0.4)]",
  neutral:
    "bg-violet-500/90 border-violet-300/60 text-violet-950 shadow-[0_0_8px_rgba(139,92,246,0.35)]",
};

type PlayerMatchModifiersBadgeProps = {
  modifiers: PlayerMatchModifier[];
  size?: "compact" | "detail";
  className?: string;
};

function ModifierChip({
  modifier,
  size,
}: {
  modifier: PlayerMatchModifier;
  size: "compact" | "detail";
}) {
  const Icon = ICON_MAP[modifier.icon];
  const isCompact = size === "compact";

  return (
    <span
      title={modifier.title}
      className={`inline-flex items-center gap-0.5 font-black uppercase border rounded-full pointer-events-auto ${
        TONE_CLASSES[modifier.tone]
      } ${
        isCompact
          ? "text-[7px] md:text-[8px] px-1 py-0 leading-none tracking-tight"
          : "text-[9px] px-2 py-1 tracking-widest"
      } ${modifier.icon === "guts_nerf" ? "[&_svg]:opacity-90" : ""}`}
    >
      <Icon className={isCompact ? "w-2 h-2 shrink-0" : "w-3 h-3 shrink-0"} />
      <span>{modifier.shortLabel}</span>
      {!isCompact && modifier.turnsRemaining != null && (
        <span className="opacity-80 tabular-nums">· {modifier.turnsRemaining}T</span>
      )}
    </span>
  );
}

export function PlayerMatchModifiersBadge({
  modifiers,
  size = "compact",
  className = "",
}: PlayerMatchModifiersBadgeProps) {
  if (modifiers.length === 0) return null;

  const visible = size === "compact" ? modifiers.slice(0, 3) : modifiers;

  return (
    <div
      className={`flex flex-wrap gap-0.5 ${
        size === "compact" ? "justify-end max-w-[52px] md:max-w-[60px]" : "justify-center"
      } ${className}`}
    >
      {visible.map((modifier) => (
        <ModifierChip key={modifier.id} modifier={modifier} size={size} />
      ))}
    </div>
  );
}
