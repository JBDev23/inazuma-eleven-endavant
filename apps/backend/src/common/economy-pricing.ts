import {
  DEFAULT_ECONOMY_PRICING,
  type EconomyPricingSettings,
} from '@inazuma/shared';
import type { PrismaService } from '../../prisma/prisma.service';

type PrismaLike = Pick<PrismaService, 'gameSettings'>;

export async function getEconomyPricing(
  prisma: PrismaLike,
): Promise<EconomyPricingSettings> {
  const settings = await prisma.gameSettings.findUnique({ where: { id: 1 } });
  if (!settings) return { ...DEFAULT_ECONOMY_PRICING };

  return {
    basePlayerPrice: settings.basePlayerPrice ?? DEFAULT_ECONOMY_PRICING.basePlayerPrice,
    playerPricePerLevel:
      settings.playerPricePerLevel ?? DEFAULT_ECONOMY_PRICING.playerPricePerLevel,
    baseCoachPrice: settings.baseCoachPrice ?? DEFAULT_ECONOMY_PRICING.baseCoachPrice,
    coachPricePerLevel:
      settings.coachPricePerLevel ?? DEFAULT_ECONOMY_PRICING.coachPricePerLevel,
    playerPricePerPc: settings.playerPricePerPc ?? DEFAULT_ECONOMY_PRICING.playerPricePerPc,
    facilityUpgradeCostFrom0:
      settings.facilityUpgradeCostFrom0 ?? DEFAULT_ECONOMY_PRICING.facilityUpgradeCostFrom0,
    facilityUpgradeCostFrom1:
      settings.facilityUpgradeCostFrom1 ?? DEFAULT_ECONOMY_PRICING.facilityUpgradeCostFrom1,
    facilityUpgradeCostFrom2:
      settings.facilityUpgradeCostFrom2 ?? DEFAULT_ECONOMY_PRICING.facilityUpgradeCostFrom2,
  };
}
