"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Plus, RefreshCw, Save, Trash2, TrendingUp } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import { computePachangaXpBounds, DEFAULT_ECONOMY_PRICING, type GameSettings, type SessionXpConfig } from "@inazuma/shared";

const emptySessionForm = (): SessionXpConfig => ({
  session: 1,
  minXp: 600,
  maxXp: 3500,
  pachangaMultiplier: 0.2,
  winnerRewardPp: 0,
  winnerRewardYens: 0,
  coachXpPerYe: 100,
});

export default function GameSettingsTab() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState(1);
  const [basePlayerPrice, setBasePlayerPrice] = useState(DEFAULT_ECONOMY_PRICING.basePlayerPrice);
  const [playerPricePerLevel, setPlayerPricePerLevel] = useState(DEFAULT_ECONOMY_PRICING.playerPricePerLevel);
  const [baseCoachPrice, setBaseCoachPrice] = useState(DEFAULT_ECONOMY_PRICING.baseCoachPrice);
  const [coachPricePerLevel, setCoachPricePerLevel] = useState(DEFAULT_ECONOMY_PRICING.coachPricePerLevel);
  const [playerPricePerPc, setPlayerPricePerPc] = useState(DEFAULT_ECONOMY_PRICING.playerPricePerPc);
  const [facilityUpgradeCostFrom0, setFacilityUpgradeCostFrom0] = useState(
    DEFAULT_ECONOMY_PRICING.facilityUpgradeCostFrom0,
  );
  const [facilityUpgradeCostFrom1, setFacilityUpgradeCostFrom1] = useState(
    DEFAULT_ECONOMY_PRICING.facilityUpgradeCostFrom1,
  );
  const [facilityUpgradeCostFrom2, setFacilityUpgradeCostFrom2] = useState(
    DEFAULT_ECONOMY_PRICING.facilityUpgradeCostFrom2,
  );
  const [sessionForm, setSessionForm] = useState<SessionXpConfig>(emptySessionForm);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await api.gameSettings.get();
      setSettings(data);
      setCurrentSession(data.currentSession);
      setBasePlayerPrice(data.basePlayerPrice);
      setPlayerPricePerLevel(data.playerPricePerLevel);
      setBaseCoachPrice(data.baseCoachPrice);
      setCoachPricePerLevel(data.coachPricePerLevel);
      setPlayerPricePerPc(data.playerPricePerPc);
      setFacilityUpgradeCostFrom0(data.facilityUpgradeCostFrom0);
      setFacilityUpgradeCostFrom1(data.facilityUpgradeCostFrom1);
      setFacilityUpgradeCostFrom2(data.facilityUpgradeCostFrom2);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Error al cargar la configuración de XP";
      setLoadError(message);
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSaveGlobal = async () => {
    setSaving(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const data = await api.gameSettings.update({
        currentSession,
        basePlayerPrice,
        playerPricePerLevel,
        baseCoachPrice,
        coachPricePerLevel,
        playerPricePerPc,
        facilityUpgradeCostFrom0,
        facilityUpgradeCostFrom1,
        facilityUpgradeCostFrom2,
      });
      setSettings(data);
      setActionSuccess("Configuración global guardada");
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Error al guardar."));
    } finally {
      setSaving(false);
    }
  };

  const handleUpsertSession = async () => {
    if (sessionForm.maxXp < sessionForm.minXp) {
      alert("El máximo debe ser mayor o igual al mínimo");
      return;
    }

    setSaving(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const data = await api.gameSettings.upsertSession(sessionForm);
      setSettings(data);
      setSessionForm(emptySessionForm());
      setActionSuccess(`Sesión ${sessionForm.session} guardada`);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Error al guardar la sesión."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async (session: number) => {
    if (!confirm(`¿Eliminar configuración de la sesión ${session}?`)) return;

    try {
      const data = await api.gameSettings.deleteSession(session);
      setSettings(data);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Error al eliminar."));
    }
  };

  const handleEditSession = (config: SessionXpConfig) => {
    setSessionForm({ ...config });
  };

  const pachangaPreview = computePachangaXpBounds(sessionForm);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-violet-400 font-black uppercase tracking-widest animate-pulse">
        Cargando configuración de XP...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-950/30 p-8 text-center space-y-4">
        <p className="text-red-300 font-bold">{loadError}</p>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Comprueba que el backend esté en marcha en el puerto 4000 y que hayas aplicado las
          migraciones de Prisma. Si acabas de actualizar el código, reinicia el servidor backend.
        </p>
        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold border border-slate-600"
        >
          <RefreshCw size={16} /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      <div className="flex justify-stretch sm:justify-end">
        <button
          onClick={() => void loadData()}
          className="flex w-full sm:w-auto items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl font-bold transition-colors border border-slate-700"
        >
          <RefreshCw size={16} /> Recargar
        </button>
      </div>

      {(actionError || actionSuccess) && (
        <div
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
            actionError
              ? "border-red-500/30 bg-red-950/40 text-red-100"
              : "border-emerald-500/30 bg-emerald-950/30 text-emerald-100"
          }`}
        >
          {actionError ? (
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
          ) : (
            <span className="mt-0.5 shrink-0 text-emerald-400 font-black">✓</span>
          )}
          <div>
            <p className="font-black uppercase tracking-wide">
              {actionError ? "Accion no completada" : "Listo"}
            </p>
            <p className="mt-1">{actionError ?? actionSuccess}</p>
          </div>
        </div>
      )}

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-violet-400" size={22} />
          <h2 className="text-lg font-black uppercase tracking-wider text-white">
            Sesión activa
          </h2>
        </div>

        <label className="space-y-2 block max-w-xs">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Día / sesión del evento
          </span>
          <input
            type="number"
            min={1}
            value={currentSession}
            onChange={(e) => setCurrentSession(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
          />
        </label>

        <button
          onClick={() => void handleSaveGlobal()}
          disabled={saving}
          className="flex w-full sm:w-auto items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-colors"
        >
          <Save size={16} /> Guardar sesión activa
        </button>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
        <h2 className="text-lg font-black uppercase tracking-wider text-white">
          Precios mercado
        </h2>
        <p className="text-sm text-slate-500">
          Jugador = base + (nivel × por nivel) + (PC aplicados × por PC). Entrenador = base +
          (nivel × por nivel). Peaje y venta usan la mitad.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Base jugadores
            </span>
            <input
              type="number"
              min={0}
              value={basePlayerPrice}
              onChange={(e) => setBasePlayerPrice(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Precio × nivel jug.
            </span>
            <input
              type="number"
              min={0}
              value={playerPricePerLevel}
              onChange={(e) => setPlayerPricePerLevel(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Precio × PC
            </span>
            <input
              type="number"
              min={0}
              value={playerPricePerPc}
              onChange={(e) => setPlayerPricePerPc(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Base entrenadores
            </span>
            <input
              type="number"
              min={0}
              value={baseCoachPrice}
              onChange={(e) => setBaseCoachPrice(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Precio × nivel ent.
            </span>
            <input
              type="number"
              min={0}
              value={coachPricePerLevel}
              onChange={(e) => setCoachPricePerLevel(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
            />
          </label>
        </div>

        <p className="text-xs text-slate-500 font-mono">
          Ej. jugador Nv.5 + 3 PC →{" "}
          {basePlayerPrice + 5 * playerPricePerLevel + 3 * playerPricePerPc} PP · entrenador Nv.5 →{" "}
          {baseCoachPrice + 5 * coachPricePerLevel} PP
        </p>

        <button
          onClick={() => void handleSaveGlobal()}
          disabled={saving}
          className="flex w-full sm:w-auto items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-colors"
        >
          <Save size={16} /> Guardar precios y sesión
        </button>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
        <h2 className="text-lg font-black uppercase tracking-wider text-white">
          Precios ciudad deportiva
        </h2>
        <p className="text-sm text-slate-500">
          Coste en YE para mejorar cualquier instalación de un nivel al siguiente. Igual para
          todos los edificios.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Nv.0 → 1 (YE)
            </span>
            <input
              type="number"
              min={0}
              value={facilityUpgradeCostFrom0}
              onChange={(e) => setFacilityUpgradeCostFrom0(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Nv.1 → 2 (YE)
            </span>
            <input
              type="number"
              min={0}
              value={facilityUpgradeCostFrom1}
              onChange={(e) => setFacilityUpgradeCostFrom1(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Nv.2 → 3 (YE)
            </span>
            <input
              type="number"
              min={0}
              value={facilityUpgradeCostFrom2}
              onChange={(e) => setFacilityUpgradeCostFrom2(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
            />
          </label>
        </div>

        <button
          onClick={() => void handleSaveGlobal()}
          disabled={saving}
          className="flex w-full sm:w-auto items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-colors"
        >
          <Save size={16} /> Guardar precios ciudad deportiva
        </button>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
        <h2 className="text-lg font-black uppercase tracking-wider text-white">
          Configuración por sesión
        </h2>
        <p className="text-sm text-slate-500">
          El partido oficial usa min/máx directamente. La pachanga multiplica esos valores
          (ej. ×0,5 sobre 600 → 300 XP mínimo).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Sesión</span>
            <input
              type="number"
              min={1}
              value={sessionForm.session}
              onChange={(e) =>
                setSessionForm((f) => ({ ...f, session: Number(e.target.value) }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              XP mín. partido
            </span>
            <input
              type="number"
              min={0}
              value={sessionForm.minXp}
              onChange={(e) =>
                setSessionForm((f) => ({ ...f, minXp: Number(e.target.value) }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              XP máx. partido
            </span>
            <input
              type="number"
              min={0}
              value={sessionForm.maxXp}
              onChange={(e) =>
                setSessionForm((f) => ({ ...f, maxXp: Number(e.target.value) }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Mult. pachanga
            </span>
            <input
              type="number"
              min={0}
              max={10}
              step={0.05}
              value={sessionForm.pachangaMultiplier}
              onChange={(e) =>
                setSessionForm((f) => ({
                  ...f,
                  pachangaMultiplier: Number(e.target.value),
                }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              PP ganador
            </span>
            <input
              type="number"
              min={0}
              value={sessionForm.winnerRewardPp}
              onChange={(e) =>
                setSessionForm((f) => ({ ...f, winnerRewardPp: Number(e.target.value) }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              YE ganador
            </span>
            <input
              type="number"
              min={0}
              value={sessionForm.winnerRewardYens}
              onChange={(e) =>
                setSessionForm((f) => ({ ...f, winnerRewardYens: Number(e.target.value) }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              XP por YE
            </span>
            <input
              type="number"
              min={0}
              value={sessionForm.coachXpPerYe}
              onChange={(e) =>
                setSessionForm((f) => ({ ...f, coachXpPerYe: Number(e.target.value) }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500"
            />
          </label>
        </div>

        <p className="text-xs text-emerald-400/90 font-bold">
          Vista previa pachanga: {pachangaPreview.minXp} – {pachangaPreview.maxXp} XP
          (×{sessionForm.pachangaMultiplier})
        </p>

        <button
          onClick={() => void handleUpsertSession()}
          disabled={saving}
          className="flex w-full sm:w-auto items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-colors border border-slate-700"
        >
          <Plus size={16} /> Guardar sesión
        </button>

        <div className="overflow-x-auto rounded-xl border border-slate-800 -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left text-sm min-w-[640px]">
            <thead className="bg-slate-950 text-slate-500 uppercase text-xs tracking-widest">
              <tr>
                <th className="p-3 sm:p-4">Sesión</th>
                <th className="p-3 sm:p-4">Oficial min–máx</th>
                <th className="hidden md:table-cell p-3 sm:p-4">Mult. pachanga</th>
                <th className="hidden lg:table-cell p-3 sm:p-4">Pachanga min–máx</th>
                <th className="hidden sm:table-cell p-3 sm:p-4">PP / YE ganador</th>
                <th className="hidden lg:table-cell p-3 sm:p-4">XP por YE</th>
                <th className="p-3 sm:p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(settings?.sessionConfigs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-600">
                    No hay sesiones configuradas. Añade la sesión 1 (ej: 600 / 3500, mult. 0,2).
                  </td>
                </tr>
              ) : (
                settings?.sessionConfigs.map((config) => {
                  const pachanga = computePachangaXpBounds(config);
                  return (
                    <tr
                      key={config.session}
                      className={`border-t border-slate-800 ${
                        config.session === settings?.currentSession
                          ? "bg-violet-950/30"
                          : ""
                      }`}
                    >
                      <td className="p-3 sm:p-4 font-black text-white">
                        Sesión {config.session}
                        {config.session === settings?.currentSession && (
                          <span className="ml-2 text-[10px] text-violet-400 uppercase">
                            Activa
                          </span>
                        )}
                        <div className="mt-1 space-y-0.5 md:hidden text-xs font-normal text-slate-400">
                          <p>Pachanga ×{config.pachangaMultiplier}</p>
                          <p className="sm:hidden">{config.winnerRewardPp} PP · {config.winnerRewardYens} YE</p>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 tabular-nums">
                        {config.minXp} – {config.maxXp}
                      </td>
                      <td className="hidden md:table-cell p-3 sm:p-4 tabular-nums text-cyan-400">
                        ×{config.pachangaMultiplier}
                      </td>
                      <td className="hidden lg:table-cell p-3 sm:p-4 tabular-nums text-emerald-400">
                        {pachanga.minXp} – {pachanga.maxXp}
                      </td>
                      <td className="hidden sm:table-cell p-3 sm:p-4 tabular-nums text-amber-400">
                        {config.winnerRewardPp} PP · {config.winnerRewardYens} YE
                      </td>
                      <td className="hidden lg:table-cell p-3 sm:p-4 tabular-nums text-purple-300">
                        {config.coachXpPerYe}
                      </td>
                      <td className="p-3 sm:p-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleEditSession(config)}
                          className="text-blue-400 hover:text-blue-300 font-bold text-xs uppercase"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => void handleDeleteSession(config.session)}
                          className="text-red-400 hover:text-red-300"
                          aria-label={`Eliminar sesión ${config.session}`}
                        >
                          <Trash2 size={16} className="inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
