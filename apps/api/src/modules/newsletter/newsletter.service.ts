import { Injectable, Logger, ConflictException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsletterService implements OnModuleInit {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const tableCheck = await this.prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'newsletter_subscribers'
        ) as exists`;

      if (!tableCheck[0]?.exists) {
        this.logger.warn('newsletter_subscribers table missing — creating via raw SQL...');
        await this.ensureTableExists();
      }
    } catch (err) {
      this.logger.error(`Newsletter onModuleInit failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  private async ensureTableExists() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) NOT NULL,
        "name" VARCHAR(200),
        "is_verified" BOOLEAN NOT NULL DEFAULT false,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "source" VARCHAR(50) NOT NULL DEFAULT 'landing',
        "unsubscribed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "newsletter_subscribers_email_key" UNIQUE ("email")
      );
    `);
    await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_newsletter_email" ON "newsletter_subscribers"("email");`);
    await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_newsletter_active" ON "newsletter_subscribers"("is_active");`);
    this.logger.log('newsletter_subscribers table created successfully');
  }

  async subscribe(email: string, name?: string, source = 'landing') {
    // Check existing
    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('Bu e-posta adresi zaten kayitli');
      }
      // Reactivate
      return this.prisma.newsletterSubscriber.update({
        where: { email },
        data: { isActive: true, unsubscribedAt: null, name: name || existing.name },
      });
    }

    const subscriber = await this.prisma.newsletterSubscriber.create({
      data: { email, name, source },
    });

    this.logger.log(`Newsletter subscriber: ${email} (source: ${source})`);
    return subscriber;
  }

  async unsubscribe(email: string) {
    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (!existing) throw new NotFoundException('Abone bulunamadi');

    return this.prisma.newsletterSubscriber.update({
      where: { email },
      data: { isActive: false, unsubscribedAt: new Date() },
    });
  }

  // Admin
  async getSubscribers(activeOnly = true) {
    return this.prisma.newsletterSubscriber.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats() {
    const [total, active, unsubscribed] = await Promise.all([
      this.prisma.newsletterSubscriber.count(),
      this.prisma.newsletterSubscriber.count({ where: { isActive: true } }),
      this.prisma.newsletterSubscriber.count({ where: { isActive: false } }),
    ]);
    const bySource = await this.prisma.newsletterSubscriber.groupBy({
      by: ['source'],
      _count: true,
      where: { isActive: true },
    });
    return {
      total,
      active,
      unsubscribed,
      bySource: bySource.map((s) => ({ source: s.source, count: s._count })),
    };
  }
}
