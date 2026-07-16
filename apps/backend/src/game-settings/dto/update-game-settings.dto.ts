import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateGameSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  currentSession?: number;
}
