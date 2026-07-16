import {
  DEFAULT_WEATHER,
  WEATHER_OPTIONS,
  type WeatherCondition,
} from "@/lib/match-environment";

interface WeatherSelectorProps {
  value: WeatherCondition;
  onChange: (value: WeatherCondition) => void;
}

const ACCENT_BORDER: Record<string, string> = {
  sky: "border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]",
  blue: "border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.2)]",
  cyan: "border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]",
  orange: "border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.25)]",
  amber: "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
  slate: "border-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.2)]",
};

const ACCENT_TEXT: Record<string, string> = {
  sky: "text-sky-400",
  blue: "text-blue-400",
  cyan: "text-cyan-400",
  orange: "text-orange-400",
  amber: "text-amber-400",
  slate: "text-slate-300",
};

export function WeatherSelector({ value, onChange }: WeatherSelectorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-10">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
        Condiciones meteorológicas
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {WEATHER_OPTIONS.map((option) => {
          const isActive = value === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              title={option.description}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 active:scale-95
                ${isActive
                  ? `bg-slate-800 ${ACCENT_BORDER[option.accent]}`
                  : "bg-slate-900/50 border-slate-700 hover:border-slate-500 opacity-75 hover:opacity-100"
                }`}
            >
              <div className={`p-2 rounded-full bg-slate-950 ${isActive ? ACCENT_TEXT[option.accent] : "text-slate-500"}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-black uppercase tracking-wide text-center leading-tight ${isActive ? "text-white" : "text-slate-300"}`}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-center text-[11px] text-slate-500 mt-3 italic">
        Próximamente influirá en los duelos
      </p>
    </div>
  );
}

export { DEFAULT_WEATHER, type WeatherCondition };
