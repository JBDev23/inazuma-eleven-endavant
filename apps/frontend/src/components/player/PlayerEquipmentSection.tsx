"use client";

import { useState } from "react";
import { AlertTriangle, Package, X, ChevronDown, Plus } from "lucide-react";
import type { ClubItemWithDetails, Item, ItemType, Player, StatKey } from "@inazuma/shared";
import {
  getPrimaryItemTypeForPosition,
  ITEM_TYPE_LABELS,
  isPrimaryItemType,
  isSecondaryItemType,
  parseItemStats,
  STAT_KEYS,
} from "@inazuma/shared";
import { api, getApiErrorMessage } from "@/services/api";

interface PlayerEquipmentSectionProps {
  player: Player;
  clubId: string;
  inventory: ClubItemWithDetails[];
  onUpdated: () => void | Promise<void>;
}

const STAT_LABELS: Record<StatKey, string> = {
  gp: "GP",
  tp: "TP",
  kick: "Tiro",
  body: "Físico",
  control: "Control",
  guard: "Defensa",
  speed: "Velocidad",
  stamina: "Resistencia",
  guts: "Determinación",
};

function ItemStatsPreview({ item }: { item: Item }) {
  const stats = parseItemStats(item.stats);
  const entries = STAT_KEYS.filter((key) => stats[key] != null);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map((key) => (
        <span
          key={key}
          className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-900/50"
        >
          +{stats[key]} {STAT_LABELS[key]}
        </span>
      ))}
    </div>
  );
}

function canEquipPrimary(type: ItemType, position: string): boolean {
  if (!isPrimaryItemType(type)) return false;
  return type === getPrimaryItemTypeForPosition(position);
}

function getEligibleItems(
  slot: "primary" | "secondary",
  player: Player,
  inventory: ClubItemWithDetails[],
) {
  return inventory.filter(({ item, quantity }) => {
    if (quantity < 1) return false;
    if (slot === "primary") return canEquipPrimary(item.type, player.position);
    return isSecondaryItemType(item.type);
  });
}

function EquipmentSlot({
  label,
  slot,
  player,
  item,
  inventory,
  isLoading,
  isOpen,
  onToggle,
  onEquip,
  onUnequip,
}: {
  label: string;
  slot: "primary" | "secondary";
  player: Player;
  item: Item | null | undefined;
  inventory: ClubItemWithDetails[];
  isLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onEquip: (itemId: number) => Promise<void>;
  onUnequip: () => Promise<void>;
}) {
  const eligible = getEligibleItems(slot, player, inventory);
  const hasOptions = eligible.length > 0 || item != null;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={isLoading || !hasOptions}
        onClick={onToggle}
        className={`w-full text-left rounded-xl border p-3 transition-all disabled:cursor-default ${
          isOpen
            ? "border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/30"
            : hasOptions
              ? "border-slate-700 bg-slate-950/60 hover:border-cyan-700/60 hover:bg-slate-900/80 cursor-pointer"
              : "border-slate-800 bg-slate-950/40 opacity-60"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
          {hasOptions && (
            <ChevronDown
              size={14}
              className={`shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180 text-cyan-400" : ""}`}
            />
          )}
        </div>

        {item ? (
          <div className="mt-1">
            <p className="text-sm font-black text-white uppercase">{item.name}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              {ITEM_TYPE_LABELS[item.type]}
            </p>
            <ItemStatsPreview item={item} />
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-2 text-cyan-500/70">
            <Plus size={14} />
            <p className="text-xs font-bold uppercase">
              {eligible.length > 0 ? "Pulsa para equipar" : "Sin objetos disponibles"}
            </p>
          </div>
        )}
      </button>

      {isOpen && hasOptions && (
        <div className="absolute z-20 left-0 right-0 mt-1 rounded-xl border border-cyan-800/60 bg-slate-900 shadow-xl overflow-hidden">
          {item && (
            <button
              type="button"
              disabled={isLoading}
              onClick={async (e) => {
                e.stopPropagation();
                await onUnequip();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs font-black uppercase text-red-400 hover:bg-red-950/30 border-b border-slate-800 transition-colors disabled:opacity-50"
            >
              <X size={14} />
              Desequipar
            </button>
          )}

          {eligible.length === 0 ? (
            <p className="px-3 py-3 text-xs font-bold text-slate-500 uppercase text-center">
              No hay objetos en el inventario
            </p>
          ) : (
            <div className="max-h-44 overflow-y-auto scrollbar-hide">
              {eligible.map(({ item: invItem, quantity }) => {
                const isEquipped = item?.id === invItem.id;
                return (
                  <button
                    key={invItem.id}
                    type="button"
                    disabled={isLoading || isEquipped}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await onEquip(invItem.id);
                    }}
                    className={`w-full text-left px-3 py-2.5 border-b border-slate-800 last:border-b-0 transition-colors disabled:opacity-50 ${
                      isEquipped
                        ? "bg-cyan-950/30 cursor-default"
                        : "hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-black text-white uppercase truncate">
                        {invItem.name}
                        {isEquipped && (
                          <span className="ml-1.5 text-[10px] text-cyan-400">(equipado)</span>
                        )}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 shrink-0">×{quantity}</span>
                    </div>
                    <ItemStatsPreview item={invItem} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PlayerEquipmentSection({
  player,
  clubId,
  inventory,
  onUpdated,
}: PlayerEquipmentSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [openSlot, setOpenSlot] = useState<"primary" | "secondary" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleEquip = async (slot: "primary" | "secondary", itemId: number | null) => {
    try {
      setIsLoading(true);
      setActionError(null);
      await api.market.equipItem(clubId, { playerId: player.id, slot, itemId });
      setOpenSlot(null);
      await onUpdated();
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, "Error al equipar."));
    } finally {
      setIsLoading(false);
    }
  };

  const primaryLabel =
    player.position === "GK" ? "Principal (Guantes)" : "Principal (Botas)";

  return (
    <div className="mb-6">
      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        <Package size={16} className="text-cyan-500" /> Equipamiento
      </h4>

      {actionError && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="font-black uppercase tracking-wide text-red-300">Accion no completada</p>
            <p className="mt-1">{actionError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <EquipmentSlot
          label={primaryLabel}
          slot="primary"
          player={player}
          item={player.primaryItem}
          inventory={inventory}
          isLoading={isLoading}
          isOpen={openSlot === "primary"}
          onToggle={() => setOpenSlot((prev) => (prev === "primary" ? null : "primary"))}
          onEquip={(itemId) => handleEquip("primary", itemId)}
          onUnequip={() => handleEquip("primary", null)}
        />

        <EquipmentSlot
          label="Secundario (Pulsera/Colgante)"
          slot="secondary"
          player={player}
          item={player.secondaryItem}
          inventory={inventory}
          isLoading={isLoading}
          isOpen={openSlot === "secondary"}
          onToggle={() => setOpenSlot((prev) => (prev === "secondary" ? null : "secondary"))}
          onEquip={(itemId) => handleEquip("secondary", itemId)}
          onUnequip={() => handleEquip("secondary", null)}
        />
      </div>
    </div>
  );
}
