import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class PlayerParticipationDto {
  @IsInt()
  playerId: number;

  @IsString()
  playerName: string;

  @IsIn(['home', 'away'])
  side: 'home' | 'away';

  @IsInt()
  @Min(0)
  turnsOnField: number;

  @IsInt()
  @Min(0)
  duelsPlayed: number;

  @IsInt()
  @Min(0)
  duelsWon: number;

  @IsInt()
  @Min(0)
  goals: number;

  @IsInt()
  @Min(0)
  saves: number;

  @IsInt()
  @Min(0)
  possessionTurns: number;

  @IsOptional()
  @IsBoolean()
  cleanSheet?: boolean;

  @IsInt()
  @Min(1)
  level: number;

  @IsInt()
  @Min(0)
  experience: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  guts?: number;
}

class ConsumableUsageDto {
  @IsString()
  clubId: string;

  @IsInt()
  playerId: number;

  @IsInt()
  consumableId: number;

  @IsInt()
  @Min(1)
  turn: number;
}

class MoveUsageDto {
  @IsString()
  clubId: string;

  @IsInt()
  playerId: number;

  @IsInt()
  moveId: number;

  @IsInt()
  @Min(1)
  turn: number;
}

export class ApplyMatchXpDto {
  @IsIn(['11v11', '4v4'])
  format: '11v11' | '4v4';

  @IsInt()
  @Min(1)
  totalTurns: number;

  @IsString()
  homeClubId: string;

  @IsString()
  awayClubId: string;

  @IsInt()
  @Min(0)
  homeScore: number;

  @IsInt()
  @Min(0)
  awayScore: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerParticipationDto)
  players: PlayerParticipationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumableUsageDto)
  consumableUsages?: ConsumableUsageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MoveUsageDto)
  moveUsages?: MoveUsageDto[];

  @IsOptional()
  @IsString()
  winnerClubId?: string | null;
}
