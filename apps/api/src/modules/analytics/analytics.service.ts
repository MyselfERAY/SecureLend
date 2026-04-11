import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface TrackEventDto {
  sessionId: string;
  eventType: string;
  page: string;
  referrer?: string;
  duration?: number;
  screenWidth?: number;
  screenHeight?: number;
  errorMessage?: string;
  errorStack?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AnalyticsService implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const tableCheck = await this.prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'analytics_events'
        ) as exists`;

      if (!tableCheck[0]?.exists) {
        this.logger.warn('analytics_events table missing — creating via raw SQL...');
        await this.ensureTableExists();
      }
    } catch (err) {
      this.logger.error(`Analytics onModuleInit failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  private async ensureTableExists() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "analytics_events" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "session_id" VARCHAR(64) NOT NULL,
        "event_type" VARCHAR(30) NOT NULL,
        "page" VARCHAR(500) NOT NULL,
        "referrer" VARCHAR(500),
        "duration" INTEGER,
        "user_id" UUID,
        "ip_address" VARCHAR(45),
        "country" VARCHAR(5),
        "city" VARCHAR(100),
        "user_agent" VARCHAR(500),
        "device" VARCHAR(20),
        "browser" VARCHAR(50),
        "os" VARCHAR(50),
        "screen_width" INTEGER,
        "screen_height" INTEGER,
        "error_message" VARCHAR(1000),
        "error_stack" TEXT,
        "metadata" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
      );
    `);
    await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_analytics_type_date" ON "analytics_events"("event_type", "created_at");`);
    await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_analytics_page_date" ON "analytics_events"("page", "created_at");`);
    await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_analytics_session" ON "analytics_events"("session_id");`);
    await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_analytics_user" ON "analytics_events"("user_id");`);
    await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_analytics_created" ON "analytics_events"("created_at");`);
    this.logger.log('analytics_events table created successfully');
  }

  // ─── Track Event ───

  async track(dto: TrackEventDto, ipAddress?: string, userAgent?: string, userId?: string) {
    const parsed = this.parseUserAgent(userAgent || '');

    try {
      await this.prisma.analyticsEvent.create({
        data: {
          sessionId: dto.sessionId,
          eventType: dto.eventType,
          page: dto.page.slice(0, 500),
          referrer: dto.referrer?.slice(0, 500),
          duration: dto.duration,
          userId,
          ipAddress: ipAddress?.slice(0, 45),
          userAgent: userAgent?.slice(0, 500),
          device: parsed.device,
          browser: parsed.browser,
          os: parsed.os,
          screenWidth: dto.screenWidth,
          screenHeight: dto.screenHeight,
          errorMessage: dto.errorMessage?.slice(0, 1000),
          errorStack: dto.errorStack?.slice(0, 5000),
          metadata: (dto.metadata as any) || undefined,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to track event: ${err instanceof Error ? err.message : err}`);
    }
  }

  // ─── Batch Track ───

  async trackBatch(events: TrackEventDto[], ipAddress?: string, userAgent?: string, userId?: string) {
    const parsed = this.parseUserAgent(userAgent || '');

    try {
      await this.prisma.analyticsEvent.createMany({
        data: events.map((dto) => ({
          sessionId: dto.sessionId,
          eventType: dto.eventType,
          page: dto.page.slice(0, 500),
          referrer: dto.referrer?.slice(0, 500),
          duration: dto.duration,
          userId,
          ipAddress: ipAddress?.slice(0, 45),
          userAgent: userAgent?.slice(0, 500),
          device: parsed.device,
          browser: parsed.browser,
          os: parsed.os,
          screenWidth: dto.screenWidth,
          screenHeight: dto.screenHeight,
          errorMessage: dto.errorMessage?.slice(0, 1000),
          errorStack: dto.errorStack?.slice(0, 5000),
          metadata: (dto.metadata as any) || undefined,
        })),
      });
    } catch (err) {
      this.logger.error(`Failed to track batch: ${err instanceof Error ? err.message : err}`);
    }
  }

  // ─── Admin: Dashboard Stats ───

  async getDashboard(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalPageViews,
      uniqueSessions,
      uniqueUsers,
      totalErrors,
      pageViews,
      topPages,
      avgDurations,
      devices,
      browsers,
      errors,
      dailyViews,
    ] = await Promise.all([
      // Total page views
      this.prisma.analyticsEvent.count({
        where: { eventType: 'page_view', createdAt: { gte: since } },
      }),
      // Unique sessions
      this.prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: { createdAt: { gte: since } },
      }).then((r) => r.length),
      // Unique users (non-null)
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: since }, userId: { not: null } },
      }).then((r) => r.length),
      // Total errors
      this.prisma.analyticsEvent.count({
        where: { eventType: 'error', createdAt: { gte: since } },
      }),
      // Page views per page (top 20)
      this.prisma.analyticsEvent.groupBy({
        by: ['page'],
        where: { eventType: 'page_view', createdAt: { gte: since } },
        _count: true,
        orderBy: { _count: { page: 'desc' } },
        take: 20,
      }),
      // Top pages by unique sessions
      this.prisma.analyticsEvent.groupBy({
        by: ['page'],
        where: { eventType: 'page_view', createdAt: { gte: since } },
        _count: { sessionId: true },
        orderBy: { _count: { sessionId: 'desc' } },
        take: 15,
      }),
      // Average duration per page (from page_exit events)
      this.prisma.analyticsEvent.groupBy({
        by: ['page'],
        where: { eventType: 'page_exit', duration: { not: null }, createdAt: { gte: since } },
        _avg: { duration: true },
        _count: true,
        orderBy: { _count: { page: 'desc' } },
        take: 15,
      }),
      // Device breakdown
      this.prisma.analyticsEvent.groupBy({
        by: ['device'],
        where: { eventType: 'page_view', device: { not: null }, createdAt: { gte: since } },
        _count: true,
        orderBy: { _count: { device: 'desc' } },
      }),
      // Browser breakdown
      this.prisma.analyticsEvent.groupBy({
        by: ['browser'],
        where: { eventType: 'page_view', browser: { not: null }, createdAt: { gte: since } },
        _count: true,
        orderBy: { _count: { browser: 'desc' } },
        take: 10,
      }),
      // Recent errors
      this.prisma.analyticsEvent.findMany({
        where: { eventType: 'error', createdAt: { gte: since } },
        select: {
          page: true,
          errorMessage: true,
          browser: true,
          device: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      // Daily page views (last N days)
      this.prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
        SELECT DATE(created_at) as day, COUNT(*)::bigint as count
        FROM analytics_events
        WHERE event_type = 'page_view' AND created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `.catch(() => []),
    ]);

    return {
      summary: {
        totalPageViews,
        uniqueSessions,
        uniqueUsers,
        totalErrors,
        avgPagesPerSession: uniqueSessions > 0 ? +(totalPageViews / uniqueSessions).toFixed(1) : 0,
      },
      pageViews: pageViews.map((p) => ({ page: p.page, count: p._count })),
      topPages: topPages.map((p) => ({ page: p.page, sessions: p._count.sessionId })),
      avgDurations: avgDurations.map((p) => ({
        page: p.page,
        avgSeconds: Math.round(p._avg.duration || 0),
        samples: p._count,
      })),
      devices: devices.map((d) => ({ device: d.device, count: d._count })),
      browsers: browsers.map((b) => ({ browser: b.browser, count: b._count })),
      recentErrors: errors,
      dailyViews: dailyViews.map((d) => ({
        day: String(d.day).slice(0, 10),
        count: Number(d.count),
      })),
    };
  }

  // ─── Parse User Agent ───

  private parseUserAgent(ua: string): { device: string; browser: string; os: string } {
    const device = /Mobi|Android/i.test(ua)
      ? /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile'
      : 'desktop';

    let browser = 'other';
    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/OPR|Opera/i.test(ua)) browser = 'Opera';
    else if (/Chrome/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';

    let os = 'other';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Mac OS/i.test(ua)) os = 'macOS';
    else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/Linux/i.test(ua)) os = 'Linux';

    return { device, browser, os };
  }
}
