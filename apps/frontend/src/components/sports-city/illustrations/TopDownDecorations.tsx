import type { InfrastructureTier } from '../level-styles';
import { GROUND, GROUND_LIGHT, GRASS, PATH } from './top-down-shared';

const FAN_GREEN = ['#166534', '#15803d', '#22c55e'];

type SvgProps = { tier: InfrastructureTier; className?: string };

export function TopDownParking({ tier, className = '' }: SvgProps) {
  const slots = tier === 0 ? 4 : tier === 1 ? 6 : tier === 2 ? 8 : 12;
  const filled = tier === 0 ? 0 : tier === 1 ? 1 : tier === 2 ? 3 : 6;
  const cols = tier <= 1 ? 2 : 4;

  return (
    <svg viewBox="0 0 120 80" className={`w-full h-full ${className}`} aria-hidden>
      <rect x="0" y="0" width="120" height="80" fill={GROUND} rx="4" />
      <rect x="4" y="4" width="112" height="72" fill={GRASS} opacity="0.3" rx="3" />
      <rect x="6" y="14" width="108" height="58" fill={tier === 0 ? '#292524' : '#334155'} opacity="0.75" rx="2" />
      <text x="60" y="11" textAnchor="middle" fill="#94a3b8" fontSize="5" fontWeight="bold" letterSpacing="1">
        PARKING
      </text>
      {Array.from({ length: slots }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cw = 108 / cols - 4;
        const ch = 50 / Math.ceil(slots / cols) - 3;
        const px = 8 + col * (cw + 3);
        const py = 18 + row * (ch + 3);
        const occupied = i < filled;
        return (
          <g key={i}>
            <rect x={px} y={py} width={cw} height={ch} fill={GROUND_LIGHT} stroke="#475569" strokeWidth="0.5" rx="1" opacity="0.85" />
            {occupied && (
              <>
                <rect x={px + 2} y={py + ch * 0.35} width={cw - 4} height={ch * 0.45} fill={tier >= 2 ? '#94a3b8' : '#64748b'} rx="1.5" />
                <rect x={px + cw * 0.25} y={py + ch * 0.15} width={cw * 0.5} height={ch * 0.35} fill={tier >= 2 ? '#cbd5e1' : '#94a3b8'} rx="1" />
              </>
            )}
          </g>
        );
      })}
      {/* Seto y farola */}
      <rect x="6" y="6" width="108" height="3" fill="#166534" opacity="0.5" rx="0.5" />
      {tier >= 2 && (
        <>
          <circle cx="112" cy="8" r="1.5" fill="#475569" />
          <circle cx="112" cy="6.5" r="1" fill="#facc15" opacity={tier >= 3 ? 0.9 : 0.6} />
        </>
      )}
      {tier >= 1 && (
        <>
          <circle cx="10" cy="72" r="3" fill="#166534" opacity="0.4" />
          <circle cx="110" cy="72" r="3" fill="#166534" opacity="0.4" />
        </>
      )}
    </svg>
  );
}

