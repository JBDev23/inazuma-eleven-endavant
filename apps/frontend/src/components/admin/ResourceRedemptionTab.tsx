"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Coins,
  Minus,
  Plus,
  RefreshCw,
  Search,
  X,
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

const QUANTITY_STEPS = [1, 5, 10, 25];

function parseAmountInput(value: string): number {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatPackageSummary(pkg: ClubResources): string {
  return CLUB_RESOURCES.filter(({ key }) => pkg[key] > 0)
    .map(({ key, short }) => `+${pkg[key].toLocaleString("es-ES")} ${short}`)
    .join(" · ");
}

function scalePackage(pkg: ClubResources, quantity: number): ClubResources {
  return {
    pp: pkg.pp * quantity,
    pe: pkg.pe * quantity,
    yens: pkg.yens * quantity,
    pc: pkg.pc * quantity,
  };
}

interface ChapaQuantityModalProps {
  club: UserClub;
  packageAmounts: ClubResources;
  packageLabel: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}

function ChapaQuantityModal({
  club,
  packageAmounts,
  packageLabel,
  isSubmitting,
  onClose,
  onConfirm,
}: ChapaQuantityModalProps) {
  const [quantityInput, setQuantityInput] = useState("1");
  const quantity = Math.max(0, parseAmountInput(quantityInput));
  const label = packageLabel.trim() || "Chapa";
  const total = scalePackage(packageAmounts, quantity);
  const totalSummary = formatPackageSummary(total);
  const canConfirm = quantity > 0 && !isSubmitting;

  const setQuantity = (next: number) => {
    const clamped = Math.max(0, Math.floor(next));
    setQuantityInput(clamped > 0 ? String(clamped) : "");
  };

  const handleQuantityChange = (value: string) => {
    if (value === "") {
      setQuantityInput("");
      return;
    }
    const digitsOnly = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    setQuantityInput(digitsOnly);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2 min-w-0">
            <Coins className="text-amber-400 w-5 h-5 shrink-0" />
            <h3 className="font-black text-white uppercase tracking-wider text-sm sm:text-base truncate">
              Canjear {label}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="shrink-0 p-2 -mr-2 text-slate-400 hover:text-white transition-colors touch-manipulation disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain p-4 sm:p-6 flex flex-col gap-5 scrollbar-hide">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center shrink-0 overflow-hidden p-1">
              <ClubShield
                shieldUrl={club.shieldUrl}
                alt={club.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="font-black text-white truncate">{club.name}</p>
              <ClubResourcesDisplay
                resources={pickClubResources(club)}
                variant="inline"
                className="mt-1 flex-wrap"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Número de {label.toLowerCase()}s
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity(quantity - 1)}
                disabled={quantity <= 0 || isSubmitting}
                className="shrink-0 w-12 h-12 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 touch-manipulation flex items-center justify-center"
                aria-label="Restar una"
              >
                <Minus size={18} />
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantityInput}
                onChange={(e) => handleQuantityChange(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-center text-3xl font-black tabular-nums text-amber-300 outline-none focus:border-amber-500 disabled:opacity-50"
                aria-label={`Cantidad de ${label}`}
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                disabled={isSubmitting}
                className="shrink-0 w-12 h-12 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 touch-manipulation flex items-center justify-center"
                aria-label="Sumar una"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUANTITY_STEPS.map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setQuantity(quantity + step)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs font-black uppercase tracking-wider text-slate-300 hover:border-amber-500/50 hover:text-amber-300 disabled:opacity-40 touch-manipulation"
                >
                  +{step}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Total a sumar
            </p>
            <p className="text-sm sm:text-base font-black text-amber-300">
              {quantity > 0
                ? `${quantity} × ${label} → ${totalSummary}`
                : "Indica al menos 1"}
            </p>
          </div>
        </div>

        <div className="shrink-0 p-4 border-t border-slate-800 bg-slate-950 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 font-bold hover:bg-slate-800 disabled:opacity-50 touch-manipulation"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(quantity)}
            disabled={!canConfirm}
            className="flex-1 py-3 rounded-xl bg-amber-500 text-slate-950 font-black uppercase tracking-wider hover:bg-amber-400 disabled:opacity-50 touch-manipulation"
          >
            {isSubmitting ? "Canjeando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
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
  const [selectedClub, setSelectedClub] = useState<UserClub | null>(null);
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
  const label = packageLabel.trim() || "Chapa";

  const setResourceAmount = (key: ClubResourceKey, raw: string) => {
    const digitsOnly = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    setPackageAmounts((prev) => ({
      ...prev,
      [key]: digitsOnly === "" ? 0 : parseAmountInput(digitsOnly),
    }));
  };

  const openRedeemModal = (club: UserClub) => {
    if (!hasAnyAmount) {
      setActionError("Configura al menos un recurso mayor que cero.");
      setSuccessMessage(null);
      return;
    }
    setActionError(null);
    setSelectedClub(club);
  };

  const handleRedeem = async (quantity: number) => {
    if (!selectedClub || quantity <= 0) return;
    if (!hasAnyAmount) {
      setActionError("Configura al menos un recurso mayor que cero.");
      setSuccessMessage(null);
      return;
    }

    const club = selectedClub;
    const total = scalePackage(packageAmounts, quantity);
    const totalSummary = formatPackageSummary(total);
    const transactionData: AddTransactionDto = {
      amountPP: total.pp,
      amountPE: total.pe,
      amountYens: total.yens,
      amountPC: total.pc,
      description: `Canjeo: ${quantity}× ${label}`,
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
        `${club.name}: ${totalSummary || "sin cambios"} (${quantity}× ${label})`,
      );
      setSelectedClub(null);
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
            Configura cuánto vale cada chapa. Luego pulsa un club y elige cuántas canjear.
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
            Cada chapa sumará
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
              const wasJustRedeemed = lastRedeemedId === club.id;
              const busy = redeemingClubId !== null;

              return (
                <button
                  key={club.id}
                  type="button"
                  disabled={!hasAnyAmount || busy}
                  onClick={() => openRedeemModal(club)}
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
                        {wasJustRedeemed ? (
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

      {selectedClub && (
        <ChapaQuantityModal
          club={selectedClub}
          packageAmounts={packageAmounts}
          packageLabel={packageLabel}
          isSubmitting={redeemingClubId === selectedClub.id}
          onClose={() => {
            if (redeemingClubId) return;
            setSelectedClub(null);
          }}
          onConfirm={handleRedeem}
        />
      )}
    </div>
  );
}
