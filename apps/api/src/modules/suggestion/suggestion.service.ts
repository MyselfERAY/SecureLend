import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { SuggestionStatus } from '@prisma/client';

@Injectable()
export class SuggestionService implements OnModuleInit {
  private readonly logger = new Logger(SuggestionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Defansif kolon garanti: Railway'de `prisma migrate deploy` sessizce fail
   * olduğunda yeni Prisma client'ın SELECT ettigi kolon DB'de olmayabiliyor
   * ve her query 500 donuyordu. AnalyticsService'teki pattern'i takip ederek
   * `dedup_key` kolonunu raw SQL ile garanti ediyoruz.
   * `ADD COLUMN IF NOT EXISTS` idempotent. Unique index BU PR'da yok — PR E2'de.
   */
  async onModuleInit() {
    try {
      await this.prisma.$executeRawUnsafe(
        `ALTER TABLE "dev_suggestions" ADD COLUMN IF NOT EXISTS "dedup_key" VARCHAR(200);`,
      );
    } catch (err) {
      this.logger.error(
        `SuggestionService.onModuleInit dedup_key ensure failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async findAll(status?: SuggestionStatus) {
    return this.prisma.devSuggestion.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const suggestion = await this.prisma.devSuggestion.findUnique({ where: { id } });
    if (!suggestion) throw new NotFoundException('Oneri bulunamadi');
    return suggestion;
  }

  async create(dto: CreateSuggestionDto) {
    // New suggestions start as REJECTED with no agentNotes = "Yeni" (awaiting admin approval)
    return this.prisma.devSuggestion.create({
      data: { ...dto, status: SuggestionStatus.REJECTED },
    });
  }

  async update(id: string, dto: UpdateSuggestionDto) {
    await this.findOne(id);
    return this.prisma.devSuggestion.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.devSuggestion.delete({ where: { id } });
  }
}
