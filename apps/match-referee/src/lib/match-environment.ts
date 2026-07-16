import type { LucideIcon } from "lucide-react";
import {
  DEFAULT_WEATHER,
  type WeatherCondition,
} from "@inazuma/shared";
import {
  CloudFog,
  CloudRain,
  CloudSnow,
  Flame,
  Moon,
  Sun,
  Wind,
  Droplets,
} from "lucide-react";

export type TimeOfDay = "day" | "night";

export { DEFAULT_WEATHER, type WeatherCondition };

export const DEFAULT_TIME_OF_DAY: TimeOfDay = "day";

export type EnvironmentOption<T extends string> = {
  id: T;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

export const TIME_OF_DAY_OPTIONS: EnvironmentOption<TimeOfDay>[] = [
  {
    id: "day",
    label: "Día",
    shortLabel: "Día",
    description: "Luz natural, césped en plena forma",
    icon: Sun,
    accent: "amber",
  },
  {
    id: "night",
    label: "Noche",
    shortLabel: "Noche",
    description: "Focos del estadio iluminan el campo",
    icon: Moon,
    accent: "indigo",
  },
];

export const WEATHER_OPTIONS: EnvironmentOption<WeatherCondition>[] = [
  {
    id: "clear",
    label: "Despejado",
    shortLabel: "Despejado",
    description: "Sin condiciones adversas",
    icon: Sun,
    accent: "sky",
  },
  {
    id: "rain",
    label: "Lluvia",
    shortLabel: "Lluvia",
    description: "Supertécnicas Bosque +10%. Segada con doble riesgo de falta",
    icon: CloudRain,
    accent: "blue",
  },
  {
    id: "strong_wind",
    label: "Viento fuerte",
    shortLabel: "Viento",
    description: "Supertécnicas Aire +10%. Vaselinas y tiros aéreos -15% poder",
    icon: Wind,
    accent: "cyan",
  },
  {
    id: "heat_wave",
    label: "Ola de calor",
    shortLabel: "Calor",
    description: "Supertécnicas Fuego +10%. Doble gasto de PE por turno en campo",
    icon: Flame,
    accent: "orange",
  },
  {
    id: "muddy",
    label: "Campo embarrado",
    shortLabel: "Barro",
    description: "Supertécnicas Montaña +10%. -10% Rapidez y Físico a todos",
    icon: Droplets,
    accent: "amber",
  },
  {
    id: "dense_fog",
    label: "Niebla densa",
    shortLabel: "Niebla",
    description: "Defensas (Bloqueo/Segada) -10% poder por visibilidad",
    icon: CloudFog,
    accent: "slate",
  },
  {
    id: "snow",
    label: "Nieve",
    shortLabel: "Nieve",
    description: "Defensas +10% poder. Supertécnicas de Tiro cuestan +5 PT",
    icon: CloudSnow,
    accent: "sky",
  },
];

export function getTimeOfDayOption(id: TimeOfDay) {
  return TIME_OF_DAY_OPTIONS.find((o) => o.id === id) ?? TIME_OF_DAY_OPTIONS[0];
}

export function getWeatherOption(id: WeatherCondition) {
  return WEATHER_OPTIONS.find((o) => o.id === id) ?? WEATHER_OPTIONS[0];
}

export type PitchEnvironmentVisuals = {
  pitchClass: string;
  pitchGradient: string;
  overlayClass?: string;
  effect: "none" | "rain" | "wind" | "heat" | "fog" | "snow";
};

export function getPitchEnvironmentVisuals(
  timeOfDay: TimeOfDay,
  weather: WeatherCondition,
): PitchEnvironmentVisuals {
  const isNight = timeOfDay === "night";

  let pitchClass = isNight
    ? "bg-emerald-950 border-indigo-500/30"
    : "bg-emerald-900 border-emerald-500/40";

  let pitchGradient = isNight
    ? "bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12)_0%,transparent_70%)]"
    : "bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15)_0%,transparent_100%)]";

  let overlayClass: string | undefined;
  let effect: PitchEnvironmentVisuals["effect"] = "none";

  switch (weather) {
    case "rain":
      pitchClass = isNight ? "bg-emerald-950 border-blue-600/40" : "bg-emerald-800 border-blue-500/40";
      overlayClass = "bg-blue-900/20";
      effect = "rain";
      break;
    case "strong_wind":
      overlayClass = "bg-cyan-900/10";
      effect = "wind";
      break;
    case "heat_wave":
      pitchClass = isNight ? "bg-amber-950 border-orange-600/40" : "bg-amber-900/80 border-orange-500/40";
      pitchGradient = "bg-[radial-gradient(ellipse_at_center,rgba(251,146,60,0.2)_0%,transparent_80%)]";
      overlayClass = "bg-orange-500/10";
      effect = "heat";
      break;
    case "muddy":
      pitchClass = isNight ? "bg-amber-950 border-amber-800/50" : "bg-amber-900/70 border-amber-700/50";
      pitchGradient = "bg-[radial-gradient(ellipse_at_center,rgba(180,83,9,0.15)_0%,transparent_80%)]";
      overlayClass = "bg-amber-950/20";
      break;
    case "dense_fog":
      pitchClass = isNight ? "bg-slate-800 border-slate-500/40" : "bg-emerald-800/80 border-slate-400/40";
      overlayClass = "bg-slate-300/25 backdrop-blur-[1px]";
      effect = "fog";
      break;
    case "snow":
      pitchClass = isNight ? "bg-slate-800 border-sky-400/40" : "bg-slate-200 border-sky-300/60";
      pitchGradient = "bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.3)_0%,transparent_80%)]";
      overlayClass = "bg-white/15";
      effect = "snow";
      break;
    default:
      break;
  }

  return { pitchClass, pitchGradient, overlayClass, effect };
}
