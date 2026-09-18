import {
  DEFAULT_ECONOMY_PRICING,
  type EconomyPricingSettings,
} from './entity-pricing';

export type FacilityId =
  | 'field'
  | 'stands'
  | 'benches'
  | 'shop'
  | 'training'
  | 'clinic'
  | 'lab';

export type FacilityLevel = 0 | 1 | 2 | 3;

export const FACILITY_IDS: FacilityId[] = [
  'field',
  'stands',
  'benches',
  'shop',
  'training',
  'clinic',
  'lab',
];

export const FACILITY_LABELS: Record<FacilityId, string> = {
  field: 'Terreno de Juego',
  stands: 'Gradas y la Afición',
  benches: 'Banquillos y Zona Técnica',
  shop: 'Tienda del Club',
  training: 'Centro de Entrenamiento Secreto',
  clinic: 'Clínica de Recuperación y Nutrición',
  lab: 'Laboratorio de Tácticas y Datos',
};

export const LEVEL_LABELS: Record<FacilityLevel, string> = {
  0: 'Ruinas',
  1: 'Básico',
  2: 'Mejorado',
  3: 'Élite',
};

export type SportsCityState = Record<FacilityId, FacilityLevel>;

export type ClubFacilityRecord = {
  facilityId: FacilityId;
  level: FacilityLevel;
  upgradingTo: FacilityLevel | null;
  pitchElement?: string | null;
};

export type ClubSportsCity = {
  clubId: string;
  facilities: ClubFacilityRecord[];
};

export const DEFAULT_SPORTS_CITY: SportsCityState = {
  field: 1,
  stands: 0,
  benches: 0,
  shop: 0,
  training: 0,
  clinic: 0,
  lab: 0,
};

export function facilitiesToState(facilities: ClubFacilityRecord[]): SportsCityState {
  const state = { ...DEFAULT_SPORTS_CITY };
  for (const f of facilities) {
    state[f.facilityId] = f.level;
  }
  return state;
}

export function getConstructionMap(facilities: ClubFacilityRecord[]): Partial<Record<FacilityId, FacilityLevel>> {
  const map: Partial<Record<FacilityId, FacilityLevel>> = {};
  for (const f of facilities) {
    if (f.upgradingTo != null) {
      map[f.facilityId] = f.upgradingTo;
    }
  }
  return map;
}

export type FacilityUpgradeCosts = Pick<
  EconomyPricingSettings,
  'facilityUpgradeCostFrom0' | 'facilityUpgradeCostFrom1' | 'facilityUpgradeCostFrom2'
>;

/** Costes por defecto en YE para subir de nivel N a N+1 */
export const FACILITY_UPGRADE_COSTS: Record<FacilityLevel, number | null> = {
  0: DEFAULT_ECONOMY_PRICING.facilityUpgradeCostFrom0,
  1: DEFAULT_ECONOMY_PRICING.facilityUpgradeCostFrom1,
  2: DEFAULT_ECONOMY_PRICING.facilityUpgradeCostFrom2,
  3: null,
};

/** Coste en YE para subir de nivel N a N+1 (usa GameSettings si se pasa). */
export function getUpgradeCost(
  currentLevel: FacilityLevel,
  costs: FacilityUpgradeCosts = DEFAULT_ECONOMY_PRICING,
): number | null {
  if (currentLevel === 0) return costs.facilityUpgradeCostFrom0;
  if (currentLevel === 1) return costs.facilityUpgradeCostFrom1;
  if (currentLevel === 2) return costs.facilityUpgradeCostFrom2;
  return null;
}

export type FacilityBenefit = {
  level: FacilityLevel;
  title: string;
  description: string;
};

export const FACILITY_BENEFITS: Record<FacilityId, FacilityBenefit[]> = {
  field: [
    { level: 1, title: 'Sin ventaja', description: 'Césped y porterías básicas. Sin bonificaciones especiales.' },
    { level: 2, title: 'Terreno elemental', description: '+5% a jugadores de ese elemento.' },
    { level: 3, title: 'Techo retráctil', description: 'Evita desventajas climáticas.' },
  ],
  stands: [
    { level: 1, title: 'Afición básica', description: '+5% de valor.' },
    { level: 2, title: 'Gradas animadas', description: '20% de recuperación de GP y TP.' },
    { level: 3, title: 'Ambiente hostil', description: '-10% de guts al rival.' },
  ],
  benches: [
    { level: 1, title: 'Banquillo activo', description: 'Reparte XP a los jugadores en el banquillo.' },
    { level: 2, title: 'Entrada en caliente', description: 'Si metes a un suplente, entra con +15% durante 2 turnos.' },
    { level: 3, title: 'Espionaje táctico', description: 'Una vez por partido, puedes espiar el comando elegido por tu oponente.' },
  ],
  shop: [
    { level: 1, title: 'Mostrador', description: '+15% de dinero y XP al ganar.' },
    { level: 2, title: 'Outlet', description: '20% de descuento en items.' },
    { level: 3, title: 'Mercado negociado', description: '20% de descuento en mercado libre.' },
  ],
  training: [
    { level: 1, title: 'Entrenamiento intensivo', description: '10% extra de XP por PE.' },
    { level: 2, title: 'Técnicas optimizadas', description: '10% menos de TP por supertecnica.' },
    { level: 3, title: 'Chapa maestra', description: 'Puedes repetir 1 tiro de chapa por partido.' },
  ],
  clinic: [
    { level: 1, title: 'Recuperación básica', description: '20% menos de desgaste de GP.' },
    { level: 2, title: 'Nutrición deportiva', description: '+50% de efecto en consumibles usados en partido.' },
    { level: 3, title: 'Segunda oportunidad', description: 'Si 1 jugador llega a 0 GP, se recupera al 30% una vez por partido.' },
  ],
  lab: [
    { level: 1, title: 'Análisis básico', description: '1 vez por partido puedes anular una falta.' },
    { level: 2, title: 'Datos elementales', description: 'Ignora desventajas elementales.' },
    { level: 3, title: 'Contra-inteligencia', description: 'Si el rival repite una supertecnica ya usada, pierde 10% de eficacia.' },
  ],
};

export type StartFacilityUpgradeResult = {
  success: true;
  facility: ClubFacilityRecord;
  newBalance: number;
};

export type ApproveFacilityResult = {
  success: true;
  facility: ClubFacilityRecord;
};

export type SetPitchElementResult = {
  success: true;
  facility: ClubFacilityRecord;
};
