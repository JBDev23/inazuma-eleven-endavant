import type { FacilityLevel } from '../types';

type StadiumIllustrationProps = {
  fieldLevel: FacilityLevel;
  standsLevel: FacilityLevel;
  benchesLevel: FacilityLevel;
  className?: string;
};

/** Shared stadium geometry — everything centered on CENTER */
const CENTER = { x: 160, y: 120 };
const PITCH = { w: 96, h: 64 };
const PITCH_X = CENTER.x - PITCH.w / 2;
const PITCH_Y = CENTER.y - PITCH.h / 2;

const TRACK_INNER_RX = 54;
const TRACK_INNER_RY = 40;
const LANE_WIDTH = 4;

/** Bounding box wrapping track + pitch for rectangular stands */
const ARENA = {
  x: 50,
  y: 56,
  w: 220,
  h: 128,
};

function ellipsePath(cx: number, cy: number, rx: number, ry: number) {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy} Z`;
}

function ellipseRing(cx: number, cy: number, innerRx: number, innerRy: number, outerRx: number, outerRy: number) {
  return `${ellipsePath(cx, cy, outerRx, outerRy)} ${ellipsePath(cx, cy, innerRx, innerRy)}`;
}

function trackOuterRadius(fieldLevel: FacilityLevel) {
  const lanes = fieldLevel >= 3 ? 6 : 3;
  return {
    rx: TRACK_INNER_RX + lanes * LANE_WIDTH,
    ry: TRACK_INNER_RY + lanes * LANE_WIDTH * 0.75,
    lanes,
  };
}

function standInnerRadius(fieldLevel: FacilityLevel) {
  const outer = trackOuterRadius(fieldLevel);
  return {
    rx: outer.rx + 6,
    ry: outer.ry + 5,
  };
}

const FAN_COLORS = ['#facc15', '#f97316', '#ef4444', '#3b82f6', '#ffffff', '#22c55e', '#a855f7', '#ec4899', '#06b6d4'];

function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function FanCrowd({
  x,
  y,
  w,
  h,
  count,
  seed = 0,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  count: number;
  seed?: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const s = i * 7 + seed;
        const px = x + 2 + pseudoRandom(s) * Math.max(w - 4, 1);
        const py = y + 2 + pseudoRandom(s + 1) * Math.max(h - 4, 1);
        const r = pseudoRandom(s + 2) > 0.65 ? 1.5 : 1.1;
        return (
          <circle
            key={i}
            cx={px}
            cy={py}
            r={r}
            fill={FAN_COLORS[Math.floor(pseudoRandom(s + 3) * FAN_COLORS.length)]}
            opacity={0.6 + pseudoRandom(s + 4) * 0.35}
          />
        );
      })}
    </>
  );
}

function FanCrowdOnOval(
  cx: number,
  cy: number,
  innerRx: number,
  innerRy: number,
  outerRx: number,
  outerRy: number,
  count: number,
  seed = 0,
) {
  const dots = [];
  for (let i = 0; i < count; i++) {
    const s = i * 11 + seed;
    const angle = pseudoRandom(s) * Math.PI * 2;
    const band = 0.25 + pseudoRandom(s + 1) * 0.65;
    const rx = innerRx + (outerRx - innerRx) * band;
    const ry = innerRy + (outerRy - innerRy) * band;
    const jitter = (pseudoRandom(s + 2) - 0.5) * 4;
    dots.push(
      <circle
        key={i}
        cx={cx + Math.cos(angle) * (rx + jitter * 0.3)}
        cy={cy + Math.sin(angle) * (ry + jitter * 0.3)}
        r={pseudoRandom(s + 3) > 0.7 ? 1.5 : 1.1}
        fill={FAN_COLORS[Math.floor(pseudoRandom(s + 4) * FAN_COLORS.length)]}
        opacity={0.55 + pseudoRandom(s + 5) * 0.4}
      />,
    );
  }
  return <>{dots}</>;
}

/** Banquillo visto desde arriba: asientos + siluetas sentadas */
function BenchRow({ x, y, w, seats, facingUp }: { x: number; y: number; w: number; seats: number; facingUp: boolean }) {
  const seatW = (w - 4) / seats;
  const backY = facingUp ? y + 7 : y;
  const seatY = facingUp ? y : y + 5;

  return (
    <g>
      {/* Respaldo */}
      <rect x={x} y={backY} width={w} height={3} fill="#57534e" rx="0.5" />
      {Array.from({ length: seats }).map((_, i) => {
        const sx = x + 2 + i * seatW;
        const headCy = facingUp ? y + 2 : y + 10;
        const shirtCy = facingUp ? y + 4.5 : y + 7.5;
        return (
          <g key={i}>
            {/* Asiento */}
            <rect x={sx + 0.5} y={seatY} width={seatW - 1.5} height={4} fill="#94a3b8" rx="0.5" />
            {/* Jugador sentado: cabeza + torso */}
            <circle cx={sx + seatW / 2} cy={headCy} r="1.6" fill="#fcd34d" opacity="0.9" />
            <rect x={sx + seatW / 2 - 1.5} y={shirtCy - 1} width={3} height={2.5} fill={FAN_COLORS[i % FAN_COLORS.length]} rx="0.5" opacity="0.85" />
          </g>
        );
      })}
    </g>
  );
}

function grassStripes(x: number, y: number, w: number, h: number, opacity: number) {
  const stripes = [];
  const count = 6;
  const sh = h / count;
  for (let i = 0; i < count; i++) {
    stripes.push(
      <rect key={i} x={x} y={y + i * sh} width={w} height={sh} fill={i % 2 === 0 ? '#059669' : '#047857'} opacity={opacity} />,
    );
  }
  return stripes;
}

function drawPitchMarkings(opacity: number) {
  const x = PITCH_X;
  const y = PITCH_Y;
  const { w, h } = PITCH;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="white" strokeWidth="1.5" rx="1" />
      <line x1={CENTER.x} y1={y} x2={CENTER.x} y2={y + h} stroke="white" strokeWidth="1.2" />
      <circle cx={CENTER.x} cy={CENTER.y} r={12} fill="none" stroke="white" strokeWidth="1.2" />
      <circle cx={CENTER.x} cy={CENTER.y} r={1.5} fill="white" />
      <rect x={x} y={y + h * 0.28} width={w * 0.18} height={h * 0.44} fill="none" stroke="white" strokeWidth="0.8" />
      <rect x={x + w * 0.82} y={y + h * 0.28} width={w * 0.18} height={h * 0.44} fill="none" stroke="white" strokeWidth="0.8" />
      <rect x={x - 5} y={y + h * 0.35} width={5} height={h * 0.3} fill="none" stroke="white" strokeWidth="1.5" />
      <rect x={x + w} y={y + h * 0.35} width={5} height={h * 0.3} fill="none" stroke="white" strokeWidth="1.5" />
    </g>
  );
}

function RunningTrack({ level }: { level: FacilityLevel }) {
  if (level < 2) return null;
  const { rx, ry, lanes } = trackOuterRadius(level);
  const trackColor = level >= 3 ? '#c2410c' : '#9a3412';

  return (
    <g>
      <ellipse cx={CENTER.x} cy={CENTER.y} rx={rx + 4} ry={ry + 3} fill="#78350f" opacity="0.5" />
      <ellipse cx={CENTER.x} cy={CENTER.y} rx={rx} ry={ry} fill={trackColor} opacity={level >= 3 ? 0.95 : 0.75} />
      {Array.from({ length: lanes }).map((_, i) => (
        <ellipse
          key={i}
          cx={CENTER.x}
          cy={CENTER.y}
          rx={TRACK_INNER_RX + (i + 1) * LANE_WIDTH}
          ry={TRACK_INNER_RY + (i + 1) * LANE_WIDTH * 0.75}
          fill="none"
          stroke="white"
          strokeWidth={level >= 3 ? 0.6 : 0.4}
          opacity={0.5}
        />
      ))}
      {level >= 3 && (
        <>
          <line x1={CENTER.x - 36} y1={CENTER.y - ry} x2={CENTER.x + 36} y2={CENTER.y - ry} stroke="white" strokeWidth="0.5" opacity="0.4" />
          <line x1={CENTER.x - 36} y1={CENTER.y + ry} x2={CENTER.x + 36} y2={CENTER.y + ry} stroke="white" strokeWidth="0.5" opacity="0.4" />
        </>
      )}
    </g>
  );
}

type StandSide = 'top' | 'bottom' | 'left' | 'right';

function RectangularStandSection({ side, level }: { side: StandSide; level: FacilityLevel }) {
  const tiers = level === 1 ? 1 : 2;
  const mainColors = ['#3b82f6', '#2563eb'];
  const lightColor = '#93c5fd';
  const standDepth = 22;
  const { x: ax, y: ay, w: aw, h: ah } = ARENA;

  const configs: Record<StandSide, { x: number; y: number; w: number; h: number; vertical: boolean }> = {
    top: { x: ax, y: ay - standDepth - 4, w: aw, h: standDepth, vertical: false },
    bottom: { x: ax, y: ay + ah + 4, w: aw, h: standDepth, vertical: false },
    left: { x: ax - standDepth - 4, y: ay, w: standDepth, h: ah, vertical: true },
    right: { x: ax + aw + 4, y: ay, w: standDepth, h: ah, vertical: true },
  };

  const activeSides: StandSide[] = level === 1 ? ['top', 'bottom'] : ['top', 'bottom', 'left', 'right'];
  if (!activeSides.includes(side)) return null;

  const { x, y, w, h, vertical } = configs[side];
  const tierSize = (vertical ? w : h) / tiers;

  return (
    <g>
      {Array.from({ length: tiers }).map((_, t) => {
        const tx = vertical ? x + t * tierSize : x;
        const ty = vertical ? y : y + t * tierSize;
        const tw = vertical ? tierSize - 1 : w;
        const th = vertical ? h : tierSize - 1;
        return (
          <g key={t}>
            <rect x={tx} y={ty} width={tw} height={th} fill={mainColors[t]} opacity={0.88 - t * 0.1} rx="1" />
            {Array.from({ length: vertical ? 10 : 14 }).map((_, r) => {
              const step = vertical ? h / 10 : w / 14;
              return (
                <line
                  key={r}
                  x1={vertical ? tx + tw * 0.25 : tx + r * step}
                  y1={vertical ? ty + r * step : ty + th * 0.25}
                  x2={vertical ? tx + tw * 0.75 : tx + r * step}
                  y2={vertical ? ty + r * step : ty + th * 0.75}
                  stroke={lightColor}
                  strokeWidth="0.5"
                  opacity="0.35"
                />
              );
            })}
          </g>
        );
      })}
      {/* Afición */}
      {level >= 1 && (
        <FanCrowd
          x={x}
          y={y}
          w={w}
          h={h}
          count={level === 1 ? 22 : 35}
          seed={side === 'top' ? 10 : side === 'bottom' ? 20 : side === 'left' ? 30 : 40}
        />
      )}
    </g>
  );
}

function RectangularStands({ level }: { level: FacilityLevel }) {
  if (level === 0) {
    const rubble: Record<StandSide, { x: number; y: number }> = {
      top: { x: 120, y: 24 },
      bottom: { x: 120, y: 198 },
      left: { x: 30, y: 108 },
      right: { x: 262, y: 108 },
    };
    return (
      <g opacity="0.55">
        {(['top', 'bottom', 'left', 'right'] as StandSide[]).map((side) => {
          const { x, y } = rubble[side];
          const isVert = side === 'left' || side === 'right';
          return (
            <g key={side}>
              <rect x={x} y={y} width={isVert ? 12 : 80} height={isVert ? 40 : 10} fill="#57534e" rx="1" />
              <rect x={x + 4} y={y + 2} width={isVert ? 8 : 24} height={isVert ? 10 : 5} fill="#44403c" rx="1" />
            </g>
          );
        })}
      </g>
    );
  }

  return (
    <g>
      {(['top', 'bottom', 'left', 'right'] as StandSide[]).map((side) => (
        <RectangularStandSection key={side} side={side} level={level} />
      ))}
    </g>
  );
}

function OvalStandsLevel3({ fieldLevel }: { fieldLevel: FacilityLevel }) {
  const { x: cx, y: cy } = CENTER;
  const inner = standInnerRadius(fieldLevel);
  const tierDepth = 11;
  const tiers = 3;
  const mainColors = ['#3b82f6', '#2563eb', '#1d4ed8'];
  const lightColors = ['#93c5fd', '#60a5fa', '#3b82f6'];

  const rings = [];
  for (let t = 0; t < tiers; t++) {
    const iRx = inner.rx + t * tierDepth;
    const iRy = inner.ry + t * tierDepth * 0.72;
    const oRx = inner.rx + (t + 1) * tierDepth - 1;
    const oRy = inner.ry + (t + 1) * tierDepth * 0.72 - 1;
    rings.push(
      <path key={t} d={ellipseRing(cx, cy, iRx, iRy, oRx, oRy)} fill={mainColors[t]} fillRule="evenodd" opacity={0.9 - t * 0.08} />,
    );
    for (let s = 0; s < 24; s++) {
      const angle = (s / 24) * Math.PI * 2;
      rings.push(
        <line
          key={`seat-${t}-${s}`}
          x1={cx + Math.cos(angle) * iRx}
          y1={cy + Math.sin(angle) * iRy}
          x2={cx + Math.cos(angle) * oRx}
          y2={cy + Math.sin(angle) * oRy}
          stroke={lightColors[t]}
          strokeWidth="0.4"
          opacity="0.3"
        />,
      );
    }
  }

  const outerRx = inner.rx + tiers * tierDepth;
  const outerRy = inner.ry + tiers * tierDepth * 0.72;

  return (
    <g>
      {rings}
      {FanCrowdOnOval(cx, cy, inner.rx, inner.ry, outerRx, outerRy, 110, 50)}
      {FanCrowdOnOval(cx, cy, inner.rx + tierDepth * 0.3, inner.ry + tierDepth * 0.2, outerRx - 2, outerRy - 2, 45, 200)}
      <ellipse cx={cx} cy={cy} rx={outerRx + 3} ry={outerRy + 2} fill="none" stroke="#1e293b" strokeWidth="4" opacity="0.85" />
      <ellipse cx={cx} cy={cy} rx={outerRx + 1} ry={outerRy + 1} fill="none" stroke="#475569" strokeWidth="1" opacity="0.6" />
      <ellipse cx={cx} cy={cy} rx={inner.rx - 1} ry={inner.ry - 1} fill="none" stroke="#60a5fa" strokeWidth="0.8" opacity="0.25" />
    </g>
  );
}

function StandsRuins() {
  return (
    <g opacity="0.55">
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={60 + i * 28} y={i % 2 === 0 ? 22 : 200} width={24} height={8} fill="#57534e" rx="1" />
      ))}
    </g>
  );
}

function Stands({ level, fieldLevel }: { level: FacilityLevel; fieldLevel: FacilityLevel }) {
  if (level === 0) return <StandsRuins />;
  if (level === 3) return <OvalStandsLevel3 fieldLevel={fieldLevel} />;
  return <RectangularStands level={level} />;
}

/** Banquillos y zona técnica — sur del campo, dentro del estadio */
function TechnicalBenchesZone({ level }: { level: FacilityLevel }) {
  const x = PITCH_X + 6;
  const y = PITCH_Y + PITCH.h + 2;
  const w = PITCH.w - 12;
  const h = 20;
  const amber = '#f59e0b';
  const amberDark = '#b45309';

  if (level === 0) {
    return (
      <g opacity="0.5">
        <rect x={x} y={y} width={w} height={h} fill="#44403c" rx="2" stroke="#57534e" strokeWidth="0.5" strokeDasharray="2 2" />
        <text x={CENTER.x} y={y + h / 2 + 2} textAnchor="middle" fill="#78716c" fontSize="5" fontWeight="bold">
          SIN ZONA TÉCNICA
        </text>
      </g>
    );
  }

  const gap = 5;
  const techW = level >= 2 ? w * 0.22 : 0;
  const benchW =
    level >= 2 ? (w - techW - gap * 2 - 6) / 2 : (w - gap - 6) / 2;
  const homeX = x + 3;
  const awayX = level >= 2 ? x + w - benchW - 3 : homeX + benchW + gap;
  const techX = x + (w - techW) / 2;

  return (
    <g>
      <line x1={PITCH_X} y1={PITCH_Y + PITCH.h} x2={PITCH_X + PITCH.w} y2={PITCH_Y + PITCH.h} stroke="white" strokeWidth="1" opacity="0.6" />

      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="#1e293b"
        fillOpacity={0.92}
        rx="2"
        stroke={amber}
        strokeWidth={level >= 2 ? 1.2 : 0.8}
        strokeOpacity={0.7}
      />

      {/* Banquillo local (izquierda) */}
      <BenchRow x={homeX} y={y + 3} w={benchW} seats={level >= 3 ? 6 : level >= 2 ? 5 : 3} facingUp />

      {/* Banquillo visitante (derecha) — desde nivel 1 */}
      <BenchRow x={awayX} y={y + 3} w={benchW} seats={level >= 3 ? 6 : level >= 2 ? 4 : 3} facingUp />

      {/* Separador central en nivel 1 */}
      {level === 1 && (
        <line
          x1={CENTER.x}
          y1={y + 4}
          x2={CENTER.x}
          y2={y + h - 4}
          stroke="#475569"
          strokeWidth="0.6"
          strokeDasharray="2 2"
          opacity="0.6"
        />
      )}

      {/* Zona técnica central (nivel 2+) */}
      {level >= 2 && (
        <>
          <rect x={techX} y={y + 2} width={techW} height={h - 4} fill="#0f172a" fillOpacity={0.85} rx="1" stroke="#475569" strokeWidth="0.5" />
          <circle cx={techX + techW * 0.28} cy={y + 15} r="1.8" fill="#fcd34d" />
          <rect x={techX + techW * 0.28 - 1.5} y={y + 16.5} width={3} height={3} fill="#1e3a8a" rx="0.5" />
          <circle cx={techX + techW * 0.72} cy={y + 15} r="1.8" fill="#fcd34d" />
          <rect x={techX + techW * 0.72 - 1.5} y={y + 16.5} width={3} height={3} fill="#1e3a8a" rx="0.5" />
        </>
      )}

      {level >= 2 && (
        <rect x={x + 1} y={y - 4} width={w - 2} height={4} fill={amberDark} opacity="0.75" rx="1" />
      )}

      {level >= 3 && (
        <>
          <path
            d={`M ${x} ${y - 4} Q ${x + w / 2} ${y - 12} ${x + w} ${y - 4}`}
            fill="#1e293b"
            fillOpacity={0.92}
            stroke={amber}
            strokeWidth="0.7"
          />
          <rect x={x + 2} y={y + h - 5} width={6} height={4} fill="#3b82f6" rx="0.5" opacity="0.7" />
          <rect x={x + w - 8} y={y + h - 5} width={6} height={4} fill="#3b82f6" rx="0.5" opacity="0.7" />
        </>
      )}

      {/* Textos encima de todo lo demás */}
      {level >= 2 && (
        <g>
          <rect x={techX + 1} y={y + 4} width={techW - 2} height={9} fill="#0f172a" fillOpacity={0.95} rx="1" />
          <text x={techX + techW / 2} y={y + 8.5} textAnchor="middle" fill={amber} fontSize="4" fontWeight="bold">
            ZONA
          </text>
          <text x={techX + techW / 2} y={y + 12.5} textAnchor="middle" fill={amber} fontSize="4" fontWeight="bold">
            TÉCNICA
          </text>
        </g>
      )}

      <text x={CENTER.x} y={y + h + 4} textAnchor="middle" fill="#fbbf24" fontSize="3.5" fontWeight="bold" opacity="0.85">
        {level >= 2 ? 'BANQUILLOS' : 'LOCAL · VISITANTE'}
      </text>
    </g>
  );
}

function FieldExtras({ level }: { level: FacilityLevel }) {
  const x = PITCH_X;
  const y = PITCH_Y;
  const { w, h } = PITCH;
  const { rx: trackRx, ry: trackRy } = trackOuterRadius(level);

  return (
    <g>
      {level >= 2 &&
        [
          [x, y],
          [x + w, y],
          [x, y + h],
          [x + w, y + h],
        ].map(([fx, fy], i) => (
          <g key={i}>
            <line x1={fx} y1={fy} x2={fx} y2={fy - 8} stroke="#facc15" strokeWidth="1.2" />
            <polygon points={`${fx},${fy - 8} ${fx + 5},${fy - 6} ${fx},${fy - 4}`} fill="#e11d48" />
          </g>
        ))}

      {level >= 3 && (
        <g>
          <rect x={CENTER.x - 18} y={y - 20} width={36} height={12} fill="#0f172a" stroke="#334155" strokeWidth="1" rx="2" />
          <text x={CENTER.x} y={y - 11} textAnchor="middle" fill="#facc15" fontSize="6" fontWeight="bold">
            0 - 0
          </text>
        </g>
      )}

      {level >= 2 &&
        [
          [CENTER.x - trackRx - 8, CENTER.y - trackRy - 6],
          [CENTER.x + trackRx + 8, CENTER.y - trackRy - 6],
        ].map(([lx, ly], i) => (
          <g key={i}>
            <line x1={lx} y1={ly} x2={lx + (lx < CENTER.x ? 6 : -6)} y2={ly + (ly < CENTER.y ? 6 : -6)} stroke="#94a3b8" strokeWidth="1.5" />
            <ellipse cx={lx} cy={ly} rx="7" ry="3.5" fill="#facc15" opacity={level >= 3 ? 0.55 : 0.28} />
          </g>
        ))}
    </g>
  );
}

export function StadiumIllustration({ fieldLevel, standsLevel, benchesLevel, className = '' }: StadiumIllustrationProps) {
  const grassOpacity = fieldLevel === 0 ? 0.25 : fieldLevel === 1 ? 0.7 : fieldLevel === 2 ? 0.9 : 1;
  const lineOpacity = fieldLevel === 0 ? 0 : fieldLevel === 1 ? 0.6 : fieldLevel === 2 ? 0.85 : 1;

  return (
    <svg viewBox="0 0 320 240" className={`w-full h-full ${className}`} aria-hidden>
      <defs>
        <radialGradient id="stadiumGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#facc15" stopOpacity="0.12" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="320" height="240" fill="#14532d" opacity="0.4" rx="8" />

      <Stands level={standsLevel} fieldLevel={fieldLevel} />
      <RunningTrack level={fieldLevel} />

      {fieldLevel === 0 ? (
        <g opacity="0.5">
          <rect x={PITCH_X} y={PITCH_Y} width={PITCH.w} height={PITCH.h} fill="#44403c" rx="2" />
          <text x={CENTER.x} y={CENTER.y - 6} textAnchor="middle" fill="#a8a29e" fontSize="9" fontWeight="bold">
            CAMPO EN RUINAS
          </text>
        </g>
      ) : (
        <>
          <rect x={PITCH_X} y={PITCH_Y} width={PITCH.w} height={PITCH.h} fill="#047857" rx="1" />
          {grassStripes(PITCH_X, PITCH_Y, PITCH.w, PITCH.h, grassOpacity)}
          {drawPitchMarkings(lineOpacity)}
          {fieldLevel >= 3 && (
            <rect x={PITCH_X} y={PITCH_Y} width={PITCH.w} height={PITCH.h} fill="url(#stadiumGlow)" rx="1" />
          )}
        </>
      )}

      <FieldExtras level={fieldLevel} />

      {/* Banquillos al final para quedar por encima de pista/gradas */}
      <TechnicalBenchesZone level={benchesLevel} />

      {standsLevel >= 3 && (
        <g>
          <rect x={118} y={4} width={84} height={10} fill="#0f172a" opacity="0.8" rx="2" />
          <text x={CENTER.x} y={11} textAnchor="middle" fill="#60a5fa" fontSize="5" fontWeight="bold" letterSpacing="1">
            ESTADIO
          </text>
        </g>
      )}
    </svg>
  );
}
