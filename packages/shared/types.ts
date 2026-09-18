// ==========================================
// 1. INTERFACES BASE (Mapeo exacto de la DB)
// ==========================================

import type { PeRedemptionPreview } from './pe-redeem';

export interface Team {
  id: number;
  name: string;
  slug: string;
  mapData: any;
  type: 'CLUB' | 'CENTRAL';
}


export type StatKey =
  | 'gp'
  | 'tp'
  | 'kick'
  | 'body'
  | 'control'
  | 'guard'
  | 'speed'
  | 'stamina'
  | 'guts';

export type PlayerStats = Record<StatKey, number>;
export type CoachModifiers = Record<StatKey, number>;
export type ItemStats = Partial<Record<StatKey, number>>;

export type ItemType = 'BOOTS' | 'GLOVES' | 'BRACELET' | 'PENDANT';

export interface Item {
  id: number;
  name: string;
  type: ItemType;
  price: number;
  stats: ItemStats;
}

export interface ClubItem {
  clubId: string;
  itemId: number;
  quantity: number;
  item?: Item;
}

export interface ClubItemWithDetails extends ClubItem {
  item: Item;
}

export interface BuyItemResult {
  success: true;
  newBalance: number;
  quantity: number;
}

export type ConsumableCategory = 'WATER' | 'FOOD' | 'SPECIAL';

export type ConsumableEffect =
  | 'RESTORE_GP_PERCENT'
  | 'RESTORE_TP_PERCENT'
  | 'REVEAL_OPPONENT_COMMAND';

export interface Consumable {
  id: number;
  name: string;
  category: ConsumableCategory;
  effect: ConsumableEffect;
  effectValue: number;
  price: number;
  description: string | null;
  imageUrl: string | null;
}

export interface ClubConsumable {
  clubId: string;
  consumableId: number;
  quantity: number;
  consumable?: Consumable;
}

export interface ClubConsumableWithDetails extends ClubConsumable {
  consumable: Consumable;
}

export interface BuyConsumableResult {
  success: true;
  newBalance: number;
  quantity: number;
}

export interface EquipItemDto {
  playerId: number;
  slot: 'primary' | 'secondary';
  itemId: number | null;
}

export interface Coach {
  id: number;
  name: string;
  nickname: string | null;
  spriteUrl: string | null;
  season: number;
  price: number;
  level: number;
  experience: number;
  baseModifiers: CoachModifiers;
  maxModifiers: CoachModifiers;
  isFreeAgent: boolean;
  teamId: number;
  ownerId: string | null;
}

export interface Player {
  id: number;
  name: string;
  nickname: string | null;
  jpName: string | null;
  position: 'GK' | 'DF' | 'MF' | 'FW' | string;
  element: 'Earth' | 'Fire' | 'Wind' | 'Wood' | string;
  season: number;
  spriteUrl: string | null;
  price: number;
  isFreeAgent: boolean;

  level: number;
  experience: number;
  baseStats: PlayerStats;
  maxStats: PlayerStats;
  /** Mejoras permanentes con PC; persisten al transferir al jugador */
  statBonuses?: Partial<Record<StatKey, number>>;



  // Convocatoria y alineaciones
  isActiveRoster: boolean;
  position11: number | null;
  position4: number | null;

  // Foreign Keys
  teamId: number;
  ownerId: string | null;

  // Equipamiento
  primaryItemId?: number | null;
  secondaryItemId?: number | null;
  primaryItem?: Item | null;
  secondaryItem?: Item | null;
}


export interface UnlockedNode {
  id: number;
  playerId: number;
  userClubId: number;
  unlockedAt: Date;
}

export const DEFAULT_SHIELD_URL =
  'https://res.cloudinary.com/ddfhquqsb/image/upload/f_auto,q_auto/v1781867849/default_shield_h3evcz.png';

export interface UserClub {
  id: string;
  name: string;
  password: string;
  baseTeamSlug: string | null;
  shieldUrl: string;
  pp: number;
  pe: number;
  yens: number;
  pc: number;
  /** Si true, el club no aparece en la pantalla pública de Recursos */
  hiddenFromResources: boolean;
  activeFormation11Id: number | null;
  activeFormation4Id: number | null;
  roster: PlayerWithDetails[];
  unlockedNodes: UnlockedNode[];
  formations?: ClubFormation[];
  formation11?: Formation;
  formation4?: Formation;
  activeCoachId?: number | null;
  coaches?: Coach[];
  items?: ClubItemWithDetails[];
  consumables?: ClubConsumableWithDetails[];
  facilities?: import('./sports-city').ClubFacilityRecord[];
}

export interface CreateUserClubDto {
  name: string;
  password: string;
  baseTeamSlug?: string | null;
  shieldUrl?: string | null;
  pp?: number;
  pe?: number;
  yens?: number;
  pc?: number;
  hiddenFromResources?: boolean;
}

export type UpdateUserClubDto = Partial<
  Pick<
    UserClub,
    'name' | 'password' | 'baseTeamSlug' | 'shieldUrl' | 'pp' | 'activeCoachId' | 'hiddenFromResources'
  >
>;

// ==========================================
// TIPOS BASE DE LAS SUPERTÉCNICAS
// ==========================================

export type MoveType = 'SHOOT' | 'DRIBBLE' | 'BLOCK' | 'CATCH' | 'SKILL';

export type EvolutionPath = 'SHIN' | 'L_G' | 'NONE';

export type EvolutionSpeed = 'FAST' | 'MEDIUM' | 'SLOW' | 'NONE';

// ==========================================
// INTERFAZ DE LA TÉCNICA (MOVE)
// ==========================================

