import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  addExperience,
  applyShopWinnerXpBonus,
  applyMoveUsageProgress,
  aggregateMoveUsages,
  calculateMatchXp,
  computeBenchXpGrants,
  getDisplayStats,
  getShopWinnerYensBonus,
  resolveClubFacilities,
  resolveMatchWinnerClubId,
  type GameSettings,
  type MatchWinnerRewards,
  type MoveUsageGrant,
  type PlayerMatchParticipation,
} from '@inazuma/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { playerWithMovesInclude } from '../common/prisma-includes';
import { formatPlayerWithMoves } from '../common/format-player';
import { formatClubFacilities } from '../common/format-facility';
import { UpdateGameSettingsDto } from './dto/update-game-settings.dto';
import { UpsertSessionXpDto } from './dto/upsert-session-xp.dto';
import { ApplyMatchXpDto } from './dto/apply-match-xp.dto';

@Injectable()
export class GameSettingsService {
  constructor(private prisma: PrismaService) {}

  private async ensureSettings() {
    const existing = await this.prisma.gameSettings.findUnique({ where: { id: 1 } });
    if (!existing) {
      await this.prisma.gameSettings.create({
        data: {
          id: 1,
          currentSession: 1,
          basePlayerPrice: 15,
          playerPricePerLevel: 5,
          baseCoachPrice: 30,
          coachPricePerLevel: 10,
          playerPricePerPc: 1,
        },
      });
    }

    const sessionCount = await this.prisma.sessionXpConfig.count();
    if (sessionCount === 0) {
      await this.prisma.sessionXpConfig.create({
        data: {
          session: 1,
          minXp: 600,
          maxXp: 3500,
          pachangaMultiplier: 0.2,
          winnerRewardPp: 0,
          winnerRewardYens: 0,
          coachXpPerYe: 100,
        },
      });
    }

    return this.prisma.gameSettings.findUniqueOrThrow({ where: { id: 1 } });
  }

  private mapSessionConfig(c: {
    session: number;
    minXp: number;
    maxXp: number;
    pachangaMultiplier: number;
    winnerRewardPp: number;
    winnerRewardYens: number;
    coachXpPerYe: number;
  }) {
    return {
      session: c.session,
      minXp: c.minXp,
      maxXp: c.maxXp,
      pachangaMultiplier: c.pachangaMultiplier,
      winnerRewardPp: c.winnerRewardPp,
      winnerRewardYens: c.winnerRewardYens,
      coachXpPerYe: c.coachXpPerYe,
    };
  }

  async getSettings(): Promise<GameSettings> {
    await this.ensureSettings();

    const [settings, sessionConfigs] = await Promise.all([
      this.prisma.gameSettings.findUniqueOrThrow({ where: { id: 1 } }),
      this.prisma.sessionXpConfig.findMany({ orderBy: { session: 'asc' } }),
    ]);

    return {
      currentSession: settings.currentSession,
      basePlayerPrice: settings.basePlayerPrice,
      playerPricePerLevel: settings.playerPricePerLevel,
      baseCoachPrice: settings.baseCoachPrice,
      coachPricePerLevel: settings.coachPricePerLevel,
      playerPricePerPc: settings.playerPricePerPc,
      sessionConfigs: sessionConfigs.map((c) => this.mapSessionConfig(c)),
    };
  }

  async updateSettings(dto: UpdateGameSettingsDto) {
    await this.ensureSettings();

    await this.prisma.gameSettings.update({
      where: { id: 1 },
      data: {
        ...(dto.currentSession !== undefined && { currentSession: dto.currentSession }),
        ...(dto.basePlayerPrice !== undefined && { basePlayerPrice: dto.basePlayerPrice }),
        ...(dto.playerPricePerLevel !== undefined && {
          playerPricePerLevel: dto.playerPricePerLevel,
        }),
        ...(dto.baseCoachPrice !== undefined && { baseCoachPrice: dto.baseCoachPrice }),
        ...(dto.coachPricePerLevel !== undefined && {
          coachPricePerLevel: dto.coachPricePerLevel,
        }),
        ...(dto.playerPricePerPc !== undefined && { playerPricePerPc: dto.playerPricePerPc }),
      },
    });

    return this.getSettings();
  }

