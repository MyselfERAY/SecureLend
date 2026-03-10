import {
  Controller, Get, Query, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

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

  @Get('commissions')
  async getCommissionReport() {
    const data = await this.adminService.getCommissionReport();
    return { status: 'success', data };
  }
}
