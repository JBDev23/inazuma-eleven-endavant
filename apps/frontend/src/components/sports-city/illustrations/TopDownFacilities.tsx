import type { FacilityId, FacilityLevel } from '../types';
import {
  ACCENTS,
  EliteGlow,
  FacilityLabel,
  GROUND_LIGHT,
  GroundPlate,
  PATH,
  PerimeterPath,
  RuinsPlot,
} from './top-down-shared';

const W = 160;
const H = 100;

type Props = { facilityId: FacilityId; level: FacilityLevel; accent: string };

export function TopDownFacilityIllustration({ facilityId, level, accent }: Props) {
  const palette = ACCENTS[accent] ?? ACCENTS.cyan;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full block" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <GroundPlate w={W} h={H} />
      {facilityId === 'shop' && <ShopTopDown level={level} palette={palette} />}
      {facilityId === 'training' && <TrainingTopDown level={level} palette={palette} />}
      {facilityId === 'clinic' && <ClinicTopDown level={level} palette={palette} />}
      {facilityId === 'lab' && <LabTopDown level={level} palette={palette} />}
    </svg>
  );
}

type P = { level: FacilityLevel; palette: (typeof ACCENTS)['cyan'] };

/** Entrada a búnker — evoluciona del nivel 1 al 3 */
function BunkerEntrance({
  x,
  y,
  level,
  palette,
}: {
  x: number;
  y: number;
  level: 1 | 2 | 3;
  palette: (typeof ACCENTS)['cyan'];
}) {
  const sizes = { 1: { w: 20, h: 16 }, 2: { w: 24, h: 20 }, 3: { w: 28, h: 24 } };
  const { w, h } = sizes[level];
  const cx = x + w / 2;
  const cy = y + h / 2 + 1;
  const hatchR = level === 1 ? 5 : level === 2 ? 7.5 : 9.5;

  if (level === 1) {
    return (
      <g>
        {/* Parche de tierra — entrada camuflada */}
        <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2 - 1} fill="#57534e" opacity="0.45" />
        <ellipse cx={cx - 4} cy={cy + 3} rx="3" ry="2" fill="#047857" opacity="0.35" />
        <ellipse cx={cx + 5} cy={cy - 2} rx="2.5" ry="1.5" fill="#047857" opacity="0.3" />

        {/* Escotilla metálica cerrada */}
        <circle cx={cx} cy={cy} r={hatchR} fill="#3f3f46" stroke="#71717a" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={hatchR - 1.5} fill="#27272a" />
        <line x1={cx - 4} y1={cy} x2={cx + 4} y2={cy} stroke="#71717a" strokeWidth="0.6" opacity="0.7" />
        <line x1={cx} y1={cy - 4} x2={cx} y2={cy + 4} stroke="#71717a" strokeWidth="0.6" opacity="0.7" />
        <circle cx={cx} cy={cy} r="1.2" fill="#a1a1aa" opacity="0.6" />
      </g>
    );
  }

  if (level === 2) {
    return (
      <g>
        {/* Losa de hormigón básica */}
        <rect x={x} y={y} width={w} height={h} fill="#52525b" opacity="0.9" rx="1.5" stroke="#71717a" strokeWidth="0.5" />

        {/* Anillo de escotilla */}
        <circle cx={cx} cy={cy} r={hatchR + 1} fill="none" stroke="#a1a1aa" strokeWidth="0.8" />
        <circle cx={cx} cy={cy} r={hatchR} fill="#27272a" stroke="#71717a" strokeWidth="0.6" />

        {/* Puertas entreabiertas */}
        <path
          d={`M ${cx - hatchR} ${cy} A ${hatchR} ${hatchR} 0 0 1 ${cx - 1} ${cy - hatchR + 2} L ${cx} ${cy} Z`}
          fill="#52525b"
          stroke="#a1a1aa"
          strokeWidth="0.4"
          opacity="0.8"
        />
        <path
          d={`M ${cx + hatchR} ${cy} A ${hatchR} ${hatchR} 0 0 0 ${cx + 1} ${cy - hatchR + 2} L ${cx} ${cy} Z`}
          fill="#52525b"
          stroke="#a1a1aa"
          strokeWidth="0.4"
          opacity="0.8"
        />

        {/* Escaleras visibles */}
        <circle cx={cx} cy={cy + 1} r={hatchR - 3} fill="#09090b" />
        {[0, 1, 2].map((i) => (
          <line
            key={i}
            x1={cx - 5}
            y1={cy - 2 + i * 2.5}
            x2={cx + 5}
            y2={cy - 2 + i * 2.5}
            stroke="#52525b"
            strokeWidth="0.6"
            opacity="0.65"
          />
        ))}

        {/* Rejilla simple */}
        <rect x={x + w - 8} y={y + h - 10} width={5} height={7} fill="#27272a" stroke="#71717a" strokeWidth="0.3" rx="0.5" />
        <line x1={x + w - 7} y1={y + h - 7} x2={x + w - 3} y2={y + h - 7} stroke="#52525b" strokeWidth="0.4" />
        <line x1={x + w - 7} y1={y + h - 4} x2={x + w - 3} y2={y + h - 4} stroke="#52525b" strokeWidth="0.4" />
      </g>
    );
  }

  // Nivel 3 — búnker completo
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#52525b" opacity="0.95" rx="2" stroke="#71717a" strokeWidth="0.6" />
      <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} fill="#3f3f46" opacity="0.5" rx="1.5" />

      {[0, 1, 2].map((i) => (
        <rect key={i} x={x + 3 + i * 9} y={y + 1} width={5} height={3} fill="#facc15" opacity={i % 2 === 0 ? 0.85 : 0.35} rx="0.3" />
      ))}

      <circle cx={cx} cy={cy} r={hatchR + 1.5} fill="none" stroke="#a1a1aa" strokeWidth="1.2" opacity="0.9" />
      <circle cx={cx} cy={cy} r={hatchR} fill="#27272a" stroke="#71717a" strokeWidth="0.8" />

      <path
        d={`M ${cx - hatchR} ${cy} A ${hatchR} ${hatchR} 0 0 1 ${cx} ${cy - hatchR} L ${cx} ${cy} Z`}
        fill="#52525b"
        stroke="#a1a1aa"
        strokeWidth="0.5"
        opacity="0.85"
      />
      <path
        d={`M ${cx + hatchR} ${cy} A ${hatchR} ${hatchR} 0 0 0 ${cx} ${cy - hatchR} L ${cx} ${cy} Z`}
        fill="#52525b"
        stroke="#a1a1aa"
        strokeWidth="0.5"
        opacity="0.85"
      />

      <circle cx={cx} cy={cy + 1} r={hatchR - 3} fill="#09090b" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={cx - 6}
          y1={cy - 4 + i * 2.5}
          x2={cx + 6}
          y2={cy - 4 + i * 2.5}
          stroke="#52525b"
          strokeWidth="0.7"
          opacity={0.6 + i * 0.08}
        />
      ))}

      <circle cx={cx} cy={cy + 2} r="3.5" fill={palette.main} opacity="0.35" />
      <circle cx={cx} cy={cy + 2} r="1.5" fill={palette.glow} opacity="0.6" />

      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        return (
          <circle
            key={i}
            cx={cx + Math.cos(angle) * (hatchR + 0.5)}
            cy={cy + Math.sin(angle) * (hatchR + 0.5)}
            r="1"
            fill="#a1a1aa"
            opacity="0.8"
          />
        );
      })}

      <rect x={x + w - 8} y={y + h - 10} width={6} height={8} fill="#27272a" stroke="#71717a" strokeWidth="0.4" rx="0.5" />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={x + w - 7} y1={y + h - 8 + i * 2.5} x2={x + w - 3} y2={y + h - 8 + i * 2.5} stroke="#52525b" strokeWidth="0.5" />
      ))}

      <rect x={x + 3} y={y + h - 10} width={8} height={6} fill="#1e1b2e" stroke={palette.main} strokeWidth="0.5" rx="0.5" />
      <text x={x + 7} y={y + h - 5.5} textAnchor="middle" fill={palette.glow} fontSize="4" fontWeight="bold">
        ⬇
      </text>
    </g>
  );
}

