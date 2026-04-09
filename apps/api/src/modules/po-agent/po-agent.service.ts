import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePoReportDto } from './dto/create-po-report.dto';
import { CreatePoItemDto } from './dto/create-po-item.dto';
import { UpdatePoItemDto } from './dto/update-po-item.dto';
import { PoItemStatus, SuggestionStatus } from '@prisma/client';

@Injectable()
export class PoAgentService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(dto: CreatePoReportDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.$transaction(async (tx) => {
      const report = await tx.poReport.create({
        data: {
          reportDate: today,
          summary: dto.summary,
          metricsSnapshot: dto.metricsSnapshot ?? undefined,
          agentRunId: dto.agentRunId ?? undefined,
        },
      });

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
        include: { _count: { select: { items: true } } },
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
