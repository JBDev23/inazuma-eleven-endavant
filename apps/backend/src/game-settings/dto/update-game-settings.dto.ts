import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateGameSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  currentSession?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  basePlayerPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  playerPricePerLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  baseCoachPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  coachPricePerLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  playerPricePerPc?: number;
}
