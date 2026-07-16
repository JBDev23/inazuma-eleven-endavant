"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Droplets, Loader2 } from "lucide-react";
import type { ClubConsumableWithDetails, ClubResources, Consumable, ConsumableCategory } from "@inazuma/shared";
import { CONSUMABLE_CATEGORY_LABELS, CONSUMABLE_CATEGORY_ORDER, pickClubResources } from "@inazuma/shared";
import { api } from "@/services/api";
import { ClubResourcesDisplay } from "@/components/economy/ClubResourcesDisplay";
import ConsumableCard from "@/components/consumables/ConsumableCard";

export default function ConsumablesShopPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const [catalog, setCatalog] = useState<Consumable[]>([]);
  const [inventory, setInventory] = useState<ClubConsumableWithDetails[]>([]);
  const [resources, setResources] = useState<ClubResources>({ pp: 0, pe: 0, yens: 0, pc: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadShop = async () => {
    try {
      const [consumables, clubConsumables, club] = await Promise.all([
        api.market.getConsumableCatalog(),
        api.market.getClubConsumables(clubId),
        api.market.getUserClub(clubId),
      ]);
      setCatalog(consumables);
      setInventory(clubConsumables);
      setResources(pickClubResources(club));
    } catch (error) {
      console.error("Error cargando tienda de consumibles", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShop();
  }, [clubId]);

  const inventoryById = new Map(inventory.map((entry) => [entry.consumableId, entry.quantity]));

  const handleBuy = async (consumableId: number) => {
    try {
      setIsProcessing(true);
      const res = await api.market.buyConsumable(clubId, consumableId);
      setResources((prev) => ({ ...prev, pp: res.newBalance }));
      await loadShop();
    } catch (error: unknown) {
      alert(`❌ ${error instanceof Error ? error.message : "Error al comprar"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin mb-4 text-sky-500" size={48} />
        <h2 className="text-xl font-black uppercase tracking-widest">Cargando tienda...</h2>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto mb-8">
        <Link
          href={`/market/${clubId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Volver a la sede
        </Link>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase text-white tracking-wider flex items-center gap-3">
              <Droplets className="text-sky-500" /> Tienda de Consumibles
            </h1>
            <p className="text-slate-400 font-bold uppercase text-sm mt-1 tracking-widest">
              Agua y comida de un solo uso · Se gastan durante el partido
            </p>
          </div>

          <ClubResourcesDisplay resources={resources} variant="grid" title="Recursos" />
        </div>
      </div>

      {inventory.length > 0 && (
        <div className="max-w-7xl mx-auto mb-10">
          <h2 className="text-lg font-black text-white uppercase mb-4 flex items-center gap-2">
            <Droplets size={18} className="text-emerald-500" /> Tu inventario
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {inventory.map(({ consumable, quantity }) => (
              <div
                key={consumable.id}
                className="bg-slate-900/60 border border-emerald-900/40 rounded-xl px-4 py-3"
              >
                <p className="text-xs font-black text-emerald-400 uppercase">
                  {CONSUMABLE_CATEGORY_LABELS[consumable.category as ConsumableCategory]}
                </p>
                <p className="text-sm font-black text-white uppercase truncate">{consumable.name}</p>
                <p className="text-lg font-black text-emerald-300 tabular-nums mt-1">×{quantity}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {CONSUMABLE_CATEGORY_ORDER.map((category) => {
          const categoryItems = catalog.filter((c) => c.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <section key={category} className="mb-12">
              <h2 className="text-lg font-black text-white uppercase mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                {CONSUMABLE_CATEGORY_LABELS[category]}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {categoryItems.map((consumable) => (
                  <ConsumableCard
                    key={consumable.id}
                    consumable={consumable}
                    ownedQuantity={inventoryById.get(consumable.id) ?? 0}
                    resources={resources}
                    isProcessing={isProcessing}
                    onBuy={handleBuy}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
