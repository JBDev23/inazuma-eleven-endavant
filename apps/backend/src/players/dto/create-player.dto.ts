import { IsString, IsOptional, IsInt, Min, IsObject, IsBoolean } from 'class-validator';
import type { PlayerStats } from '@inazuma/shared';

export class CreatePlayerDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  jpName?: string;

  @IsString()
  position!: string; // GK, DF, MF, FW

  @IsString()
  element!: string; // Earth, Fire, Wind, Wood

  @IsOptional()
  @IsInt()
  @Min(1)
  season?: number;

  @IsOptional()
  @IsString()
  spriteUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  level?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  experience?: number;

  @IsObject()
  baseStats!: PlayerStats;

  @IsObject()
  maxStats!: PlayerStats;

  @IsInt()
  teamId!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isFreeAgent?: boolean;

  @IsOptional()
  @IsString()
  ownerId?: string | null;
}