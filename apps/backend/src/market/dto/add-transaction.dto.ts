import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class AddTransactionDto {
  @IsInt()
  amountPP!: number;

  @IsInt()
  amountPE!: number;

  @IsInt()
  amountYens!: number;

  @IsInt()
  amountPC!: number;

  @IsString()
  @IsNotEmpty()
  description!: string;
}
