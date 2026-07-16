import type { BraceletData } from "@inazuma/shared";
import { CLUB_RESOURCES, type ClubResourceKey } from "@inazuma/shared";
import { CLUB_RESOURCE_STYLES } from "@/components/economy/club-resource-styles";

interface BraceletSummaryProps {
  bracelet: BraceletData;
  title?: string;
}

const BRACELET_FIELDS: { key: ClubResourceKey; getValue: (b: BraceletData) => number }[] = [
  { key: "pp", getValue: (b) => b.pp },
  { key: "pe", getValue: (b) => b.pe },
  { key: "yens", getValue: (b) => b.ye },
  { key: "pc", getValue: (b) => b.pc },
];

export function BraceletSummary({
  bracelet,
  title = "Última lectura",
}: BraceletSummaryProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">
          {title}
        </p>
        <span
          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            bracelet.active
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40"
              : "bg-slate-800 text-slate-400 border-slate-600"
          }`}
        >
          {bracelet.active ? "Activa" : "Inactiva"}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Equipo
        </span>
        <span className="text-lg font-black text-white tabular-nums">
          {bracelet.team}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {BRACELET_FIELDS.map(({ key, getValue }) => {
          const meta = CLUB_RESOURCES.find((r) => r.key === key)!;
          const style = CLUB_RESOURCE_STYLES[key];
          const amount = getValue(bracelet);

          return (
            <div
              key={key}
              className={`rounded-lg border px-3 py-2.5 ${style.border} ${style.bg}`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {meta.short}
              </p>
              <p className={`text-xl font-black tabular-nums ${style.text}`}>
                {amount.toLocaleString("es-ES")}
              </p>
              <p className="text-[10px] text-slate-500">{meta.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