function ShopTopDown({ level, palette }: P) {
  if (level === 0) return <RuinsPlot w={W} h={H} label="TIENDA" />;

  const configs = {
    1: { bw: 84, bh: 46, rows: 2, dots: 1 },
    2: { bw: 98, bh: 56, rows: 3, dots: 2 },
    3: { bw: 96, bh: 54, rows: 3, dots: 3 },
  }[level] ?? { bw: 98, bh: 56, rows: 3, dots: 2 };

  const { bw, bh, rows, dots } = configs;
  const isElite = level >= 3;
  const hasRegister = level >= 2;

  const pad = 6;
  const aisleW = 6;
  const gap = 3;
  const shelfH = 7;
  const counterH = 10;

  const outletW = 28;
  const outletH = 44;
  const outletGap = 8;
  const compoundW = isElite ? bw + outletGap + outletW : bw;
  const bx = (W - compoundW) / 2;
  const by = (H - bh) / 2;

  const outletX = bx + bw + outletGap;
  const outletY = by + 6;

  const counterY = by + bh - pad - counterH;
  const shelfTop = by + pad + (isElite ? 10 : 2);
  const shelfBottom = counterY - gap - (hasRegister ? 2 : 0);

  const aisleX = bx + (bw - aisleW) / 2;
  const leftX = bx + pad;
  const rightX = aisleX + aisleW + gap;
  const leftW = aisleX - gap - leftX;
  const rightW = bx + bw - pad - rightX;

  const rowStep = rows > 1 ? (shelfBottom - shelfTop - shelfH) / (rows - 1) : 0;

  const counterW = Math.min(bw * 0.3, leftW + 4);
  const counterX = bx + pad;

  return (
    <g>
      {/* Edificio principal */}
      <rect
        x={bx}
        y={by}
        width={bw}
        height={bh}
        fill={isElite ? '#0c4a6e' : palette.dark}
        opacity="0.92"
        rx="2"
        stroke={palette.main}
        strokeWidth={isElite ? 1.2 : 0.8}
      />

      {/* Pasillo central */}
      <rect
        x={aisleX}
        y={shelfTop}
        width={aisleW}
        height={Math.max(shelfBottom + shelfH - shelfTop, 8)}
        fill={GROUND_LIGHT}
        opacity={isElite ? 0.45 : 0.3}
        rx="1"
      />

      {/* Estanterías — dos columnas simétricas sin invadir el pasillo */}
      {Array.from({ length: rows }).map((_, row) => {
        const sy = shelfTop + row * rowStep;
        const colPositions = [
          { x: leftX, w: leftW },
          { x: rightX, w: rightW },
        ];
        return colPositions.map(({ x, w }, col) => (
          <g key={`${row}-${col}`}>
            <rect x={x} y={sy} width={w} height={shelfH} fill={palette.light} opacity={isElite ? 0.5 : 0.3} rx="1" />
            {Array.from({ length: dots }).map((_, d) => (
              <circle
                key={d}
                cx={x + 5 + d * Math.min(8, (w - 10) / Math.max(dots - 1, 1))}
                cy={sy + shelfH / 2}
                r={isElite ? 1.8 : 1.6}
                fill={['#facc15', '#f97316', '#22d3ee', '#a855f7', '#22c55e'][d]}
                opacity="0.85"
              />
            ))}
          </g>
        ));
      })}

      {/* Mostrador principal */}
      <g>
        <rect x={counterX} y={counterY} width={counterW} height={counterH} fill="#475569" rx="1" opacity="0.9" />
        <rect x={counterX + 2} y={counterY + 2} width={counterW - 4} height={counterH - 4} fill="#64748b" rx="0.5" />
        {hasRegister && (
          <>
            <rect
              x={counterX + 3}
              y={counterY + 2}
              width={7}
              height={5}
              fill="#1e293b"
              stroke={palette.main}
              strokeWidth="0.4"
              rx="0.5"
            />
            <text x={counterX + 6.5} y={counterY + 5.5} textAnchor="middle" fill="white" fontSize="3.5" fontWeight="bold">
              ¥
            </text>
          </>
        )}
      </g>

      {/* Nivel 3: vitrinas, segunda caja y ala outlet */}
      {isElite && (
        <g>
          <rect x={bx + pad} y={by + 4} width={14} height={7} fill={palette.main} opacity="0.2" rx="1" stroke={palette.glow} strokeWidth="0.4" />
          <rect x={bx + bw - pad - 14} y={by + 4} width={14} height={7} fill={palette.main} opacity="0.2" rx="1" stroke={palette.glow} strokeWidth="0.4" />
          <circle cx={bx + pad + 7} cy={by + 7.5} r="1.8" fill="#facc15" opacity="0.8" />
          <circle cx={bx + bw - pad - 7} cy={by + 7.5} r="1.8" fill="#22d3ee" opacity="0.8" />

          <rect x={bx + bw - pad - counterW} y={counterY} width={counterW} height={counterH} fill="#475569" rx="1" />

          {/* Ala outlet */}
          <rect
            x={outletX}
            y={outletY}
            width={outletW}
            height={outletH}
            fill={palette.dark}
            opacity="0.9"
            rx="2"
            stroke={palette.glow}
            strokeWidth="0.8"
          />
          <text
            x={outletX + outletW / 2}
            y={outletY + 7}
            textAnchor="middle"
            fill={palette.glow}
            fontSize="3.5"
            fontWeight="bold"
            letterSpacing="0.3"
          >
            OUTLET
          </text>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect
                x={outletX + 4}
                y={outletY + 12 + i * 10}
                width={outletW - 8}
                height={6}
                fill={palette.light}
                opacity="0.35"
                rx="0.5"
              />
              <circle
                cx={outletX + outletW / 2}
                cy={outletY + 15 + i * 10}
                r="1.8"
                fill={['#facc15', '#f97316', '#22d3ee'][i]}
                opacity="0.85"
              />
            </g>
          ))}

          <FacilityLabel x={bx + bw / 2} y={by - 5} text="TIENDA ÉLITE" color={palette.glow} />
          <EliteGlow x={bx} y={by} w={compoundW} h={Math.max(bh, outletH + 6)} color={palette.glow} />
        </g>
      )}

      {level === 2 && <PerimeterPath x={bx} y={by} w={bw} h={bh} level={level} />}
      {isElite && (
        <rect
          x={bx - 2}
          y={by - 2}
          width={compoundW + 4}
          height={Math.max(bh, outletH + 6) + 4}
          fill="none"
          stroke="#facc15"
          strokeWidth="0.8"
          opacity="0.5"
          rx="3"
        />
      )}
    </g>
  );
}

