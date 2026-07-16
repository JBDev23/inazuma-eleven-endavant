import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { FACILITY_IDS, PITCH_ELEMENTS, type FacilityId } from '@inazuma/shared';

export class StartFacilityUpgradeDto {
  @IsIn(FACILITY_IDS)
  facilityId!: FacilityId;
}

export class SetPitchElementDto {
  @IsIn(PITCH_ELEMENTS)
  pitchElement!: (typeof PITCH_ELEMENTS)[number];
}

export class AdminUpdateFacilityDto {
  @IsIn(FACILITY_IDS)
  facilityId!: FacilityId;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  level?: number;

  @IsOptional()
  approveConstruction?: boolean;
}
