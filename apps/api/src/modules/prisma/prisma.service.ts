import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.ensureEnumValues();
  }

  /**
   * PostgreSQL ALTER TYPE ... ADD VALUE cannot run inside a transaction,
   * so Prisma migrations may silently skip enum additions.
   * This ensures HEALTH and ARTICLE values exist in the agent_type enum.
   */
  private async ensureEnumValues() {
    const enumsToAdd = [
      { type: 'agent_type', value: 'HEALTH' },
      { type: 'agent_type', value: 'ARTICLE' },
    ];
    for (const { type, value } of enumsToAdd) {
      try {
        await this.$executeRawUnsafe(
          `ALTER TYPE "${type}" ADD VALUE IF NOT EXISTS '${value}'`,
        );
        this.logger.log(`Enum ${type}.${value} ensured`);
      } catch (err) {
        // Already exists or other non-critical error
        this.logger.warn(`Enum ${type}.${value} check: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