function TrainingTopDown({ level, palette }: P) {
  if (level === 0) return <RuinsPlot w={W} h={H} label="ENTRENO" />;

  const isElite = level >= 3;
  const pad = 8;

  const fieldConfigs = {
    1: { fw: 100, fh: 58 },
    2: { fw: 108, fh: 62 },
    3: { fw: 108, fh: 62 },
  }[level] ?? { fw: 108, fh: 62 };

  const { fw, fh } = fieldConfigs;
  const fx = (W - fw) / 2;
  const fy = (H - fh) / 2;

  const bunkerSizes = { 1: { w: 20, h: 16 }, 2: { w: 24, h: 20 }, 3: { w: 28, h: 24 } } as const;
  const bunkerSize = bunkerSizes[level as 1 | 2 | 3];
  const bunkerX = fx + pad;
  const bunkerY = fy + fh - pad - bunkerSize.h;
  const bunkerCx = bunkerX + bunkerSize.w / 2;
  const bunkerCy = bunkerY + bunkerSize.h / 2;

  const fieldCx = fx + fw / 2;
  const fieldCy = fy + fh / 2;
  const circleR = level >= 2 ? 9 : 7;

  const conePositions =
    level >= 2
      ? [
          [fx + 14, fy + 12],
          [fx + fw - 14, fy + 12],
          [fx + fw - 14, fy + fh - 12],
        ]
      : [
          [fx + 14, fy + 12],
          [fx + fw - 14, fy + 12],
        ];

  const boothW = 18;
  const boothH = 10;
  const boothX = fx + fw - pad - boothW;
  const boothY = fy + pad;

  return (
    <g>
      {isElite && <EliteGlow x={fx - 4} y={fy - 4} w={fw + 8} h={fh + 8} color={palette.glow} />}

      {/* Valla perimetral */}
      {level >= 2 && (
        <rect
          x={fx - 4}
          y={fy - 4}
          width={fw + 8}
          height={fh + 8}
          fill="none"
          stroke={palette.main}
          strokeWidth="1"
          strokeDasharray="4 2"
          opacity="0.5"
          rx="2"
        />
      )}

      {/* Campo de entreno */}
      <rect x={fx} y={fy} width={fw} height={fh} fill="#047857" opacity="0.85" rx="2" />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={fx}
          y={fy + i * (fh / 4)}
          width={fw}
          height={fh / 4}
          fill={i % 2 === 0 ? '#059669' : '#047857'}
          opacity="0.7"
        />
      ))}
      <circle cx={fieldCx} cy={fieldCy} r={circleR} fill="none" stroke="white" strokeWidth="0.8" opacity="0.5" />

      {/* Camino hacia el búnker */}
      {level >= 2 && (
        <path
          d={`M ${fieldCx} ${fieldCy} Q ${fieldCx - 10} ${fy + fh - pad - 4} ${bunkerCx + 4} ${bunkerCy}`}
          fill="none"
          stroke={PATH}
          strokeWidth={level >= 3 ? 2.5 : 1.8}
          opacity={level >= 3 ? 0.3 : 0.18}
          strokeLinecap="round"
        />
      )}

      {/* Entrada al búnker — dentro del campo, esquina inferior izquierda */}
      <BunkerEntrance x={bunkerX} y={bunkerY} level={level as 1 | 2 | 3} palette={palette} />

      {/* Conos — sin colocar en la esquina del búnker */}
      {conePositions.map(([cx, cy], i) => (
        <polygon
          key={i}
          points={`${cx},${cy - 3} ${cx + 3},${cy + 2} ${cx - 3},${cy + 2}`}
          fill="#f97316"
          opacity="0.9"
        />
      ))}

      {/* Caseta de vigilancia — dentro del campo, esquina superior derecha */}
      {isElite && (
        <g>
          <rect x={boothX} y={boothY} width={boothW} height={boothH} fill="#3f3f46" rx="1" stroke={palette.main} strokeWidth="0.5" />
          <circle cx={boothX + boothW / 2} cy={boothY + boothH / 2} r="2" fill="#1e1b2e" stroke={palette.glow} strokeWidth="0.4" />
          <line
            x1={boothX + boothW / 2}
            y1={boothY + boothH / 2}
            x2={boothX + 4}
            y2={boothY + boothH + 3}
            stroke={palette.main}
            strokeWidth="0.5"
            opacity="0.6"
          />
        </g>
      )}

      {isElite && <FacilityLabel x={fieldCx} y={fy - 6} text="SECRETO" color={palette.glow} />}

      <PerimeterPath x={fx} y={fy} w={fw} h={fh} level={level} />
    </g>
  );
}

