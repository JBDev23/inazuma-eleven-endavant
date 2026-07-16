"use client";

import { useEffect } from "react";
import { getPendingUploadCount, isBrowserOnline } from "@/lib/offline-storage";
import { syncPendingUploads } from "@/lib/sync-pending-uploads";

export function PendingUploadProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const trySync = () => {
      if (isBrowserOnline() && getPendingUploadCount() > 0) {
        void syncPendingUploads();
      }
    };

    trySync();
    window.addEventListener("online", trySync);
    return () => window.removeEventListener("online", trySync);
  }, []);

  return children;
}
