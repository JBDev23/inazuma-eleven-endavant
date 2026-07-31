import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateTeamMapDto } from './update-team-map.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { playerWithMovesInclude } from '../common/prisma-includes';
import { enrichPlayersWithEquipment, formatTeamWithPlayers } from '../common/format-player';
import { getEconomyPricing } from '../common/economy-pricing';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const [teams, economy] = await Promise.all([
      this.prisma.team.findMany({
        include: {
          players: { include: playerWithMovesInclude },
        },
        orderBy: { name: 'asc' },
      }),
      getEconomyPricing(this.prisma),
    ]);
    return teams.map((team) => formatTeamWithPlayers(team, economy));
  }

  async findOne(id: number) {
    const [team, economy] = await Promise.all([
      this.prisma.team.findUnique({
        where: { id },
        include: {
          players: { include: playerWithMovesInclude },
        },
      }),
      getEconomyPricing(this.prisma),
    ]);

    if (!team) {
      throw new NotFoundException(`Team with id ${id} not found`);
    }

    return formatTeamWithPlayers(team, economy);
  }

  async getPlayersByTeam(teamId: string) {
    console.log('getPlayersByTeam', teamId);
    const [team, economy] = await Promise.all([
      this.prisma.team.findUnique({
        where: { id: parseInt(teamId, 10) },
        include: {
          players: { include: playerWithMovesInclude },
        },
      }),
      getEconomyPricing(this.prisma),
    ]);

    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }

    if (!team.players) {
      throw new NotFoundException(`No players found for team ${teamId}`);
    }

    return enrichPlayersWithEquipment(team.players, economy);
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

  async update(id: number, dto: UpdateTeamDto) {
    const existing = await this.prisma.team.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Team with id ${id} not found`);
    }

    try {
      return await this.prisma.team.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un equipo con ese nombre o slug.');
      }
      throw error;
    }
  }
}
