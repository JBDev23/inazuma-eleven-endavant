import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { UpdateTeamMapDto } from './update-team-map.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(+id);
  }

  @Get('players/:teamId')
  getPlayersByTeam(@Param('teamId') teamId: string) {
    return this.teamsService.getPlayersByTeam(teamId);
  }

  @Patch(':teamId/map')
  async saveTeamMap(
    @Param('teamId') teamId: string, 
    @Body() mapData: UpdateTeamMapDto
  ) {
    return this.teamsService.saveMap(teamId, mapData);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(+id, dto);
  }
}
