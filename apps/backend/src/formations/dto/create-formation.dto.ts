import { IsString, IsInt, Min, IsIn, IsOptional } from 'class-validator';
import type { FormationType } from '@inazuma/shared';

const FORMATION_TYPES: FormationType[] = ['OFFENSIVE', 'DEFENSIVE', 'BALANCED'];

export class CreateFormationDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  playerCount!: number;

  @IsIn(FORMATION_TYPES)
  type!: FormationType;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  /** Líneas de campo, p. ej. "4-3-3" o [4, 3, 3] */
  positions!: string | number[];
}
