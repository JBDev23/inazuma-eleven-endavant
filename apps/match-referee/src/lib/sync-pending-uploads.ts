import { api } from "@/services/api";
import {
  getPendingUploads,
  isBrowserOnline,
  markMatchXpApplied,
  removePendingUpload,
} from "@/lib/offline-storage";

export interface SyncPendingResult {
  synced: number;
  failed: number;
  remaining: number;
}

export async function syncPendingUploads(): Promise<SyncPendingResult> {
  if (!isBrowserOnline()) {
    const remaining = getPendingUploads().length;
    return { synced: 0, failed: 0, remaining };
  }

  const pending = getPendingUploads();
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      await api.gameSettings.applyMatchXp(item.payload);
      markMatchXpApplied(item.finishedAt);
      removePendingUpload(item.id);
      synced += 1;
    } catch {
      failed += 1;
      break;
    }
  }

  return {
    synced,
    failed,
    remaining: getPendingUploads().length,
  };
}
