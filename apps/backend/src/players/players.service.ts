import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import {
  addExperience,
  type PlayerWithDetails,
} from '@inazuma/shared';
import { playerWithMovesInclude } from '../common/prisma-includes';
import {
  enrichPlayerWithEquipment,
  enrichPlayersWithEquipment,
} from '../common/format-player';
import { rosterResetData } from '../common/player-roster';
import { getEconomyPricing } from '../common/economy-pricing';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  private async formatPlayer(raw: Parameters<typeof enrichPlayerWithEquipment>[0]) {
    const economy = await getEconomyPricing(this.prisma);
    return enrichPlayerWithEquipment(raw, economy);
  }

  private async formatPlayers(raw: Parameters<typeof enrichPlayersWithEquipment>[0]) {
    const economy = await getEconomyPricing(this.prisma);
    return enrichPlayersWithEquipment(raw, economy);
  }

  async create(createPlayerDto: CreatePlayerDto) {
    const player = await this.prisma.player.create({
      data: createPlayerDto,
      include: playerWithMovesInclude,
    });
    return this.formatPlayer(player);
  }

  async findAll() {
    const players = await this.prisma.player.findMany({
      include: playerWithMovesInclude,
    });
    return this.formatPlayers(players);
  }

  async findOne(id: number) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      include: playerWithMovesInclude,
    });

    if (!player) {
      throw new NotFoundException(`Player with id ${id} not found`);
    }

    return this.formatPlayer(player);
  }

  async update(id: number, updatePlayerDto: UpdatePlayerDto) {
    const player = await this.prisma.player.findUnique({ where: { id } });

    if (!player) {
      throw new NotFoundException(`Player with id ${id} not found`);
    }

    const hasOwnerIdInDto = 'ownerId' in updatePlayerDto;
    const newOwnerId = hasOwnerIdInDto ? (updatePlayerDto.ownerId ?? null) : player.ownerId;
    const oldOwnerId = player.ownerId;
    const ownerChanging = hasOwnerIdInDto && newOwnerId !== oldOwnerId;

    // Precio dinámico: ignoramos price estático del DTO
    const { price: _ignoredPrice, ...safeDto } = updatePlayerDto as UpdatePlayerDto & {
      price?: number;
    };

    const updated = await this.prisma.$transaction(async (tx) => {
      const data: UpdatePlayerDto = { ...safeDto };

      if (hasOwnerIdInDto && newOwnerId) {
        data.isFreeAgent = false;
      }

      if (ownerChanging) {
        Object.assign(data, rosterResetData);
      }

      const result = await tx.player.update({
        where: { id },
        data,
        include: playerWithMovesInclude,
      });

      if (ownerChanging) {
        if (oldOwnerId) {
          await tx.unlockedNode.deleteMany({
            where: { userClubId: oldOwnerId, playerId: id },
          });
        }

        if (newOwnerId) {
          await this.ensureNodeUnlocked(tx, newOwnerId, id);
        }
      }

      return result;
    });

    return this.formatPlayer(updated);
  }

  async remove(id: number) {
    const player = await this.prisma.player.findUnique({ where: { id } });

    if (!player) {
      throw new NotFoundException(`Player with id ${id} not found`);
    }

    const deleted = await this.prisma.player.delete({
      where: { id },
      include: playerWithMovesInclude,
    });
    return this.formatPlayer(deleted);
  }

  async bulkUpdate(playerIds: number[], updatePlayerDto: UpdatePlayerDto) {
    const uniqueIds = [...new Set(playerIds)];
    const { price: _ignoredPrice, ...safeDto } = updatePlayerDto as UpdatePlayerDto & {
      price?: number;
    };
    const players = await this.updateMany(uniqueIds, safeDto);
    return { updated: players.length, players };
  }

  async bulkRelease(playerIds: number[]) {
    const uniqueIds = [...new Set(playerIds)];
    const players: PlayerWithDetails[] = [];

    for (const id of uniqueIds) {
      const player = await this.prisma.player.findUnique({ where: { id } });
      if (player?.ownerId) {
        const released = await this.release(id);
        if (released) players.push(released);
      }
    }

    return { released: players.length, skipped: uniqueIds.length - players.length };
  }

  private async updateMany(
    playerIds: number[],
    updatePlayerDto: UpdatePlayerDto,
  ): Promise<PlayerWithDetails[]> {
    const results: PlayerWithDetails[] = [];
    for (const id of playerIds) {
      const updated = await this.update(id, updatePlayerDto);
      if (updated) results.push(updated);
    }
    return results;
  }

  async release(playerId: number) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });

    if (!player) {
      throw new NotFoundException(`Player with id ${playerId} not found`);
    }

    const previousOwnerId = player.ownerId;

    const released = await this.prisma.$transaction(async (tx) => {
      if (previousOwnerId) {
        await tx.unlockedNode.deleteMany({
          where: { userClubId: previousOwnerId, playerId },
        });
      }

      return tx.player.update({
        where: { id: playerId },
        data: {
          ownerId: null,
          isFreeAgent: true,
          ...rosterResetData,
        },
        include: playerWithMovesInclude,
      });
    });

    return this.formatPlayer(released);
  }

  private async ensureNodeUnlocked(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    userClubId: string,
    playerId: number,
  ) {
    const existing = await tx.unlockedNode.findFirst({
      where: { userClubId, playerId },
    });

    if (!existing) {
      await tx.unlockedNode.create({
        data: { userClubId, playerId },
      });
    }
  }
  
  async grantExperienceToPlayer(playerId: number, xpAmount: number) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) throw new BadRequestException('Jugador no encontrado');

    if (player.level >= 50) {
      const maxLevelPlayer = await this.prisma.player.findUnique({
        where: { id: playerId },
        include: playerWithMovesInclude,
      });
      return {
        message: 'El jugador ya está al nivel máximo',
        player: await this.formatPlayer(maxLevelPlayer),
      };
    }

    const { level, experience, leveledUp } = addExperience(
      player.level,
      player.experience,
      xpAmount,
    );

    const updatedPlayer = await this.prisma.player.update({
      where: { id: playerId },
      data: {
        level,
        experience,
      },
      include: playerWithMovesInclude,
    });

    return {
      success: true,
      xpGained: xpAmount,
      leveledUp,
      newLevel: level,
      currentXp: experience,
      player: await this.formatPlayer(updatedPlayer),
    };
  }
}
