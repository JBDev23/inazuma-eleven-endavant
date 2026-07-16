import { ACTION_WEIGHTS } from './constants';
import { formatDuelMultiplier, formatDuelStatValue, roundDuelStat } from './duel-format';
import { formatShotDistanceMultiplier } from './shot-distance';
import { getActionTacticFamily } from './tactics';
import type {
  DuelParticipantInput,
  DuelResolution,
  DuelResolutionInput,
  DuelSide,
} from './duel-resolver';
import type { ActionCategory, DuelStats } from './types';

const STAT_LABELS: Record<keyof DuelStats, string> = {
  kick: 'Tiro',
  body: 'Físico',
  control: 'Control',
  guard: 'Defensa',
  speed: 'Rapidez',
  stamina: 'Aguante',
  guts: 'Valor',
};

export interface StatContribution {
  stat: keyof DuelStats;
  label: string;
  value: number;
  weight: number;
  contribution: number;
}

export interface ParticipantDebugLog {
  side: DuelSide;
  element: string;
  action: ActionCategory;
  tacticFamily: string;
  stats: DuelStats;
  statContributions: StatContribution[];
  eStats: number;
  move?: {
    id: number;
    name: string;
    element: string;
    basePower: number;
    maxPower: number;
    currentLevel: number;
    techniquePower: number;
    stabMultiplier: number;
    techniqueContribution: number;
  };
  elementMultiplier: number;
  tacticMultiplier: number;
  tacticsApplied: boolean;
  rng: number;
  rngMax: number;
  furor: number;
  basePower: number;
  total: number;
  formula: string;
}

export interface DuelDebugLog {
  turn: number;
  duelType: 'FIELD' | 'GOAL';
  ballSide: DuelSide;
  isBurningPhase: boolean;
  tacticsDisabled: boolean;
  home: ParticipantDebugLog;
  away: ParticipantDebugLog;
  winnerSide: DuelSide | 'draw';
  homePower: number;
  awayPower: number;
  effects: DuelResolution['effects'];
  foul?: DuelResolution['foul'];
}

function duelHasSuperTechnique(home: DuelParticipantInput, away: DuelParticipantInput): boolean {
  const superActions = new Set<ActionCategory>([
    'DRIBBLE_SUPER',
    'BLOCK_SUPER',
    'SHOOT_SUPER',
    'CATCH_SUPER',
  ]);
  return superActions.has(home.action) || superActions.has(away.action);
}

function isSuperAction(action: ActionCategory): boolean {
  return (
    action === 'DRIBBLE_SUPER' ||
    action === 'BLOCK_SUPER' ||
    action === 'SHOOT_SUPER' ||
    action === 'CATCH_SUPER'
  );
}

function buildStatContributions(
  stats: DuelStats,
  action: ActionCategory,
): StatContribution[] {
  const { weights } = ACTION_WEIGHTS[action];
  return (Object.keys(weights) as (keyof DuelStats)[]).map((stat) => ({
    stat,
    label: STAT_LABELS[stat],
    value: stats[stat],
    weight: weights[stat],
    contribution: roundDuelStat(stats[stat] * weights[stat]),
  }));
}

