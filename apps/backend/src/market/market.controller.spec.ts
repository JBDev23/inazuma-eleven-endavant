import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';

describe('MarketController', () => {
  let controller: MarketController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketController],
      providers: [
        MarketService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<MarketController>(MarketController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
