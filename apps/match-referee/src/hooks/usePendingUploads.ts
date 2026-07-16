import { useCallback, useEffect, useState } from "react";
import {
  getPendingUploadCount,
  getPendingUploads,
  isBrowserOnline,
  subscribePendingUploads,
  type PendingMatchUpload,
} from "@/lib/offline-storage";
import { syncPendingUploads } from "@/lib/sync-pending-uploads";

export function usePendingUploads() {
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingUploads, setPendingUploads] = useState<PendingMatchUpload[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setPendingCount(getPendingUploadCount());
    setPendingUploads(getPendingUploads());
    setIsOnline(isBrowserOnline());
  }, []);

  const syncNow = useCallback(async () => {
    if (!isBrowserOnline()) {
      setLastSyncMessage("Sin conexión a internet");
      return { synced: 0, failed: 0, remaining: getPendingUploadCount() };
    }

    setIsSyncing(true);
    setLastSyncMessage(null);

    try {
      const result = await syncPendingUploads();
      refresh();

      if (result.synced > 0) {
        setLastSyncMessage(
          result.synced === 1
            ? "1 partido sincronizado"
            : `${result.synced} partidos sincronizados`,
        );
      } else if (result.remaining > 0 && result.failed > 0) {
        setLastSyncMessage("No se pudo sincronizar. Inténtalo más tarde.");
      }

      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    return subscribePendingUploads(refresh);
  }, [refresh]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(isBrowserOnline());

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    pendingCount,
    pendingUploads,
    isOnline,
    isSyncing,
    lastSyncMessage,
    syncNow,
    refresh,
  };
}
