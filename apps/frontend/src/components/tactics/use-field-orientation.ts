import { useEffect, useState } from "react";
import type { FieldOrientation } from "@/lib/formation-field";

export function useFieldOrientation(): FieldOrientation {
  const [orientation, setOrientation] = useState<FieldOrientation>("portrait");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setOrientation(mq.matches ? "landscape" : "portrait");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return orientation;
}
