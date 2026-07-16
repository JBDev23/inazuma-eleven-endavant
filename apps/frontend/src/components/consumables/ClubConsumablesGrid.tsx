"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Droplets, Search, ShoppingBag } from "lucide-react";
import type { ClubConsumableWithDetails, ConsumableCategory } from "@inazuma/shared";
import {
  CONSUMABLE_CATEGORY_LABELS,
  formatConsumableEffect,
} from "@inazuma/shared";

interface ClubConsumablesGridProps {
  inventory: ClubConsumableWithDetails[];
  clubId: string;
}

export default function ClubConsumablesGrid({ inventory, clubId }: ClubConsumablesGridProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return inventory.filter(({ consumable }) => {
      const categoryLabel = CONSUMABLE_CATEGORY_LABELS[consumable.category as ConsumableCategory];
      return (
        consumable.name.toLowerCase().includes(lower) ||
        categoryLabel.toLowerCase().includes(lower) ||
        formatConsumableEffect(consumable).toLowerCase().includes(lower)
      );
    });
  }, [inventory, searchTerm]);

  if (inventory.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl">
        <Droplets size={40} className="mx-auto mb-4 text-slate-600" />
        <p className="text-slate-500 text-lg font-bold">Aún no tienes consumibles.</p>
        <p className="text-slate-600 text-sm mt-2 mb-6">
          Compra agua y comida para usarlos durante los partidos.
        </p>
        <Link
          href={`/market/${clubId}/consumables`}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-black uppercase px-6 py-3 rounded-xl transition-colors"
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
            placeholder="Buscar consumible..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
          />
        </div>
        <Link
          href={`/market/${clubId}/consumables`}
          className="inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-sky-400 hover:text-sky-300 px-4 py-2.5 rounded-xl border border-sky-900/50 bg-sky-950/20 transition-colors shrink-0"
        >
          <ShoppingBag size={14} /> Comprar más
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 font-bold uppercase tracking-widest border-2 border-dashed border-slate-800 rounded-2xl">
          No se encontraron consumibles
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(({ consumable, quantity }) => (
            <div
              key={consumable.id}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-5 flex flex-col hover:border-sky-700/50 transition-colors"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-500 mb-0.5">
                {CONSUMABLE_CATEGORY_LABELS[consumable.category]}
              </p>
              <h4 className="text-base font-black text-white uppercase truncate">{consumable.name}</h4>
              <p className="text-sm font-black text-sky-400 mt-2">{formatConsumableEffect(consumable)}</p>
              <div className="mt-auto pt-4 flex items-end justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Cantidad</span>
                <span className="text-2xl font-black text-white tabular-nums">×{quantity}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
