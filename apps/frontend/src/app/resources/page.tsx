"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { pickClubResources, type UserClub } from "@inazuma/shared";
import { api } from "@/services/api";
import { ClubResourcesDisplay } from "@/components/economy/ClubResourcesDisplay";
import { ClubShield } from "@/components/club/ClubShield";
import { MarketRequestState } from "@/components/market/MarketRequestState";

export default function ResourcesPage() {
  const [clubs, setClubs] = useState<UserClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [refreshEverySeconds, setRefreshEverySeconds] = useState(5);
  const resourcesFingerprintRef = useRef("");

  const buildResourcesFingerprint = useCallback((clubsData: UserClub[]) => {
    return clubsData
      .map((club) => {
        const resources = pickClubResources(club);
        return `${club.id}|${club.name}|${club.shieldUrl ?? ""}|${resources.pe}|${resources.pp}|${resources.yens}|${resources.pc}`;
      })
      .sort()
      .join("||");
  }, []);

  const loadClubs = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setIsLoading(true);
      setLoadError(null);
    }
    try {
      const clubsData = await api.market.getUserClubs({ forResources: true });
      const nextFingerprint = buildResourcesFingerprint(clubsData);
      if (nextFingerprint !== resourcesFingerprintRef.current) {
        resourcesFingerprintRef.current = nextFingerprint;
        setClubs(clubsData);
      }
    } catch (error) {
      console.error("Error cargando recursos de clubes:", error);
      if (showLoader) {
        setLoadError(error);
      }
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  }, [buildResourcesFingerprint]);

  useEffect(() => {
    loadClubs(true);
  }, [loadClubs]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadClubs();
    }, refreshEverySeconds * 1000);
    return () => window.clearInterval(intervalId);
  }, [refreshEverySeconds, loadClubs]);

  const sortedClubs = useMemo(
    () => [...clubs].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [clubs],
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 font-sans">
      <div className="w-full max-w-[1800px] mx-auto space-y-6">
        <header className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-sm font-bold border border-slate-700 transition-colors"
          >
            <ArrowLeft size={14} />
            Volver
          </Link>
          <div className="flex items-center gap-2">
            <select
              value={refreshEverySeconds}
              onChange={(e) => setRefreshEverySeconds(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-500"
              aria-label="Frecuencia de recarga"
            >
              <option value={3}>3s</option>
              <option value={5}>5s</option>
              <option value={10}>10s</option>
              <option value={15}>15s</option>
              <option value={30}>30s</option>
            </select>
            <button
              type="button"
              onClick={() => loadClubs()}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-sm font-bold border border-slate-700 transition-colors"
              aria-label="Recargar"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
          {isLoading ? (
            <MarketRequestState
              title="Cargando recursos..."
              loadingLabel="Sincronizando recursos de tus clubes."
              accentClassName="text-yellow-500"
              className="w-full min-h-[260px] bg-transparent"
            />
          ) : loadError ? (
            <MarketRequestState
              title="No se pudieron cargar los recursos"
              error={loadError}
              onRetry={() => loadClubs(true)}
              className="w-full min-h-[260px] bg-transparent"
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
              {sortedClubs.map((club) => (
                <div
                  key={club.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden p-2">
                      <ClubShield shieldUrl={club.shieldUrl} alt={club.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-white text-xl md:text-2xl truncate">{club.name}</p>
                    </div>
                  </div>
                  <ClubResourcesDisplay
                    resources={pickClubResources(club)}
                    variant="grid"
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
