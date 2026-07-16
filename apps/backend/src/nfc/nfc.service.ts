import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  braceletHasCoins,
  braceletToResources,
  resetBracelet,
  type NfcSyncResult,
} from '@inazuma/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { SyncBraceletDto } from './dto/sync-bracelet.dto';

@Injectable()
export class NfcService {
  constructor(private readonly prisma: PrismaService) {}

  async syncBracelet(dto: SyncBraceletDto): Promise<NfcSyncResult> {
    if (!Number.isInteger(dto.team) || dto.team <= 0) {
      throw new BadRequestException('El número de equipo de la pulsera no es válido.');
    }

    if (!braceletHasCoins(dto)) {
      throw new BadRequestException(
        'La pulsera no tiene monedas pendientes de sincronizar.',
      );
    }

    const clubId = String(dto.team);
    const deposited = braceletToResources(dto);

    return this.prisma.$transaction(async (tx) => {
      const club = await tx.userClub.findUnique({ where: { id: clubId } });

      if (!club) {
        throw new NotFoundException(
          `No existe un club asociado al equipo ${dto.team}.`,
        );
      }

      await tx.transaction.create({
        data: {
          clubId,
          type: 'EXTERNAL',
          description: 'Sincronización pulsera NFC',
          amountPP: deposited.pp,
          amountPE: deposited.pe,
          amountYens: deposited.yens,
          amountPC: deposited.pc,
        },
      });

      const updatedClub = await tx.userClub.update({
        where: { id: clubId },
        data: {
          pp: club.pp + deposited.pp,
          pe: club.pe + deposited.pe,
          yens: club.yens + deposited.yens,
          pc: club.pc + deposited.pc,
        },
      });

      return {
        success: true as const,
        clubId,
        clubName: club.name,
        deposited,
        newBalance: {
          pp: updatedClub.pp,
          pe: updatedClub.pe,
          yens: updatedClub.yens,
          pc: updatedClub.pc,
        },
        resetPayload: resetBracelet(dto),
      };
    });
  }
}
