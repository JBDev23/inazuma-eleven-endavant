import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, ValidateNested } from 'class-validator';

class RosterPositionDto {
  @IsInt()
  playerId!: number;

  @IsBoolean()
  isActiveRoster!: boolean;

  @IsOptional()
  @IsInt()
  position11!: number | null;

  @IsOptional()
  @IsInt()
  position4!: number | null;
}

export class UpdateRosterDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RosterPositionDto)
  roster!: RosterPositionDto[];
}
