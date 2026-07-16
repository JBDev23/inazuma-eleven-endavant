import {
  getTimeOfDayOption,
  getWeatherOption,
  type TimeOfDay,
  type WeatherCondition,
} from "@/lib/match-environment";

interface MatchEnvironmentBadgeProps {
  timeOfDay: TimeOfDay;
  weather: WeatherCondition;
  compact?: boolean;
}

export function MatchEnvironmentBadge({
  timeOfDay,
  weather,
  compact = false,
}: MatchEnvironmentBadgeProps) {
  const time = getTimeOfDayOption(timeOfDay);
  const cond = getWeatherOption(weather);
  const TimeIcon = time.icon;
  const WeatherIcon = cond.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <TimeIcon className="w-3.5 h-3.5 text-amber-400/80" />
        <span>{time.shortLabel}</span>
        <span className="text-slate-600">·</span>
        <WeatherIcon className="w-3.5 h-3.5 text-sky-400/80" />
        <span>{cond.shortLabel}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-700 text-[10px] font-bold uppercase tracking-widest text-slate-300">
        <TimeIcon className="w-3.5 h-3.5 text-amber-400" />
        {time.label}
      </span>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-700 text-[10px] font-bold uppercase tracking-widest text-slate-300">
        <WeatherIcon className="w-3.5 h-3.5 text-sky-400" />
        {cond.label}
      </span>
    </div>
  );
}
