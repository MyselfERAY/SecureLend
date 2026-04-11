import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentRunDto } from './dto/create-agent-run.dto';
import { AgentRunStatus } from '@prisma/client';

@Injectable()
export class AgentRunService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAgentRunDto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.prisma.agentRun.create({
      data: { agentType: dto.agentType as any },
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

  async findAll(agentType?: string, limit = 50) {
    return this.prisma.agentRun.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: agentType ? { agentType: agentType as any } : undefined,
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

    // Iterate all types that have ever run (includes HEALTH, ARTICLE once DB enum is extended)
    const successRatePerType: Record<string, number> = {};
    for (const type of Object.keys(totalPerType)) {
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
