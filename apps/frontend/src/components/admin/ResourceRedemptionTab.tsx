"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Coins,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  CLUB_RESOURCES,
  pickClubResources,
  type AddTransactionDto,
  type ClubResourceKey,
  type ClubResources,
  type UserClub,
} from "@inazuma/shared";
import { api, getApiErrorMessage } from "@/services/api";
import { ClubShield } from "@/components/club/ClubShield";
import { ClubResourcesDisplay } from "@/components/economy/ClubResourcesDisplay";
import { CLUB_RESOURCE_STYLES } from "@/components/economy/club-resource-styles";
import { MarketRequestState } from "@/components/market/MarketRequestState";

const DEFAULT_PACKAGE: ClubResources = {
  pp: 10,
  pe: 10,
  yens: 0,
  pc: 0,
};

function parseAmountInput(value: string): number {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatPackageSummary(pkg: ClubResources): string {
  return CLUB_RESOURCES.filter(({ key }) => pkg[key] > 0)
    .map(({ key, short }) => `+${pkg[key].toLocaleString("es-ES")} ${short}`)
    .join(" · ");
}

export default function ResourceRedemptionTab() {
  const [clubs, setClubs] = useState<UserClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [packageAmounts, setPackageAmounts] = useState<ClubResources>(DEFAULT_PACKAGE);
  const [packageLabel, setPackageLabel] = useState("Chapa");
  const [redeemingClubId, setRedeemingClubId] = useState<string | null>(null);
  const [lastRedeemedId, setLastRedeemedId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      const clubsData = await api.market.getUserClubs();
      setClubs(clubsData);
    } catch (error) {
      console.error("Error cargando clubes:", error);
      setLoadError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClubs = useMemo(() => {
    if (!searchTerm) return clubs;
    const lowerSearch = searchTerm.toLowerCase();
    return clubs.filter((c) => c.name.toLowerCase().includes(lowerSearch));
  }, [clubs, searchTerm]);

  const packageSummary = formatPackageSummary(packageAmounts);
  const hasAnyAmount = CLUB_RESOURCES.some(({ key }) => packageAmounts[key] > 0);

  const setResourceAmount = (key: ClubResourceKey, raw: string) => {
    const digitsOnly = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    setPackageAmounts((prev) => ({
      ...prev,
      [key]: digitsOnly === "" ? 0 : parseAmountInput(digitsOnly),
    }));
  };

  const handleRedeem = async (club: UserClub) => {
    if (!hasAnyAmount) {
      setActionError("Configura al menos un recurso mayor que cero.");
      setSuccessMessage(null);
      return;
    }

    const label = packageLabel.trim() || "Chapa";
    const transactionData: AddTransactionDto = {
      amountPP: packageAmounts.pp,
      amountPE: packageAmounts.pe,
      amountYens: packageAmounts.yens,
      amountPC: packageAmounts.pc,
      description: `Canjeo: ${label}`,
    };

    setRedeemingClubId(club.id);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const updated = await api.market.addTransaction(club.id, transactionData);
      setClubs((prev) =>
        prev.map((c) => (c.id === club.id ? { ...c, ...updated } : c)),
      );
      setLastRedeemedId(club.id);
      setSuccessMessage(
        `${club.name}: ${packageSummary || "sin cambios"} (${label})`,
      );
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Error al canjear recursos."));
    } finally {
      setRedeemingClubId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Coins className="text-amber-400 shrink-0" size={22} />
            Valor de la chapa
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Configura cuánto suma cada canjeo. Luego pulsa un club para aplicarlo.
          </p>
        </div>

        <div className="flex flex-col gap-1 max-w-sm">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Nombre del canjeo
          </label>
          <input
            type="text"
            value={packageLabel}
            onChange={(e) => setPackageLabel(e.target.value)}
            placeholder="Chapa"
            className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white placeholder:text-slate-600 outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CLUB_RESOURCES.map(({ key, short, name }) => {
            const style = CLUB_RESOURCE_STYLES[key];
            return (
              <div
                key={key}
                className={`rounded-xl border p-3 flex flex-col gap-2 ${style.border} ${style.bg}`}
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {short}
                  </p>
                  <p className={`text-xs font-bold truncate ${style.text}`}>{name}</p>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={packageAmounts[key] === 0 ? "" : String(packageAmounts[key])}
                  onChange={(e) => setResourceAmount(key, e.target.value)}
                  placeholder="0"
                  className={`w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 px-3 text-2xl font-black tabular-nums outline-none focus:border-white/30 placeholder:text-slate-700 ${style.text}`}
                />
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Cada canjeo sumará
          </p>
          <p className="text-sm sm:text-base font-black text-amber-300">
            {hasAnyAmount ? packageSummary : "Configura al menos un recurso"}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Buscar club por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={loadData}
          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-bold transition-colors border border-slate-700"
        >
          <RefreshCw size={16} /> Recargar
        </button>
      </div>

      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
          <Check size={18} className="mt-0.5 shrink-0 text-emerald-400" />
          <div>
            <p className="font-black uppercase tracking-wide text-emerald-300">Canjeo aplicado</p>
            <p className="mt-1 text-emerald-100/90">{successMessage}</p>
          </div>
        </div>
      )}

      {actionError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="font-black uppercase tracking-wide text-red-300">Canjeo no completado</p>
            <p className="mt-1 text-red-100/90">{actionError}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <MarketRequestState
            title="Cargando clubes..."
            loadingLabel="Preparando lista para canjeo."
            accentClassName="text-amber-400"
            className="w-full min-h-[260px] bg-transparent"
          />
        ) : loadError ? (
          <MarketRequestState
            title="No se pudieron cargar los clubes"
            error={loadError}
            onRetry={loadData}
            className="w-full min-h-[260px] bg-transparent"
          />
        ) : filteredClubs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm font-bold uppercase tracking-widest">
            No hay clubes que coincidan
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 sm:p-4">
            {filteredClubs.map((club) => {
              const isRedeeming = redeemingClubId === club.id;
              const wasJustRedeemed = lastRedeemedId === club.id;
              const busy = redeemingClubId !== null;

              return (
                <button
                  key={club.id}
                  type="button"
                  disabled={!hasAnyAmount || busy}
                  onClick={() => handleRedeem(club)}
                  className={`text-left rounded-xl border p-3 sm:p-4 transition-all touch-manipulation min-h-[88px] disabled:opacity-50 disabled:cursor-not-allowed ${
                    wasJustRedeemed
                      ? "border-emerald-500/60 bg-emerald-950/40 ring-1 ring-emerald-500/40"
                      : "border-slate-800 bg-slate-950 hover:border-amber-500/50 hover:bg-slate-900 active:scale-[0.99]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center shrink-0 overflow-hidden p-1">
                      <ClubShield
                        shieldUrl={club.shieldUrl}
                        alt={club.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-white truncate">{club.name}</p>
                        {isRedeeming ? (
                          <span className="shrink-0 text-[10px] font-black uppercase text-amber-300">
                            Canjeando…
                          </span>
                        ) : wasJustRedeemed ? (
                          <Check size={14} className="shrink-0 text-emerald-400" />
                        ) : null}
                      </div>
                      <ClubResourcesDisplay
                        resources={pickClubResources(club)}
                        variant="inline"
                        className="mt-1.5 flex-wrap"
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
