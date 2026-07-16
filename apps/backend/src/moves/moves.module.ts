import { Module } from '@nestjs/common';
import { MovesService } from './moves.service';
import { MovesController } from './moves.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [MovesController],
  providers: [MovesService, PrismaService],
})
export class MovesModule {}
