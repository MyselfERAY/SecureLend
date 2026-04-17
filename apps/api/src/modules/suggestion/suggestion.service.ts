import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { SuggestionStatus } from '@prisma/client';

/**
 * `dedupKey` ayni oneri tekrar gonderildiginde mevcut DONE kaydin kac saat
 * icinde yine dondurulecegi. Deploy/rollout penceresi buraya gelir: fix deploy
 * olmadan once ayni hata yine log'lara dusebilir, yenisini acmanin anlami yok.
 */
const DONE_RESURFACE_HOURS = 48;

@Injectable()
export class SuggestionService implements OnModuleInit {
  private readonly logger = new Logger(SuggestionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Defansif schema garanti: Railway'de `prisma migrate deploy` sessizce fail
   * olduğunda yeni Prisma client'in SELECT ettigi kolon DB'de olmayabiliyor
   * ve her query 500 donuyordu. AnalyticsService pattern'i: kolon + unique
   * index'i raw SQL ile idempotent garanti et. App boot'unda migrate deploy
   * olmasa bile kolon ve constraint hazir olur.
   */
  async onModuleInit() {
    try {
      await this.prisma.$executeRawUnsafe(
        `ALTER TABLE "dev_suggestions" ADD COLUMN IF NOT EXISTS "dedup_key" VARCHAR(200);`,
      );
      await this.prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "dev_suggestion_dedup_key_key" ON "dev_suggestions" ("dedup_key");`,
      );
    } catch (err) {
      this.logger.error(
        `SuggestionService.onModuleInit schema ensure failed: ${err instanceof Error ? err.message : err}`,
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

  /**
   * Suggestion olusturur. `dedupKey` verildiyse ayni key uzerinden mevcut
   * aktif/yeni-tamamlanmis kayit varsa onu dondurur — boylece Health Agent
   * gibi periyodik ajanlar ayni hata grubu icin her kosuda yeni kayit acmaz.
   *
   * Dedup algoritmasi:
   *  1) Aktif (PENDING/IN_PROGRESS) ayni dedupKey → mevcut dondurulur
   *  2) REJECTED ayni dedupKey (Health Agent'in default'u) → mevcut dondurulur
   *     (admin henuz onaylamamis olabilir ama yeni kayit acmanin anlami yok)
   *  3) 48 saat icindeki DONE ayni dedupKey → mevcut dondurulur (rollout)
   *  4) Yukaridakilerin hicbiri yoksa (ornek: DONE >48h, eski veri) → eski
   *     eslesen kayitlarin dedupKey'i null'a cekilir (audit korunur), yeni
   *     kayit acilir.
   */
  async create(dto: CreateSuggestionDto) {
    const { dedupKey, ...rest } = dto;

    if (dedupKey) {
      // 1+2) Aktif veya REJECTED (yani Dev Agent henuz cozmemis) ayni dedupKey
      const unresolved = await this.prisma.devSuggestion.findFirst({
        where: {
          dedupKey,
          status: {
            in: [
              SuggestionStatus.PENDING,
              SuggestionStatus.IN_PROGRESS,
              SuggestionStatus.REJECTED,
            ],
          },
        },
      });
      if (unresolved) {
        this.logger.log(
          `dedupKey=${dedupKey}: mevcut kayit (id=${unresolved.id} status=${unresolved.status}) — yeni olusturulmadi`,
        );
        return unresolved;
      }

      // 3) Yakin zamanda DONE olan ayni dedupKey
      const resurfaceThreshold = new Date(
        Date.now() - DONE_RESURFACE_HOURS * 60 * 60 * 1000,
      );
      const recentDone = await this.prisma.devSuggestion.findFirst({
        where: {
          dedupKey,
          status: SuggestionStatus.DONE,
          updatedAt: { gte: resurfaceThreshold },
        },
      });
      if (recentDone) {
        this.logger.log(
          `dedupKey=${dedupKey}: yakin DONE (id=${recentDone.id}, ${DONE_RESURFACE_HOURS}h icinde) — yeni olusturulmadi`,
        );
        return recentDone;
      }

      // 4) Eski kayitlarin dedupKey'ini null'a cek (unique constraint'i acar)
      //    Kayit silinmez; title/description/status aynı kalır (audit).
      await this.prisma.devSuggestion.updateMany({
        where: { dedupKey },
        data: { dedupKey: null },
      });
    }

    // New suggestions start as REJECTED (awaiting admin approval / Health
    // Agent auto-approves CRITICAL+HIGH via subsequent PATCH).
    return this.prisma.devSuggestion.create({
      data: { ...rest, dedupKey: dedupKey ?? null, status: SuggestionStatus.REJECTED },
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
