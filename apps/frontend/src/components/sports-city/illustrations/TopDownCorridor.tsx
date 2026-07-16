import type { InfrastructureTier } from '../level-styles';
import { PATH_NETWORK_STYLES } from '../level-styles';
import { GRASS, GROUND } from './top-down-shared';

type CorridorProps = {
  tier: InfrastructureTier;
  axis: 'horizontal' | 'vertical';
  className?: string;
};

/** Franja de camino que llena toda la celda del grid — sin curvas artificiales */
export function TopDownCorridor({ tier, axis, className = '' }: CorridorProps) {
  const style = PATH_NETWORK_STYLES[tier];
  const isH = axis === 'horizontal';
  const vbW = isH ? 100 : 16;
  const vbH = isH ? 16 : 100;

  const pathY = isH ? 8 : 50;
  const pathX = isH ? 50 : 8;
  const pathW = isH ? 96 : 10;
  const pathH = isH ? 10 : 96;

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      className={`w-full h-full block ${className}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* Césped de bordín */}
      <rect x="0" y="0" width={vbW} height={vbH} fill={GROUND} />
      <rect x="0" y="0" width={vbW} height={vbH} fill={GRASS} opacity={0.35} />

      {/* Bordillos laterales */}
      {isH ? (
        <>
          <rect x="0" y="0" width={vbW} height="2.5" fill="#166534" opacity="0.45" />
          <rect x="0" y={vbH - 2.5} width={vbW} height="2.5" fill="#166534" opacity="0.45" />
        </>
      ) : (
        <>
          <rect x="0" y="0" width="2.5" height={vbH} fill="#166534" opacity="0.45" />
          <rect x={vbW - 2.5} y="0" width="2.5" height={vbH} fill="#166534" opacity="0.45" />
        </>
      )}

      {/* Firme del camino */}
      <rect
        x={isH ? 2 : pathX - pathW / 2}
        y={isH ? pathY - pathH / 2 : 2}
        width={pathW}
        height={pathH}
        fill={style.surface}
        opacity="0.95"
        rx={isH ? 1.5 : 1.5}
      />
      <rect
        x={isH ? 2 : pathX - pathW / 2}
        y={isH ? pathY - pathH / 2 : 2}
        width={pathW}
        height={pathH}
        fill="none"
        stroke={style.edge}
        strokeWidth="0.4"
        opacity="0.6"
        rx={isH ? 1.5 : 1.5}
      />

      {/* Marca central */}
      {tier >= 2 && isH && (
        <line
          x1="4"
          y1={pathY}
          x2={vbW - 4}
          y2={pathY}
          stroke={style.marking}
          strokeWidth="0.5"
          strokeDasharray="3 2.5"
          opacity="0.55"
        />
      )}
      {tier >= 2 && !isH && (
        <line
          x1={pathX}
          y1="4"
          x2={pathX}
          y2={vbH - 4}
          stroke={style.marking}
          strokeWidth="0.5"
          strokeDasharray="3 2.5"
          opacity="0.55"
        />
      )}

      {tier < 2 && isH && (
        <line x1="4" y1={pathY} x2={vbW - 4} y2={pathY} stroke={style.edge} strokeWidth="0.3" strokeDasharray="2 2" opacity="0.4" />
      )}
      {tier < 2 && !isH && (
        <line x1={pathX} y1="4" x2={pathX} y2={vbH - 4} stroke={style.edge} strokeWidth="0.3" strokeDasharray="2 2" opacity="0.4" />
      )}

      {/* Ensanchamiento en cruces (alineado con columnas verticales del grid) */}
      {isH && tier >= 1 && (
        <>
          {[22, 50, 78].map((jx) => (
            <ellipse key={jx} cx={jx} cy={pathY} rx={tier >= 2 ? 4 : 3} ry={pathH / 2 + 0.5} fill={style.surface} opacity="0.95" />
          ))}
        </>
      )}
    </svg>
  );
}

/** Cruce de caminos en intersección del grid */
export function TopDownCrossing({ tier, className = '' }: { tier: InfrastructureTier; className?: string }) {
  const style = PATH_NETWORK_STYLES[tier];

  return (
    <svg viewBox="0 0 16 16" className={`w-full h-full block ${className}`} preserveAspectRatio="none" aria-hidden>
      <rect x="0" y="0" width="16" height="16" fill={GROUND} />
      <rect x="0" y="0" width="16" height="16" fill={GRASS} opacity="0.35" />
      <rect x="3" y="3" width="10" height="10" fill={style.surface} opacity="0.95" rx="1.5" />
      <rect x="3" y="3" width="10" height="10" fill="none" stroke={style.edge} strokeWidth="0.35" rx="1.5" opacity="0.6" />
      {tier >= 2 && (
        <>
          <line x1="8" y1="4" x2="8" y2="12" stroke={style.marking} strokeWidth="0.4" strokeDasharray="1.5 1.5" opacity="0.5" />
          <line x1="4" y1="8" x2="12" y2="8" stroke={style.marking} strokeWidth="0.4" strokeDasharray="1.5 1.5" opacity="0.5" />
        </>
      )}
    </svg>
  );
}
