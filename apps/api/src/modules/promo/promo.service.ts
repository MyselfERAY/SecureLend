import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromoService implements OnModuleInit {
  private readonly logger = new Logger(PromoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      // Check if promo_templates table exists
      const tableCheck = await this.prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'promo_templates'
        ) as exists`;

      if (!tableCheck[0]?.exists) {
        this.logger.warn('promo_templates table missing — creating via raw SQL...');
        await this.ensureTablesExist();
      }

      // Seed default templates if table is empty
      const count = await this.prisma.promoTemplate.count();
      if (count === 0) {
        this.logger.log('No promo templates found — seeding defaults...');
        await this.prisma.promoTemplate.createMany({
          data: [
            { name: 'Ilk 3 Ay Komisyonsuz', type: 'FIRST_MONTHS_FREE', description: 'Yeni kayit olan tum kullanicilar icin ilk 3 ay komisyon alinmaz.', discountPercent: 100, durationMonths: 3, isActive: true, isAutoApply: true },
            { name: '12. Ay Komisyonsuz', type: 'LOYALTY_REWARD', description: '1 yil boyunca platformu kullanan kullanicilara 12. ay hediye.', discountPercent: 100, durationMonths: 1, isActive: true, isAutoApply: false },
            { name: '2. Yil Yenileme Indirimi', type: 'RENEWAL_DISCOUNT', description: 'Sozlesmesini yenileyen kullanicilara komisyon oraninda %25 indirim.', discountPercent: 25, durationMonths: 12, isActive: true, isAutoApply: false },
            { name: 'Arkadasini Getir', type: 'REFERRAL_BONUS', description: 'Davet eden ve davet edilen, her biri 1 ay komisyonsuz.', discountPercent: 100, durationMonths: 1, isActive: true, isAutoApply: false },
          ],
        });
        this.logger.log('Default promo templates seeded successfully');
      }
    } catch (err) {
      this.logger.error(`Promo onModuleInit failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  private async ensureTablesExist() {
    // Create enum types if they don't exist
    await this.prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "PromoType" AS ENUM ('FIRST_MONTHS_FREE', 'RENEWAL_DISCOUNT', 'REFERRAL_BONUS', 'LOYALTY_REWARD', 'CUSTOM');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await this.prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "PromoStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Create promo_templates table
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "promo_templates" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "name" VARCHAR(200) NOT NULL,
        "type" "PromoType" NOT NULL,
        "description" VARCHAR(500),
        "discount_percent" INTEGER NOT NULL,
        "duration_months" INTEGER NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "is_auto_apply" BOOLEAN NOT NULL DEFAULT false,
        "max_usage_count" INTEGER,
        "current_usage" INTEGER NOT NULL DEFAULT 0,
        "valid_from" TIMESTAMPTZ,
        "valid_until" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "promo_templates_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create user_promos table
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "user_promos" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "template_id" UUID NOT NULL,
        "contract_id" UUID,
        "status" "PromoStatus" NOT NULL DEFAULT 'ACTIVE',
        "remaining_months" INTEGER NOT NULL,
        "activated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expires_at" TIMESTAMPTZ,
        "referred_by_user_id" UUID,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "user_promos_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create indexes
    await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_promo_template_type" ON "promo_templates"("type", "is_active");`);
    await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_user_promo_user_status" ON "user_promos"("user_id", "status");`);
    await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_user_promo_template" ON "user_promos"("template_id");`);

    // Add foreign keys (ignore if already exist)
    const fks = [
      `ALTER TABLE "user_promos" ADD CONSTRAINT "user_promos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`,
      `ALTER TABLE "user_promos" ADD CONSTRAINT "user_promos_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "promo_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`,
      `ALTER TABLE "user_promos" ADD CONSTRAINT "user_promos_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;`,
      `ALTER TABLE "user_promos" ADD CONSTRAINT "user_promos_referred_by_user_id_fkey" FOREIGN KEY ("referred_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;`,
    ];
    for (const fk of fks) {
      try { await this.prisma.$executeRawUnsafe(fk); } catch { /* constraint may already exist */ }
    }

    this.logger.log('Promo tables created successfully via raw SQL');
  }

  // ─── ADMIN: Template CRUD ───

  async getTemplates() {
    return this.prisma.promoTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { userPromos: true } } },
    });
  }

  async createTemplate(data: {
    name: string;
    type: string;
    description?: string;
    discountPercent: number;
    durationMonths: number;
    isAutoApply?: boolean;
    maxUsageCount?: number;
    validFrom?: string;
    validUntil?: string;
  }) {
    return this.prisma.promoTemplate.create({
      data: {
        name: data.name,
        type: data.type as any,
        description: data.description,
        discountPercent: data.discountPercent,
        durationMonths: data.durationMonths,
        isAutoApply: data.isAutoApply ?? false,
        maxUsageCount: data.maxUsageCount,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      },
    });
  }

  async updateTemplate(id: string, data: Record<string, unknown>) {
    const template = await this.prisma.promoTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Promosyon sablonu bulunamadi');
    return this.prisma.promoTemplate.update({ where: { id }, data: data as any });
  }

  async toggleTemplate(id: string) {
    const template = await this.prisma.promoTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Promosyon sablonu bulunamadi');
    return this.prisma.promoTemplate.update({
      where: { id },
      data: { isActive: !template.isActive },
    });
  }

  // ─── PUBLIC: Active promos for pricing page ───

  async getActivePromos() {
    const now = new Date();
    return this.prisma.promoTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          { validFrom: null },
          { validFrom: { lte: now } },
        ],
        AND: [
          { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        discountPercent: true,
        durationMonths: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── USER: Apply promo on registration (auto-apply) ───

  async applyAutoPromos(userId: string) {
    const now = new Date();
    const autoTemplates = await this.prisma.promoTemplate.findMany({
      where: {
        isAutoApply: true,
        isActive: true,
        OR: [{ validFrom: null }, { validFrom: { lte: now } }],
        AND: [{ OR: [{ validUntil: null }, { validUntil: { gte: now } }] }],
        // Check usage limit
      },
    });

    const applied: string[] = [];

    for (const template of autoTemplates) {
      // Check usage limit
      if (template.maxUsageCount && template.currentUsage >= template.maxUsageCount) continue;

      // Check if user already has this promo
      const existing = await this.prisma.userPromo.findFirst({
        where: { userId, templateId: template.id },
      });
      if (existing) continue;

      await this.prisma.$transaction(async (tx) => {
        await tx.userPromo.create({
          data: {
            userId,
            templateId: template.id,
            remainingMonths: template.durationMonths,
            expiresAt: new Date(Date.now() + template.durationMonths * 30 * 24 * 60 * 60 * 1000),
          },
        });
        await tx.promoTemplate.update({
          where: { id: template.id },
          data: { currentUsage: { increment: 1 } },
        });
      });

      applied.push(template.name);
      this.logger.log(`Auto-applied promo "${template.name}" to user ${userId}`);
    }

    return applied;
  }

  // ─── USER: Get my promos ───

  async getUserPromos(userId: string) {
    return this.prisma.userPromo.findMany({
      where: { userId },
      include: { template: { select: { name: true, type: true, description: true, discountPercent: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── ADMIN: Assign promo to user ───

  async assignPromoToUser(templateId: string, userId: string, contractId?: string) {
    const template = await this.prisma.promoTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Promosyon sablonu bulunamadi');
    if (!template.isActive) throw new BadRequestException('Bu promosyon aktif degil');

    const existing = await this.prisma.userPromo.findFirst({
      where: { userId, templateId, status: 'ACTIVE' },
    });
    if (existing) throw new BadRequestException('Kullanicinin zaten bu promosyonu var');

    const promo = await this.prisma.$transaction(async (tx) => {
      const p = await tx.userPromo.create({
        data: {
          userId,
          templateId,
          contractId,
          remainingMonths: template.durationMonths,
          expiresAt: new Date(Date.now() + template.durationMonths * 30 * 24 * 60 * 60 * 1000),
        },
      });
      await tx.promoTemplate.update({
        where: { id: templateId },
        data: { currentUsage: { increment: 1 } },
      });
      return p;
    });

    this.logger.log(`Promo "${template.name}" assigned to user ${userId}`);
    return promo;
  }

  // ─── ADMIN: Stats ───

  async getStats() {
    const [templates, totalActive, totalUsed] = await Promise.all([
      this.prisma.promoTemplate.count(),
      this.prisma.userPromo.count({ where: { status: 'ACTIVE' } }),
      this.prisma.userPromo.count({ where: { status: 'USED' } }),
    ]);
    return { templates, totalActive, totalUsed };
  }
}