function buildParticipantLog(
  participant: DuelParticipantInput,
  opponent: DuelParticipantInput,
  resolution: DuelResolution,
  duelType: 'FIELD' | 'GOAL',
  tacticsDisabled: boolean,
): ParticipantDebugLog {
  const breakdown =
    participant.side === 'home' ? resolution.homeBreakdown : resolution.awayBreakdown;
  const actionData = ACTION_WEIGHTS[participant.action];
  const statContributions = buildStatContributions(participant.stats, participant.action);
  const isSuper = isSuperAction(participant.action) && participant.move != null;
  const tacticsApplied = !tacticsDisabled && !isSuper;

  let basePower: number;
  let formula: string;

  if (isSuper && participant.move) {
    const techContrib =
      (breakdown.techniquePower ?? 0) * (breakdown.stabMultiplier ?? 1);
    basePower = Math.floor(
      (breakdown.eStats + techContrib) * breakdown.elementMultiplier,
    );
    const preWeatherTotal = basePower + breakdown.rng + breakdown.furor;
    const weatherNote =
      breakdown.weatherMultiplier != null && breakdown.weatherMultiplier !== 1
        ? ` × Clima(${formatDuelMultiplier(breakdown.weatherMultiplier)})`
        : '';
    const distanceNote =
      breakdown.shotDistanceMultiplier != null &&
      participant.shotDistance != null
        ? ` × Distancia(${participant.shotDistance} franjas, ${formatShotDistanceMultiplier(participant.shotDistance)})`
        : '';
    const finalNote =
      weatherNote || distanceNote
        ? `${weatherNote}${distanceNote} = ${breakdown.total}`
        : ` = ${breakdown.total}`;
    formula = [
      `E = ${formatDuelStatValue(breakdown.eStats)}`,
      `Téc×STAB = ${breakdown.techniquePower} × ${formatDuelMultiplier(breakdown.stabMultiplier ?? 1)} = ${formatDuelStatValue(techContrib)}`,
      `Base = floor((${formatDuelStatValue(breakdown.eStats)} + ${formatDuelStatValue(techContrib)}) × ${formatDuelMultiplier(breakdown.elementMultiplier)}) = ${basePower}`,
      `Total = ${basePower} + RNG(${breakdown.rng}) + Furor(${breakdown.furor}) = ${preWeatherTotal}${finalNote}`,
      tacticsDisabled ? '(Tácticas desactivadas: super técnica en juego)' : '',
    ]
      .filter(Boolean)
      .join('\n    ');
  } else {
    basePower = Math.floor(
      breakdown.eStats * breakdown.elementMultiplier * breakdown.tacticMultiplier,
    );
    const preWeatherTotal = basePower + breakdown.rng + breakdown.furor;
    const weatherNote =
      breakdown.weatherMultiplier != null && breakdown.weatherMultiplier !== 1
        ? ` × Clima(${formatDuelMultiplier(breakdown.weatherMultiplier)})`
        : '';
    const distanceNote =
      breakdown.shotDistanceMultiplier != null &&
      participant.shotDistance != null
        ? ` × Distancia(${participant.shotDistance} franjas, ${formatShotDistanceMultiplier(participant.shotDistance)})`
        : '';
    const finalNote =
      weatherNote || distanceNote
        ? `${weatherNote}${distanceNote} = ${breakdown.total}`
        : ` = ${breakdown.total}`;
    formula = [
      `E = ${formatDuelStatValue(breakdown.eStats)}`,
      `Base = floor(${formatDuelStatValue(breakdown.eStats)} × ${formatDuelMultiplier(breakdown.elementMultiplier)} × ${formatDuelMultiplier(breakdown.tacticMultiplier)}) = ${basePower}`,
      `Total = ${basePower} + RNG(${breakdown.rng}) + Furor(${breakdown.furor}) = ${preWeatherTotal}${finalNote}`,
      !tacticsApplied && tacticsDisabled
        ? '(Tácticas desactivadas: super técnica en juego)'
        : '',
    ]
      .filter(Boolean)
      .join('\n    ');
  }

  const move =
    participant.move && breakdown.techniquePower != null
      ? {
          id: participant.move.id,
          name: participant.move.name,
          element: participant.move.element,
          basePower: participant.move.basePower,
          maxPower: participant.move.maxPower,
          currentLevel: participant.move.currentLevel,
          techniquePower: breakdown.techniquePower,
          stabMultiplier: breakdown.stabMultiplier ?? 1,
          techniqueContribution: roundDuelStat(
            breakdown.techniquePower * (breakdown.stabMultiplier ?? 1),
          ),
        }
      : undefined;

  return {
    side: participant.side,
    element: participant.element,
    action: participant.action,
    tacticFamily: getActionTacticFamily(participant.action),
    stats: participant.stats,
    statContributions,
    eStats: breakdown.eStats,
    move,
    elementMultiplier: breakdown.elementMultiplier,
    tacticMultiplier: breakdown.tacticMultiplier,
    tacticsApplied,
    rng: breakdown.rng,
    rngMax: actionData.rngMax,
    furor: breakdown.furor,
    basePower,
    total: breakdown.total,
    formula,
  };
}

export function buildDuelDebugLog(
  input: DuelResolutionInput,
  resolution: DuelResolution,
): DuelDebugLog {
  const tacticsDisabled = duelHasSuperTechnique(input.home, input.away);

  return {
    turn: input.currentTurn,
    duelType: input.duelType,
    ballSide: input.ballSide,
    isBurningPhase: resolution.isBurningPhase,
    tacticsDisabled,
    home: buildParticipantLog(
      input.home,
      input.away,
      resolution,
      input.duelType,
      tacticsDisabled,
    ),
    away: buildParticipantLog(
      input.away,
      input.home,
      resolution,
      input.duelType,
      tacticsDisabled,
    ),
    winnerSide: resolution.winnerSide,
    homePower: resolution.homePower,
    awayPower: resolution.awayPower,
    effects: resolution.effects,
    foul: resolution.foul,
  };
}

