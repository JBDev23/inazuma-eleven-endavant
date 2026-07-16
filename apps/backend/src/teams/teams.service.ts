import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateTeamMapDto } from './update-team-map.dto';
import { playerWithMovesInclude } from '../common/prisma-includes';
import { formatPlayersWithMoves, formatTeamWithPlayers } from '../common/format-player';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const teams = await this.prisma.team.findMany({
      include: {
        players: { include: playerWithMovesInclude },
      },
    });
    return teams.map((team) => formatTeamWithPlayers(team));
  }

  async findOne(id: number) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        players: { include: playerWithMovesInclude },
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with id ${id} not found`);
    }

    return formatTeamWithPlayers(team);
  }

  async getPlayersByTeam(teamId: string) {
    console.log('getPlayersByTeam', teamId);
    const team = await this.prisma.team.findUnique({
      where: { id: parseInt(teamId, 10) },
      include: {
        players: { include: playerWithMovesInclude },
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }

    if (!team.players) {
      throw new NotFoundException(`No players found for team ${teamId}`);
    }

    return formatPlayersWithMoves(team.players);
  }

  async saveMap(teamId: string, mapData: UpdateTeamMapDto) {
    console.log('saveMap', teamId, mapData);
    return this.prisma.team.update({
      where: { id: parseInt(teamId, 10) },
      data: {
        mapData: mapData as any, 
      },
    });
  }
}