function ClinicTopDown({ level, palette }: P) {
  if (level === 0) return <RuinsPlot w={W} h={H} label="CLÍNICA" />;

  const isElite = level >= 3;
  const hasPool = level >= 2;
  const pad = 6;

  const mainSizes = { 1: { bw: 58, bh: 46 }, 2: { bw: 62, bh: 50 }, 3: { bw: 62, bh: 50 } }[level] ?? { bw: 62, bh: 50 };
  const { bw, bh } = mainSizes;

  const poolW = 28;
  const poolGap = 6;
  const poolH = bh - 12;
  const nutritionW = 50;
  const nutritionH = 13;
  const nutritionGap = 4;

  const compoundW = hasPool ? bw + poolGap + poolW : bw;
  const compoundH = isElite ? bh + nutritionGap + nutritionH : bh;
  const bx = (W - compoundW) / 2;
  const by = (H - compoundH) / 2;

  const poolX = bx + bw + poolGap;
  const poolY = by + (bh - poolH) / 2;
  const nutritionX = bx + (bw - nutritionW) / 2;
  const nutritionY = by + bh + nutritionGap;

  const corridorW = 4;
  const bedW = 14;
  const bedH = 7;
  const bedY = by + pad + 4;
  const bedLeftX = bx + pad + 2;
  const bedRightX = bx + bw - pad - bedW - 2;

  return (
    <g>
      {isElite && <EliteGlow x={bx - 3} y={by - 3} w={compoundW + 6} h={compoundH + 6} color={palette.glow} />}

      {/* Edificio principal */}
      <rect x={bx} y={by} width={bw} height={bh} fill={palette.dark} opacity="0.92" rx="2" stroke={palette.main} strokeWidth="0.8" />

      {/* Pasillos en cruz — no invaden zona de camillas */}
      <rect x={bx + bw / 2 - corridorW / 2} y={by + pad} width={corridorW} height={bh - pad * 2} fill={palette.light} opacity="0.25" rx="0.5" />
      <rect x={bx + pad} y={by + bh / 2 - corridorW / 2} width={bw - pad * 2} height={corridorW} fill={palette.light} opacity="0.25" rx="0.5" />
      {/* Cruz médica en el centro del cruce */}
      <rect x={bx + bw / 2 - 1.5} y={by + bh / 2 - 6} width={3} height={12} fill={palette.light} opacity="0.85" rx="0.5" />
      <rect x={bx + bw / 2 - 6} y={by + bh / 2 - 1.5} width={12} height={3} fill={palette.light} opacity="0.85" rx="0.5" />

      {/* Camillas — cuadrantes superiores, alejadas del pasillo horizontal */}
      {level >= 1 && (
        <g>
          <ClinicBed x={bedLeftX} y={bedY} />
          {level >= 2 && <ClinicBed x={bedRightX} y={bedY} />}
        </g>
      )}

      {/* Mostrador de recepción — nivel 1+ */}
      <rect x={bx + bw / 2 - 10} y={by + bh - pad - 8} width={20} height={7} fill="#475569" rx="1" opacity="0.85" />
      <rect x={bx + bw / 2 - 8} y={by + bh - pad - 6} width={16} height={4} fill="#64748b" rx="0.5" opacity="0.7" />

      {/* Piscina de recuperación — anexo derecho */}
      {hasPool && (
        <g>
          <rect x={poolX} y={poolY} width={poolW} height={poolH} fill="#0ea5e9" opacity="0.55" rx="3" stroke="#38bdf8" strokeWidth="0.8" />
          <ellipse cx={poolX + poolW / 2} cy={poolY + poolH / 2} rx={poolW / 2 - 4} ry={poolH / 2 - 5} fill="#38bdf8" opacity="0.2" />
          {[0, 1, 2].map((i) => (
            <ellipse
              key={i}
              cx={poolX + poolW / 2}
              cy={poolY + poolH / 2 + i * 3 - 3}
              rx={poolW / 2 - 6 - i * 2}
              ry={3}
              fill="none"
              stroke="#7dd3fc"
              strokeWidth="0.4"
              opacity={0.5 - i * 0.1}
            />
          ))}
          {level >= 2 && (
            <text x={poolX + poolW / 2} y={poolY + 6} textAnchor="middle" fill="#e0f2fe" fontSize="3" fontWeight="bold" opacity="0.8">
              RECOVERY
            </text>
          )}
        </g>
      )}

      {/* Ala de nutrición — nivel 3 */}
      {isElite && (
        <g>
          <rect
            x={nutritionX}
            y={nutritionY}
            width={nutritionW}
            height={nutritionH}
            fill={palette.dark}
            opacity="0.9"
            rx="2"
            stroke={palette.main}
            strokeWidth="0.5"
          />
          <rect x={nutritionX + 3} y={nutritionY + 3} width={nutritionW - 6} height={nutritionH - 6} fill={palette.main} opacity="0.1" rx="1" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={nutritionX + 6 + i * 11} y={nutritionY + 4} width={7} height={nutritionH - 7} fill="#334155" rx="1" opacity="0.8" />
              <circle
                cx={nutritionX + 9.5 + i * 11}
                cy={nutritionY + nutritionH / 2 + 0.5}
                r="2"
                fill={['#22c55e', '#facc15', '#f97316', '#38bdf8'][i]}
                opacity="0.8"
              />
            </g>
          ))}
        </g>
      )}

      {isElite && <FacilityLabel x={bx + compoundW / 2} y={by - 5} text="CLÍNICA+" color={palette.glow} />}

      <PerimeterPath x={bx} y={by} w={compoundW} h={compoundH} level={level} />
    </g>
  );
}

