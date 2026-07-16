import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMoveDto } from './dto/create-move.dto';
import { UpdateMoveDto } from './dto/update-move.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MovesService {
  constructor(private prisma: PrismaService) {}

  async create(createMoveDto: CreateMoveDto) {
    const existingMove = await this.prisma.move.findUnique({
      where: { name: createMoveDto.name },
    });

    if (existingMove) {
      throw new ConflictException(`La supertécnica "${createMoveDto.name}" ya existe.`);
    }

    // Casteamos los enums al tipo esperado por Prisma
    return this.prisma.move.create({
      data: {
        ...createMoveDto,
        type: createMoveDto.type as Prisma.MoveCreateInput['type'],
        evolutionPath: createMoveDto.evolutionPath as Prisma.MoveCreateInput['evolutionPath'],
        evolutionSpeed: createMoveDto.evolutionSpeed as Prisma.MoveCreateInput['evolutionSpeed'],
      },
    });
  }

  async findAll() {
    return this.prisma.move.findMany({
      orderBy: { id: 'asc' },
      include: {
        players: {
          include: {
            player: {
              include: { team: true },
            },
          },
          orderBy: { unlockLevel: 'asc' },
        },
      },
    });
  }

  async findOne(id: number) {
    const move = await this.prisma.move.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            player: {
              include: { team: true },
            },
          },
          orderBy: { unlockLevel: 'asc' },
        },
      },
    });

    if (!move) {
      throw new NotFoundException(`Supertécnica con ID ${id} no encontrada.`);
    }

    return move;
  }

  async update(id: number, updateMoveDto: UpdateMoveDto) {
    await this.findOne(id); // Verificamos que exista

    if (updateMoveDto.name) {
      const existingMove = await this.prisma.move.findUnique({
        where: { name: updateMoveDto.name },
      });

      if (existingMove && existingMove.id !== id) {
        throw new ConflictException(`El nombre "${updateMoveDto.name}" ya está en uso.`);
      }
    }

    return this.prisma.move.update({
      where: { id },
      data: {
        ...updateMoveDto,
        type: updateMoveDto.type as Prisma.MoveUpdateInput['type'],
        evolutionPath: updateMoveDto.evolutionPath as Prisma.MoveUpdateInput['evolutionPath'],
        evolutionSpeed: updateMoveDto.evolutionSpeed as Prisma.MoveUpdateInput['evolutionSpeed'],
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verificamos que exista antes de borrar

    // OJO: Si la técnica ya está asignada a un jugador (PlayerMove), Prisma lanzará error por integridad referencial.
    // Lo ideal es dejar que salte el error 500 o atraparlo para devolver un ConflictException.
    try {
      return await this.prisma.move.delete({
        where: { id },
      });
    } catch (error) {
      throw new ConflictException("No puedes eliminar una técnica que ya ha sido aprendida por jugadores.");
    }
  }
}