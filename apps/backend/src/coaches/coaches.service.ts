import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CoachModifiers } from '@inazuma/shared';
import { buildBaseModifiersFromMax, STAT_KEYS } from '@inazuma/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { coachWithFormationsInclude } from '../common/prisma-includes';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';

function normalizeCoachModifiers(value: unknown): CoachModifiers | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const out = {} as CoachModifiers;

  for (const key of STAT_KEYS) {
    const n = record[key as string];
    if (typeof n !== 'number') return null;
    out[key] = n;
  }

  return out;
}

@Injectable()
export class CoachesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCoachDto: CreateCoachDto) {
    const data: any = {
      name: createCoachDto.name,
      teamId: createCoachDto.teamId,
      nickname: createCoachDto.nickname ?? null,
      spriteUrl: createCoachDto.spriteUrl ?? null,
    };

    if (createCoachDto.season !== undefined) data.season = createCoachDto.season;
    if (createCoachDto.price !== undefined) data.price = createCoachDto.price;
    if (createCoachDto.level !== undefined) data.level = createCoachDto.level;
    if (createCoachDto.experience !== undefined) data.experience = createCoachDto.experience;

    if (createCoachDto.ownerId !== undefined) data.ownerId = createCoachDto.ownerId;
    if (createCoachDto.isFreeAgent !== undefined) data.isFreeAgent = createCoachDto.isFreeAgent;

    if (createCoachDto.ownerId !== undefined && createCoachDto.ownerId !== null) {
      // Si tiene dueño, forzamos que no sea agente libre.
      data.isFreeAgent = false;
    }

    // JSON fields: normalizamos/validamos para evitar NaNs al recalcular.
    if (createCoachDto.maxModifiers !== undefined) {
      const maxModifiers = normalizeCoachModifiers(createCoachDto.maxModifiers);
      if (!maxModifiers) {
        throw new BadRequestException(
          'maxModifiers debe ser un objeto con todas las claves de stats numéricas',
        );
      }
      data.maxModifiers = maxModifiers as unknown as Prisma.InputJsonValue;
      data.baseModifiers = buildBaseModifiersFromMax(maxModifiers) as unknown as Prisma.InputJsonValue;
    } else if (createCoachDto.baseModifiers !== undefined) {
      const baseModifiers = normalizeCoachModifiers(createCoachDto.baseModifiers);
      if (!baseModifiers) {
        throw new BadRequestException(
          'baseModifiers debe ser un objeto con todas las claves de stats numéricas',
        );
      }
      data.baseModifiers = baseModifiers as unknown as Prisma.InputJsonValue;
    }

    return this.prisma.coach.create({ data });
  }

  async findAll() {
    return this.prisma.coach.findMany({
      orderBy: { id: 'asc' },
      include: coachWithFormationsInclude,
    });
  }

  async findOne(id: number) {
    const coach = await this.prisma.coach.findUnique({
      where: { id },
      include: coachWithFormationsInclude,
    });
    if (!coach) {
      throw new NotFoundException(`Entrenador con ID ${id} no encontrado.`);
    }
    return coach;
  }

  async update(id: number, updateCoachDto: UpdateCoachDto) {
    await this.findOne(id);

    const data: any = {};

    if (updateCoachDto.name !== undefined) data.name = updateCoachDto.name;
    if (updateCoachDto.nickname !== undefined) data.nickname = updateCoachDto.nickname ?? null;
    if (updateCoachDto.spriteUrl !== undefined) data.spriteUrl = updateCoachDto.spriteUrl ?? null;
    if (updateCoachDto.season !== undefined) data.season = updateCoachDto.season;
    if (updateCoachDto.price !== undefined) data.price = updateCoachDto.price;
    if (updateCoachDto.level !== undefined) data.level = updateCoachDto.level;
    if (updateCoachDto.experience !== undefined) data.experience = updateCoachDto.experience;
    if (updateCoachDto.teamId !== undefined) data.teamId = updateCoachDto.teamId;

    if (updateCoachDto.ownerId !== undefined) data.ownerId = updateCoachDto.ownerId;
    if (updateCoachDto.isFreeAgent !== undefined) data.isFreeAgent = updateCoachDto.isFreeAgent;

    if (updateCoachDto.ownerId !== undefined && updateCoachDto.ownerId !== null) {
      data.isFreeAgent = false;
    }

    if (updateCoachDto.maxModifiers !== undefined) {
      const maxModifiers = normalizeCoachModifiers(updateCoachDto.maxModifiers);
      if (!maxModifiers) {
        throw new BadRequestException(
          'maxModifiers debe ser un objeto con todas las claves de stats numéricas',
        );
      }
      data.maxModifiers = maxModifiers as unknown as Prisma.InputJsonValue;
      data.baseModifiers = buildBaseModifiersFromMax(maxModifiers) as unknown as Prisma.InputJsonValue;
    } else if (updateCoachDto.baseModifiers !== undefined) {
      const baseModifiers = normalizeCoachModifiers(updateCoachDto.baseModifiers);
      if (!baseModifiers) {
        throw new BadRequestException(
          'baseModifiers debe ser un objeto con todas las claves de stats numéricas',
        );
      }
      data.baseModifiers = baseModifiers as unknown as Prisma.InputJsonValue;
    }

    try {
      return await this.prisma.coach.update({
        where: { id },
        data,
      });
    } catch {
      throw new ConflictException('No se pudo actualizar el entrenador.');
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      return await this.prisma.coach.delete({
        where: { id },
      });
    } catch {
      throw new ConflictException('No puedes eliminar un entrenador que está en uso.');
    }
  }

  async release(coachId: number) {
    await this.findOne(coachId);

    return this.prisma.$transaction(async (tx) => {
      await tx.userClub.updateMany({
        where: { activeCoachId: coachId },
        data: { activeCoachId: null },
      });

      return tx.coach.update({
        where: { id: coachId },
        data: { ownerId: null, isFreeAgent: true },
      });
    });
  }
}

