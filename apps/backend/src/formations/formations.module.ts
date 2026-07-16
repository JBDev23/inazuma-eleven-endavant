import { Module } from '@nestjs/common';
import { FormationsService } from './formations.service';
import { FormationsController } from './formations.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [FormationsController],
  providers: [FormationsService, PrismaService],
})
export class FormationsModule {}
