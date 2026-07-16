import { IsString, IsInt, IsNumber, Min, Max, IsOptional, IsIn } from 'class-validator';
import type { MoveType, EvolutionPath, EvolutionSpeed } from '@inazuma/shared';

const MOVE_TYPES: MoveType[] = ['SHOOT', 'DRIBBLE', 'BLOCK', 'CATCH', 'SKILL'];
const EVOLUTION_PATHS: EvolutionPath[] = ['SHIN', 'L_G', 'NONE'];
const EVOLUTION_SPEEDS: EvolutionSpeed[] = ['FAST', 'MEDIUM', 'SLOW', 'NONE'];

export class CreateMoveDto {
  @IsString()
  name!: string;

  @IsIn(MOVE_TYPES)
  type!: MoveType;

  @IsString()
  element!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  foulRate!: number;

  @IsInt()
  @Min(0)
  basePower!: number;

  @IsInt()
  @Min(0)
  maxPower!: number;

  @IsInt()
  @Min(0)
  tpCost!: number;

  @IsOptional()
  @IsString()
  secondaryType?: string;

  @IsIn(EVOLUTION_PATHS)
  evolutionPath!: EvolutionPath;

  @IsIn(EVOLUTION_SPEEDS)
  evolutionSpeed!: EvolutionSpeed;
}