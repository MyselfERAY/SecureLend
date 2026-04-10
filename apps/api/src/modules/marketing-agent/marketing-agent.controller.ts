import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Header,
} from '@nestjs/common';
import { MarketingAgentService } from './marketing-agent.service';
import { CreateMarketingReportDto } from './dto/create-marketing-report.dto';
import { UpdateMarketingTaskDto } from './dto/update-marketing-task.dto';
import { CreateResearchRequestDto } from './dto/create-research-request.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  UserRole,
  MarketingReportType,
  MarketingTaskStatus,
} from '@prisma/client';

@Controller('api/v1/marketing')
@Roles(UserRole.ADMIN, UserRole.SERVICE)
export class MarketingAgentController {
  constructor(private readonly marketingAgentService: MarketingAgentService) {}

  // ─── Reports ──────────────────────────────────────────────────

  @Post('reports')
  async createReport(@Body() dto: CreateMarketingReportDto) {
    const report = await this.marketingAgentService.createReport(dto);
    return { status: 'success', data: report };
  }

  @Get('reports')
  async findAllReports(
    @Query('type') type?: MarketingReportType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.marketingAgentService.findAllReports(
      type,
      page ? +page : undefined,
      limit ? +limit : undefined,
    );
    return { status: 'success', data: result };
  }

  @Get('reports/:id')
  async findReportById(@Param('id') id: string) {
    const report = await this.marketingAgentService.findReportById(id);
    return { status: 'success', data: report };
  }

  @Get('reports/:id/html')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="rapor.html"')
  async getReportHtml(@Param('id') id: string) {
    return this.marketingAgentService.getReportHtml(id);
  }

  // ─── Tasks ────────────────────────────────────────────────────

  @Get('tasks')
  async findAllTasks(
    @Query('status') status?: MarketingTaskStatus,
    @Query('responsible') responsible?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.marketingAgentService.findAllTasks(
      status,
      responsible,
      page ? +page : undefined,
      limit ? +limit : undefined,
    );
    return { status: 'success', data: result };
  }

  @Get('tasks/upcoming')
  async findUpcomingTasks() {
    const tasks = await this.marketingAgentService.findUpcomingTasks();
    return { status: 'success', data: tasks };
  }

  @Patch('tasks/:id')
  async updateTask(@Param('id') id: string, @Body() dto: UpdateMarketingTaskDto) {
    const task = await this.marketingAgentService.updateTask(id, dto);
    return { status: 'success', data: task };
  }

  // ─── Research Requests ────────────────────────────────────────

  @Post('research')
  async createResearchRequest(@Body() dto: CreateResearchRequestDto) {
    const request = await this.marketingAgentService.createResearchRequest(dto);
    return { status: 'success', data: request };
  }

  @Get('research')
  async findAllResearchRequests() {
    const requests = await this.marketingAgentService.findAllResearchRequests();
    return { status: 'success', data: requests };
  }

  @Get('research/:id')
  async findResearchRequestById(@Param('id') id: string) {
    const request = await this.marketingAgentService.findResearchRequestById(id);
    return { status: 'success', data: request };
  }
}