  async upsertSessionConfig(dto: UpsertSessionXpDto) {
    if (dto.maxXp < dto.minXp) {
      throw new BadRequestException('El máximo de XP debe ser mayor o igual al mínimo');
    }

    await this.prisma.sessionXpConfig.upsert({
      where: { session: dto.session },
      create: {
        session: dto.session,
        minXp: dto.minXp,
        maxXp: dto.maxXp,
        pachangaMultiplier: dto.pachangaMultiplier,
        winnerRewardPp: dto.winnerRewardPp,
        winnerRewardYens: dto.winnerRewardYens,
        coachXpPerYe: dto.coachXpPerYe,
      },
      update: {
        minXp: dto.minXp,
        maxXp: dto.maxXp,
        pachangaMultiplier: dto.pachangaMultiplier,
        winnerRewardPp: dto.winnerRewardPp,
        winnerRewardYens: dto.winnerRewardYens,
        coachXpPerYe: dto.coachXpPerYe,
      },
    });

    return this.getSettings();
  }

  async deleteSessionConfig(session: number) {
    const existing = await this.prisma.sessionXpConfig.findUnique({ where: { session } });
    if (!existing) {
      throw new NotFoundException(`No existe configuración para la sesión ${session}`);
    }

    await this.prisma.sessionXpConfig.delete({ where: { session } });
    return this.getSettings();
  }

