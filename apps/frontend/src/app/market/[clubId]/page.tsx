"use client";

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, Network, Store, Shield, Activity, AlertTriangle,
  TrendingUp, Flame, Wind, Mountain, Leaf, BarChart3,
  LayoutTemplate, UserCircle2, Package, Droplets, Building2
} from 'lucide-react';
import { api, getApiErrorMessage } from '@/services/api';
import PlayerGrid from '@/components/player/PlayerGrid';
import CoachGrid from '@/components/coach/CoachGrid';
import CoachMarketModal from '@/components/coach/CoachMarketModal';
import ClubItemsGrid from '@/components/items/ClubItemsGrid';
import ClubConsumablesGrid from '@/components/consumables/ClubConsumablesGrid';
import type { ClubConsumableWithDetails, ClubItemWithDetails, Coach, Player, UserClub } from '@inazuma/shared';
import { getDisplayStats, getEffectiveStats, getActiveCoach, getTotalStats, pickClubResources } from '@inazuma/shared';
import PlayerModal from '@/components/player/PlayerModal';
import { ClubResourcesDisplay } from '@/components/economy/ClubResourcesDisplay';
import { ClubShield } from '@/components/club/ClubShield';
import { MarketRequestState } from '@/components/market/MarketRequestState';

type RosterTab = 'players' | 'coaches' | 'items' | 'consumables';

