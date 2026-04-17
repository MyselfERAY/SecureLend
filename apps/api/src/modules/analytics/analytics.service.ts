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

  // ─── Track API Request (from LoggingInterceptor) ───

  async trackApiRequest(method: string, url: string, statusCode: number, durationMs: number, req?: any) {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          sessionId: 'server',
          eventType: 'api_request',
          page: url.split('?')[0].slice(0, 500),
          duration: durationMs,
          device: method.slice(0, 20),
          browser: String(statusCode).slice(0, 50),
          ipAddress: this.extractIp(req)?.slice(0, 45),
          userAgent: req?.headers?.['user-agent']?.slice(0, 500),
          userId: req?.user?.id,
          metadata: { method, statusCode } as any,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to track API request: ${err instanceof Error ? err.message : err}`);
    }
  }

  // ─── Track API Error (from AllExceptionsFilter) ───

  async trackApiError(
    method: string, url: string, statusCode: number,
    errorMessage: string, stack?: string, durationMs?: number, req?: any,
  ) {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          sessionId: 'server',
          eventType: 'api_error',
          page: url.split('?')[0].slice(0, 500),
          duration: durationMs,
          device: method.slice(0, 20),
          browser: String(statusCode).slice(0, 50),
          errorMessage: errorMessage?.slice(0, 1000),
          errorStack: stack?.slice(0, 5000),
          ipAddress: this.extractIp(req)?.slice(0, 45),
          userAgent: req?.headers?.['user-agent']?.slice(0, 500),
          userId: req?.user?.id,
          metadata: { method, statusCode } as any,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to track API error: ${err instanceof Error ? err.message : err}`);
    }
  }

  private extractIp(req?: any): string | undefined {
    if (!req) return undefined;
    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim();
    return req.ip;
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

  // ─── API Dashboard Stats ───

  /**
   * API dashboard verisi. `minutes` parametresi gelirse onu kullanır;
   * yoksa `days` üzerinden dakikaya çevirir (geriye dönük uyumluluk).
   * minutes < 1440 ise grafik saatlik bucket'a geçer (ani trafik
   * anomalilerini görmek için). Response'ta `granularity` dönülür.
   */
  async getApiDashboard(options: { days?: number; minutes?: number } = {}) {
    const minutes =
      typeof options.minutes === 'number' && options.minutes > 0
        ? options.minutes
        : Math.max(options.days ?? 30, 1) * 24 * 60;
    const since = new Date(Date.now() - minutes * 60 * 1000);
    const granularity: 'hour' | 'day' = minutes < 24 * 60 ? 'hour' : 'day';

    const [
      totalRequests,
      totalErrors,
      avgResponseTime,
      topEndpoints,
      errorEndpoints,
      statusCodes,
      methods,
      slowEndpoints,
      recentErrors,
      dailyRequests,
      dailyErrors,
    ] = await Promise.all([
      // Total successful API requests
      this.prisma.analyticsEvent.count({
        where: { eventType: 'api_request', createdAt: { gte: since } },
      }),
      // Total API errors
      this.prisma.analyticsEvent.count({
        where: { eventType: 'api_error', createdAt: { gte: since } },
      }),
      // Average response time (successful requests)
      this.prisma.analyticsEvent.aggregate({
        where: { eventType: 'api_request', createdAt: { gte: since }, duration: { not: null } },
        _avg: { duration: true },
      }),
      // Top endpoints by request count
      this.prisma.analyticsEvent.groupBy({
        by: ['page'],
        where: { eventType: 'api_request', createdAt: { gte: since } },
        _count: true,
        _avg: { duration: true },
        orderBy: { _count: { page: 'desc' } },
        take: 20,
      }),
      // Top error endpoints
      this.prisma.analyticsEvent.groupBy({
        by: ['page'],
        where: { eventType: 'api_error', createdAt: { gte: since } },
        _count: true,
        orderBy: { _count: { page: 'desc' } },
        take: 20,
      }),
      // Status code distribution (browser field stores status code)
      this.prisma.analyticsEvent.groupBy({
        by: ['browser'],
        where: {
          eventType: { in: ['api_request', 'api_error'] },
          browser: { not: null },
          createdAt: { gte: since },
        },
        _count: true,
        orderBy: { _count: { browser: 'desc' } },
      }),
      // HTTP method distribution (device field stores method)
      this.prisma.analyticsEvent.groupBy({
        by: ['device'],
        where: {
          eventType: { in: ['api_request', 'api_error'] },
          device: { not: null },
          createdAt: { gte: since },
        },
        _count: true,
        orderBy: { _count: { device: 'desc' } },
      }),
      // Slowest endpoints
      this.prisma.analyticsEvent.groupBy({
        by: ['page'],
        where: { eventType: 'api_request', createdAt: { gte: since }, duration: { not: null } },
        _avg: { duration: true },
        _max: { duration: true },
        _count: true,
        orderBy: { _avg: { duration: 'desc' } },
        take: 15,
      }),
      // Recent API errors
      this.prisma.analyticsEvent.findMany({
        where: { eventType: 'api_error', createdAt: { gte: since } },
        select: {
          page: true,
          device: true,
          browser: true,
          errorMessage: true,
          ipAddress: true,
          userId: true,
          duration: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      // Daily/Hourly API requests (bucket size = granularity)
      granularity === 'hour'
        ? this.prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
            SELECT DATE_TRUNC('hour', created_at) as day, COUNT(*)::bigint as count
            FROM analytics_events
            WHERE event_type = 'api_request' AND created_at >= ${since}
            GROUP BY DATE_TRUNC('hour', created_at)
            ORDER BY day ASC
          `.catch(() => [])
        : this.prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
            SELECT DATE(created_at) as day, COUNT(*)::bigint as count
            FROM analytics_events
            WHERE event_type = 'api_request' AND created_at >= ${since}
            GROUP BY DATE(created_at)
            ORDER BY day ASC
          `.catch(() => []),
      // Daily/Hourly API errors
      granularity === 'hour'
        ? this.prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
            SELECT DATE_TRUNC('hour', created_at) as day, COUNT(*)::bigint as count
            FROM analytics_events
            WHERE event_type = 'api_error' AND created_at >= ${since}
            GROUP BY DATE_TRUNC('hour', created_at)
            ORDER BY day ASC
          `.catch(() => [])
        : this.prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
            SELECT DATE(created_at) as day, COUNT(*)::bigint as count
            FROM analytics_events
            WHERE event_type = 'api_error' AND created_at >= ${since}
            GROUP BY DATE(created_at)
            ORDER BY day ASC
          `.catch(() => []),
    ]);

    const total = totalRequests + totalErrors;

    return {
      summary: {
        totalRequests: total,
        totalErrors,
        errorRate: total > 0 ? +((totalErrors / total) * 100).toFixed(2) : 0,
        avgResponseTime: Math.round(avgResponseTime._avg?.duration || 0),
      },
      topEndpoints: topEndpoints.map((e) => ({
        endpoint: e.page,
        count: e._count,
        avgMs: Math.round(e._avg?.duration || 0),
      })),
      errorEndpoints: errorEndpoints.map((e) => ({
        endpoint: e.page,
        count: e._count,
      })),
      statusCodes: statusCodes.map((s) => ({
        code: s.browser,
        count: s._count,
      })),
      methods: methods.map((m) => ({
        method: m.device,
        count: m._count,
      })),
      slowEndpoints: slowEndpoints.map((s) => ({
        endpoint: s.page,
        avgMs: Math.round(s._avg?.duration || 0),
        maxMs: s._max?.duration || 0,
        samples: s._count,
      })),
      recentErrors: recentErrors.map((e) => ({
        endpoint: e.page,
        method: e.device,
        statusCode: e.browser,
        errorMessage: e.errorMessage,
        ip: e.ipAddress,
        userId: e.userId,
        durationMs: e.duration,
        createdAt: e.createdAt,
      })),
      granularity,
      // Postgres `DATE(...)` pg driver'dan Date objesi olarak dönebiliyor;
      // String() ile doğrudan slice "Fri Apr 17" gibi bozuk string üretiyordu.
      // Her durumda Date'e normalize edip UTC tabanlı "YYYY-MM-DD" veya tam
      // ISO üret — client güvenle parse edebilsin.
      dailyRequests: (dailyRequests as any[]).map((d) => {
        const dt = d.day instanceof Date ? d.day : new Date(d.day);
        const iso = dt.toISOString();
        return {
          day: granularity === 'hour' ? iso : iso.slice(0, 10),
          count: Number(d.count),
        };
      }),
      dailyErrors: (dailyErrors as any[]).map((d) => {
        const dt = d.day instanceof Date ? d.day : new Date(d.day);
        const iso = dt.toISOString();
        return {
          day: granularity === 'hour' ? iso : iso.slice(0, 10),
          count: Number(d.count),
        };
      }),
    };
  }

  /**
   * Belirli bir zaman aralığındaki API hatalarını döner:
   *   - topEndpoints: endpoint bazında hata sayısı (top 15)
   *   - events: ham error event'leri (son `limit` tane, yeni → eski)
   * Admin UI'da chart bar'ına tıklayınca açılan detay panelini besliyor.
   */
  async getApiErrorsForWindow(from: Date, to: Date, limit = 50) {
    const [topEndpoints, events] = await Promise.all([
      this.prisma.analyticsEvent.groupBy({
        by: ['page'],
        where: { eventType: 'api_error', createdAt: { gte: from, lt: to } },
        _count: true,
        orderBy: { _count: { page: 'desc' } },
        take: 15,
      }),
      this.prisma.analyticsEvent.findMany({
        where: { eventType: 'api_error', createdAt: { gte: from, lt: to } },
        select: {
          page: true,
          device: true,
          browser: true,
          errorMessage: true,
          userId: true,
          ipAddress: true,
          duration: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    return {
      window: { from: from.toISOString(), to: to.toISOString() },
      topEndpoints: topEndpoints.map((e) => ({
        endpoint: e.page,
        count: e._count,
      })),
      events: events.map((e) => ({
        endpoint: e.page,
        method: e.device,
        statusCode: e.browser,
        errorMessage: e.errorMessage,
        userId: e.userId,
        ip: e.ipAddress,
        durationMs: e.duration,
        createdAt: e.createdAt,
      })),
    };
  }

  // ─── Extended Metrics ───

  async getExtendedMetrics(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      bounceData,
      totalSessions,
      referrerStats,
      ctaClicks,
      scrollDepthData,
      funnelData,
      conversionVisitors,
      conversionRegistered,
    ] = await Promise.all([
      // Bounce rate: sessions with only 1 page_view
      this.prisma.$queryRaw<Array<{ bounced: bigint; total: bigint }>>`
        WITH session_pages AS (
          SELECT session_id, COUNT(*) as page_count
          FROM analytics_events
          WHERE event_type = 'page_view' AND created_at >= ${since}
            AND session_id != 'server'
          GROUP BY session_id
        )
        SELECT
          COUNT(*) FILTER (WHERE page_count = 1)::bigint as bounced,
          COUNT(*)::bigint as total
        FROM session_pages
      `.catch(() => [{ bounced: BigInt(0), total: BigInt(0) }]),

      // Total unique sessions (for funnel denominator)
      this.prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
          createdAt: { gte: since },
          sessionId: { not: 'server' },
        },
      }).then((r) => r.length),

      // Referrer analysis
      this.prisma.analyticsEvent.groupBy({
        by: ['referrer'],
        where: {
          eventType: 'page_view',
          referrer: { not: null },
          createdAt: { gte: since },
          sessionId: { not: 'server' },
        },
        _count: true,
        orderBy: { _count: { referrer: 'desc' } },
        take: 20,
      }),

      // CTA clicks
      this.prisma.analyticsEvent.groupBy({
        by: ['page', 'errorMessage'], // errorMessage stores CTA label
        where: {
          eventType: 'cta_click',
          createdAt: { gte: since },
        },
        _count: true,
        orderBy: { _count: { page: 'desc' } },
        take: 30,
      }),

      // Scroll depth distribution
      this.prisma.$queryRaw<Array<{ depth: string; cnt: bigint }>>`
        SELECT
          CASE
            WHEN (metadata->>'depth')::int <= 25 THEN '25%'
            WHEN (metadata->>'depth')::int <= 50 THEN '50%'
            WHEN (metadata->>'depth')::int <= 75 THEN '75%'
            ELSE '100%'
          END as depth,
          COUNT(*)::bigint as cnt
        FROM analytics_events
        WHERE event_type = 'scroll_depth' AND created_at >= ${since}
          AND metadata->>'depth' IS NOT NULL
        GROUP BY depth
        ORDER BY depth ASC
      `.catch(() => []),

      // Funnel: pages visited in order — Landing, Register, OTP, Dashboard
      this.prisma.$queryRaw<Array<{ step: string; visitors: bigint }>>`
        SELECT step, COUNT(DISTINCT session_id)::bigint as visitors FROM (
          SELECT session_id, 'landing' as step FROM analytics_events
            WHERE event_type = 'page_view' AND page = '/' AND created_at >= ${since} AND session_id != 'server'
          UNION ALL
          SELECT session_id, 'register' as step FROM analytics_events
            WHERE event_type = 'page_view' AND page LIKE '%/kayit%' AND created_at >= ${since} AND session_id != 'server'
          UNION ALL
          SELECT session_id, 'otp' as step FROM analytics_events
            WHERE event_type = 'page_view' AND page LIKE '%/otp%' AND created_at >= ${since} AND session_id != 'server'
          UNION ALL
          SELECT session_id, 'dashboard' as step FROM analytics_events
            WHERE event_type = 'page_view' AND page LIKE '%/dashboard%' AND created_at >= ${since} AND session_id != 'server'
        ) funnel
        GROUP BY step
      `.catch(() => []),

      // Unique visitors (sessions with page_view)
      this.prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
          eventType: 'page_view',
          createdAt: { gte: since },
          sessionId: { not: 'server' },
        },
      }).then((r) => r.length),

      // Registered users in the period (page_view on dashboard = logged in user)
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: {
          eventType: 'page_view',
          createdAt: { gte: since },
          userId: { not: null },
        },
      }).then((r) => r.length),
    ]);

    // Parse bounce rate
    const bd = (bounceData as any[])[0] || { bounced: BigInt(0), total: BigInt(0) };
    const bouncedCount = Number(bd.bounced);
    const totalSessionsForBounce = Number(bd.total);
    const bounceRate = totalSessionsForBounce > 0
      ? +((bouncedCount / totalSessionsForBounce) * 100).toFixed(1)
      : 0;

    // Parse referrers into categories
    const referrerCategories: Record<string, number> = {};
    for (const r of referrerStats) {
      const ref = r.referrer || '';
      let category = 'Direkt';
      if (ref.includes('google') || ref.includes('bing') || ref.includes('yahoo') || ref.includes('yandex')) {
        category = 'Arama Motoru';
      } else if (ref.includes('facebook') || ref.includes('instagram') || ref.includes('twitter') || ref.includes('linkedin') || ref.includes('tiktok') || ref.includes('t.co')) {
        category = 'Sosyal Medya';
      } else if (ref) {
        category = 'Diger Site';
      }
      referrerCategories[category] = (referrerCategories[category] || 0) + r._count;
    }

    // Parse funnel steps
    const funnelMap: Record<string, number> = {};
    for (const f of funnelData as any[]) {
      funnelMap[f.step] = Number(f.visitors);
    }

    // Parse scroll depth
    const scrollDepths = (scrollDepthData as any[]).map((d) => ({
      depth: d.depth as string,
      count: Number(d.cnt),
    }));

    return {
      bounceRate: {
        rate: bounceRate,
        bounced: bouncedCount,
        total: totalSessionsForBounce,
      },
      funnel: {
        landing: funnelMap['landing'] || 0,
        register: funnelMap['register'] || 0,
        otp: funnelMap['otp'] || 0,
        dashboard: funnelMap['dashboard'] || 0,
      },
      conversionRate: {
        visitors: conversionVisitors,
        registered: conversionRegistered,
        rate: conversionVisitors > 0
          ? +((conversionRegistered / conversionVisitors) * 100).toFixed(1)
          : 0,
      },
      referrers: {
        categories: Object.entries(referrerCategories).map(([category, count]) => ({
          category,
          count,
        })),
        topSources: referrerStats.map((r) => ({
          source: r.referrer || 'Direkt',
          count: r._count,
        })),
      },
      ctaClicks: ctaClicks.map((c) => ({
        page: c.page,
        label: c.errorMessage, // CTA label stored in errorMessage
        count: c._count,
      })),
      scrollDepth: scrollDepths,
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

  // ─── Admin: Reset / Milat ───
  // Tum analytics_events'i (veya belirli bir event_type'i) siler. Sifirdan
  // ölçüm başlatmak icin. Geri alinmaz.
  async resetEvents(type?: string): Promise<number> {
    const where = type && type.trim() ? { eventType: type.trim() } : {};
    const result = await this.prisma.analyticsEvent.deleteMany({ where });
    this.logger.warn(
      `Analytics events reset — type=${type ?? 'ALL'}, deleted=${result.count}`,
    );
    return result.count;
  }
}