  async applyMatchXp(dto: ApplyMatchXpDto) {
    const settings = await this.getSettings();
    const sessionConfig =
      settings.sessionConfigs.find((c) => c.session === settings.currentSession) ?? null;

    if (!sessionConfig) {
      throw new BadRequestException(
        `No hay configuración de XP para la sesión activa (${settings.currentSession})`,
      );
    }

    const playersFromDb = await this.prisma.player.findMany({
      where: { id: { in: dto.players.map((p) => p.playerId) } },
    });
    const playerMap = new Map(playersFromDb.map((p) => [p.id, p]));

    const participation: PlayerMatchParticipation[] = dto.players.map((p) => {
      const dbPlayer = playerMap.get(p.playerId);
      if (!dbPlayer) {
        throw new BadRequestException(`Jugador ${p.playerId} no encontrado`);
      }

      return {
        ...p,
        cleanSheet: p.cleanSheet ?? false,
        level: dbPlayer.level,
        experience: dbPlayer.experience,
        guts: p.guts ?? getDisplayStats(formatPlayerWithMoves(dbPlayer)!).guts,
      };
    });

    const matchXpBase = calculateMatchXp({
      format: dto.format,
      totalTurns: dto.totalTurns,
      sessionConfig,
      players: participation,
    });

    const [homeClub, awayClub] = await Promise.all([
      this.prisma.userClub.findUnique({
        where: { id: dto.homeClubId },
        include: {
          facilities: true,
          roster: { select: { id: true, name: true, isActiveRoster: true, position11: true, position4: true } },
        },
      }),
      this.prisma.userClub.findUnique({
        where: { id: dto.awayClubId },
        include: {
          facilities: true,
          roster: { select: { id: true, name: true, isActiveRoster: true, position11: true, position4: true } },
        },
      }),
    ]);

    if (!homeClub || !awayClub) {
      throw new BadRequestException('No se encontraron los clubes del partido');
    }

    const homeFacilities = resolveClubFacilities(formatClubFacilities(homeClub.facilities));
    const awayFacilities = resolveClubFacilities(formatClubFacilities(awayClub.facilities));

    const winnerClubId =
      dto.winnerClubId ??
      resolveMatchWinnerClubId(
        dto.homeClubId,
        dto.awayClubId,
        dto.homeScore,
        dto.awayScore,
      );
    const winnerSide =
      winnerClubId === dto.homeClubId
        ? 'home'
        : winnerClubId === dto.awayClubId
          ? 'away'
          : null;
    const winnerFacilities =
      winnerSide === 'home'
        ? homeFacilities
        : winnerSide === 'away'
          ? awayFacilities
          : resolveClubFacilities([]);

    const matchXp = {
      ...matchXpBase,
      players: applyShopWinnerXpBonus(
        matchXpBase.players,
        winnerSide,
        winnerFacilities,
        dto.format,
      ),
    };

    const playedIds = new Set(matchXp.players.map((player) => player.playerId));
    const posKey = dto.format === '4v4' ? 'position4' : 'position11';
    const benchForClub = (club: typeof homeClub) =>
      club.roster
        .filter((player) => player.isActiveRoster && !player[posKey] && !playedIds.has(player.id))
        .map((player) => ({ playerId: player.id, playerName: player.name }));

    const benchXpGrants = computeBenchXpGrants({
      format: dto.format,
      matchXp,
      homeBenchPlayers: benchForClub(homeClub),
      awayBenchPlayers: benchForClub(awayClub),
      homeFacilities,
      awayFacilities,
    });

    const winnerClubIdForRewards = winnerClubId;

    let winnerRewards: MatchWinnerRewards | null = null;
    if (
      winnerClubIdForRewards &&
      (sessionConfig.winnerRewardPp > 0 || sessionConfig.winnerRewardYens > 0)
    ) {
      const winnerClubFacilities =
        winnerClubIdForRewards === dto.homeClubId ? homeFacilities : awayFacilities;
      winnerRewards = {
        clubId: winnerClubIdForRewards,
        pp: sessionConfig.winnerRewardPp,
        yens: getShopWinnerYensBonus(
          sessionConfig.winnerRewardYens,
          winnerClubFacilities,
          dto.format,
        ),
      };
    }

    const grants = await this.prisma.$transaction(async (tx) => {
      const results: Array<{
        playerId: number;
        totalXp: number;
        leveledUp: boolean;
        newLevel: number;
        player: ReturnType<typeof formatPlayerWithMoves>;
      }> = [];
      const moveGrants: MoveUsageGrant[] = [];

      for (const breakdown of matchXp.players) {
        const player = playerMap.get(breakdown.playerId)!;
        const { level, experience, leveledUp } = addExperience(
          player.level,
          player.experience,
          breakdown.totalXp,
        );

        const updated = await tx.player.update({
          where: { id: breakdown.playerId },
          data: { level, experience },
          include: playerWithMovesInclude,
        });

        results.push({
          playerId: breakdown.playerId,
          totalXp: breakdown.totalXp,
          leveledUp,
          newLevel: level,
          player: formatPlayerWithMoves(updated),
        });
      }

      for (const benchGrant of benchXpGrants) {
        const player = await tx.player.findUnique({ where: { id: benchGrant.playerId } });
        if (!player) continue;

        const { level, experience, leveledUp } = addExperience(
          player.level,
          player.experience,
          benchGrant.xp,
        );

        const updated = await tx.player.update({
          where: { id: benchGrant.playerId },
          data: { level, experience },
          include: playerWithMovesInclude,
        });

        results.push({
          playerId: benchGrant.playerId,
          totalXp: benchGrant.xp,
          leveledUp,
          newLevel: level,
          player: formatPlayerWithMoves(updated),
        });
      }

      const formatLabel = dto.format === '4v4' ? 'Pachanga' : 'Partido oficial';
      const xpDescription = `${formatLabel} sesión ${settings.currentSession} (${dto.homeScore}-${dto.awayScore})`;

      for (const clubId of [dto.homeClubId, dto.awayClubId]) {
        await tx.transaction.create({
          data: {
            clubId,
            description: xpDescription,
            type: 'INTERNAL',
          },
        });
      }

      if (winnerRewards) {
        await tx.userClub.update({
          where: { id: winnerRewards.clubId },
          data: {
            pp: { increment: winnerRewards.pp },
            yens: { increment: winnerRewards.yens },
          },
        });

        await tx.transaction.create({
          data: {
            clubId: winnerRewards.clubId,
            description: `Victoria ${dto.homeScore}-${dto.awayScore}`,
            amountPP: winnerRewards.pp,
            amountYens: winnerRewards.yens,
            type: 'INTERNAL',
          },
        });
      }

      if (dto.consumableUsages?.length) {
        const validClubIds = new Set([dto.homeClubId, dto.awayClubId]);
        const usageCounts = new Map<string, number>();

        for (const usage of dto.consumableUsages) {
          if (!validClubIds.has(usage.clubId)) {
            throw new BadRequestException(`Club ${usage.clubId} no participó en este partido`);
          }

          const player = playerMap.get(usage.playerId);
          if (!player || player.ownerId !== usage.clubId) {
            throw new BadRequestException(
              `El jugador ${usage.playerId} no pertenece al club ${usage.clubId}`,
            );
          }

          const key = `${usage.clubId}:${usage.consumableId}`;
          usageCounts.set(key, (usageCounts.get(key) ?? 0) + 1);
        }

        for (const [key, count] of usageCounts.entries()) {
          const [clubId, consumableIdRaw] = key.split(':');
          const consumableId = Number(consumableIdRaw);

          const clubItem = await tx.clubConsumable.findUnique({
            where: { clubId_consumableId: { clubId, consumableId } },
            include: { consumable: true },
          });

          if (!clubItem || clubItem.quantity < count) {
            const name = clubItem?.consumable.name ?? `ID ${consumableId}`;
            throw new BadRequestException(
              `Inventario insuficiente de "${name}" en el club`,
            );
          }

          const nextQuantity = clubItem.quantity - count;
          if (nextQuantity <= 0) {
            await tx.clubConsumable.delete({
              where: { clubId_consumableId: { clubId, consumableId } },
            });
          } else {
            await tx.clubConsumable.update({
              where: { clubId_consumableId: { clubId, consumableId } },
              data: { quantity: nextQuantity },
            });
          }

          await tx.transaction.create({
            data: {
              clubId,
              description: `${count}× ${clubItem.consumable.name} usado(s) en partido`,
              type: 'INTERNAL',
            },
          });
        }
      }

      if (dto.moveUsages?.length) {
        const validClubIds = new Set([dto.homeClubId, dto.awayClubId]);
        const aggregated = aggregateMoveUsages(dto.moveUsages);

        for (const usage of dto.moveUsages) {
          if (!validClubIds.has(usage.clubId)) {
            throw new BadRequestException(`Club ${usage.clubId} no participó en este partido`);
          }

          const player = playerMap.get(usage.playerId);
          if (!player || player.ownerId !== usage.clubId) {
            throw new BadRequestException(
              `El jugador ${usage.playerId} no pertenece al club ${usage.clubId}`,
            );
          }
        }

        for (const { playerId, moveId, count } of aggregated.values()) {
          const playerMove = await tx.playerMove.findUnique({
            where: { playerId_moveId: { playerId, moveId } },
            include: { move: true },
          });

          if (!playerMove) {
            throw new BadRequestException(
              `El jugador ${playerId} no tiene la técnica ${moveId}`,
            );
          }

          const progress = applyMoveUsageProgress(
            playerMove.uses,
            playerMove.moveLevel,
            playerMove.move.evolutionPath,
            playerMove.move.evolutionSpeed,
            count,
          );

          await tx.playerMove.update({
            where: { playerId_moveId: { playerId, moveId } },
            data: {
              uses: progress.uses,
              moveLevel: progress.moveLevel,
            },
          });

          moveGrants.push({
            playerId,
            moveId,
            moveName: playerMove.move.name,
            usesAdded: count,
            newUses: progress.uses,
            newMoveLevel: progress.moveLevel,
            leveledUp: progress.leveledUp,
            levelsGained: progress.levelsGained,
          });

          await tx.transaction.create({
            data: {
              clubId: playerMap.get(playerId)!.ownerId!,
              description: `${count}× ${playerMove.move.name} usada(s) en partido`,
              type: 'INTERNAL',
            },
          });
        }
      }

      return { results, moveGrants };
    });

    return {
      success: true as const,
      matchXp,
      winnerRewards,
      grants: grants.results.map((g) => ({
        playerId: g.playerId,
        totalXp: g.totalXp,
        leveledUp: g.leveledUp,
        newLevel: g.newLevel,
      })),
      moveGrants: grants.moveGrants,
    };
  }
}
