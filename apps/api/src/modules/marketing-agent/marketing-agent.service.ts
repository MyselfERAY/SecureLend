import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarketingReportDto } from './dto/create-marketing-report.dto';
import { UpdateMarketingTaskDto } from './dto/update-marketing-task.dto';
import { CreateResearchRequestDto } from './dto/create-research-request.dto';
import {
  MarketingReportType,
  MarketingTaskStatus,
  ResearchRequestStatus,
} from '@prisma/client';

@Injectable()
export class MarketingAgentService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Reports ──────────────────────────────────────────────────

  async createReport(dto: CreateMarketingReportDto) {
    const { tasks, reportDate, ...reportData } = dto;

    return this.prisma.marketingReport.create({
      data: {
        ...reportData,
        reportDate: reportDate ? new Date(reportDate) : new Date(),
        tasks: tasks?.length
          ? {
              createMany: {
                data: tasks.map((t) => ({
                  title: t.title,
                  description: t.description,
                })),
              },
            }
          : undefined,
      },
      include: { tasks: true },
    });
  }

  async findAllReports(type?: MarketingReportType, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = type ? { type } : undefined;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.marketingReport.findMany({
        where,
        orderBy: { reportDate: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { tasks: true } } },
      }),
      this.prisma.marketingReport.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findReportById(id: string) {
    const report = await this.prisma.marketingReport.findUnique({
      where: { id },
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
    });
    if (!report) throw new NotFoundException('Rapor bulunamadi');
    return report;
  }

  async getReportHtml(id: string) {
    const report = await this.prisma.marketingReport.findUnique({
      where: { id },
      select: { content: true },
    });
    if (!report) throw new NotFoundException('Rapor bulunamadi');
    return report.content;
  }

  // ─── Tasks ────────────────────────────────────────────────────

  async findAllTasks(
    status?: MarketingTaskStatus,
    responsible?: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (responsible) where.responsible = responsible;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.marketingTask.findMany({
        where,
        orderBy: [{ targetDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.marketingTask.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findUpcomingTasks() {
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    return this.prisma.marketingTask.findMany({
      where: {
        targetDate: { gte: now, lte: in7Days },
        status: { notIn: [MarketingTaskStatus.COMPLETED, MarketingTaskStatus.CANCELLED] },
      },
      orderBy: { targetDate: 'asc' },
    });
  }

  async updateTask(id: string, dto: UpdateMarketingTaskDto) {
    const existing = await this.prisma.marketingTask.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Gorev bulunamadi');

    const data: Record<string, unknown> = { ...dto };

    if (dto.targetDate) {
      data.targetDate = new Date(dto.targetDate);
    }

    if (dto.status === MarketingTaskStatus.COMPLETED) {
      data.completedAt = new Date();
    } else if (dto.status && existing.status === MarketingTaskStatus.COMPLETED) {
      data.completedAt = null;
    }

    return this.prisma.marketingTask.update({ where: { id }, data });
  }

  // ─── Research Requests ────────────────────────────────────────

  async createResearchRequest(dto: CreateResearchRequestDto) {
    return this.prisma.researchRequest.create({
      data: { ...dto, status: ResearchRequestStatus.PENDING },
    });
  }

  async findAllResearchRequests() {
    return this.prisma.researchRequest.findMany({
      orderBy: { requestedAt: 'desc' },
      include: { resultReport: true },
    });
  }

  async findResearchRequestById(id: string) {
    const request = await this.prisma.researchRequest.findUnique({
      where: { id },
      include: { resultReport: true },
    });
    if (!request) throw new NotFoundException('Arastirma talebi bulunamadi');
    return request;
  }

  async completeResearchRequest(id: string, reportId: string) {
    const request = await this.prisma.researchRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Arastirma talebi bulunamadi');

    const report = await this.prisma.marketingReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Rapor bulunamadi');

    return this.prisma.researchRequest.update({
      where: { id },
      data: {
        status: ResearchRequestStatus.COMPLETED,
        resultReportId: reportId,
        completedAt: new Date(),
      },
      include: { resultReport: true },
    });
  }
}
