"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Save,
  Shield,
} from "lucide-react";
import type { UserClub } from "@inazuma/shared";
import { useMatchStore } from "@/store/useMatchStore";
import { PrematchTeamEditor } from "@/components/prematch/PrematchTeamEditor";
import { usePrematchTeam } from "@/hooks/usePrematchTeam";
import { getRosterValidationIssues } from "@/lib/roster-validation";
import { MatchEnvironmentBadge } from "@/components/MatchEnvironmentBadge";
import { api } from "@/services/api";
import {
  fetchAndCacheGameSettings,
  getCachedGameSettings,
} from "@/lib/offline-storage";

interface PrematchContentProps {
  homeTeam: UserClub;
  awayTeam: UserClub;
}

export function PrematchContent({ homeTeam, awayTeam }: PrematchContentProps) {
  const router = useRouter();
  const { matchFormat, timeOfDay, weather, updateTeam, startMatch } = useMatchStore();

  const [refreshing, setRefreshing] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [starting, setStarting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const homeEditor = usePrematchTeam({ club: homeTeam, matchFormat });
  const awayEditor = usePrematchTeam({ club: awayTeam, matchFormat });

  const validationIssues = useMemo(
    () => [
      ...getRosterValidationIssues(homeEditor.roster, matchFormat, homeTeam.name),
      ...getRosterValidationIssues(awayEditor.roster, matchFormat, awayTeam.name),
    ],
    [homeEditor.roster, awayEditor.roster, matchFormat, homeTeam.name, awayTeam.name],
  );

  const hasUnsavedChanges = homeEditor.hasChanges || awayEditor.hasChanges;
  const isBusy = savingAll || starting || refreshing || homeEditor.saving || awayEditor.saving;
  const canStart = validationIssues.length === 0 && !isBusy;

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "Hay cambios sin guardar en las alineaciones. ¿Volver a configuración?",
      );
      if (!confirmed) return;
    }
    router.push("/setup");
  };

  const handleRefresh = useCallback(async () => {
    if (isBusy) return;

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "Se perderán los cambios locales sin guardar. ¿Refrescar datos desde el servidor?",
      );
      if (!confirmed) return;
    }

    setRefreshing(true);
    setActionError(null);

    try {
      const [freshHome, freshAway] = await Promise.all([
        api.clubs.getById(homeTeam.id),
        api.clubs.getById(awayTeam.id),
      ]);
      updateTeam("home", freshHome);
      updateTeam("away", freshAway);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "No se pudieron refrescar los datos.",
      );
    } finally {
      setRefreshing(false);
    }
  }, [homeTeam.id, awayTeam.id, hasUnsavedChanges, isBusy, updateTeam]);

  const handleSaveAll = async () => {
    if (!hasUnsavedChanges || isBusy) return;

    setSavingAll(true);
    setActionError(null);

    try {
      if (homeEditor.hasChanges) {
        updateTeam("home", await homeEditor.save());
      }
      if (awayEditor.hasChanges) {
        updateTeam("away", await awayEditor.save());
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al guardar los cambios.");
    } finally {
      setSavingAll(false);
    }
  };

  const handleStartMatch = async () => {
    if (!canStart) return;

    setStarting(true);
    setActionError(null);

    try {
      if (homeEditor.hasChanges) {
        updateTeam("home", await homeEditor.save());
      }
      if (awayEditor.hasChanges) {
        updateTeam("away", await awayEditor.save());
      }

      if (!getCachedGameSettings()) {
        await fetchAndCacheGameSettings(() => api.gameSettings.get());
      }

      startMatch();
      router.push("/match");
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar el partido. Comprueba la conexión.",
      );
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col items-center py-8 px-4 md:px-8">
      <div className="fixed inset-0 -z-10 bg-slate-950">
        <Image
          src="/setup_back.webp"
          fill
          alt="background"
          priority
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/80 via-transparent to-slate-950/80" />
      </div>

      <div className="w-full max-w-7xl flex flex-wrap items-center justify-between gap-3 mb-6 z-10">
        <button
          type="button"
          onClick={handleBack}
          disabled={isBusy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-bold uppercase tracking-wider">Volver</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isBusy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            <span className="text-sm font-bold uppercase tracking-wider">Refrescar</span>
          </button>

          <button
            type="button"
            onClick={() => void handleSaveAll()}
            disabled={!hasUnsavedChanges || isBusy}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              hasUnsavedChanges
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30"
                : "bg-slate-900/80 border-slate-700 text-slate-600"
            }`}
          >
            {savingAll ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            <span className="text-sm font-bold uppercase tracking-wider">Guardar</span>
          </button>
        </div>
      </div>

      <div className="text-center mb-6 z-10 w-full">
        <h1 className="text-3xl md:text-5xl font-black text-amber-300 uppercase tracking-widest drop-shadow-lg mb-2">
          Verificación
        </h1>
        <p className="text-slate-300 font-mono uppercase text-sm tracking-widest bg-black/40 inline-block px-4 py-1 rounded-full border border-white/10">
          Formato: {matchFormat === "11v11" ? "Oficial (11vs11)" : "Pachanga (4vs4)"}
        </p>
        <div className="mt-3">
          <MatchEnvironmentBadge timeOfDay={timeOfDay} weather={weather} />
        </div>
        <p className="text-slate-500 text-xs mt-2 uppercase tracking-wider">
          Puedes ajustar formación y once inicial · La convocatoria no se modifica aquí
        </p>
      </div>

      {(actionError || validationIssues.length > 0) && (
        <div className="w-full max-w-3xl mb-6 z-10 space-y-2">
          {actionError && (
            <div className="bg-red-950/60 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{actionError}</p>
            </div>
          )}
          {validationIssues.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-500/40 text-amber-200 px-4 py-3 rounded-xl">
              <p className="text-xs font-black uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-2">
                <AlertCircle size={14} />
                Pendiente antes del pitido
              </p>
              <ul className="space-y-1">
                {validationIssues.map((issue) => (
                  <li key={issue} className="text-sm">
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col xl:flex-row w-full max-w-7xl gap-8 xl:gap-16 items-start justify-center flex-1 z-10">
        <PrematchTeamEditor
          side="home"
          club={homeTeam}
          matchFormat={matchFormat}
          team={homeEditor}
        />

        <div className="hidden xl:flex items-center justify-center shrink-0 self-center">
          <div className="bg-slate-950 p-6 rounded-full border-4 border-slate-800 shadow-2xl flex flex-col items-center justify-center w-32 h-32">
            <span className="text-5xl font-black italic text-amber-500 tracking-tighter -ml-2">
              VS
            </span>
          </div>
        </div>

        <PrematchTeamEditor
          side="away"
          club={awayTeam}
          matchFormat={matchFormat}
          team={awayEditor}
        />
      </div>

      <div className="w-full max-w-xl mt-12 mb-8 z-10">
        <button
          type="button"
          onClick={() => void handleStartMatch()}
          disabled={!canStart}
          className={`relative group w-full py-6 rounded-3xl font-black text-3xl uppercase tracking-widest transition-all duration-300 overflow-hidden border-b-4 ${
            canStart
              ? "bg-linear-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_rgba(16,185,129,0.8)] hover:scale-105 active:scale-95 border-emerald-800"
              : "bg-slate-800 text-slate-600 cursor-not-allowed border-slate-900"
          }`}
        >
          {canStart && (
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          )}
          <span className="relative z-10 flex items-center justify-center gap-4 drop-shadow-md">
            {starting ? (
              <>
                <Loader2 className="animate-spin w-8 h-8" />
                Guardando...
              </>
            ) : (
              <>
                <Shield className="w-8 h-8" />
                ¡Pitar el Inicio!
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
