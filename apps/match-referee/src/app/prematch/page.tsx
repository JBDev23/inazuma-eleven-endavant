"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useMatchStore } from "@/store/useMatchStore";
import { useMatchStoreHydration } from "@/hooks/useMatchStoreHydration";
import { PrematchContent } from "./PrematchContent";

export default function PrematchPage() {
  const router = useRouter();
  const hydrated = useMatchStoreHydration();
  const { homeTeam, awayTeam, matchStatus } = useMatchStore();

  useEffect(() => {
    if (!hydrated) return;

    if (matchStatus === "PLAYING") {
      router.replace("/match");
      return;
    }

    if (!homeTeam || !awayTeam) {
      router.replace("/setup");
    }
  }, [hydrated, homeTeam, awayTeam, matchStatus, router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!homeTeam || !awayTeam || matchStatus === "PLAYING") return null;

  return <PrematchContent homeTeam={homeTeam} awayTeam={awayTeam} />;
}
