import {
  DEFAULT_TIME_OF_DAY,
  TIME_OF_DAY_OPTIONS,
  type TimeOfDay,
} from "@/lib/match-environment";

interface TimeOfDaySelectorProps {
  value: TimeOfDay;
  onChange: (value: TimeOfDay) => void;
}

const ACCENT_STYLES: Record<string, { active: string; glow: string; icon: string; label: string }> = {
  amber: {
    active: "border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]",
    glow: "from-amber-500/10",
    icon: "text-amber-400",
    label: "text-amber-400",
  },
  indigo: {
    active: "border-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.25)]",
    glow: "from-indigo-500/15",
    icon: "text-indigo-400",
    label: "text-indigo-400",
  },
};

export function TimeOfDaySelector({ value, onChange }: TimeOfDaySelectorProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
        Momento del partido
      </h2>
      <div className="flex flex-col sm:flex-row gap-3">
        {TIME_OF_DAY_OPTIONS.map((option) => {
          const isActive = value === option.id;
          const styles = ACCENT_STYLES[option.accent];
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`relative flex-1 flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden active:scale-95
                ${isActive ? `bg-slate-800 ${styles.active}` : "bg-slate-900/50 border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100"}`}
            >
              {isActive && (
                <div className={`absolute inset-0 bg-linear-to-r ${styles.glow} to-transparent z-0`} />
              )}
              <div className="relative z-10 flex flex-col text-left">
                <span className={`text-xs font-bold tracking-widest uppercase mb-0.5 ${isActive ? styles.label : "text-slate-400"}`}>
                  {option.label}
                </span>
                <span className="text-sm text-slate-400 font-medium">{option.description}</span>
              </div>
              <div className="relative z-10 bg-slate-950 p-2.5 rounded-full shadow-inner">
                <Icon className={`w-7 h-7 ${isActive ? styles.icon : "text-slate-500"}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { DEFAULT_TIME_OF_DAY, type TimeOfDay };
