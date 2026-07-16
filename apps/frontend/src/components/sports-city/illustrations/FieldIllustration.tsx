import type { FacilityLevel } from '../types';

type FieldIllustrationProps = {
  level: FacilityLevel;
  className?: string;
};

export function FieldIllustration({ level, className = '' }: FieldIllustrationProps) {
  const grassOpacity = level === 0 ? 0.3 : level === 1 ? 0.6 : level === 2 ? 0.85 : 1;
  const lineOpacity = level === 0 ? 0.2 : level === 1 ? 0.5 : level === 2 ? 0.75 : 1;
  const hasGoals = level >= 1;
  const hasLights = level >= 2;
  const hasPremium = level >= 3;

  return (
    <svg
      viewBox="0 0 200 140"
      className={`w-full h-full ${className}`}
      aria-hidden
    >
      {/* Grass stripes */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect
          key={i}
          x="10"
          y={10 + i * 18}
          width="180"
          height="18"
          fill={i % 2 === 0 ? '#059669' : '#047857'}
          opacity={grassOpacity}
        />
      ))}

      {/* Field outline */}
      <rect
        x="20"
        y="15"
        width="160"
        height="110"
        fill="none"
        stroke="white"
        strokeWidth="2"
        opacity={lineOpacity}
        rx="2"
      />

      {/* Center circle */}
      <circle cx="100" cy="70" r="22" fill="none" stroke="white" strokeWidth="1.5" opacity={lineOpacity} />
      <circle cx="100" cy="70" r="2" fill="white" opacity={lineOpacity} />

      {/* Center line */}
      <line x1="100" y1="15" x2="100" y2="125" stroke="white" strokeWidth="1.5" opacity={lineOpacity} />

      {/* Penalty areas */}
      <rect x="20" y="42" width="30" height="56" fill="none" stroke="white" strokeWidth="1" opacity={lineOpacity * 0.8} />
      <rect x="150" y="42" width="30" height="56" fill="none" stroke="white" strokeWidth="1" opacity={lineOpacity * 0.8} />

      {/* Goals */}
      {hasGoals && (
        <>
          <rect x="14" y="58" width="8" height="24" fill="none" stroke="white" strokeWidth="2" opacity={lineOpacity} />
          <rect x="178" y="58" width="8" height="24" fill="none" stroke="white" strokeWidth="2" opacity={lineOpacity} />
        </>
      )}

      {/* Ruins overlay for level 0 */}
      {level === 0 && (
        <>
          <rect x="30" y="25" width="40" height="8" fill="#57534e" opacity="0.7" rx="1" transform="rotate(-5 50 29)" />
          <rect x="120" y="90" width="50" height="10" fill="#57534e" opacity="0.6" rx="1" transform="rotate(3 145 95)" />
          <rect x="70" y="50" width="60" height="6" fill="#44403c" opacity="0.5" rx="1" />
          <text x="100" y="78" textAnchor="middle" fill="#a8a29e" fontSize="10" fontWeight="bold" opacity="0.8">
            EN RUINAS
          </text>
        </>
      )}

      {/* Level 2: corner flags */}
      {level >= 2 && (
        <>
          {[[22, 17], [178, 17], [22, 123], [178, 123]].map(([x, y], i) => (
            <g key={i}>
              <line x1={x} y1={y} x2={x} y2={y - 10} stroke="#facc15" strokeWidth="1.5" />
              <polygon points={`${x},${y - 10} ${x + 6},${y - 8} ${x},${y - 6}`} fill="#e11d48" />
            </g>
          ))}
        </>
      )}

      {/* Level 3: premium turf pattern */}
      {hasPremium && (
        <>
          <rect x="20" y="15" width="160" height="110" fill="url(#fieldGlow)" opacity="0.15" />
          <defs>
            <radialGradient id="fieldGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
        </>
      )}

      {/* Floodlights */}
      {hasLights && (
        <>
          {[[25, 10], [175, 10], [25, 130], [175, 130]].map(([x, y], i) => (
            <g key={`light-${i}`}>
              <line x1={x} y1={y} x2={x} y2={y + (y < 70 ? 8 : -8)} stroke="#94a3b8" strokeWidth="2" />
              <ellipse
                cx={x}
                cy={y + (y < 70 ? 12 : -12)}
                rx="12"
                ry="6"
                fill="#facc15"
                opacity={hasPremium ? 0.5 : 0.25}
              />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}
