import { IsIn, IsInt } from 'class-validator';
import { STAT_KEYS, type StatKey } from '@inazuma/shared';

export class SpendPcDto {
  @IsInt()
  playerId!: number;

  @IsIn(STAT_KEYS)
  statKey!: StatKey;
}
