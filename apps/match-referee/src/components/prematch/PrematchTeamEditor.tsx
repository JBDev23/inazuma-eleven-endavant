"use client";

import { ChevronDown, LayoutGrid, Loader2, Users } from "lucide-react";
import { ClubShield } from "@/components/ClubShield";
import type { UserClub } from "@inazuma/shared";
import type { MatchFormat } from "@/components/MatchFormatSelector";
import { formatFormationLines } from "@/lib/formation-field";
import { REQUIRED_STARTERS } from "@/lib/roster-utils";
import type { usePrematchTeam } from "@/hooks/usePrematchTeam";
import { PlayerSpriteAvatar } from "@/components/PlayerSpriteAvatar";
import { AssignPlayerModal } from "./AssignPlayerModal";
import { PrematchField } from "./PrematchField";

interface PrematchTeamEditorProps {
  side: "home" | "away";
  club: UserClub;
  matchFormat: MatchFormat;
  team: ReturnType<typeof usePrematchTeam>;
}

function BenchPlayer({ name, spriteUrl }: { name: string; spriteUrl: string | null }) {
  return (
    <div className="flex flex-col items-center shrink-0">
      <PlayerSpriteAvatar
        spriteUrl={spriteUrl}
        alt={name}
        shape="square"
        className="w-10 h-10 md:w-11 md:h-11 border border-slate-700 shadow-md"
        imgClassName="opacity-90"
      />
      <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-300 bg-slate-950/80 px-1 py-0.5 rounded mt-1 border border-slate-800 max-w-[52px] truncate">
        {name.split(" ")[0]}
      </span>
    </div>
  );
}

export function PrematchTeamEditor({ side, club, matchFormat, team }: PrematchTeamEditorProps) {
  const isHome = side === "home";
  const required = REQUIRED_STARTERS[matchFormat];

  const selectedSlotConfig =
    team.selectedSlot !== null ? team.slotsConfig[team.selectedSlot] : null;

  return (
    <div className="flex flex-col items-center w-full max-w-md gap-4">
      <div
        className={`flex items-center gap-4 bg-slate-900/80 px-6 py-3 rounded-2xl border-2 w-full justify-center shadow-lg ${
          isHome ? "border-blue-900/50 shadow-blue-900/30" : "border-red-900/50 shadow-red-900/30"
        }`}
      >
        <ClubShield
          shieldUrl={club.shieldUrl}
          alt={club.name}
          className="w-8 h-8 object-contain shrink-0"
        />
        <div className="min-w-0 text-center">
          <h2
            className={`text-2xl font-black uppercase tracking-wider truncate ${
              isHome ? "text-blue-100" : "text-red-100"
            }`}
          >
            {club.name}
          </h2>
          <p
            className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
              team.starterCount === required ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {team.starterCount}/{required} titulares
            {team.hasChanges && " · sin guardar"}
          </p>
        </div>
      </div>

      <div className="w-full">
        <label className="flex text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 items-center gap-1.5">
          <LayoutGrid size={12} />
          Formación
          {team.usingFallback && (
            <span className="text-amber-500/80 normal-case tracking-normal font-bold">
              · por defecto
            </span>
          )}
        </label>
        {team.loadingFormations ? (
          <div className="flex items-center justify-center gap-2 py-3 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando formaciones...
          </div>
        ) : team.availableFormations.length > 0 ? (
          <div className="relative">
            <select
              value={team.activeFormation.id || ""}
              disabled={team.saving}
              onChange={(e) => team.handleFormationChange(Number(e.target.value))}
              className="w-full appearance-none bg-slate-900 border border-slate-700 text-white font-bold text-sm rounded-xl py-2.5 pl-4 pr-10 focus:outline-none focus:border-amber-500 disabled:opacity-50"
            >
              {team.availableFormations.map((formation) => (
                <option key={formation.id} value={formation.id}>
                  {formation.name} ({formatFormationLines(formation.positions, team.playerCount)})
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-300">
            {team.activeFormation.name} (
            {formatFormationLines(team.activeFormation.positions, team.playerCount)})
          </div>
        )}
      </div>

      <PrematchField
        activeFormation={team.activeFormation}
        playerCount={team.playerCount}
        slotsConfig={team.slotsConfig}
        getPlayerInSlot={team.getPlayerInSlot}
        onSelectSlot={team.setSelectedSlot}
        onRemoveFromSlot={team.handleRemoveFromSlot}
      />

      {matchFormat === "11v11" && team.bench.length > 0 && (
        <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl px-3 py-3 shadow-inner">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Users size={12} />
              Banquillo (convocatoria fija)
            </p>
            <span className="text-[10px] font-mono font-bold text-slate-600">{team.bench.length}</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {team.bench.map((player) => (
              <BenchPlayer key={player.id} name={player.name} spriteUrl={player.spriteUrl} />
            ))}
          </div>
        </div>
      )}

      {team.selectedSlot !== null && selectedSlotConfig && (
        <AssignPlayerModal
          slot={team.selectedSlot}
          role={selectedSlotConfig.role}
          players={team.availablePlayers}
          onAssign={team.handleAssignPlayer}
          onClose={() => team.setSelectedSlot(null)}
        />
      )}
    </div>
  );
}
