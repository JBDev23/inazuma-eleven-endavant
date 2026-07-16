"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Save, Trash2, TrendingUp } from "lucide-react";
import { api } from "@/services/api";
import { computePachangaXpBounds, type GameSettings, type SessionXpConfig } from "@inazuma/shared";

const emptySessionForm = (): SessionXpConfig => ({
  session: 1,
  minXp: 600,
  maxXp: 3500,
  pachangaMultiplier: 0.2,
  winnerRewardPp: 0,
  winnerRewardYens: 0,
});

export default function GameSettingsTab() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState(1);
  const [sessionForm, setSessionForm] = useState<SessionXpConfig>(emptySessionForm);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await api.gameSettings.get();
      setSettings(data);
      setCurrentSession(data.currentSession);
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
    try {
      const data = await api.gameSettings.update({ currentSession });
      setSettings(data);
      alert("Sesión activa guardada");
    } catch (error) {
      alert((error as Error).message || "Error al guardar");
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
    try {
      const data = await api.gameSettings.upsertSession(sessionForm);
      setSettings(data);
      setSessionForm(emptySessionForm());
      alert(`Sesión ${sessionForm.session} guardada`);
    } catch (error) {
      alert((error as Error).message || "Error al guardar sesión");
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
      alert((error as Error).message || "Error al eliminar");
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
      <div className="flex justify-end">
        <button
          onClick={() => void loadData()}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl font-bold transition-colors border border-slate-700"
        >
          <RefreshCw size={16} /> Recargar
        </button>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
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
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-colors"
        >
          <Save size={16} /> Guardar sesión activa
        </button>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <h2 className="text-lg font-black uppercase tracking-wider text-white">
          Configuración por sesión
        </h2>
        <p className="text-sm text-slate-500">
          El partido oficial usa min/máx directamente. La pachanga multiplica esos valores
          (ej. ×0,5 sobre 600 → 300 XP mínimo).
        </p>

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
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
        </div>

        <p className="text-xs text-emerald-400/90 font-bold">
          Vista previa pachanga: {pachangaPreview.minXp} – {pachangaPreview.maxXp} XP
          (×{sessionForm.pachangaMultiplier})
        </p>

        <button
          onClick={() => void handleUpsertSession()}
          disabled={saving}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-colors border border-slate-700"
        >
          <Plus size={16} /> Guardar sesión
        </button>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm min-w-[720px]">
            <thead className="bg-slate-950 text-slate-500 uppercase text-xs tracking-widest">
              <tr>
                <th className="p-4">Sesión</th>
                <th className="p-4">Oficial min–máx</th>
                <th className="p-4">Mult. pachanga</th>
                <th className="p-4">Pachanga min–máx</th>
                <th className="p-4">PP / YE ganador</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(settings?.sessionConfigs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-600">
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
                      <td className="p-4 font-black text-white">
                        Sesión {config.session}
                        {config.session === settings?.currentSession && (
                          <span className="ml-2 text-[10px] text-violet-400 uppercase">
                            Activa
                          </span>
                        )}
                      </td>
                      <td className="p-4 tabular-nums">
                        {config.minXp} – {config.maxXp}
                      </td>
                      <td className="p-4 tabular-nums text-cyan-400">
                        ×{config.pachangaMultiplier}
                      </td>
                      <td className="p-4 tabular-nums text-emerald-400">
                        {pachanga.minXp} – {pachanga.maxXp}
                      </td>
                      <td className="p-4 tabular-nums text-amber-400">
                        {config.winnerRewardPp} PP · {config.winnerRewardYens} YE
                      </td>
                      <td className="p-4 text-right space-x-2">
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
