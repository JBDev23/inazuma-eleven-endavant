import { IsInt, Min } from 'class-validator';

export class ActivateFormationDto {
  @IsInt()
  @Min(1)
  formationId!: number;
}
