import { Type } from 'class-transformer';
import { IsInt, IsNumber, Max, Min } from 'class-validator';

export class UpsertSessionXpDto {
  @IsInt()
  @Min(1)
  session: number;

  @IsInt()
  @Min(0)
  minXp: number;

  @IsInt()
  @Min(0)
  maxXp: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  pachangaMultiplier: number;

  @IsInt()
  @Min(0)
  winnerRewardPp: number;

  @IsInt()
  @Min(0)
  winnerRewardYens: number;

  @IsInt()
  @Min(0)
  coachXpPerYe: number;
}
