import { IsArray, IsInt, ArrayMinSize } from 'class-validator';

export class BulkReleasePlayersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  playerIds: number[];
}
