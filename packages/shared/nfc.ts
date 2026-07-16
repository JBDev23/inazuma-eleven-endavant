import type { ClubResources } from './economy';

/** Datos almacenados en la pulsera NFC (formato del sistema externo). */
export interface BraceletData {
  active: boolean;
  pp: number;
  pe: number;
  ye: number;
  pc: number;
  team: number;
}

export interface NfcSyncResult {
  success: true;
  clubId: string;
  clubName: string;
  deposited: ClubResources;
  newBalance: ClubResources;
  resetPayload: BraceletData;
}

export function resetBracelet(data: BraceletData): BraceletData {
  return { active: data.active, pp: 0, pe: 0, ye: 0, pc: 0, team: data.team };
}

export function braceletHasCoins(data: BraceletData): boolean {
  return data.pp > 0 || data.pe > 0 || data.ye > 0 || data.pc > 0;
}

export function braceletToResources(data: BraceletData): ClubResources {
  return { pp: data.pp, pe: data.pe, yens: data.ye, pc: data.pc };
}

export function parseBraceletPayload(raw: unknown): BraceletData {
  if (typeof raw === 'string') {
    return parseBraceletPayload(JSON.parse(raw));
  }

  if (!raw || typeof raw !== 'object') {
    throw new Error('Formato de pulsera inválido.');
  }

  const data = raw as Record<string, unknown>;

  return {
    active: Boolean(data.active),
    pp: Number(data.pp ?? 0),
    pe: Number(data.pe ?? 0),
    ye: Number(data.ye ?? data.yens ?? 0),
    pc: Number(data.pc ?? 0),
    team: Number(data.team),
  };
}