export interface DuelDebugLabels {
  homeName?: string;
  awayName?: string;
  homeAction?: string;
  awayAction?: string;
}

function formatParticipant(
  p: ParticipantDebugLog,
  opponent: ParticipantDebugLog,
  labels: DuelDebugLabels,
  side: DuelSide,
): string {
  const name =
    side === 'home' ? labels.homeName ?? 'Local' : labels.awayName ?? 'Visitante';
  const actionLabel =
    side === 'home' ? labels.homeAction ?? p.action : labels.awayAction ?? p.action;

  const statLines = p.statContributions
    .filter((c) => c.weight > 0)
    .map(
      (c) =>
        `      ${c.label.padEnd(8)} ${String(c.value).padStart(4)} × ${formatDuelMultiplier(c.weight)} = ${formatDuelStatValue(c.contribution)}`,
    )
    .join('\n');

  const lines = [
    `  ${name} (${side})`,
    `    Acción: ${actionLabel} [${p.action}] · Familia táctica: ${p.tacticFamily}`,
    `    Elemento: ${p.element}  vs  ${opponent.element}  →  ×${formatDuelMultiplier(p.elementMultiplier)}`,
    `    Stats:`,
    statLines,
    `    E_stats = ${formatDuelStatValue(p.eStats)}`,
  ];

  if (p.move) {
    lines.push(
      `    Super técnica: ${p.move.name} (Nv.${p.move.currentLevel})`,
      `      Poder: ${p.move.basePower}→${p.move.maxPower} → ${p.move.techniquePower}`,
      `      Elem. técnica: ${p.move.element} · STAB: ×${formatDuelMultiplier(p.move.stabMultiplier)}`,
      `      Contribución técnica: ${formatDuelStatValue(p.move.techniqueContribution)}`,
    );
  }

  lines.push(
    `    Multiplicadores:`,
    `      Elemento: ×${formatDuelMultiplier(p.elementMultiplier)}`,
    `      Táctica:  ×${formatDuelMultiplier(p.tacticMultiplier)}${p.tacticsApplied ? '' : ' (no aplicado)'}`,
    `    RNG: 0–${p.rngMax} → +${p.rng}`,
    `    Furor: +${p.furor}${p.furor === 0 ? ' (inactivo)' : ''}`,
    `    Fórmula:`,
    `    ${p.formula}`,
    `    TOTAL: ${p.total}`,
  );

  return lines.join('\n');
}

export function formatDuelDebugLog(
  log: DuelDebugLog,
  labels: DuelDebugLabels = {},
): string {
  const winner =
    log.winnerSide === 'draw'
      ? 'EMPATE'
      : log.winnerSide === 'home'
        ? labels.homeName ?? 'Local'
        : labels.awayName ?? 'Visitante';

  const effects: string[] = [];
  if (log.foul) {
    effects.push(
      `FALTA (${log.foul.action}, ${(log.foul.foulRate * 100).toFixed(1)}%) → posesión ${log.effects.newBallSide}`,
    );
  }
  if (log.effects.goalScored) effects.push(`GOL (${log.effects.goalSide})`);
  if (log.effects.possessionChange) {
    effects.push(`Cambio posesión → ${log.effects.newBallSide}`);
  } else {
    effects.push('Posesión se mantiene');
  }

  return [
    '══════════════════════════════════════════',
    '  DUEL DEBUG LOG',
    '══════════════════════════════════════════',
    `Turno: ${log.turn}`,
    `Tipo: ${log.duelType === 'GOAL' ? 'Portería' : 'Campo'}`,
    `Balón: ${log.ballSide}`,
    `Fase de furor: ${log.isBurningPhase ? 'SÍ' : 'NO'}`,
    `Tácticas desactivadas: ${log.tacticsDisabled ? 'SÍ (super técnica)' : 'NO'}`,
    '',
    formatParticipant(log.home, log.away, labels, 'home'),
    '',
    formatParticipant(log.away, log.home, labels, 'away'),
    '',
    '  RESULTADO',
    `    ${log.homePower} vs ${log.awayPower}`,
    `    Ganador: ${winner}`,
    `    Efectos: ${effects.join(' · ')}`,
    '══════════════════════════════════════════',
  ].join('\n');
}

export function logDuelDebug(
  input: DuelResolutionInput,
  resolution: DuelResolution,
  labels: DuelDebugLabels = {},
): DuelDebugLog {
  const log = buildDuelDebugLog(input, resolution);
  console.group('[Duel Debug]');
  console.log(formatDuelDebugLog(log, labels));
  console.log('Structured:', log);
  console.groupEnd();
  return log;
}
