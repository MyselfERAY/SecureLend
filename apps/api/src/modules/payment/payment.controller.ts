import {
  Controller, Get, Post, Param, Req,
  ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import { Request } from 'express';
import type { JSendSuccess } from '@securelend/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentService } from './payment.service';

@ApiTags('Payment')
@ApiBearerAuth('access-token')
@Controller('api/v1')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('contracts/:contractId/payments')
  async getSchedule(
    @CurrentUser() user: { id: string },
    @Param('contractId', ParseUUIDPipe) contractId: string,
  ): Promise<JSendSuccess<unknown>> {
    const schedule = await this.paymentService.getScheduleByContract(user.id, contractId);
    return { status: 'success', data: schedule };
  }

  @Get('payments/summary/:contractId')
  async getSummary(
    @CurrentUser() user: { id: string },
    @Param('contractId', ParseUUIDPipe) contractId: string,
  ): Promise<JSendSuccess<unknown>> {
    const summary = await this.paymentService.getPaymentSummary(user.id, contractId);
    return { status: 'success', data: summary };
  }

  @Get('payments/my')
  async getMyPayments(
    @CurrentUser() user: { id: string },
  ): Promise<JSendSuccess<unknown>> {
    const payments = await this.paymentService.getMyPayments(user.id);
    return { status: 'success', data: payments };
  }

  @Post('payments/:id/process')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 1, ttl: seconds(30) } })
  async processPayment(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<JSendSuccess<unknown>> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const result = await this.paymentService.processPayment(user.id, id, ipAddress);
    return { status: 'success', data: result };
  }
}