export function TopDownGreenArea({
  tier,
  variant = 'trees',
  className = '',
}: SvgProps & { variant?: 'trees' | 'fountain' | 'benches' }) {
  if (tier === 0) {
    return (
      <svg viewBox="0 0 120 60" className={`w-full h-full ${className}`} aria-hidden>
        <rect x="0" y="0" width="120" height="60" fill={GROUND} rx="4" />
        <rect x="4" y="4" width="112" height="52" fill={GRASS} opacity="0.2" stroke="#365314" strokeWidth="0.5" strokeDasharray="3 2" rx="3" />
        <circle cx="60" cy="30" r="6" fill="#365314" opacity="0.4" />
        <text x="60" y="54" textAnchor="middle" fill="#57534e" fontSize="4" fontWeight="bold" opacity="0.5">
          SIN MANTENER
        </text>
      </svg>
    );
  }

  const treeCount = tier >= 3 ? 4 : tier >= 2 ? 3 : 2;

  return (
    <svg viewBox="0 0 120 60" className={`w-full h-full ${className}`} aria-hidden>
      <rect x="0" y="0" width="120" height="60" fill={GROUND} rx="4" />
      <rect x="4" y="4" width="112" height="52" fill={GRASS} opacity="0.55" rx="3" />
      {/* Seto perimetral */}
      <rect x="6" y="6" width="108" height="3" fill="#166534" opacity="0.55" rx="1" />
      <rect x="6" y="51" width="108" height="3" fill="#166534" opacity="0.55" rx="1" />
      <rect x="6" y="6" width="3" height="48" fill="#166534" opacity="0.4" rx="1" />
      <rect x="111" y="6" width="3" height="48" fill="#166534" opacity="0.4" rx="1" />

      {variant === 'trees' &&
        Array.from({ length: treeCount }).map((_, i) => {
          const tx = 22 + i * (76 / Math.max(treeCount - 1, 1));
          const ty = 28 + (i % 2) * 5;
          return (
            <g key={i}>
              <circle cx={tx} cy={ty + 2} r={tier >= 3 ? 9 : 7} fill={FAN_GREEN[i % 3]} opacity="0.35" />
              <circle cx={tx} cy={ty} r={tier >= 3 ? 7 : 5.5} fill={FAN_GREEN[i % 3]} opacity="0.85" />
              <circle cx={tx} cy={ty} r={tier >= 3 ? 3.5 : 2.5} fill={FAN_GREEN[(i + 1) % 3]} opacity="0.55" />
              <rect x={tx - 1} y={ty + 3} width="2" height={6} fill="#57534e" />
            </g>
          );
        })}

      {variant === 'benches' && (
        <g>
          {[
            [32, 34],
            [60, 38],
            [88, 34],
          ]
            .slice(0, tier >= 2 ? 3 : 1)
            .map(([bx, by], i) => (
              <g key={i}>
                <rect x={bx - 9} y={by} width={18} height={4} fill={PATH} rx="0.5" opacity="0.75" />
                <rect x={bx - 8} y={by - 2} width={16} height={2} fill="#78716c" rx="0.5" />
              </g>
            ))}
          <circle cx="60" cy="22" r="6" fill="#166534" opacity="0.45" />
          <circle cx="60" cy="22" r="3" fill="#22c55e" opacity="0.35" />
          {tier >= 2 && (
            <>
              <circle cx="20" cy="48" r="2" fill="#f472b6" opacity="0.6" />
              <circle cx="100" cy="48" r="2" fill="#fbbf24" opacity="0.6" />
            </>
          )}
        </g>
      )}

      {variant === 'fountain' && tier >= 3 && (
        <g>
          <circle cx="60" cy="32" r="17" fill="#0c4a6e" opacity="0.2" />
          <circle cx="60" cy="32" r="13" fill="#0ea5e9" opacity="0.35" />
          <circle cx="60" cy="32" r="6" fill="#38bdf8" opacity="0.55" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle
              key={i}
              cx={60 + Math.cos(i * 1.05) * 12}
              cy={32 + Math.sin(i * 1.05) * 12}
              r="1.3"
              fill="#7dd3fc"
              opacity="0.75"
            />
          ))}
          {tier >= 3 && (
            <>
              <circle cx="18" cy="48" r="1.5" fill="#fbbf24" opacity="0.7" />
              <circle cx="102" cy="48" r="1.5" fill="#f472b6" opacity="0.7" />
            </>
          )}
        </g>
      )}

      {tier >= 2 && variant === 'trees' && tier < 3 && (
        <path d="M 16 50 Q 60 47 104 50" fill="none" stroke={PATH} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function TopDownEntrance({ tier, clubName }: { tier: InfrastructureTier; clubName?: string }) {
  const pathSurface = tier === 0 ? '#44403c' : tier === 1 ? '#57534e' : tier === 2 ? '#6b7280' : '#9ca3af';

  return (
    <svg viewBox="0 0 200 44" className="w-full max-w-md h-auto mx-auto" aria-hidden>
      {/* Camino de acceso */}
      <rect x="88" y="32" width="24" height="12" fill={pathSurface} opacity="0.85" rx="1" />
      {tier >= 2 && (
        <line x1="100" y1="34" x2="100" y2="42" stroke="#facc15" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
      )}

      <rect x="0" y="12" width="200" height="20" fill={tier === 0 ? '#292524' : '#334155'} opacity="0.75" rx="2" />
      <rect x="70" y="8" width="60" height="28" fill={GROUND} stroke={tier >= 2 ? '#facc15' : '#57534e'} strokeWidth="1" rx="2" opacity="0.95" />
      <rect x="74" y="18" width="52" height="12" fill={tier >= 1 ? '#1e293b' : '#292524'} rx="1" />
      <text x="100" y="16" textAnchor="middle" fill="#facc15" fontSize="5" fontWeight="bold" letterSpacing="1">
        ENTRADA
      </text>
      {clubName && tier >= 1 && (
        <text x="100" y="26" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">
          {clubName.length > 16 ? `${clubName.slice(0, 14)}…` : clubName}
        </text>
      )}
      {tier === 0 && (
        <text x="100" y="26" textAnchor="middle" fill="#78716c" fontSize="4" fontWeight="bold">
          SIN SEÑALIZAR
        </text>
      )}
      <rect x="72" y="14" width="4" height="20" fill={tier >= 2 ? '#facc15' : '#57534e'} opacity="0.7" rx="0.5" />
      <rect x="124" y="14" width="4" height="20" fill={tier >= 2 ? '#facc15' : '#57534e'} opacity="0.7" rx="0.5" />
      {tier >= 2 && (
        <>
          <circle cx="64" cy="22" r="3" fill="#166534" opacity="0.4" />
          <circle cx="136" cy="22" r="3" fill="#166534" opacity="0.4" />
        </>
      )}
      {tier >= 3 && (
        <text x="100" y="6" textAnchor="middle" fill="#facc15" fontSize="6">
          ★
        </text>
      )}
    </svg>
  );
}
