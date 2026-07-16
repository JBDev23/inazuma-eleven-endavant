import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { UpdatePlayerDto } from './update-player.dto';

export class BulkUpdatePlayersDto extends UpdatePlayerDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  playerIds: number[];
}
