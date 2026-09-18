import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { STAT_KEYS, type StatKey } from '@inazuma/shared';

export class SpendPcDto {
  @IsInt()
  playerId!: number;

  @IsIn(STAT_KEYS)
  statKey!: StatKey;

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;
}
