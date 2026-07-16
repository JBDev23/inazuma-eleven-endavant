import { useEffect, useState } from "react";
import { useMatchStore } from "@/store/useMatchStore";

export function useMatchStoreHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persist = useMatchStore.persist;
    if (!persist) {
      setHydrated(true);
      return;
    }

    const unsub = persist.onFinishHydration(() => {
      setHydrated(true);
    });

    setHydrated(persist.hasHydrated());

    return unsub;
  }, []);

  return hydrated;
}
