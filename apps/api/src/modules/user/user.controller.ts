import { Controller, Get, Patch, Post, Body, Req, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import { Request } from 'express';
import type { JSendSuccess } from '@securelend/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddRoleDto } from './dto/add-role.dto';

@ApiTags('User')
@ApiBearerAuth('access-token')
@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get role-aware dashboard aggregate data' })
  async getDashboard(
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.userService.getDashboard(userId);
    return { status: 'success', data };
  }

  @Get('search')
  @Throttle({ short: { limit: 5, ttl: seconds(10) } })
  async searchByPhone(
    @Query('phone') phone: string,
    @CurrentUser('id') userId: string,
  ) {
    if (!phone || !/^5\d{9}$/.test(phone)) {
      return { status: 'fail', data: { message: 'Gecerli telefon numarasi girin (5XXXXXXXXX)' } };
    }
    const user = await this.userService.searchByPhone(phone, userId);
    return { status: 'success', data: user };
  }

  @Get('me')
  async getProfile(
    @CurrentUser() user: { id: string },
  ): Promise<JSendSuccess<unknown>> {
    const profile = await this.userService.getProfile(user.id);
    return { status: 'success', data: profile };
  }

  @Patch('me')
  @Throttle({ short: { limit: 2, ttl: seconds(5) } })
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ): Promise<JSendSuccess<unknown>> {
    const profile = await this.userService.updateProfile(user.id, dto);
    return { status: 'success', data: profile };
  }

  @Post('me/roles')
  @Throttle({ short: { limit: 1, ttl: seconds(10) } })
  async addRole(
    @CurrentUser() user: { id: string },
    @Body() dto: AddRoleDto,
  ): Promise<JSendSuccess<unknown>> {
    const profile = await this.userService.addRole(user.id, dto.role);
    return { status: 'success', data: profile };
  }

  @Post('me/kyc')
  @Throttle({ short: { limit: 1, ttl: seconds(30) } })
  async completeKyc(
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ): Promise<JSendSuccess<unknown>> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const profile = await this.userService.completeKyc(user.id, ipAddress);
    return { status: 'success', data: profile };
  }
}
