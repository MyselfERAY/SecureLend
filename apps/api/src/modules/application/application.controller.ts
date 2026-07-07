import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle, seconds } from '@nestjs/throttler';
import { Request } from 'express';
import type { JSendSuccess, ApplicationResult } from '@securelend/shared';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { StartApplicationDto } from './dto/start-application.dto';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('api/v1/applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  // Adım 1: TCKN + telefon → 30 gün dedup kontrolü + OTP gönder
  @Post('start')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    short: { limit: 1, ttl: seconds(15) },
    long: { limit: 5, ttl: seconds(3600) },
  })
  async start(
    @Body() dto: StartApplicationDto,
    @Req() req: Request,
  ): Promise<JSendSuccess<{ phoneMasked: string; message: string }>> {
    const ipAddress = req.ip || 'unknown';
    const result = await this.applicationService.startApplication(
      dto.tckn,
      dto.phone,
      ipAddress,
    );
    return { status: 'success', data: result };
  }

  // Adım 2: TCKN + telefon + OTP → doğrula, kredi sorgula, kaydet
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { limit: 3, ttl: seconds(60) } })
  async create(
    @Body() dto: CreateApplicationDto,
    @Req() req: Request,
  ): Promise<JSendSuccess<ApplicationResult>> {
    const ipAddress = req.ip || 'unknown';

    const result = await this.applicationService.createApplication(
      dto.tckn,
      dto.phone,
      dto.code,
      ipAddress,
    );

    return {
      status: 'success',
      data: result,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('t') token?: string,
  ): Promise<JSendSuccess<ApplicationResult>> {
    const result = await this.applicationService.findApplication(id, token);
    // resultToken'ı GET yanıtında geri sızdırma
    delete (result as { resultToken?: string }).resultToken;
    return {
      status: 'success',
      data: result,
    };
  }
}
