"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { pickClubResources } from "@inazuma/shared";
import type { ClubFacilityRecord, NormalizedElement, UserClub } from "@inazuma/shared";
import { api } from "@/services/api";
import { ClubResourcesDisplay } from "@/components/economy/ClubResourcesDisplay";
import { ClubShield } from "@/components/club/ClubShield";
import { SportsCityMap } from "@/components/sports-city/SportsCityMap";
import type { FacilityId } from "@/components/sports-city/types";

export default function SportsCityPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const [club, setClub] = useState<UserClub | null>(null);
  const [facilities, setFacilities] = useState<ClubFacilityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isSavingPitchElement, setIsSavingPitchElement] = useState(false);

  const loadData = useCallback(async () => {
    const [clubRes, cityRes] = await Promise.all([
      api.market.getUserClub(clubId),
      api.market.getSportsCity(clubId),
    ]);
    setClub(clubRes);
    setFacilities(cityRes.facilities);
  }, [clubId]);

  useEffect(() => {
    loadData()
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [loadData]);

  const handleUpgrade = async (facilityId: FacilityId) => {
    setIsUpgrading(true);
    try {
      const result = await api.market.startFacilityUpgrade(clubId, facilityId);
      setFacilities((prev) =>
        prev.map((f) => (f.facilityId === facilityId ? result.facility : f)),
      );
      setClub((prev) => (prev ? { ...prev, pp: result.newBalance } : prev));
    } catch (error) {
      alert((error as Error).message || "Error al iniciar la obra");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleSetPitchElement = async (pitchElement: NormalizedElement) => {
    setIsSavingPitchElement(true);
    try {
      const result = await api.market.setPitchElement(clubId, pitchElement);
      setFacilities((prev) =>
        prev.map((f) => (f.facilityId === "field" ? result.facility : f)),
      );
    } catch (error) {
      alert((error as Error).message || "Error al guardar el terreno elemental");
    } finally {
      setIsSavingPitchElement(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin mb-4 text-emerald-500" size={48} />
        <h2 className="text-xl font-black uppercase tracking-widest">Cargando ciudad deportiva...</h2>
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

        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            {club?.shieldUrl && (
              <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/30 p-1.5">
                <ClubShield
                  shieldUrl={club.shieldUrl}
                  alt={club.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-white tracking-wider flex items-center gap-2 md:gap-3">
                <Building2 className="text-emerald-500 shrink-0" size={28} /> Ciudad Deportiva
              </h1>
              <p className="text-slate-400 font-bold uppercase text-xs sm:text-sm mt-1 tracking-widest truncate">
                {club?.name ?? "Tu club"} · Instalaciones y mejoras
              </p>
            </div>
          </div>

          {club && (
            <ClubResourcesDisplay
              resources={pickClubResources(club)}
              variant="grid"
              title="Recursos"
              className="w-full lg:w-auto lg:min-w-[280px]"
            />
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {club && (
          <SportsCityMap
            facilities={facilities}
            clubName={club.name}
            resources={pickClubResources(club)}
            onUpgrade={handleUpgrade}
            onSetPitchElement={handleSetPitchElement}
            isUpgrading={isUpgrading}
            isSavingPitchElement={isSavingPitchElement}
          />
        )}
      </div>
    </div>
  );
}
