import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CoachesController } from './coaches.controller';
import { CoachesService } from './coaches.service';

@Module({
  controllers: [CoachesController],
  providers: [CoachesService, PrismaService],
})
export class CoachesModule {}

