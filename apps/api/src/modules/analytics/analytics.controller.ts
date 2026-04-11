import {
  Controller, Get, Post, Body, Query,
  HttpCode, HttpStatus, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import { Request } from 'express';
import {
  IsString, IsOptional, IsNumber, IsArray,
  ValidateNested, MaxLength, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { JSendSuccess } from '@securelend/shared';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service';

class TrackEventDto {
  @IsString() @MaxLength(64)
  sessionId!: string;

  @IsString() @MaxLength(30)
  eventType!: string;

  @IsString() @MaxLength(500)
  page!: string;

  @IsOptional() @IsString() @MaxLength(500)
  referrer?: string;

  @IsOptional() @IsNumber() @Min(0) @Max(86400)
  duration?: number;

  @IsOptional() @IsNumber()
  screenWidth?: number;

  @IsOptional() @IsNumber()
  screenHeight?: number;

  @IsOptional() @IsString() @MaxLength(1000)
  errorMessage?: string;

  @IsOptional() @IsString() @MaxLength(5000)
  errorStack?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

class TrackBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackEventDto)
  events!: TrackEventDto[];
}

@ApiTags('Analytics')
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ─── PUBLIC: Track single event (supports both auth & anon) ───

  @Post('track')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ short: { limit: 30, ttl: seconds(10) } })
  async track(
    @Body() dto: TrackEventDto,
    @Req() req: Request,
    @CurrentUser('id') userId?: string,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || undefined;
    const ua = req.headers['user-agent'] || undefined;
    await this.analyticsService.track(dto, ip, ua, userId);
  }

  // ─── PUBLIC: Track batch events ───

  @Post('track/batch')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ short: { limit: 10, ttl: seconds(10) } })
  async trackBatch(
    @Body() dto: TrackBatchDto,
    @Req() req: Request,
    @CurrentUser('id') userId?: string,
  ) {
    if (!dto.events || dto.events.length === 0) return;
    if (dto.events.length > 50) dto.events = dto.events.slice(0, 50); // cap
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || undefined;
    const ua = req.headers['user-agent'] || undefined;
    await this.analyticsService.trackBatch(dto.events, ip, ua, userId);
  }

  // ─── ADMIN: Frontend Dashboard ───

  @Get('dashboard')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  async getDashboard(
    @Query('days') days?: string,
  ): Promise<JSendSuccess<unknown>> {
    const d = Math.min(Math.max(parseInt(days || '30', 10) || 30, 1), 365);
    const data = await this.analyticsService.getDashboard(d);
    return { status: 'success', data };
  }

  // ─── ADMIN: API Dashboard ───

  @Get('api-dashboard')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  async getApiDashboard(
    @Query('days') days?: string,
  ): Promise<JSendSuccess<unknown>> {
    const d = Math.min(Math.max(parseInt(days || '30', 10) || 30, 1), 365);
    const data = await this.analyticsService.getApiDashboard(d);
    return { status: 'success', data };
  }

  // ─── ADMIN: Extended Metrics (Bounce, Funnel, Referrer, Conversion) ───

  @Get('extended')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  async getExtendedMetrics(
    @Query('days') days?: string,
  ): Promise<JSendSuccess<unknown>> {
    const d = Math.min(Math.max(parseInt(days || '30', 10) || 30, 1), 365);
    const data = await this.analyticsService.getExtendedMetrics(d);
    return { status: 'success', data };
  }
}
