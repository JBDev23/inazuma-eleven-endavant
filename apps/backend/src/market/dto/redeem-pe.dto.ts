import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, ValidateNested } from 'class-validator';

export class PeAllocationDto {
  @IsInt()
  playerId!: number;
}

export class RedeemPeDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PeAllocationDto)
  allocations!: PeAllocationDto[];
}
