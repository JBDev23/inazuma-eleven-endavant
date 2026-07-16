import type { PlayerWithDetails } from "@inazuma/shared";

interface PlayerRosterCardProps {
  player: PlayerWithDetails;
  variant: "convocado" | "disponible";
  disabled?: boolean;
  onToggle: () => void;
}

export function PlayerRosterCard({ player, variant, disabled, onToggle }: PlayerRosterCardProps) {
  const isConvocado = variant === "convocado";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`w-full p-3 rounded-xl flex items-center justify-between transition-colors text-left group ${
        isConvocado
          ? "bg-emerald-950/40 border border-emerald-500/30 hover:border-red-500/50 hover:bg-red-950/20"
          : "bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 disabled:opacity-40 disabled:cursor-not-allowed"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${
            isConvocado
              ? "bg-slate-900 border-emerald-500/20"
              : "bg-slate-950 border-slate-800 group-hover:border-emerald-500/30"
          }`}
        >
          <img
            src={player.spriteUrl || "/sprites/default.webp"}
            alt={player.name}
            className={`h-9 object-contain ${isConvocado ? "" : "opacity-70 group-hover:opacity-100"}`}
          />
        </div>
        <div className="min-w-0">
          <p
            className={`font-black text-sm uppercase truncate ${
              isConvocado ? "text-white" : "text-slate-300 group-hover:text-white"
            }`}
          >
            {player.name}
          </p>
          <p
            className={`text-[10px] font-mono uppercase font-bold ${
              isConvocado ? "text-slate-500" : "text-slate-600"
            }`}
          >
            {player.position} · Nv.{player.level}
            {isConvocado && (player.position11 || player.position4) && (
              <span className="text-emerald-400 ml-1.5">
                ·{" "}
                {player.position11
                  ? `11v11 #${player.position11}`
                  : `Pachanga #${player.position4}`}
              </span>
            )}
          </p>
        </div>
      </div>
      <span
        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border shrink-0 ml-2 ${
          isConvocado
            ? "bg-red-600/20 text-red-400 border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity"
            : "bg-emerald-600/20 text-emerald-400 border-emerald-500/30"
        }`}
      >
        {isConvocado ? "Quitar" : "Convocar"}
      </span>
    </button>
  );
}
