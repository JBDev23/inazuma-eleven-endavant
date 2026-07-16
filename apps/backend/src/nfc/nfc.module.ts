import { Module } from '@nestjs/common';
import { NfcController } from './nfc.controller';
import { NfcService } from './nfc.service';

@Module({
  controllers: [NfcController],
  providers: [NfcService],
})
export class NfcModule {}