export interface Move {
  id: number;
  name: string;
  type: MoveType;
  element: string;
  foulRate: number;
  basePower: number;
  maxPower: number;
  tpCost: number;
  secondaryType: string | null;
  evolutionPath: EvolutionPath;
  evolutionSpeed: EvolutionSpeed;
}

// ==========================================
// INTERFAZ DEL PROGRESO DEL JUGADOR (PLAYER MOVE)
// ==========================================

export interface PlayerMove {
  playerId: number;
  moveId: number;
  
  unlockLevel: number; // A qué nivel del jugador se desbloquea esta técnica
  uses: number;        // Veces que la ha usado el jugador
  moveLevel: number;   // Nivel actual de la técnica (Ej: 2 para "Kai" o "L2")
  
  // Relaciones opcionales para cuando hagas "include" en Prisma
  move?: Move;
  player?: Player;
}

// ==========================================
// 2. INTERFACES EXTENDIDAS (Lo que devuelve tu API)
// ==========================================

export interface PlayerMoveWithProgress extends Move {
  unlockLevel: number;
  currentLevel: number;
  uses: number;
  isUnlocked: boolean;
}

export interface PlayerWithDetails extends Player {
  team?: Team;
  moves: PlayerMoveWithProgress[];
  kick: number;
  body: number;
  control: number;
  guard: number;
  speed: number;
  stamina: number;
  guts: number;
}

// ==========================================
// DTOs PARA CREAR/ACTUALIZAR TÉCNICAS (Opcional)
// ==========================================

export type CreateMoveDto = Omit<Move, 'id'>;
export type UpdateMoveDto = Partial<CreateMoveDto>;

// ==========================================
// TÁCTICAS Y FORMACIONES
// ==========================================

export type FormationType = 'OFFENSIVE' | 'DEFENSIVE' | 'BALANCED';

/** Líneas de campo, p. ej. "4-3-3" o [4, 3, 3] (sin contar al portero). */
export type FormationLines = string | number[];

export interface Formation {
  id: number;
  name: string;
  playerCount: number;
  type: FormationType;
  price: number;
  positions: FormationLines;
}

export interface ClubFormation {
  clubId: string;
  formationId: number;
  unlockedAt: Date;
  formation?: Formation;
}

export type CreateFormationDto = Omit<Formation, 'id'>;
export type UpdateFormationDto = Partial<CreateFormationDto>;

export interface FormationWithClubStatus extends Formation {
  unlocked: boolean;
  unlockedByCoach: boolean;
  ownedByClub: boolean;
  isActive11: boolean;
  isActive4: boolean;
}

export interface FormationClubAssignment {
  clubId: string;
  clubName: string;
  ownedByClub: boolean;
}

export interface BuyFormationResult {
  success: true;
  newBalance: number;
  formation: Formation;
}

export interface ActivateFormationResult {
  success: true;
  activeFormation11Id: number | null;
  activeFormation4Id: number | null;
}

export interface RosterPositionUpdate {
  playerId: number;
  isActiveRoster: boolean;
  position11: number | null;
  position4: number | null;
}

export interface UpdateRosterDto {
  roster: RosterPositionUpdate[];
}

export interface AddTransactionDto {
  amountPP: number;
  amountPE: number;
  amountYens: number;
  amountPC: number;
  description: string;
}

export interface PeAllocationDto {
  playerId: number;
}

export interface RedeemPeDto {
  allocations: PeAllocationDto[];
}

export interface RedeemPeResult {
  success: true;
  newPeBalance: number;
  preview: PeRedemptionPreview;
}

export interface SpendPcDto {
  playerId: number;
  statKey: StatKey;
  /** Cantidad de mejoras (+N a la stat). Por defecto 1. */
  amount?: number;
}

export interface SpendPcResult {
  success: true;
  newPcBalance: number;
  statBonuses: Partial<Record<StatKey, number>>;
  statKey: StatKey;
  newStatValue: number;
  /** Precio de mercado dinámico tras aplicar el PC */
  marketPrice: number;
}

export type { PeAllocation, PePlayerPreview, PeRedemptionPreview } from './pe-redeem';

export interface YeAllocationDto {
  coachId: number;
}

export interface RedeemYeDto {
  allocations: YeAllocationDto[];
}

export interface RedeemYeResult {
  success: true;
  newYeBalance: number;
  preview: import('./ye-redeem').YeRedemptionPreview;
}

export type { YeAllocation, YeCoachPreview, YeRedemptionPreview } from './ye-redeem';

// ==========================================
// CONFIGURACIÓN DE XP DE PARTIDO
// ==========================================

export type {
  SessionXpConfig,
  GameSettings,
  PlayerMatchParticipation,
  PlayerMatchXpBreakdown,
  MatchXpResult,
  MatchWinnerRewards,
} from './match-xp.utils';

export interface ApplyMatchXpDto {
  format: '11v11' | '4v4';
  totalTurns: number;
  homeClubId: string;
  awayClubId: string;
  homeScore: number;
  awayScore: number;
  players: import('./match-xp.utils').PlayerMatchParticipation[];
  /** Consumibles usados durante el partido (sincroniza inventario al subir resultado) */
  consumableUsages?: import('./consumables').ApplyMatchConsumableUsage[];
  /** Supertécnicas usadas durante el partido (dominio y evolución) */
  moveUsages?: import('./move-evolution').ApplyMatchMoveUsage[];
  /** Ganador por penaltis cuando el marcador reglamentario está empatado */
  winnerClubId?: string | null;
}

export interface ApplyMatchXpResult {
  success: true;
  matchXp: import('./match-xp.utils').MatchXpResult;
  winnerRewards: import('./match-xp.utils').MatchWinnerRewards | null;
  grants: Array<{
    playerId: number;
    totalXp: number;
    leveledUp: boolean;
    newLevel: number;
  }>;
  moveGrants: import('./move-evolution').MoveUsageGrant[];
}