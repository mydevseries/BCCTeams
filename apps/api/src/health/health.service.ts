import { Injectable } from '@nestjs/common';
import { HealthStatus } from '@bcc/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    let dbConnected = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch {
      dbConnected = false;
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbConnected,
        redis: true,
      },
    };
  }
}
