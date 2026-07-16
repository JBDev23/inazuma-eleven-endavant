"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import {
  getAvailableMatchAbilities,
  isOfficialMatch,
  MATCH_FACILITY_ABILITY_LABELS,
  type MatchFacilityAbilityId,
} from "@inazuma/shared";
import { useMatchStore } from "@/store/useMatchStore";
import { getTeamFacilities } from "@/lib/match-facility";

const ABILITY_HINTS: Partial<Record<MatchFacilityAbilityId, string>> = {
  REPEAT_COIN_TOSS:
    "Registra que has usado la chapa repetida en la mesa real. No altera el partido digital.",
};

export function MatchFacilityAbilitiesPanel() {
  const [open, setOpen] = useState(false);
  const matchStatus = useMatchStore((state) => state.matchStatus);
  const matchFormat = useMatchStore((state) => state.matchFormat);
  const homeTeam = useMatchStore((state) => state.homeTeam);
  const awayTeam = useMatchStore((state) => state.awayTeam);
  const matchFacilityState = useMatchStore((state) => state.matchFacilityState);
  const useMatchFacilityAbility = useMatchStore((state) => state.useMatchFacilityAbility);

  if (matchStatus !== "PLAYING" || !isOfficialMatch(matchFormat) || !homeTeam || !awayTeam) {
    return null;
  }

  const entries = (["home", "away"] as const).flatMap((side) => {
    const team = side === "home" ? homeTeam : awayTeam;
    const facilities = getTeamFacilities(team);
    const abilities = getAvailableMatchAbilities(
      side,
      facilities,
      matchFacilityState.usedAbilities,
      "any",
    ).filter((id) => id === "REPEAT_COIN_TOSS");

    return abilities.map((abilityId) => ({
      side,
      teamName: team.name,
      abilityId,
    }));
  });

  if (entries.length === 0) return null;

  const handleUse = (side: "home" | "away", abilityId: MatchFacilityAbilityId) => {
    const result = useMatchFacilityAbility(side, abilityId);
    if (!result.success) {
      window.alert(result.error);
      return;
    }
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-950/90 border border-purple-500/50 text-purple-200 text-xs font-black uppercase tracking-widest shadow-lg hover:bg-purple-900/90 transition-colors"
      >
        <Sparkles size={16} />
        Mejoras
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-900 border-2 border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-purple-950/40">
                <h2 className="text-sm font-black uppercase tracking-widest text-purple-200">
                  Mejoras del club
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Algunas mejoras se usan en la mesa real. Aquí solo registras el consumo para
                  llevar el control del partido.
                </p>

                {entries.map(({ side, teamName, abilityId }) => (
                  <button
                    key={`${side}-${abilityId}`}
                    type="button"
                    onClick={() => handleUse(side, abilityId)}
                    className="w-full text-left rounded-xl border border-purple-500/30 bg-purple-950/30 px-4 py-3 hover:border-purple-400 transition-colors"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-300 mb-1">
                      {teamName}
                    </p>
                    <p className="text-sm font-bold text-white">
                      {MATCH_FACILITY_ABILITY_LABELS[abilityId]}
                    </p>
                    {ABILITY_HINTS[abilityId] && (
                      <p className="text-[11px] text-slate-400 mt-1">{ABILITY_HINTS[abilityId]}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
