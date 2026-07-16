import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, ValidateNested } from 'class-validator';

export class YeAllocationDto {
  @IsInt()
  coachId!: number;
}

export class RedeemYeDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => YeAllocationDto)
  allocations!: YeAllocationDto[];
}
