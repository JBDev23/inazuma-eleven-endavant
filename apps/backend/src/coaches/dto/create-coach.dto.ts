import { IsBoolean, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
import type { CoachModifiers } from '@inazuma/shared';

export class CreateCoachDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  nickname?: string | null;

  @IsOptional()
  @IsString()
  spriteUrl?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  season?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  level?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  experience?: number;

  // Multiplicadores máximos que guarda la DB.
  // `baseModifiers` se puede recalcular desde maxModifiers, así evitamos inconsistencias.
  @IsOptional()
  @IsObject()
  maxModifiers?: CoachModifiers;

  @IsOptional()
  @IsObject()
  baseModifiers?: CoachModifiers;

  @IsOptional()
  @IsBoolean()
  isFreeAgent?: boolean;

  @IsInt()
  @Min(1)
  teamId!: number;

  // Relación opcional con un `UserClub`.
  @IsOptional()
  @IsString()
  ownerId?: string | null;
}

