import {
  DEFAULT_SPORTS_CITY,
  FACILITY_IDS,
  type ClubFacilityRecord,
  type FacilityId,
  type FacilityLevel,
} from '@inazuma/shared';
import { FacilityType } from '@prisma/client';

const FACILITY_TO_PRISMA: Record<FacilityId, FacilityType> = {
  field: FacilityType.FIELD,
  stands: FacilityType.STANDS,
  benches: FacilityType.BENCHES,
  shop: FacilityType.SHOP,
  training: FacilityType.TRAINING,
  clinic: FacilityType.CLINIC,
  lab: FacilityType.LAB,
};

const PRISMA_TO_FACILITY: Record<FacilityType, FacilityId> = {
  [FacilityType.FIELD]: 'field',
  [FacilityType.STANDS]: 'stands',
  [FacilityType.BENCHES]: 'benches',
  [FacilityType.SHOP]: 'shop',
  [FacilityType.TRAINING]: 'training',
  [FacilityType.CLINIC]: 'clinic',
  [FacilityType.LAB]: 'lab',
};

export function facilityIdToPrisma(id: FacilityId): FacilityType {
  return FACILITY_TO_PRISMA[id];
}

export function facilityIdFromPrisma(type: FacilityType): FacilityId {
  return PRISMA_TO_FACILITY[type];
}

export function formatClubFacility(raw: {
  facility: FacilityType;
  level: number;
  upgradingTo: number | null;
  pitchElement?: string | null;
}): ClubFacilityRecord {
  return {
    facilityId: facilityIdFromPrisma(raw.facility),
    level: raw.level as FacilityLevel,
    upgradingTo: raw.upgradingTo as FacilityLevel | null,
    pitchElement: raw.pitchElement ?? null,
  };
}

export function formatClubFacilities(
  rawFacilities: Array<{
    facility: FacilityType;
    level: number;
    upgradingTo: number | null;
    pitchElement?: string | null;
  }>,
): ClubFacilityRecord[] {
  const byId = new Map(
    rawFacilities.map((f) => [facilityIdFromPrisma(f.facility), formatClubFacility(f)]),
  );

  return FACILITY_IDS.map((id) => {
    const existing = byId.get(id);
    if (existing) return existing;
    return {
      facilityId: id,
      level: DEFAULT_SPORTS_CITY[id],
      upgradingTo: null,
      pitchElement: null,
    };
  });
}

export const DEFAULT_FACILITY_LEVELS: Record<FacilityType, number> = {
  [FacilityType.FIELD]: DEFAULT_SPORTS_CITY.field,
  [FacilityType.STANDS]: DEFAULT_SPORTS_CITY.stands,
  [FacilityType.BENCHES]: DEFAULT_SPORTS_CITY.benches,
  [FacilityType.SHOP]: DEFAULT_SPORTS_CITY.shop,
  [FacilityType.TRAINING]: DEFAULT_SPORTS_CITY.training,
  [FacilityType.CLINIC]: DEFAULT_SPORTS_CITY.clinic,
  [FacilityType.LAB]: DEFAULT_SPORTS_CITY.lab,
};

export const ALL_FACILITY_TYPES = FACILITY_IDS.map((id) => FACILITY_TO_PRISMA[id]);
