import {
  Controller, Get, Post, Body, Query, ParseIntPipe, DefaultValuePipe, Header,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN)
@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  async getOverview() {
    const stats = await this.adminService.getOverviewStats();
    return { status: 'success', data: stats };
  }

  @Get('users')
  async getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const data = await this.adminService.getUsers(page, Math.min(limit, 100));
    return { status: 'success', data };
  }

  @Get('contracts')
  async getContracts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const data = await this.adminService.getContracts(page, Math.min(limit, 100));
    return { status: 'success', data };
  }

  @Get('payments')
  async getPayments(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const data = await this.adminService.getPayments(page, Math.min(limit, 100));
    return { status: 'success', data };
  }

  @Get('activation-funnel')
  async getActivationFunnel(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const data = await this.adminService.getActivationFunnel(Math.min(days, 365));
    return { status: 'success', data };
  }

  @Get('commissions')
  async getCommissionReport() {
    const data = await this.adminService.getCommissionReport();
    return { status: 'success', data };
  }

  @Get('commissions/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="komisyon-raporu.csv"')
  async exportCommissions(): Promise<string> {
    return this.adminService.exportCommissionsAsCsv();
  }

  @Post('invites')
  async createInvite(
    @Body() dto: CreateInviteDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.adminService.createInvite(user.id, dto);
    return { status: 'success', data };
  }

  @Get('invites')
  async listInvites(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const data = await this.adminService.listInvites(page, Math.min(limit, 100));
    return { status: 'success', data };
  }
}