function ClinicBed({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={14} height={7} fill="#94a3b8" rx="1" opacity="0.75" />
      <rect x={x + 1} y={y + 1} width={12} height={5} fill="#cbd5e1" rx="0.5" opacity="0.5" />
      <circle cx={x + 7} cy={y + 3.5} r="1.8" fill="#fcd34d" opacity="0.75" />
    </g>
  );
}

function LabDesk({
  x,
  y,
  w,
  palette,
}: {
  x: number;
  y: number;
  w: number;
  palette: (typeof ACCENTS)['cyan'];
}) {
  const monitorH = 7;
  const deskH = 5;
  return (
    <g>
      <rect x={x} y={y + monitorH} width={w} height={deskH} fill="#334155" rx="0.5" />
      <rect x={x + 1} y={y} width={w - 2} height={monitorH} fill={palette.dark} rx="0.5" stroke={palette.light} strokeWidth="0.35" />
      <rect x={x + 2} y={y + 1.5} width={w - 4} height={monitorH - 3} fill={palette.main} opacity="0.45" rx="0.5" />
    </g>
  );
}

function LabTopDown({ level, palette }: P) {
  if (level === 0) return <RuinsPlot w={W} h={H} label="LAB" />;

  const isElite = level >= 3;
  const hasBoard = level >= 2;
  const pad = 6;

  const mainSizes = { 1: { bw: 70, bh: 46 }, 2: { bw: 76, bh: 50 }, 3: { bw: 76, bh: 50 } }[level] ?? { bw: 76, bh: 50 };
  const { bw, bh } = mainSizes;

  const boardW = 24;
  const boardGap = 6;
  const boardH = 36;
  const serverH = 16;
  const serverGap = 4;

  const compoundW = hasBoard ? bw + boardGap + boardW : bw;
  const compoundH = isElite ? bh + serverGap + serverH : bh;
  const bx = (W - compoundW) / 2;
  const by = (H - compoundH) / 2;

  const boardX = bx + bw + boardGap;
  const boardY = by + (bh - boardH) / 2;
  const serverY = by + bh + serverGap;

  const deskCounts = { 1: 2, 2: 4, 3: 6 }[level] ?? 4;
  const deskCols = level >= 3 ? 3 : 2;
  const deskRows = Math.ceil(deskCounts / deskCols);

  const areaX = bx + pad;
  const areaY = by + pad;
  const areaW = bw - pad * 2;
  const areaH = bh - pad * 2;
  const deskW = (areaW - (deskCols - 1) * 5) / deskCols;
  const deskH = 12;
  const rowGap = deskRows > 1 ? (areaH - deskRows * deskH) / (deskRows - 1) : 0;

  return (
    <g>
      {isElite && <EliteGlow x={bx - 3} y={by - 3} w={compoundW + 6} h={compoundH + 6} color={palette.glow} />}

      {/* Sala principal */}
      <rect x={bx} y={by} width={bw} height={bh} fill="#0f172a" opacity="0.92" rx="2" stroke={palette.main} strokeWidth="0.8" />

      {/* Pasillo central */}
      <rect x={bx + bw / 2 - 2} y={by + pad} width={4} height={bh - pad * 2} fill={palette.main} opacity="0.08" rx="0.5" />

      {/* Mesas con pantallas — rejilla simétrica */}
      {Array.from({ length: deskCounts }).map((_, i) => {
        const col = i % deskCols;
        const row = Math.floor(i / deskCols);
        const dx = areaX + col * (deskW + 5);
        const dy = areaY + row * (deskH + rowGap);
        return <LabDesk key={i} x={dx} y={dy} w={deskW} palette={palette} />;
      })}

      {/* Pizarra táctica — anexo derecho */}
      {hasBoard && (
        <g>
          <rect x={boardX} y={boardY} width={boardW} height={boardH} fill="#064e3b" rx="2" stroke={palette.main} strokeWidth="0.6" opacity="0.9" />
          <rect x={boardX + 2} y={boardY + 2} width={boardW - 4} height={boardH - 4} fill="#047857" rx="1" opacity="0.85" />
          <circle cx={boardX + boardW / 2} cy={boardY + boardH / 2} r="6" fill="none" stroke="white" strokeWidth="0.5" opacity="0.55" />
          <line
            x1={boardX + boardW / 2}
            y1={boardY + 6}
            x2={boardX + boardW / 2}
            y2={boardY + boardH - 6}
            stroke="white"
            strokeWidth="0.4"
            opacity="0.4"
          />
          <text x={boardX + boardW / 2} y={boardY + 6} textAnchor="middle" fill="#d1fae5" fontSize="2.8" fontWeight="bold" opacity="0.75">
            TÁCTICA
          </text>
        </g>
      )}

      {/* Sala de servidores — ala inferior nivel 3 */}
      {isElite && (
        <g>
          <rect x={bx} y={serverY} width={compoundW} height={serverH} fill="#0f172a" opacity="0.95" rx="2" stroke={palette.main} strokeWidth="0.6" />
          <rect x={bx + 2} y={serverY + 2} width={compoundW - 4} height={serverH - 4} fill={palette.dark} opacity="0.4" rx="1" />
          {Array.from({ length: 5 }).map((_, i) => {
            const rackW = 8;
            const gap = (compoundW - 10 - 5 * rackW) / 4;
            const rx = bx + 5 + i * (rackW + gap);
            return (
              <g key={i}>
                <rect x={rx} y={serverY + 4} width={rackW} height={serverH - 6} fill="#1e293b" stroke={palette.main} strokeWidth="0.35" rx="0.5" />
                <circle cx={rx + rackW / 2} cy={serverY + 7} r="0.9" fill="#22d3ee" opacity="0.9" />
                <circle cx={rx + rackW / 2} cy={serverY + 10} r="0.9" fill={palette.glow} opacity={i % 2 === 0 ? 0.8 : 0.4} />
                <rect x={rx + 1.5} y={serverY + serverH - 6} width={rackW - 3} height={1.5} fill="#334155" rx="0.3" />
              </g>
            );
          })}
        </g>
      )}

      {isElite && <FacilityLabel x={bx + compoundW / 2} y={by - 5} text="LAB DATA" color={palette.glow} />}

      <PerimeterPath x={bx} y={by} w={compoundW} h={compoundH} level={level} />
    </g>
  );
}
