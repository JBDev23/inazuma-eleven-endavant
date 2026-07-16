import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GameSettingsController } from './game-settings.controller';
import { GameSettingsService } from './game-settings.service';

@Module({
  controllers: [GameSettingsController],
  providers: [GameSettingsService, PrismaService],
  exports: [GameSettingsService],
})
export class GameSettingsModule {}
