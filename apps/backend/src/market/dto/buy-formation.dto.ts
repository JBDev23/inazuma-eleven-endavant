import { IsInt, Min } from 'class-validator';

export class BuyFormationDto {
  @IsInt()
  @Min(1)
  formationId!: number;
}
