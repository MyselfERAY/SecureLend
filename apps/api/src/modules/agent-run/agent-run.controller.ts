import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { AgentRunService } from './agent-run.service';
import { CreateAgentRunDto } from './dto/create-agent-run.dto';
import { UpdateAgentRunDto } from './dto/update-agent-run.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, AgentType, AgentRunStatus } from '@prisma/client';

@Controller('api/v1/agent-runs')
@Roles(UserRole.ADMIN, UserRole.SERVICE)
export class AgentRunController {
  constructor(private readonly agentRunService: AgentRunService) {}

  @Post()
  async create(@Body() dto: CreateAgentRunDto) {
    const run = await this.agentRunService.create(dto);
    return { status: 'success', data: run };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAgentRunDto) {
    let run;

    if (dto.status === AgentRunStatus.COMPLETED) {
      run = await this.agentRunService.complete(id, {
        summary: dto.summary,
        tokenUsage: dto.tokenUsage,
      });
    } else if (dto.status === AgentRunStatus.FAILED) {
      run = await this.agentRunService.fail(id, dto.errorMessage ?? 'Bilinmeyen hata');
    } else {
      // Generic update for other cases
      run = await this.agentRunService.complete(id, {
        summary: dto.summary,
        tokenUsage: dto.tokenUsage,
      });
    }

    return { status: 'success', data: run };
  }

  @Get()
  async findAll(@Query('agentType') agentType?: AgentType) {
    const runs = await this.agentRunService.findAll(agentType);
    return { status: 'success', data: runs };
  }

  @Get('stats')
  async getStats() {
    const stats = await this.agentRunService.getStats();
    return { status: 'success', data: stats };
  }
}
