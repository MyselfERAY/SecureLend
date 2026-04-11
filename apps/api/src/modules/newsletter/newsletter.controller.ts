import {
  Controller, Get, Post, Body,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import type { JSendSuccess } from '@securelend/shared';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { NewsletterService } from './newsletter.service';

class SubscribeDto {
  @IsEmail({}, { message: 'Gecerli bir e-posta adresi girin' })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;
}

class UnsubscribeDto {
  @IsEmail({}, { message: 'Gecerli bir e-posta adresi girin' })
  email!: string;
}

@ApiTags('Newsletter')
@Controller('api/v1/newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { limit: 3, ttl: seconds(60) } })
  async subscribe(@Body() dto: SubscribeDto): Promise<JSendSuccess<unknown>> {
    const subscriber = await this.newsletterService.subscribe(dto.email, dto.name, dto.source);
    return { status: 'success', data: { id: subscriber.id, email: subscriber.email } };
  }

  @Post('unsubscribe')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: seconds(60) } })
  async unsubscribe(@Body() dto: UnsubscribeDto): Promise<JSendSuccess<unknown>> {
    await this.newsletterService.unsubscribe(dto.email);
    return { status: 'success', data: { message: 'Abonelik iptal edildi' } };
  }

  // Admin
  @Get('subscribers')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  async getSubscribers(): Promise<JSendSuccess<unknown>> {
    const subscribers = await this.newsletterService.getSubscribers();
    return { status: 'success', data: subscribers };
  }

  @Get('stats')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  async getStats(): Promise<JSendSuccess<unknown>> {
    const stats = await this.newsletterService.getStats();
    return { status: 'success', data: stats };
  }
}