export default function ClubDashboardPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  
  const [club, setClub] = useState<UserClub | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [activeTab, setActiveTab] = useState<RosterTab>('players');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.market.getUserClub(clubId);
      setClub(res);
    } catch (error) {
      console.error(error);
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [clubId]);

  if (loading || !club) {
    if (loadError) {
      return (
        <MarketRequestState
          title="Cargando sede..."
          error={loadError}
          onRetry={loadData}
        />
      );
    }

    return <MarketRequestState title="Cargando sede..." loadingLabel="Estamos sincronizando la plantilla, recursos e inventario del club." accentClassName="text-yellow-500" />;
  }

  const handleAction = async (action: 'buy' | 'toll' | 'sell', nickname: string) => {
    try {
      setIsProcessing(true);
      setActionError(null);
      await api.market.performAction(clubId, action, nickname);
      setSelectedPlayer(null);
      await loadData();
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, 'No se pudo completar la accion del jugador.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSellCoach = async (coachId: number) => {
    try {
      setIsProcessing(true);
      setActionError(null);
      await api.market.sellCoach(clubId, coachId);
      setSelectedCoach(null);
      await loadData();
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, 'No se pudo liberar al entrenador.'));
    } finally {
      setIsProcessing(false);
    }
  };

  // 🎯 LÓGICA DE CÁLCULOS DEL EQUIPO
  const roster: Player[] = club.roster || [];
  const coaches: Coach[] = club.coaches || [];
  const clubItems: ClubItemWithDetails[] = club.items ?? [];
  const clubConsumables: ClubConsumableWithDetails[] = club.consumables ?? [];
  const activeCoach = getActiveCoach(club);
  const totalItemsOwned = clubItems.reduce((sum, e) => sum + e.quantity, 0)
    + roster.reduce((sum, p) => sum + (p.primaryItem ? 1 : 0) + (p.secondaryItem ? 1 : 0), 0);
  const totalConsumablesOwned = clubConsumables.reduce((sum, e) => sum + e.quantity, 0);
  
  // 1. Valor total de la franquicia
  const totalValue = roster.reduce((sum, p) => sum + (p.price || 0), 0);
  
  // 2. Media del equipo (OVR) con bonos del entrenador activo
  const avgOvr = roster.length > 0
    ? Math.round(roster.reduce((sum, p) => sum + getTotalStats(getEffectiveStats(p, activeCoach)), 0) / roster.length)
    : 0;

  // 3. Conteo de Afinidades (Elementos)
  const elementsCount = roster.reduce((acc, p) => {
    if (p.element === 'Fire') acc.fire++;
    if (p.element === 'Wind') acc.wind++;
    if (p.element === 'Wood') acc.wood++;
    if (p.element === 'Earth') acc.earth++;
    return acc;
  }, { fire: 0, wind: 0, wood: 0, earth: 0 });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      
      {/* 🔝 CABECERA: Identidad del Club */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center bg-linear-to-r from-slate-900 to-slate-800 p-8 rounded-3xl border-4 border-slate-800 shadow-2xl mb-6 gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5">
          <Shield size={250} />
        </div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-24 h-24 bg-blue-500/20 rounded-2xl flex items-center justify-center border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] p-2">
            <ClubShield
              shieldUrl={club.shieldUrl}
              alt={club.name}
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <div>
            <p className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Sede Oficial</p>
            <h1 className="text-4xl font-black text-white uppercase">{club.name}</h1>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center justify-center gap-1">
            <Users size={14}/> Plantilla · {roster.length} jug. · {coaches.length} ent.
          </p>
          <ClubResourcesDisplay
            resources={pickClubResources(club)}
            variant="grid"
            title="Recursos"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Panel 1: Valoración Media (OVR) */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 flex items-center justify-center gap-5 shadow-lg">
          <div className="w-18 h-18 rounded-full border-4 border-emerald-500 bg-emerald-950 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <span className="text-2xl font-black text-emerald-400 tabular-nums">{avgOvr}</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
              <BarChart3 size={16} className="text-emerald-500" /> Media Global
            </h3>
            <p className="text-xs text-slate-500 font-bold">Puntos totales promedio</p>
          </div>
        </div>

        {/* Panel 2: Valor de Franquicia */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 flex items-center justify-center gap-5 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-600">
            <TrendingUp size={32} className="text-slate-300" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Valor del Club</h3>
            <p className="text-2xl font-black text-white tabular-nums">{totalValue} <span className="text-sm text-slate-500">PP en jugadores</span></p>
          </div>
        </div>

        {/* Panel 3: Afinidades Elementales */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-center">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Distribución Elemental</h3>
          <div className="flex justify-between items-center px-2">
            <div className="flex flex-col items-center gap-1" title="Fuego">
              <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg border border-orange-500/30"><Flame size={18}/></div>
              <span className="text-sm font-black text-white">{elementsCount.fire}</span>
            </div>
            <div className="flex flex-col items-center gap-1" title="Aire">
              <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-500/30"><Wind size={18}/></div>
              <span className="text-sm font-black text-white">{elementsCount.wind}</span>
            </div>
            <div className="flex flex-col items-center gap-1" title="Bosque">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30"><Leaf size={18}/></div>
              <span className="text-sm font-black text-white">{elementsCount.wood}</span>
            </div>
            <div className="flex flex-col items-center gap-1" title="Montaña">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30"><Mountain size={18}/></div>
              <span className="text-sm font-black text-white">{elementsCount.earth}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🎮 PANEL DE NAVEGACIÓN (Botones grandes) */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 🎯 Enlace a Pizarra Táctica */}
        <Link href={`/market/${clubId}/tactics`} className="group relative bg-slate-900 border-2 border-slate-700 hover:border-blue-500 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 transition-all overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-full bg-linear-to-l from-blue-500/10 to-transparent pointer-events-none" />
          <div className="w-16 h-16 shrink-0 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <LayoutTemplate size={32} />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-black text-white uppercase tracking-wide group-hover:text-blue-400 transition-colors">Pizarra Táctica</h2>
            <p className="text-sm text-slate-400 mt-1">Convocatoria, formaciones y el 11 inicial de tu equipo.</p>
          </div>
        </Link>

        {/* Enlace al Árbol de Fichajes */}
        <Link href={`/market/${clubId}/map/${club.baseTeamSlug}`} className="group relative bg-slate-900 border-2 border-slate-700 hover:border-emerald-500 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 transition-all overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-full bg-linear-to-l from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="w-16 h-16 shrink-0 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Network size={32} />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-black text-white uppercase tracking-wide group-hover:text-emerald-400 transition-colors">Mapas de Relaciones</h2>
            <p className="text-sm text-slate-400 mt-1">Explora los árboles y descubre nuevos jugadores.</p>
          </div>
        </Link>

        {/* Enlace a Ciudad Deportiva */}
        <Link href={`/market/${clubId}/sports-city`} className="group relative bg-slate-900 border-2 border-slate-700 hover:border-emerald-500 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 transition-all overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-full bg-linear-to-l from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="w-16 h-16 shrink-0 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Building2 size={32} />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-black text-white uppercase tracking-wide group-hover:text-emerald-400 transition-colors">Ciudad Deportiva</h2>
            <p className="text-sm text-slate-400 mt-1">Mejora las instalaciones de tu club y desbloquea ventajas.</p>
          </div>
        </Link>

        {/* Enlace al Mercado Libre */}
        <Link href={`/market/${clubId}/free-agents`} className="group relative bg-slate-900 border-2 border-slate-700 hover:border-yellow-500 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 transition-all overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-full bg-linear-to-l from-yellow-500/10 to-transparent pointer-events-none" />
          <div className="w-16 h-16 shrink-0 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Store size={32} />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-black text-white uppercase tracking-wide group-hover:text-yellow-400 transition-colors">Agentes Libres</h2>
            <p className="text-sm text-slate-400 mt-1">Ficha jugadores y entrenadores sin equipo usando tus PP.</p>
          </div>
        </Link>

        {/* Enlace a Tienda de Objetos */}
        <Link href={`/market/${clubId}/items`} className="group relative bg-slate-900 border-2 border-slate-700 hover:border-cyan-500 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 transition-all overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-full bg-linear-to-l from-cyan-500/10 to-transparent pointer-events-none" />
          <div className="w-16 h-16 shrink-0 bg-cyan-500/10 text-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package size={32} />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-black text-white uppercase tracking-wide group-hover:text-cyan-400 transition-colors">Tienda de Objetos</h2>
            <p className="text-sm text-slate-400 mt-1">Compra botas, guantes, pulseras y colgantes para tu plantilla.</p>
          </div>
        </Link>

        {/* Enlace a Tienda de Consumibles */}
        <Link href={`/market/${clubId}/consumables`} className="group relative bg-slate-900 border-2 border-slate-700 hover:border-sky-500 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 transition-all overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-full bg-linear-to-l from-sky-500/10 to-transparent pointer-events-none" />
          <div className="w-16 h-16 shrink-0 bg-sky-500/10 text-sky-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Droplets size={32} />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-black text-white uppercase tracking-wide group-hover:text-sky-400 transition-colors">Consumibles</h2>
            <p className="text-sm text-slate-400 mt-1">Agua y comida de un solo uso para recuperar GP y TP en partido.</p>
          </div>
        </Link>
        </div>
      </div>

      {/* 🛡️ PLANTILLA FICHADA */}
      <div className="max-w-7xl mx-auto">
        {actionError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="font-black uppercase tracking-wide text-red-300">Accion no completada</p>
              <p className="mt-1 text-red-100/90">{actionError}</p>
            </div>
          </div>
        )}
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter border-b-2 border-slate-800 pb-4 mb-6 flex items-center gap-3">
          <Activity className="text-blue-500" /> Fichajes
        </h3>

        <div className="mb-6 flex gap-2 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-sm rounded-t-xl transition-all ${
              activeTab === 'players'
                ? 'bg-slate-900 text-blue-400 border-t-2 border-blue-500'
                : 'bg-slate-950 text-slate-500 hover:bg-slate-900'
            }`}
          >
            <Users size={18} /> Jugadores ({roster.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('coaches')}
            className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-sm rounded-t-xl transition-all ${
              activeTab === 'coaches'
                ? 'bg-slate-900 text-purple-400 border-t-2 border-purple-400'
                : 'bg-slate-950 text-slate-500 hover:bg-slate-900'
            }`}
          >
            <UserCircle2 size={18} /> Entrenadores ({coaches.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-sm rounded-t-xl transition-all ${
              activeTab === 'items'
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500'
                : 'bg-slate-950 text-slate-500 hover:bg-slate-900'
            }`}
          >
            <Package size={18} /> Objetos ({totalItemsOwned})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('consumables')}
            className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-sm rounded-t-xl transition-all ${
              activeTab === 'consumables'
                ? 'bg-slate-900 text-sky-400 border-t-2 border-sky-500'
                : 'bg-slate-950 text-slate-500 hover:bg-slate-900'
            }`}
          >
            <Droplets size={18} /> Consumibles ({totalConsumablesOwned})
          </button>
        </div>

        {activeTab === 'players' && (
          roster.length === 0 ? (
            <div className="text-center py-20 bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl">
              <p className="text-slate-500 text-lg font-bold">Aún no has fichado a ningún jugador.</p>
              <p className="text-slate-600 text-sm mt-2">Visita los Mapas de Relaciones para empezar a construir tu equipo.</p>
            </div>
          ) : (
            <PlayerGrid
              players={roster}
              activeCoach={activeCoach}
              onPlayerClick={(player) => setSelectedPlayer(player)}
              renderActionNode={(player) => (
              <button
                onClick={() => setSelectedPlayer(player)}
                className="w-full flex items-center justify-center gap-2 text-xs font-black uppercase p-2 rounded-lg transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-600"
              >
                Gestionar
              </button>
            )} />
          )
        )}

        {activeTab === 'coaches' && (
          coaches.length === 0 ? (
            <div className="text-center py-20 bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl">
              <p className="text-slate-500 text-lg font-bold">Aún no has fichado a ningún entrenador.</p>
              <p className="text-slate-600 text-sm mt-2">Visita Agentes Libres para fichar entrenadores con tus PP.</p>
            </div>
          ) : (
            <CoachGrid
              coaches={coaches}
              onCoachClick={(coach) => setSelectedCoach(coach)}
              renderActionNode={(coach) => (
                <button
                  onClick={() => setSelectedCoach(coach)}
                  className="w-full flex items-center justify-center gap-2 text-xs font-black uppercase p-2 rounded-lg transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-600"
                >
                  {club.activeCoachId === coach.id ? 'Activo · Ver' : 'Gestionar'}
                </button>
              )}
            />
          )
        )}

        {activeTab === 'items' && (
          <ClubItemsGrid
            roster={roster}
            inventory={clubItems}
            clubId={clubId}
            onPlayerClick={(player) => setSelectedPlayer(player)}
          />
        )}

        {activeTab === 'consumables' && (
          <ClubConsumablesGrid
            inventory={clubConsumables}
            clubId={clubId}
          />
        )}
      </div>

      {/* MODAL */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          status="owned"
          onClose={() => setSelectedPlayer(null)}
          onAction={handleAction}
          isLoading={isProcessing}
          resources={pickClubResources(club)}
          clubId={clubId}
          activeCoach={activeCoach}
          clubInventory={club.items ?? []}
          onEquipmentChange={async () => {
            const res = await api.market.getUserClub(clubId);
            setClub(res);
            setSelectedPlayer((prev) => {
              if (!prev) return null;
              return res.roster?.find((p: Player) => p.id === prev.id) ?? prev;
            });
          }}
          onPeRedeemComplete={async (updated) => {
            const res = await api.market.getUserClub(clubId);
            setClub(res);
            setSelectedPlayer((prev) => {
              if (!prev) return null;
              const fresh = res.roster?.find((p: Player) => p.id === prev.id);
              return fresh ?? { ...prev, level: updated.level, experience: updated.experience };
            });
          }}
          onPcSpendComplete={async (updated) => {
            const res = await api.market.getUserClub(clubId);
            setClub(res);
            setSelectedPlayer((prev) => {
              if (!prev) return null;
              const fresh = res.roster?.find((p: Player) => p.id === prev.id);
              return fresh ?? { ...prev, statBonuses: updated };
            });
          }}
        />
      )}

      {selectedCoach && (
        <CoachMarketModal
          coach={selectedCoach}
          onClose={() => setSelectedCoach(null)}
          readOnly
          isActiveCoach={club.activeCoachId === selectedCoach.id}
          canSell={coaches.length > 1}
          onSell={handleSellCoach}
          isLoading={isProcessing}
          resources={pickClubResources(club)}
          clubId={clubId}
          onYeRedeemComplete={async (updated) => {
            const res = await api.market.getUserClub(clubId);
            setClub(res);
            setSelectedCoach((prev) => {
              if (!prev) return null;
              const fresh = res.coaches?.find((c: Coach) => c.id === prev.id);
              return fresh ?? { ...prev, level: updated.level, experience: updated.experience };
            });
          }}
        />
      )}
    </div>
  );
}