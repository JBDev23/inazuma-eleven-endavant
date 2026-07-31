import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateUserClubDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  @IsOptional()
  @IsString()
  baseTeamSlug?: string | null;

  @IsOptional()
  @IsString()
  shieldUrl?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  pp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pe?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  yens?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pc?: number;
}
