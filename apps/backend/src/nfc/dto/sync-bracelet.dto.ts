import { IsBoolean, IsInt, Min } from 'class-validator';

export class SyncBraceletDto {
  @IsBoolean()
  active!: boolean;

  @IsInt()
  @Min(0)
  pp!: number;

  @IsInt()
  @Min(0)
  pe!: number;

  @IsInt()
  @Min(0)
  ye!: number;

  @IsInt()
  @Min(0)
  pc!: number;

  @IsInt()
  @Min(1)
  team!: number;
}
