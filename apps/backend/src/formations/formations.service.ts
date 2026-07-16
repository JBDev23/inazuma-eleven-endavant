import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';

@Injectable()
export class FormationsService {
  constructor(private prisma: PrismaService) {}

  async create(createFormationDto: CreateFormationDto) {
    const existing = await this.prisma.formation.findUnique({
      where: { name: createFormationDto.name },
    });

    if (existing) {
      throw new ConflictException(`La formación "${createFormationDto.name}" ya existe.`);
    }

    return this.prisma.formation.create({
      data: {
        ...createFormationDto,
        type: createFormationDto.type as Prisma.FormationCreateInput['type'],
        positions: createFormationDto.positions as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async findAll() {
    return this.prisma.formation.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const formation = await this.prisma.formation.findUnique({
      where: { id },
    });

    if (!formation) {
      throw new NotFoundException(`Formación con ID ${id} no encontrada.`);
    }

    return formation;
  }

  async update(id: number, updateFormationDto: UpdateFormationDto) {
    await this.findOne(id);

    if (updateFormationDto.name) {
      const existing = await this.prisma.formation.findUnique({
        where: { name: updateFormationDto.name },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`El nombre "${updateFormationDto.name}" ya está en uso.`);
      }
    }

    const { positions, type, ...rest } = updateFormationDto;

    return this.prisma.formation.update({
      where: { id },
      data: {
        ...rest,
        ...(type !== undefined && { type: type as Prisma.FormationUpdateInput['type'] }),
        ...(positions !== undefined && {
          positions: positions as unknown as Prisma.InputJsonValue,
        }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      return await this.prisma.formation.delete({
        where: { id },
      });
    } catch {
      throw new ConflictException(
        'No puedes eliminar una formación que está en uso por algún club.',
      );
    }
  }
}
