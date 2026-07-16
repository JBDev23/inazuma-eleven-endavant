import type { InfrastructureTier } from './level-styles';
import { GRASS, GROUND } from './illustrations/top-down-shared';

type CityGroundLayerProps = {
  tier: InfrastructureTier;
  className?: string;
};

/** Capa de suelo y decoración ambiental — sin caminos (los caminos van en el grid) */
export function CityGroundLayer({ tier, className = '' }: CityGroundLayerProps) {
  const bushCount = tier >= 3 ? 10 : tier >= 2 ? 7 : tier >= 1 ? 4 : 2;

  const bushes = Array.from({ length: bushCount }).map((_, i) => {
    const seed = i * 17 + tier * 3;
    const x = 8 + ((seed * 13) % 84);
    const y = 10 + ((seed * 7) % 80);
    const r = 2 + (seed % 3);
    return { x, y, r, shade: i % 3 };
  });

  const flowers =
    tier >= 2
      ? [
          [18, 85, '#f472b6'],
          [82, 12, '#fbbf24'],
          [45, 92, '#a78bfa'],
          [70, 88, '#f87171'],
          [25, 15, '#fbbf24'],
          [90, 45, '#f472b6'],
        ].slice(0, tier >= 3 ? 6 : 3)
      : [];

  return (
    <svg
      viewBox="0 0 100 100"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect x="0" y="0" width="100" height="100" fill={GROUND} opacity="0.4" />

      {/* Manchas de césped */}
      {[
        [25, 30, 12],
        [75, 25, 10],
        [20, 70, 14],
        [80, 72, 11],
        [50, 50, 18],
      ].map(([cx, cy, r], i) => (
        <ellipse key={`grass-${i}`} cx={cx} cy={cy} rx={r} ry={r * 0.7} fill={GRASS} opacity={0.15 + tier * 0.04} />
      ))}

      {/* Arbustos dispersos */}
      {bushes.map((b, i) => (
        <g key={`bush-${i}`} opacity={0.35 + tier * 0.08}>
          <circle cx={b.x} cy={b.y} r={b.r} fill={['#166534', '#15803d', '#14532d'][b.shade]} />
          <circle cx={b.x - 0.8} cy={b.y - 0.5} r={b.r * 0.6} fill={['#15803d', '#22c55e', '#166534'][b.shade]} opacity="0.7" />
        </g>
      ))}

      {/* Flores en niveles altos */}
      {flowers.map(([fx, fy, color], i) => (
        <g key={`flower-${i}`} opacity="0.65">
          <circle cx={fx} cy={fy} r="1.2" fill={color} />
          <circle cx={fx} cy={fy + 1.5} r="0.8" fill="#166534" opacity="0.5" />
        </g>
      ))}

      {/* Piedras decorativas */}
      {tier >= 1 &&
        [
          [12, 42],
          [88, 58],
          [35, 88],
        ].map(([sx, sy], i) => (
          <ellipse key={`stone-${i}`} cx={sx} cy={sy} rx="2" ry="1.2" fill="#57534e" opacity="0.25" />
        ))}
    </svg>
  );
}
