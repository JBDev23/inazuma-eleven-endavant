"use client";

import { use, useEffect, useState } from "react";
import { Loader2, Users, UserCircle2 } from "lucide-react";
import PlayerGrid from "@/components/player/PlayerGrid";
import CoachGrid from "@/components/coach/CoachGrid";
import CoachMarketModal from "@/components/coach/CoachMarketModal";
import { canAffordResource, pickClubResources, getFreeMarketPlayerPrice, resolveClubFacilities, type ClubResources, type Coach, type Player } from "@inazuma/shared";
import { api } from "@/services/api";
import PlayerModal from "@/components/player/PlayerModal";
import { ClubResourcesDisplay } from "@/components/economy/ClubResourcesDisplay";
import { ResourceCostBadge } from "@/components/economy/ResourceCostBadge";

type MarketTab = "players" | "coaches";

export default function FreeAgentsPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const [activeTab, setActiveTab] = useState<MarketTab>("players");
  const [agents, setAgents] = useState<Player[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [resources, setResources] = useState<ClubResources>({ pp: 0, pe: 0, yens: 0, pc: 0 });
  const [facilities, setFacilities] = useState<import("@inazuma/shared").ClubFacilityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  const loadMarket = async () => {
    try {
      const [freeAgents, freeCoaches, resClub] = await Promise.all([
        api.market.getFreeAgents(),
        api.market.getFreeCoaches(),
        api.market.getUserClub(clubId),
      ]);

      setAgents(freeAgents);
      setCoaches(freeCoaches);
      setResources(pickClubResources(resClub));
      setFacilities(resClub.facilities ?? []);
    } catch (error) {
      console.error("Error cargando el mercado", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMarket();
  }, [clubId]);

  const handlePlayerAction = async (action: "buy" | "toll" | "sell", nickname: string) => {
    try {
      setIsProcessing(true);
      const res = await api.market.performAction(clubId, action, nickname);
      setResources((prev) => ({ ...prev, pp: res.newBalance as number }));
      setSelectedPlayer(null);
      loadMarket();
    } catch (error: unknown) {
      alert(`❌ ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyCoach = async (coachId: number) => {
    try {
      setIsProcessing(true);
      const res = await api.market.buyCoach(clubId, coachId);
      setResources((prev) => ({ ...prev, pp: res.newBalance as number }));
      setSelectedCoach(null);
      loadMarket();
    } catch (error: unknown) {
      alert(`❌ ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin mb-4 text-emerald-500" size={48} />
        <h2 className="text-xl font-black uppercase tracking-widest">Cargando mercado...</h2>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase text-white tracking-wider flex items-center gap-3">
            Mercado Libre
          </h1>
          <p className="text-slate-400 font-bold uppercase text-sm mt-1 tracking-widest">
            Ficha jugadores y entrenadores sin equipo
          </p>
        </div>

        <ClubResourcesDisplay
          resources={resources}
          variant="grid"
          title="Tus recursos"
          className="w-full lg:w-auto lg:min-w-[320px]"
        />
      </div>

      <div className="max-w-7xl mx-auto mb-6 flex gap-2 border-b border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("players")}
          className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-sm rounded-t-xl transition-all ${
            activeTab === "players"
              ? "bg-slate-900 text-yellow-500 border-t-2 border-yellow-500"
              : "bg-slate-950 text-slate-500 hover:bg-slate-900"
          }`}
        >
          <Users size={18} /> Jugadores
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("coaches")}
          className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-sm rounded-t-xl transition-all ${
            activeTab === "coaches"
              ? "bg-slate-900 text-purple-400 border-t-2 border-purple-400"
              : "bg-slate-950 text-slate-500 hover:bg-slate-900"
          }`}
        >
          <UserCircle2 size={18} /> Entrenadores
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === "players" && (
          <PlayerGrid
            onPlayerClick={(player) => setSelectedPlayer(player)}
            players={agents}
            renderActionNode={(player) => {
              const basePrice = player.price || 0;
              const price = getFreeMarketPlayerPrice(
                basePrice,
                resolveClubFacilities(facilities),
              );
              const canAfford = canAffordResource(resources, price, "pp");
              const hasDiscount = price < basePrice;

              return (
                <div
                  className={`w-full flex flex-col items-center justify-center gap-2 text-sm font-black uppercase p-3 rounded-xl transition-all
                    ${canAfford
                      ? "bg-yellow-500 hover:bg-yellow-400 text-slate-950 hover:scale-[1.02]"
                      : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                    }`}
                >
                  <span>Fichar por</span>
                  <div className="flex items-center gap-2">
                    <ResourceCostBadge
                      amount={price}
                      resource="pp"
                      size="md"
                      className={canAfford ? "bg-slate-950/20! text-slate-950! border-slate-950/20!" : ""}
                    />
                    {hasDiscount && (
                      <span className="text-[10px] line-through opacity-70 normal-case tracking-normal font-bold">
                        {basePrice} PP
                      </span>
                    )}
                  </div>
                  {!canAfford && (
                    <span className="text-[10px] normal-case tracking-normal font-bold text-slate-500">
                      Te faltan {price - resources.pp} PP
                    </span>
                  )}
                </div>
              );
            }}
          />
        )}

        {activeTab === "coaches" && (
          <CoachGrid
            coaches={coaches}
            onCoachClick={(coach) => setSelectedCoach(coach)}
            renderActionNode={(coach) => {
              const price = coach.price || 0;
              const canAfford = canAffordResource(resources, price, "pp");

              return (
                <div
                  className={`w-full flex flex-col items-center justify-center gap-2 text-sm font-black uppercase p-3 rounded-xl transition-all
                    ${canAfford
                      ? "bg-purple-600 hover:bg-purple-500 text-white hover:scale-[1.02]"
                      : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                    }`}
                >
                  <span>Fichar por</span>
                  <ResourceCostBadge
                    amount={price}
                    resource="pp"
                    size="md"
                    className={canAfford ? "bg-white/20! text-white! border-white/20!" : ""}
                  />
                  {!canAfford && (
                    <span className="text-[10px] normal-case tracking-normal font-bold text-slate-500">
                      Te faltan {price - resources.pp} PP
                    </span>
                  )}
                </div>
              );
            }}
          />
        )}
      </div>

      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          status="available"
          onClose={() => setSelectedPlayer(null)}
          onAction={handlePlayerAction}
          isLoading={isProcessing}
          resources={resources}
          clubId={clubId}
          facilities={facilities}
        />
      )}

      {selectedCoach && (
        <CoachMarketModal
          coach={selectedCoach}
          onClose={() => setSelectedCoach(null)}
          onBuy={handleBuyCoach}
          isLoading={isProcessing}
          resources={resources}
        />
      )}
    </div>
  );
}
