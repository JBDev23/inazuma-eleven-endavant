"use client";

import { useEffect, useState } from "react";

const getCurrentStatus = () => {
  if (typeof navigator === "undefined" || !("onLine" in navigator)) {
    return true;
  }

  return navigator.onLine;
};

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(getCurrentStatus);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
