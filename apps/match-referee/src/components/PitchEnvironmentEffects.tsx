import type { PitchEnvironmentVisuals } from "@/lib/match-environment";

export function PitchEnvironmentEffects({ effect }: { effect: PitchEnvironmentVisuals["effect"] }) {
  if (effect === "none") return null;

  if (effect === "rain") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 opacity-60" aria-hidden>
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-px h-6 bg-linear-to-b from-transparent via-sky-300/80 to-transparent animate-pulse"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
              animationDelay: `${(i % 8) * 0.15}s`,
              transform: `rotate(12deg) translateY(${(i % 3) * 4}px)`,
            }}
          />
        ))}
      </div>
    );
  }

  if (effect === "wind") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-px bg-linear-to-r from-transparent via-cyan-300/40 to-transparent animate-wind-drift"
            style={{
              top: `${15 + i * 14}%`,
              left: "-20%",
              width: "40%",
              animationDuration: `${2.5 + i * 0.3}s`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (effect === "heat") {
    return (
      <div
        className="absolute inset-0 pointer-events-none z-20 bg-linear-to-t from-orange-500/10 via-transparent to-amber-400/5 animate-pulse"
        aria-hidden
      />
    );
  }

  if (effect === "fog") {
    return (
      <div className="absolute inset-0 pointer-events-none z-20" aria-hidden>
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-slate-200/30 via-slate-100/10 to-transparent" />
        <div className="absolute inset-0 bg-slate-100/5 animate-pulse" />
      </div>
    );
  }

  if (effect === "snow") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20" aria-hidden>
        {Array.from({ length: 25 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/70 animate-snow-fall"
            style={{
              left: `${(i * 19) % 100}%`,
              top: `${(i * 13) % 100}%`,
              animationDuration: `${3 + (i % 4)}s`,
              animationDelay: `${(i % 6) * 0.5}s`,
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}
