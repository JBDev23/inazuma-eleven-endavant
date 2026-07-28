"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Package, ShoppingBag } from "lucide-react";
import type { ClubItemWithDetails, ClubResources, Coach, Item, ItemType, ClubFacilityRecord } from "@inazuma/shared";
import {
  canAffordResource,
  ITEM_TYPE_LABELS,
  parseItemStats,
  pickClubResources,
  STAT_KEYS,
  getShopItemPrice,
  resolveClubFacilities,
  type StatKey,
} from "@inazuma/shared";
import { api, getApiErrorMessage } from "@/services/api";
import { ClubResourcesDisplay } from "@/components/economy/ClubResourcesDisplay";
import { ResourceCostBadge } from "@/components/economy/ResourceCostBadge";
import { MarketRequestState } from "@/components/market/MarketRequestState";

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

const TYPE_ORDER: ItemType[] = ["BOOTS", "GLOVES", "BRACELET", "PENDANT"];

function ItemCard({
  item,
  ownedQuantity,
  resources,
  facilities,
  isProcessing,
  onBuy,
}: {
  item: Item;
  ownedQuantity: number;
  resources: ClubResources;
  facilities: ClubFacilityRecord[];
  isProcessing: boolean;
  onBuy: (itemId: number) => void;
}) {
  const stats = parseItemStats(item.stats);
  const statEntries = STAT_KEYS.filter((key) => stats[key] != null);
  const price = getShopItemPrice(item.price, resolveClubFacilities(facilities));
  const canAfford = canAffordResource(resources, price, "pp");

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4 shadow-lg hover:border-cyan-700/50 transition-colors">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500 mb-1">
          {ITEM_TYPE_LABELS[item.type]}
        </p>
        <h3 className="text-lg font-black text-white uppercase">{item.name}</h3>
        {ownedQuantity > 0 && (
          <p className="text-xs font-bold text-emerald-400 mt-1 uppercase">
            En inventario: ×{ownedQuantity}
          </p>
        )}
      </div>

      {statEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {statEntries.map((key) => (
            <span
              key={key}
              className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-900/40"
            >
              +{stats[key]} {STAT_LABELS[key]}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={isProcessing || !canAfford}
        onClick={() => onBuy(item.id)}
        className="mt-auto w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-black uppercase py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ShoppingBag size={16} />
        Comprar
        <ResourceCostBadge amount={price} resource="pp" size="sm" className="bg-white/15! text-white! border-white/30!" />
        {price < item.price && (
          <span className="text-[10px] line-through opacity-60">{item.price} PP</span>
        )}
      </button>
    </div>
  );
}

export default function ItemsShopPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [inventory, setInventory] = useState<ClubItemWithDetails[]>([]);
  const [resources, setResources] = useState<ClubResources>({ pp: 0, pe: 0, yens: 0, pc: 0 });
  const [facilities, setFacilities] = useState<ClubFacilityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadShop = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [items, clubItems, club] = await Promise.all([
        api.market.getItemCatalog(),
        api.market.getClubItems(clubId),
        api.market.getUserClub(clubId),
      ]);
      setCatalog(items);
      setInventory(clubItems);
      setResources(pickClubResources(club));
      setFacilities(club.facilities ?? []);
    } catch (error) {
      console.error("Error cargando tienda de objetos", error);
      setLoadError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShop();
  }, [clubId]);

  const inventoryByItemId = new Map(inventory.map((entry) => [entry.itemId, entry.quantity]));

  const handleBuy = async (itemId: number) => {
    try {
      setIsProcessing(true);
      setActionError(null);
      const res = await api.market.buyItem(clubId, itemId);
      setResources((prev) => ({ ...prev, pp: res.newBalance }));
      await loadShop();
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, "No se pudo comprar el objeto."));
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <MarketRequestState title="Cargando tienda..." loadingLabel="Estamos sincronizando catalogo, inventario y recursos del club." accentClassName="text-cyan-500" />;
  }

  if (loadError) {
    return (
      <MarketRequestState
        title="Cargando tienda..."
        error={loadError}
        onRetry={loadShop}
      />
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
              <Package className="text-cyan-500" /> Tienda de Objetos
            </h1>
            <p className="text-slate-400 font-bold uppercase text-sm mt-1 tracking-widest">
              Compra equipamiento para tu plantilla · Los objetos no son únicos
            </p>
          </div>

          <ClubResourcesDisplay resources={resources} variant="grid" title="Recursos" />
        </div>
      </div>

      {inventory.length > 0 && (
        <div className="max-w-7xl mx-auto mb-10">
          <h2 className="text-lg font-black text-white uppercase mb-4 flex items-center gap-2">
            <Package size={18} className="text-emerald-500" /> Tu inventario
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {inventory.map(({ item, quantity }) => (
              <div
                key={item.id}
                className="bg-slate-900/60 border border-emerald-900/40 rounded-xl px-4 py-3"
              >
                <p className="text-xs font-black text-emerald-400 uppercase">{ITEM_TYPE_LABELS[item.type]}</p>
                <p className="text-sm font-black text-white uppercase truncate">{item.name}</p>
                <p className="text-lg font-black text-emerald-300 tabular-nums mt-1">×{quantity}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {actionError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="font-black uppercase tracking-wide text-red-300">Compra no completada</p>
              <p className="mt-1 text-red-100/90">{actionError}</p>
            </div>
          </div>
        )}
        {TYPE_ORDER.map((type) => {
          const typeItems = catalog.filter((item) => item.type === type);
          if (typeItems.length === 0) return null;

          return (
            <section key={type} className="mb-10">
              <h2 className="text-lg font-black text-white uppercase mb-4 border-b border-slate-800 pb-2">
                {ITEM_TYPE_LABELS[type]}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    ownedQuantity={inventoryByItemId.get(item.id) ?? 0}
                    resources={resources}
                    facilities={facilities}
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
