import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateUserClubDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  password?: string;

  @IsOptional()
  @IsString()
  baseTeamSlug?: string | null;

  @IsOptional()
  @IsString()
  shieldUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  pp?: number;

  @IsOptional()
  @IsInt()
  activeCoachId?: number | null;
}
