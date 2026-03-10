import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('api/v1/applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { limit: 1, ttl: seconds(2) } })
  async create(
    @Body() dto: CreateApplicationDto,
    @Req() req: Request,
  ): Promise<JSendSuccess<ApplicationResult>> {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';

    const result = await this.applicationService.createApplication(
      dto.tckn,
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
  ): Promise<JSendSuccess<ApplicationResult>> {
    const result = await this.applicationService.findApplication(id);
    return {
      status: 'success',
      data: result,
    };
  }
}
