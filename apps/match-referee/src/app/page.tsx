"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { CloudOff, Loader2, RefreshCw, Wifi } from "lucide-react";
import { useMatchStore } from "@/store/useMatchStore";
import { useMatchStoreHydration } from "@/hooks/useMatchStoreHydration";
import { usePendingUploads } from "@/hooks/usePendingUploads";
import {
  hasPendingUpload,
  isMatchXpApplied,
} from "@/lib/offline-storage";

const MENU_VIDEO = "/Background.webm";

function PendingUploadBanner({
  pendingCount,
  isOnline,
  isSyncing,
  lastSyncMessage,
  onSync,
  compact = false,
}: {
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncMessage: string | null;
  onSync: () => void;
  compact?: boolean;
}) {
  if (pendingCount <= 0) return null;

  return (
    <div
      className={`w-full rounded-xl border-2 border-amber-500/50 bg-amber-950/80 backdrop-blur-sm text-amber-100 ${
        compact ? "px-4 py-3 mb-4" : "px-6 py-4 mb-5"
      }`}
    >
      <div className="flex items-start gap-3">
        <CloudOff className={`shrink-0 text-amber-400 ${compact ? "w-5 h-5 mt-0.5" : "w-6 h-6"}`} />
        <div className="flex-1 min-w-0">
          <p className={`font-black uppercase tracking-widest text-amber-200 ${compact ? "text-xs" : "text-sm"}`}>
            {pendingCount === 1
              ? "1 resultado sin guardar"
              : `${pendingCount} resultados sin guardar`}
          </p>
          <p className={`text-amber-200/70 mt-1 ${compact ? "text-xs" : "text-sm"}`}>
            {isOnline
              ? "Los datos del partido están en el dispositivo y pendientes de subir."
              : "Se subirán automáticamente cuando vuelva la conexión."}
          </p>
          {lastSyncMessage && (
            <p className="text-xs text-emerald-300 mt-1">{lastSyncMessage}</p>
          )}
        </div>
      </div>
      {isOnline && (
        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className={`mt-3 w-full flex items-center justify-center gap-2 rounded-lg font-black uppercase tracking-widest bg-amber-500/20 border border-amber-500/40 text-amber-200 hover:bg-amber-500/30 disabled:opacity-50 transition-colors ${
            compact ? "py-2 text-xs" : "py-2.5 text-sm"
          }`}
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isSyncing ? "Sincronizando..." : "Sincronizar ahora"}
        </button>
      )}
      {!isOnline && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-300/80 uppercase tracking-wider font-bold">
          <Wifi className="w-3.5 h-3.5" />
          Sin conexión
        </p>
      )}
    </div>
  );
}

