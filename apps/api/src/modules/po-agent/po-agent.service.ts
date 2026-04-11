import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePoReportDto } from './dto/create-po-report.dto';
import { CreatePoItemDto } from './dto/create-po-item.dto';
import { UpdatePoItemDto } from './dto/update-po-item.dto';
import { PoItemStatus, SuggestionStatus, MarketingTaskStatus } from '@prisma/client';

@Injectable()
export class PoAgentService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(dto: CreatePoReportDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.$transaction(async (tx) => {
      // Upsert: if today's report exists, update it; otherwise create
      const report = await tx.poReport.upsert({
        where: { reportDate: today },
        update: {
          summary: dto.summary,
          metricsSnapshot: dto.metricsSnapshot ?? undefined,
          agentRunId: dto.agentRunId ?? undefined,
        },
        create: {
          reportDate: today,
          summary: dto.summary,
          metricsSnapshot: dto.metricsSnapshot ?? undefined,
          agentRunId: dto.agentRunId ?? undefined,
        },
      });

      // If updating existing report, remove old items first
      const existingItems = await tx.poItem.count({
        where: { poReportId: report.id },
      });
      if (existingItems > 0) {
        await tx.poItem.deleteMany({
          where: { poReportId: report.id },
        });
      }

      const createdItems = [];

      for (const item of dto.items) {
        let devSuggestionId: string | undefined;

        if (item.isDevTask) {
          const devSuggestion = await tx.devSuggestion.create({
            data: {
              title: item.title,
              description: item.description,
              priority: item.priority ?? 'MEDIUM',
              status: SuggestionStatus.REJECTED,
            },
          });
          devSuggestionId = devSuggestion.id;
        }

        const poItem = await tx.poItem.create({
          data: {
            poReportId: report.id,
            category: item.category,
            title: item.title,
            description: item.description,
            priority: item.priority ?? 'MEDIUM',
            isDevTask: item.isDevTask ?? false,
            status: item.isDevTask
              ? PoItemStatus.MOVED_TO_DEV
              : PoItemStatus.ACTIVE,
            devSuggestionId,
          },
        });

        createdItems.push(poItem);
      }

      return { ...report, items: createdItems };
    });
  }

  async findAllReports(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.poReport.findMany({
        skip,
        take: limit,
        orderBy: { reportDate: 'desc' },
        include: {
          items: {
            include: {
              devSuggestion: { select: { id: true, status: true, prLink: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.poReport.count(),
    ]);

    return { reports, total, page, limit };
  }

  async findReportById(id: string) {
    const report = await this.prisma.poReport.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            devSuggestion: { select: { id: true, status: true, prLink: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!report) throw new NotFoundException('Rapor bulunamadi');
    return report;
  }

  async findLatestReport() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try today's report first, then fall back to most recent
    let report = await this.prisma.poReport.findUnique({
      where: { reportDate: today },
      include: {
        items: {
          include: {
            devSuggestion: { select: { id: true, status: true, prLink: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!report) {
      report = await this.prisma.poReport.findFirst({
        orderBy: { reportDate: 'desc' },
        include: {
          items: {
            include: {
              devSuggestion: {
                select: { id: true, status: true, prLink: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    }

    if (!report) throw new NotFoundException('Henuz rapor yok');
    return report;
  }

  async createItem(dto: CreatePoItemDto) {
    // Try to attach to today's report if it exists
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysReport = await this.prisma.poReport.findUnique({
      where: { reportDate: today },
    });

    return this.prisma.poItem.create({
      data: {
        poReportId: todaysReport?.id ?? null,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'MEDIUM',
        isDevTask: dto.isDevTask ?? false,
        createdByAdmin: true,
      },
    });
  }

  async updateItem(id: string, dto: UpdatePoItemDto) {
    const item = await this.prisma.poItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item bulunamadi');

    return this.prisma.poItem.update({ where: { id }, data: dto });
  }

  async moveItemToDev(id: string) {
    const item = await this.prisma.poItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item bulunamadi');

    return this.prisma.$transaction(async (tx) => {
      const devSuggestion = await tx.devSuggestion.create({
        data: {
          title: item.title,
          description: item.description,
          priority: item.priority,
          status: SuggestionStatus.REJECTED,
        },
      });

      const updatedItem = await tx.poItem.update({
        where: { id },
        data: {
          devSuggestionId: devSuggestion.id,
          status: PoItemStatus.MOVED_TO_DEV,
        },
      });

      return { item: updatedItem, devSuggestion };
    });
  }

  async sendToTasks(id: string) {
    const item = await this.prisma.poItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item bulunamadi');

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.marketingTask.create({
        data: {
          source: 'PO',
          title: item.title,
          description: item.description,
          status: MarketingTaskStatus.TODO,
        },
      });

      const updatedItem = await tx.poItem.update({
        where: { id },
        data: { status: PoItemStatus.DISMISSED },
      });

      return { item: updatedItem, task };
    });
  }

  // ─── Agent Context: previous reports + active items + dev status ───

  async getAgentContext() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [
      recentReports,
      activeItems,
      completedDevSuggestions,
      pendingDevSuggestions,
      previousMetrics,
    ] = await Promise.all([
      // Last 7 report item titles + categories (to avoid repeating)
      this.prisma.poReport.findMany({
        where: { reportDate: { gte: sevenDaysAgo } },
        orderBy: { reportDate: 'desc' },
        select: {
          reportDate: true,
          items: {
            select: {
              category: true,
              title: true,
              status: true,
              priority: true,
            },
          },
        },
      }),

      // Currently ACTIVE items (not yet resolved)
      this.prisma.poItem.findMany({
        where: { status: 'ACTIVE' },
        select: {
          category: true,
          title: true,
          priority: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),

      // Dev suggestions completed in last 14 days
      this.prisma.devSuggestion.findMany({
        where: {
          status: SuggestionStatus.DONE,
          updatedAt: { gte: fourteenDaysAgo },
        },
        select: {
          title: true,
          updatedAt: true,
          prLink: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 15,
      }),

      // Dev suggestions still pending
      this.prisma.devSuggestion.findMany({
        where: {
          status: { in: [SuggestionStatus.PENDING, SuggestionStatus.IN_PROGRESS] },
        },
        select: {
          title: true,
          status: true,
          priority: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),

      // Yesterday's metrics snapshot (for delta calculation)
      this.prisma.poReport.findFirst({
        where: {
          reportDate: { lt: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        orderBy: { reportDate: 'desc' },
        select: {
          reportDate: true,
          metricsSnapshot: true,
        },
      }),
    ]);

    // Collect all recent item titles for dedup
    const recentItemTitles = recentReports.flatMap((r) =>
      r.items.map((i) => `[${i.category}] ${i.title}`),
    );

    // Category distribution in last 7 days
    const categoryCounts: Record<string, number> = {};
    for (const r of recentReports) {
      for (const item of r.items) {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      }
    }

    // Day of week for focus guidance
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    return {
      dayOfWeek,
      recentItemTitles,
      categoryCounts,
      activeItems: activeItems.map((i) => ({
        category: i.category,
        title: i.title,
        priority: i.priority,
        daysOld: Math.floor((Date.now() - i.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
      })),
      completedDevTasks: completedDevSuggestions.map((d) => d.title),
      pendingDevTasks: pendingDevSuggestions.map((d) => `[${d.status}] ${d.title}`),
      previousMetricsSnapshot: previousMetrics?.metricsSnapshot || null,
      previousMetricsDate: previousMetrics?.reportDate || null,
      totalReportsInLast7Days: recentReports.length,
    };
  }

  async getMetrics() {
    const [
      userCount,
      contractsByStatus,
      paymentsSummary,
      recentUsersCount,
      recentContractsCount,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.contract.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.paymentSchedule.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.contract.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      users: {
        total: userCount,
        lastSevenDays: recentUsersCount,
      },
      contracts: {
        byStatus: contractsByStatus.reduce(
          (acc: Record<string, number>, item: { status: string; _count: { id: number } }) => ({ ...acc, [item.status]: item._count.id }),
          {} as Record<string, number>,
        ),
        lastSevenDays: recentContractsCount,
      },
      payments: {
        byStatus: paymentsSummary.map((p: { status: string; _count: { id: number }; _sum: { amount: unknown } }) => ({
          status: p.status,
          count: p._count.id,
          totalAmount: p._sum.amount,
        })),
      },
    };
  }
}
