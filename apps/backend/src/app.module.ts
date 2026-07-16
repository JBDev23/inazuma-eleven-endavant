import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PlayersModule } from './players/players.module';
import { TeamsModule } from './teams/teams.module';
import { MovesModule } from './moves/moves.module';
import { MarketModule } from './market/market.module';
import { FormationsModule } from './formations/formations.module';
import { CoachesModule } from './coaches/coaches.module';
import { NfcModule } from './nfc/nfc.module';
import { GameSettingsModule } from './game-settings/game-settings.module';

@Module({
  imports: [
    PrismaModule,
    PlayersModule,
    TeamsModule,
    MovesModule,
    MarketModule,
    FormationsModule,
    CoachesModule,
    NfcModule,
    GameSettingsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
