import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { GameSettingsService } from './game-settings.service';
import { UpdateGameSettingsDto } from './dto/update-game-settings.dto';
import { UpsertSessionXpDto } from './dto/upsert-session-xp.dto';
import { ApplyMatchXpDto } from './dto/apply-match-xp.dto';

@Controller('game-settings')
export class GameSettingsController {
  constructor(private readonly gameSettingsService: GameSettingsService) {}

  @Get()
  getSettings() {
    return this.gameSettingsService.getSettings();
  }

  @Patch()
  updateSettings(@Body() dto: UpdateGameSettingsDto) {
    return this.gameSettingsService.updateSettings(dto);
  }

  @Put('sessions')
  upsertSessionConfig(@Body() dto: UpsertSessionXpDto) {
    return this.gameSettingsService.upsertSessionConfig(dto);
  }

  @Delete('sessions/:session')
  deleteSessionConfig(@Param('session', ParseIntPipe) session: number) {
    return this.gameSettingsService.deleteSessionConfig(session);
  }

  @Post('apply-match-xp')
  applyMatchXp(@Body() dto: ApplyMatchXpDto) {
    return this.gameSettingsService.applyMatchXp(dto);
  }
}