export default function RefereeDashboard() {
  const hydrated = useMatchStoreHydration();
  const matchStatus = useMatchStore((state) => state.matchStatus);
  const matchStats = useMatchStore((state) => state.matchStats);
  const {
    pendingCount,
    isOnline,
    isSyncing,
    lastSyncMessage,
    syncNow,
  } = usePendingUploads();

  const hasActiveMatch = hydrated && matchStatus === "PLAYING";
  const hasFinishedMatch = hydrated && matchStatus === "FINISHED";
  const finishedAt = matchStats.finishedAt;
  const currentMatchNeedsUpload =
    hasFinishedMatch &&
    finishedAt != null &&
    !isMatchXpApplied(finishedAt);
  const showUnsavedBanner = pendingCount > 0 || currentMatchNeedsUpload;
  const displayCount = useMemo(() => {
    let count = pendingCount;
    if (currentMatchNeedsUpload && finishedAt && !hasPendingUpload(finishedAt)) {
      count += 1;
    }
    return count;
  }, [pendingCount, currentMatchNeedsUpload, finishedAt]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden text-white bg-slate-950">
      <video
        src={MENU_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover z-0"
      />

      <div className="relative z-10 flex flex-col items-center justify-between py-10 w-full h-full min-h-screen px-6 md:hidden">
        <div className="flex flex-col items-center gap-8 w-full ">
          <div className="relative w-full max-w-4xl h-[30vh] shrink-0 mt-5">
            <Image
              src="/logo.png"
              alt="logo"
              fill
              className="object-contain z-50 drop-shadow-2xl"
            />
          </div>
        </div>

        <div className="flex flex-col items-center mb-10 gap-4 w-full max-w-sm">
          {showUnsavedBanner && (
            <PendingUploadBanner
              pendingCount={displayCount}
              isOnline={isOnline}
              isSyncing={isSyncing}
              lastSyncMessage={lastSyncMessage}
              onSync={() => void syncNow()}
              compact
            />
          )}
          {hasFinishedMatch && (
            <Link
              href="/postmatch"
              className="bg-amber-700/90 backdrop-blur-sm hover:bg-amber-600 border-4 border-amber-300 hover:text-amber-100 text-white font-bold py-4 px-6 rounded-xl text-xl w-full uppercase tracking-widest active:scale-95 transition-transform"
            >
              <span className="relative z-10 flex items-center justify-center gap-3 drop-shadow-md">
                Ver resultado
              </span>
            </Link>
          )}
          {hasActiveMatch && (
            <Link
              href="/match"
              className="bg-emerald-700/90 backdrop-blur-sm hover:bg-emerald-600 border-4 border-emerald-300 hover:text-emerald-100 text-white font-bold py-4 px-6 rounded-xl text-xl w-full uppercase tracking-widest active:scale-95 transition-transform"
            >
              <span className="relative z-10 flex items-center justify-center gap-3 drop-shadow-md">
                Continuar partido
              </span>
            </Link>
          )}
          <Link
            href="/setup"
            className="bg-slate-800/90 backdrop-blur-sm hover:bg-slate-700 border-4 border-amber-300 hover:text-amber-300 text-white font-bold py-4 px-6 rounded-xl text-xl w-full uppercase tracking-widest active:scale-95 transition-transform"
          >
            <span className="relative z-10 flex items-center justify-center gap-3 drop-shadow-md">
              ¡¡Juguemos Al Fútbol!!
            </span>
          </Link>
        </div>
      </div>

      <div className="relative z-10 hidden md:flex flex-col items-center justify-between w-full h-full min-h-screen pt-12 pb-24">
        <div className="relative w-full max-w-4xl h-[50vh] shrink-0 mt-5">
          <Image
            src="/logo.png"
            alt="logo"
            fill
            className="object-contain z-50 drop-shadow-2xl"
          />
        </div>

        <div className="flex flex-col items-center justify-center w-full max-w-2xl mt-auto">
          <div className="flex flex-col gap-5 w-full px-4">
            {showUnsavedBanner && (
              <PendingUploadBanner
                pendingCount={displayCount}
                isOnline={isOnline}
                isSyncing={isSyncing}
                lastSyncMessage={lastSyncMessage}
                onSync={() => void syncNow()}
              />
            )}
            {hasFinishedMatch && (
              <Link
                href="/postmatch"
                className="bg-amber-700/90 backdrop-blur-sm hover:bg-amber-600 border-4 text-3xl hover:text-amber-100 text-white border-amber-300 font-black py-6 px-8 rounded-2xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)]"
              >
                <span className="relative z-10 flex items-center justify-center gap-3 drop-shadow-md">
                  Ver resultado
                </span>
              </Link>
            )}
            {hasActiveMatch && (
              <Link
                href="/match"
                className="bg-emerald-700/90 backdrop-blur-sm hover:bg-emerald-600 border-4 text-3xl hover:text-emerald-100 text-white border-emerald-300 font-black py-6 px-8 rounded-2xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)]"
              >
                <span className="relative z-10 flex items-center justify-center gap-3 drop-shadow-md">
                  Continuar partido
                </span>
              </Link>
            )}
            <Link
              href="/setup"
              className="bg-slate-800/90 backdrop-blur-sm hover:bg-slate-700 border-4 text-4xl hover:text-amber-300 text-white border-amber-300 font-black py-6 px-8 rounded-2xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest shadow-[0_0_30px_rgba(253,230,138,0.1)] hover:shadow-[0_0_50px_rgba(253,230,138,0.4)]"
            >
              <span className="relative z-10 flex items-center justify-center gap-3 drop-shadow-md">
                ¡¡Juguemos Al Fútbol!!
              </span>
            </Link>
          </div>

          <div className="absolute bottom-8 animate-pulse text-slate-300 font-mono text-sm uppercase tracking-widest drop-shadow-md">
            Juniors Endavant &copy; 2026
          </div>
        </div>
      </div>
    </div>
  );
}
