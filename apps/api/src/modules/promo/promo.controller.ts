import {
  Controller, Get, Post, Patch, Body, Param,
  ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import type { JSendSuccess } from '@securelend/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { PromoService } from './promo.service';

@ApiTags('Promo')
@ApiBearerAuth('access-token')
@Controller('api/v1/promos')
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  // ─── PUBLIC: Active promos for pricing page ───

  @Get('active')
  @Public()
  async getActivePromos(): Promise<JSendSuccess<unknown>> {
    const promos = await this.promoService.getActivePromos();
    return { status: 'success', data: promos };
  }

  // ─── USER: My promos ───

  @Get('my')
  async getMyPromos(
    @CurrentUser('id') userId: string,
  ): Promise<JSendSuccess<unknown>> {
    const promos = await this.promoService.getUserPromos(userId);
    return { status: 'success', data: promos };
  }

  // ─── ADMIN: Template CRUD ───

  @Get('templates')
  @Roles(UserRole.ADMIN)
  async getTemplates(): Promise<JSendSuccess<unknown>> {
    const templates = await this.promoService.getTemplates();
    return { status: 'success', data: templates };
  }

  @Post('templates')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { limit: 2, ttl: seconds(10) } })
  async createTemplate(
    @Body() body: {
      name: string;
      type: string;
      description?: string;
      discountPercent: number;
      durationMonths: number;
      isAutoApply?: boolean;
      maxUsageCount?: number;
      validFrom?: string;
      validUntil?: string;
    },
  ): Promise<JSendSuccess<unknown>> {
    const template = await this.promoService.createTemplate(body);
    return { status: 'success', data: template };
  }

  @Patch('templates/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: seconds(10) } })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Record<string, unknown>,
  ): Promise<JSendSuccess<unknown>> {
    const template = await this.promoService.updateTemplate(id, body);
    return { status: 'success', data: template };
  }

  @Post('templates/:id/toggle')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: seconds(10) } })
  async toggleTemplate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<JSendSuccess<unknown>> {
    const template = await this.promoService.toggleTemplate(id);
    return { status: 'success', data: template };
  }

  // ─── ADMIN: Assign promo to user ───

  @Post('assign')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 2, ttl: seconds(10) } })
  async assignPromoToUser(
    @Body() body: { templateId: string; userId: string; contractId?: string },
  ): Promise<JSendSuccess<unknown>> {
    const promo = await this.promoService.assignPromoToUser(
      body.templateId, body.userId, body.contractId,
    );
    return { status: 'success', data: promo };
  }

  // ─── USER: Referral info ───

  @Get('referral')
  async getReferralInfo(
    @CurrentUser('id') userId: string,
  ): Promise<JSendSuccess<unknown>> {
    const info = await this.promoService.getReferralInfo(userId);
    return { status: 'success', data: info };
  }

  // ─── ADMIN: Stats ───

  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getStats(): Promise<JSendSuccess<unknown>> {
    const stats = await this.promoService.getStats();
    return { status: 'success', data: stats };
  }
}
