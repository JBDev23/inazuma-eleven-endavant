"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Package, Search, ShoppingBag, User } from "lucide-react";
import type { ClubItemWithDetails, Item, ItemType, Player, StatKey } from "@inazuma/shared";
import {
  ITEM_TYPE_LABELS,
  parseItemStats,
  STAT_KEYS,
} from "@inazuma/shared";

export type ItemEquippedBy = {
  player: Player;
  slot: "primary" | "secondary";
};

export type ClubItemOverview = {
  item: Item;
  inInventory: number;
  equippedBy: ItemEquippedBy[];
  totalOwned: number;
};

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

const SLOT_LABELS: Record<ItemEquippedBy["slot"], string> = {
  primary: "Principal",
  secondary: "Secundario",
};

export function buildClubItemOverview(
  roster: Player[],
  inventory: ClubItemWithDetails[],
): ClubItemOverview[] {
  const byItemId = new Map<number, ClubItemOverview>();

  for (const entry of inventory) {
    byItemId.set(entry.itemId, {
      item: entry.item,
      inInventory: entry.quantity,
      equippedBy: [],
      totalOwned: entry.quantity,
    });
  }

  for (const player of roster) {
    const assignments: Array<{ item: Item; slot: ItemEquippedBy["slot"] }> = [];
    if (player.primaryItem) assignments.push({ item: player.primaryItem, slot: "primary" });
    if (player.secondaryItem) assignments.push({ item: player.secondaryItem, slot: "secondary" });

    for (const { item, slot } of assignments) {
      let row = byItemId.get(item.id);
      if (!row) {
        row = { item, inInventory: 0, equippedBy: [], totalOwned: 0 };
        byItemId.set(item.id, row);
      }
      row.equippedBy.push({ player, slot });
    }
  }

  return Array.from(byItemId.values())
    .map((row) => ({
      ...row,
      totalOwned: row.inInventory + row.equippedBy.length,
    }))
    .sort((a, b) => a.item.name.localeCompare(b.item.name));
}

interface ClubItemsGridProps {
  roster: Player[];
  inventory: ClubItemWithDetails[];
  clubId: string;
  onPlayerClick?: (player: Player) => void;
}

function ItemStatsBadges({ item }: { item: Item }) {
  const stats = parseItemStats(item.stats);
  const entries = STAT_KEYS.filter((key) => stats[key] != null);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
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

export default function ClubItemsGrid({
  roster,
  inventory,
  clubId,
  onPlayerClick,
}: ClubItemsGridProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const overview = useMemo(
    () => buildClubItemOverview(roster, inventory),
    [roster, inventory],
  );

  const filtered = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return overview.filter(({ item }) => {
      const typeLabel = ITEM_TYPE_LABELS[item.type as ItemType];
      return (
        item.name.toLowerCase().includes(lower) ||
        typeLabel.toLowerCase().includes(lower)
      );
    });
  }, [overview, searchTerm]);

  if (overview.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl">
        <Package size={40} className="mx-auto mb-4 text-slate-600" />
        <p className="text-slate-500 text-lg font-bold">Aún no tienes objetos.</p>
        <p className="text-slate-600 text-sm mt-2 mb-6">
          Compra equipamiento en la tienda y asígnalo a tus jugadores.
        </p>
        <Link
          href={`/market/${clubId}/items`}
          className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-black uppercase px-6 py-3 rounded-xl transition-colors"
        >
          <ShoppingBag size={16} /> Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar objeto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <Link
          href={`/market/${clubId}/items`}
          className="inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 px-4 py-2.5 rounded-xl border border-cyan-900/50 bg-cyan-950/20 transition-colors shrink-0"
        >
          <ShoppingBag size={14} /> Comprar más
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 font-bold uppercase tracking-widest border-2 border-dashed border-slate-800 rounded-2xl">
          No se encontraron objetos
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(({ item, inInventory, equippedBy, totalOwned }) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-5 flex flex-col hover:border-cyan-700/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500 mb-0.5">
                    {ITEM_TYPE_LABELS[item.type as ItemType]}
                  </p>
                  <h4 className="text-base font-black text-white uppercase truncate">{item.name}</h4>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-cyan-400 tabular-nums">{totalOwned}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Total</p>
                </div>
              </div>

              <ItemStatsBadges item={item} />

              <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 uppercase">En inventario</span>
                  <span className="font-black text-white tabular-nums">×{inInventory}</span>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Equipados ({equippedBy.length})
                  </p>
                  {equippedBy.length === 0 ? (
                    <p className="text-xs font-bold text-slate-600 uppercase">Ningún jugador</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {equippedBy.map(({ player, slot }) => (
                        <li key={`${player.id}-${slot}`}>
                          <button
                            type="button"
                            onClick={() => onPlayerClick?.(player)}
                            className="w-full flex items-center gap-2 text-left rounded-lg px-2.5 py-2 bg-slate-950/60 border border-slate-800 hover:border-cyan-800 hover:bg-slate-800/80 transition-colors group"
                          >
                            <User size={14} className="text-slate-500 group-hover:text-cyan-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-white uppercase truncate">
                                {player.name}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">
                                {player.position} · {SLOT_LABELS[slot]}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
