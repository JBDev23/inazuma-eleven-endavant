"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, CheckCircle2, Hammer, RefreshCw, Search } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import {
  FACILITY_LABELS,
  LEVEL_LABELS,
  type ClubFacilityRecord,
  type ClubSportsCity,
  type FacilityId,
  type FacilityLevel,
} from "@inazuma/shared";
import { MarketRequestState } from "@/components/market/MarketRequestState";

type SportsCityWithName = ClubSportsCity & { clubName: string };

export default function SportsCitiesTab() {
  const [cities, setCities] = useState<SportsCityWithName[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      const data = await api.market.getAllSportsCities();
      setCities(data);
    } catch (error) {
      console.error(error);
      setLoadError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm) return cities;
    const q = searchTerm.toLowerCase();
    return cities.filter((c) => c.clubName.toLowerCase().includes(q));
  }, [cities, searchTerm]);

  const pendingCount = useMemo(
    () =>
      cities.reduce(
        (acc, c) => acc + c.facilities.filter((f) => f.upgradingTo != null).length,
        0,
      ),
    [cities],
  );

  const handleLevelChange = async (clubId: string, facilityId: FacilityId, level: number) => {
    const key = `${clubId}-${facilityId}-level`;
    setActionLoading(key);
    setActionError(null);
    try {
      await api.market.adminUpdateFacility(clubId, facilityId, { level });
      await loadData();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo actualizar el nivel."));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (clubId: string, facilityId: FacilityId) => {
    const key = `${clubId}-${facilityId}-approve`;
    setActionLoading(key);
    setActionError(null);
    try {
      await api.market.adminUpdateFacility(clubId, facilityId, { approveConstruction: true });
      await loadData();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo aprobar la obra."));
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <MarketRequestState
        title="Cargando ciudades deportivas..."
        loadingLabel="Estamos sincronizando las ciudades y el estado de obras."
        accentClassName="text-emerald-500"
        className="w-full min-h-[240px] bg-transparent"
      />
    );
  }

  if (loadError) {
    return (
      <MarketRequestState
        title="Cargando ciudades deportivas..."
        error={loadError}
        onRetry={loadData}
        className="w-full min-h-[240px] bg-transparent"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {actionError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="font-black uppercase tracking-wide text-red-300">Accion no completada</p>
            <p className="mt-1 text-red-100/90">{actionError}</p>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="text-emerald-500" size={22} />
            Ciudades Deportivas
          </h2>
          <p className="text-slate-500 text-sm font-bold mt-1">
            {cities.length} clubes · {pendingCount} obra{pendingCount !== 1 ? "s" : ""} pendiente{pendingCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Buscar club..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((city) => {
          const pending = city.facilities.filter((f) => f.upgradingTo != null);
          return (
            <div
              key={city.clubId}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-800 bg-slate-950/50">
                <div className="min-w-0">
                  <h3 className="font-black text-white uppercase tracking-wide truncate">{city.clubName}</h3>
                  <p className="text-[10px] text-slate-600 font-mono mt-0.5 truncate">{city.clubId}</p>
                </div>
                {pending.length > 0 && (
                  <span className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-black uppercase px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                    <Hammer size={14} />
                    {pending.length} en obra
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800">
                      <th className="text-left px-4 sm:px-5 py-3">Instalación</th>
                      <th className="text-center px-2 sm:px-3 py-3">Nivel</th>
                      <th className="hidden sm:table-cell text-center px-2 sm:px-3 py-3">Estado</th>
                      <th className="text-right px-4 sm:px-5 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {city.facilities.map((facility) => (
                      <FacilityRow
                        key={facility.facilityId}
                        clubId={city.clubId}
                        facility={facility}
                        actionLoading={actionLoading}
                        onLevelChange={handleLevelChange}
                        onApprove={handleApprove}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center py-12 text-slate-600 font-bold uppercase tracking-widest">
            No se encontraron clubes
          </p>
        )}
      </div>
    </div>
  );
}

function FacilityRow({
  clubId,
  facility,
  actionLoading,
  onLevelChange,
  onApprove,
}: {
  clubId: string;
  facility: ClubFacilityRecord;
  actionLoading: string | null;
  onLevelChange: (clubId: string, facilityId: FacilityId, level: number) => void;
  onApprove: (clubId: string, facilityId: FacilityId) => void;
}) {
  const { facilityId, level, upgradingTo } = facility;
  const isPending = upgradingTo != null;
  const levelKey = `${clubId}-${facilityId}-level`;
  const approveKey = `${clubId}-${facilityId}-approve`;

  return (
    <tr className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
      <td className="px-4 sm:px-5 py-3">
        <p className="font-bold text-white text-xs">{FACILITY_LABELS[facilityId]}</p>
        <div className="sm:hidden mt-1">
          {isPending ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-400">
              <Hammer size={12} /> → Nv.{upgradingTo}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-600 uppercase">{LEVEL_LABELS[level]}</span>
          )}
        </div>
      </td>
      <td className="px-2 sm:px-3 py-3 text-center">
        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
          {([0, 1, 2, 3] as FacilityLevel[]).map((lvl) => (
            <button
              key={lvl}
              type="button"
              disabled={actionLoading === levelKey}
              onClick={() => onLevelChange(clubId, facilityId, lvl)}
              className={`
                w-7 h-7 sm:w-8 sm:h-8 rounded-lg border text-xs font-black transition-all
                ${level === lvl
                  ? "border-yellow-400 bg-yellow-400/20 text-yellow-400"
                  : "border-slate-700 bg-slate-800 text-slate-500 hover:border-slate-500"
                }
              `}
              title={LEVEL_LABELS[lvl]}
            >
              {lvl}
            </button>
          ))}
        </div>
      </td>
      <td className="hidden sm:table-cell px-2 sm:px-3 py-3 text-center">
        {isPending ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-400">
            <Hammer size={12} /> → Nv.{upgradingTo}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-slate-600 uppercase">{LEVEL_LABELS[level]}</span>
        )}
      </td>
      <td className="px-4 sm:px-5 py-3 text-right">
        {isPending && (
          <button
            type="button"
            disabled={actionLoading === approveKey}
            onClick={() => onApprove(clubId, facilityId)}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            <span className="hidden sm:inline">{actionLoading === approveKey ? "..." : "Aprobar obra"}</span>
            <span className="sm:hidden">{actionLoading === approveKey ? "..." : "Aprobar"}</span>
          </button>
        )}
      </td>
    </tr>
  );
}
