import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { JSendSuccess } from '@securelend/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TenantScoreService, TenantScoreResult } from './tenant-score.service';

@ApiTags('Tenant Score')
@ApiBearerAuth('access-token')
@Controller('api/v1/tenant-score')
export class TenantScoreController {
  constructor(private readonly tenantScoreService: TenantScoreService) {}

  /**
   * GET /api/v1/tenant-score/me
   * Kiracı kendi ödeme güvenilirlik skorunu görüntüler.
   */
  @Get('me')
  @ApiOperation({ summary: 'Kendi ödeme güvenilirlik skorunu görüntüle' })
  async getMyScore(
    @CurrentUser() user: { id: string },
  ): Promise<JSendSuccess<TenantScoreResult>> {
    const score = await this.tenantScoreService.getMyScore(user.id);
    return { status: 'success', data: score };
  }

  /**
   * GET /api/v1/tenant-score/:tenantId
   * Ev sahibi, sözleşme ilişkisi olan kiracının skorunu görüntüler.
   */
  @Get(':tenantId')
  @ApiOperation({ summary: 'Kiracı skorunu görüntüle (ev sahipleri için)' })
  async getTenantScore(
    @CurrentUser() user: { id: string },
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ): Promise<JSendSuccess<TenantScoreResult>> {
    const score = await this.tenantScoreService.getTenantScore(user.id, tenantId);
    return { status: 'success', data: score };
  }
}
