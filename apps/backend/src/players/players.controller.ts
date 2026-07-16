import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { BulkUpdatePlayersDto } from './dto/bulk-update-players.dto';
import { BulkReleasePlayersDto } from './dto/bulk-release-players.dto';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  create(@Body() createPlayerDto: CreatePlayerDto) {
    return this.playersService.create(createPlayerDto);
  }

  @Get()
  findAll() {
    return this.playersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playersService.findOne(+id);
  }

  @Patch('bulk')
  bulkUpdate(@Body() dto: BulkUpdatePlayersDto) {
    const { playerIds, ...updateData } = dto;
    return this.playersService.bulkUpdate(playerIds, updateData);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlayerDto: UpdatePlayerDto) {
    return this.playersService.update(+id, updatePlayerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.playersService.remove(+id);
  }

  @Post('release')
  release(@Body() body: { playerId: number }) {
    return this.playersService.release(body.playerId);
  }

  @Post('bulk-release')
  bulkRelease(@Body() body: BulkReleasePlayersDto) {
    return this.playersService.bulkRelease(body.playerIds);
  }
}
