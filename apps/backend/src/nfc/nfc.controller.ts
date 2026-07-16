import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { NfcService } from './nfc.service';
import { SyncBraceletDto } from './dto/sync-bracelet.dto';

@Controller('nfc')
export class NfcController {
  constructor(private readonly nfcService: NfcService) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncBracelet(@Body() body: SyncBraceletDto) {
    return this.nfcService.syncBracelet(body);
  }
}
