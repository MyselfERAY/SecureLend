import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentRunDto } from './dto/create-agent-run.dto';
import { AgentType, AgentRunStatus } from '@prisma/client';

@Injectable()
export class AgentRunService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAgentRunDto) {
    return this.prisma.agentRun.create({
      data: { agentType: dto.agentType },
    });
  }

  async complete(id: string, data?: { summary?: string; tokenUsage?: number }) {
    await this.findOneOrFail(id);
    return this.prisma.agentRun.update({
      where: { id },
      data: {
        status: AgentRunStatus.COMPLETED,
        completedAt: new Date(),
        summary: data?.summary,
        tokenUsage: data?.tokenUsage,
      },
    });
  }

  async fail(id: string, errorMessage: string) {
    await this.findOneOrFail(id);
    return this.prisma.agentRun.update({
      where: { id },
      data: {
        status: AgentRunStatus.FAILED,
        completedAt: new Date(),
        errorMessage,
      },
    });
  }

  async findAll(agentType?: AgentType, limit = 50) {
    return this.prisma.agentRun.findMany({
      where: agentType ? { agentType } : undefined,
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [runsPerType, successRate, totalThisMonth] = await Promise.all([
      this.prisma.agentRun.groupBy({
        by: ['agentType'],
        _count: { id: true },
      }),
      this.prisma.agentRun.groupBy({
        by: ['agentType'],
        _count: { id: true },
        where: { status: AgentRunStatus.COMPLETED },
      }),
      this.prisma.agentRun.count({
        where: { startedAt: { gte: startOfMonth } },
      }),
    ]);

    const totalPerType = Object.fromEntries(
      runsPerType.map((r) => [r.agentType, r._count.id]),
    );
    const completedPerType = Object.fromEntries(
      successRate.map((r) => [r.agentType, r._count.id]),
    );

    const successRatePerType: Record<string, number> = {};
    for (const type of Object.values(AgentType)) {
      const total = totalPerType[type] || 0;
      const completed = completedPerType[type] || 0;
      successRatePerType[type] = total > 0 ? Math.round((completed / total) * 100) : 0;
    }

    return {
      runsPerType: totalPerType,
      successRatePerType,
      totalThisMonth,
    };
  }

  private async findOneOrFail(id: string) {
    const run = await this.prisma.agentRun.findUnique({ where: { id } });
    if (!run) throw new NotFoundException('Agent run bulunamadi');
    return run;
  }
}
