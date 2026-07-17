import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    const pool = new Pool({
      connectionString,
      // Neon compute can be cold; give it time to wake up
      connectionTimeoutMillis: 20_000,
      max: 10,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}