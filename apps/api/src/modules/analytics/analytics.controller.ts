import {
  Controller, Get, Post, Delete, Body, Query,
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
    @Query('minutes') minutes?: string,
  ): Promise<JSendSuccess<unknown>> {
    // Dakika bazında daha esnek zaman aralığı (1 dakika–1 yıl).
    // Verilmezse `days` parametresinden türetilir; her ikisi de yoksa 30 gün.
    const parsedMinutes = minutes ? parseInt(minutes, 10) : NaN;
    const parsedDays = days ? parseInt(days, 10) : NaN;
    const options: { days?: number; minutes?: number } = {};
    if (Number.isFinite(parsedMinutes) && parsedMinutes > 0) {
      options.minutes = Math.min(Math.max(parsedMinutes, 1), 365 * 24 * 60);
    } else {
      options.days = Math.min(Math.max(Number.isFinite(parsedDays) ? parsedDays : 30, 1), 365);
    }
    const data = await this.analyticsService.getApiDashboard(options);
    return { status: 'success', data };
  }

  /**
   * Belirli bir zaman penceresinde (bucket) olan API hatalarının detayı.
   * Chart'ta bir bar'a tıklandığında o bucket'ın detayını getirmek için
   * kullanılıyor. `from` ve `to` ISO8601 formatında olmalı; en fazla 7 gün
   * genişliğe izin veriliyor (büyük aralıklarda zaten `/api-dashboard`
   * aggregate'i var).
   */
  @Get('api-errors')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  async getApiErrorsForWindow(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ): Promise<JSendSuccess<unknown>> {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if (!fromDate || Number.isNaN(fromDate.getTime()) || !toDate || Number.isNaN(toDate.getTime())) {
      return {
        status: 'success',
        data: { window: { from: null, to: null }, topEndpoints: [], events: [] },
      };
    }
    const maxWindowMs = 7 * 24 * 60 * 60 * 1000;
    if (toDate.getTime() - fromDate.getTime() > maxWindowMs) {
      return {
        status: 'success',
        data: {
          window: { from: fromDate.toISOString(), to: toDate.toISOString() },
          topEndpoints: [],
          events: [],
          truncated: true,
        },
      };
    }
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const safeLimit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 50, 1), 200);
    const data = await this.analyticsService.getApiErrorsForWindow(fromDate, toDate, safeLimit);
    return { status: 'success', data };
  }

  // ─── ADMIN: Milat / Reset — tum analytics_events'i sil ───
  // Hata log'larini temizleyip "milat atmak" icin. Opsiyonel `type`
  // parametresi (api_error | api_request | page_view | ...) verilirse sadece
  // o type silinir; aksi halde tablo tamamen truncate edilir. Geri alinmaz.

  @Delete('events')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  async resetEvents(
    @Query('type') type?: string,
  ): Promise<JSendSuccess<{ deleted: number; type: string }>> {
    const deleted = await this.analyticsService.resetEvents(type);
    return { status: 'success', data: { deleted, type: type ?? 'ALL' } };
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
