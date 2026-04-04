import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConsentType } from '@prisma/client';
import { Request } from 'express';
import { ConsentService } from './consent.service';
import { RecordConsentDto } from './dto/record-consent.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Consents')
@ApiBearerAuth('access-token')
@Controller('api/v1/consents')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Get('my')
  async getMyConsents(@CurrentUser('id') userId: string) {
    const consents = await this.consentService.getUserConsents(userId);
    return { status: 'success', data: consents };
  }

  @Get('check/:type')
  async checkConsent(
    @CurrentUser('id') userId: string,
    @Param('type') type: ConsentType,
    @Query('version') version: string,
  ) {
    const hasConsent = await this.consentService.hasActiveConsent(
      userId,
      type,
      version,
    );
    return { status: 'success', data: { hasConsent } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async recordConsent(
    @CurrentUser('id') userId: string,
    @Body() dto: RecordConsentDto,
    @Req() req: Request,
  ) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';
    const consent = await this.consentService.recordConsent(
      userId,
      dto.type,
      dto.version,
      ipAddress,
      userAgent,
    );
    return { status: 'success', data: consent };
  }
}
