"use client";

import { Droplets, UtensilsCrossed, Sparkles } from "lucide-react";
import type { ClubResources, Consumable, ConsumableCategory } from "@inazuma/shared";
import {
  canAffordResource,
  CONSUMABLE_CATEGORY_LABELS,
  formatConsumableEffect,
  getConsumableTier,
  getConsumableTierColor,
} from "@inazuma/shared";
import { ResourceCostBadge } from "@/components/economy/ResourceCostBadge";
import { ShoppingBag } from "lucide-react";

const CATEGORY_ICONS: Record<ConsumableCategory, typeof Droplets> = {
  WATER: Droplets,
  FOOD: UtensilsCrossed,
  SPECIAL: Sparkles,
};

const CATEGORY_ACCENT: Record<ConsumableCategory, string> = {
  WATER: "text-sky-400",
  FOOD: "text-orange-400",
  SPECIAL: "text-violet-400",
};

interface ConsumableCardProps {
  consumable: Consumable;
  ownedQuantity: number;
  resources: ClubResources;
  isProcessing: boolean;
  onBuy: (consumableId: number) => void;
}

export default function ConsumableCard({
  consumable,
  ownedQuantity,
  resources,
  isProcessing,
  onBuy,
}: ConsumableCardProps) {
  const Icon = CATEGORY_ICONS[consumable.category];
  const tier = getConsumableTier(consumable);
  const tierColor = getConsumableTierColor(consumable);
  const canAfford = canAffordResource(resources, consumable.price, "pp");
  const effectLabel = formatConsumableEffect(consumable);

  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 bg-linear-to-b ${tierColor} p-5 shadow-xl hover:scale-[1.02] transition-transform min-h-[280px]`}
    >
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/40 text-slate-300 border border-white/10">
          1 uso
        </span>
        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/40 text-amber-300 border border-amber-500/30">
          Nv. {tier}
        </span>
      </div>

      <div className="flex flex-col items-center text-center flex-1 pt-2">
        <div className={`w-16 h-16 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center mb-4 ${CATEGORY_ACCENT[consumable.category]}`}>
          <Icon size={32} strokeWidth={2.5} />
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
          {CONSUMABLE_CATEGORY_LABELS[consumable.category]}
        </p>
        <h3 className="text-lg font-black text-white uppercase leading-tight mb-3 px-2">
          {consumable.name}
        </h3>

        <div className="w-full rounded-xl bg-black/25 border border-white/10 px-4 py-3 mb-3">
          <p className={`text-2xl font-black uppercase tracking-wide ${CATEGORY_ACCENT[consumable.category]}`}>
            {effectLabel}
          </p>
          {consumable.description && (
            <p className="text-[11px] font-medium text-slate-400 mt-2 leading-snug">
              {consumable.description}
            </p>
          )}
        </div>

        {ownedQuantity > 0 && (
          <p className="text-xs font-bold text-emerald-400 uppercase mb-2">
            En inventario: ×{ownedQuantity}
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={isProcessing || !canAfford}
        onClick={() => onBuy(consumable.id)}
        className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white text-sm font-black uppercase py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
      >
        <ShoppingBag size={16} />
        Comprar
        <ResourceCostBadge
          amount={consumable.price}
          resource="pp"
          size="sm"
          className="bg-white/15! text-white! border-white/30!"
        />
      </button>
    </div>
  );
}
