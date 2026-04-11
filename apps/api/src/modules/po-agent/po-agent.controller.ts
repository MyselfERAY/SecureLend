import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PoAgentService } from './po-agent.service';
import { CreatePoReportDto } from './dto/create-po-report.dto';
import { CreatePoItemDto } from './dto/create-po-item.dto';
import { UpdatePoItemDto } from './dto/update-po-item.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/v1/po')
@Roles(UserRole.ADMIN, UserRole.SERVICE)
export class PoAgentController {
  constructor(private readonly poAgentService: PoAgentService) {}

  @Post('reports')
  async createReport(@Body() dto: CreatePoReportDto) {
    const report = await this.poAgentService.createReport(dto);
    return { status: 'success', data: report };
  }

  @Get('reports')
  async findAllReports(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.poAgentService.findAllReports(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return { status: 'success', data: result };
  }

  @Get('reports/latest')
  async findLatestReport() {
    const report = await this.poAgentService.findLatestReport();
    return { status: 'success', data: report };
  }

  @Get('reports/:id')
  async findReportById(@Param('id', ParseUUIDPipe) id: string) {
    const report = await this.poAgentService.findReportById(id);
    return { status: 'success', data: report };
  }

  @Post('items')
  async createItem(@Body() dto: CreatePoItemDto) {
    const item = await this.poAgentService.createItem(dto);
    return { status: 'success', data: item };
  }

  @Patch('items/:id')
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePoItemDto,
  ) {
    const item = await this.poAgentService.updateItem(id, dto);
    return { status: 'success', data: item };
  }

  @Post('items/:id/move-to-dev')
  async moveItemToDev(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.poAgentService.moveItemToDev(id);
    return { status: 'success', data: result };
  }

  @Post('items/:id/send-to-tasks')
  async sendToTasks(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.poAgentService.sendToTasks(id);
    return { status: 'success', data: result };
  }

  @Get('metrics')
  async getMetrics() {
    const metrics = await this.poAgentService.getMetrics();
    return { status: 'success', data: metrics };
  }

  @Get('agent-context')
  async getAgentContext() {
    const context = await this.poAgentService.getAgentContext();
    return { status: 'success', data: context };
  }
}
