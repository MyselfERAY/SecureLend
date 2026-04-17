import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { SuggestionStatus } from '@prisma/client';

/**
 * Yeni olusturulan bir Suggestion ile, `dedupKey` uzerinden ayni oneri
 * tekrar gonderildiginde kac saat icinde mevcut DONE kaydi dondurulsun.
 * Deploy/rollout penceresi buraya gelir: cozum deploy olmadan once ayni
 * hata yine log'lara dusebilir, yenisini acmanin anlami yok.
 */
const DONE_RESURFACE_HOURS = 48;

@Injectable()
export class SuggestionService {
  private readonly logger = new Logger(SuggestionService.name);

  constructor(private readonly prisma: PrismaService) {}

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
   * Suggestion olusturur. `dedupKey` verildiyse ayni key uzerinden mevcut bir
   * aktif/yeni-tamamlanmis kayit varsa onu dondurur — boylece Health Agent gibi
   * periyodik ajanlar ayni hata icin her koshuda yeni kayit acmaz.
   *
   * Dedup algoritmasi:
   *  1) Ayni dedupKey ile status PENDING veya IN_PROGRESS → mevcut dondurulur.
   *  2) Ayni dedupKey ile status DONE + updatedAt son DONE_RESURFACE_HOURS
   *     icindeyse → mevcut dondurulur (fix deploy olmus ama log'lara hala
   *     eski hatalar dusuyor olabilir).
   *  3) Yukarıdakiler yoksa yeni kayit acilir. Eski (REJECTED veya 48h'den
   *     eski DONE) kayitlarin dedupKey'i null'a cekilir ki unique constraint
   *     yeni kaydı engellemesin. Boylece gecmis Suggestion'lar kaybolmaz
   *     (audit trail korunur) ama dedup tamponu serbest kalir.
   */
  async create(dto: CreateSuggestionDto) {
    const { dedupKey, ...rest } = dto;

    if (dedupKey) {
      // 1) Aktif (PENDING/IN_PROGRESS) ayni dedupKey
      const active = await this.prisma.devSuggestion.findFirst({
        where: {
          dedupKey,
          status: { in: [SuggestionStatus.PENDING, SuggestionStatus.IN_PROGRESS] },
        },
      });
      if (active) {
        this.logger.log(
          `dedupKey=${dedupKey}: aktif Suggestion mevcut (id=${active.id} status=${active.status}) — yeni kayit olusturulmadi`,
        );
        return active;
      }

      // 2) Yakin zamanda DONE olan ayni dedupKey
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
          `dedupKey=${dedupKey}: yakın zamanda DONE (id=${recentDone.id}, ${DONE_RESURFACE_HOURS}h icinde) — yeni kayit olusturulmadi`,
        );
        return recentDone;
      }

      // 3) Eski kayitlarin dedupKey'ini null'a cek (unique constraint'i acar)
      //    Kayit silinmez; title/description/status aynı kalır (audit).
      await this.prisma.devSuggestion.updateMany({
        where: { dedupKey },
        data: { dedupKey: null },
      });
    }

    // New suggestions start as REJECTED (pending admin approval) — Health Agent
    // auto-approves CRITICAL/HIGH via subsequent PATCH.
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
