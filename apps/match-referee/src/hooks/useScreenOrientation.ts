"use client";

import { useEffect, useState } from "react";
import type { FieldOrientation } from "@/lib/formation-field";

export function useScreenOrientation(): FieldOrientation {
  const [orientation, setOrientation] = useState<FieldOrientation>("portrait");

  useEffect(() => {
    const update = () => {
      setOrientation(window.innerWidth >= window.innerHeight ? "landscape" : "portrait");
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return orientation;
}
