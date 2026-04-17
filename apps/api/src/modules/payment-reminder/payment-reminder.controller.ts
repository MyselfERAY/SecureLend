import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { JSendSuccess } from '@securelend/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentReminderService } from './payment-reminder.service';
import { UpdateReminderPreferenceDto } from './dto/reminder-preference.dto';

@ApiTags('Payment Reminder')
@ApiBearerAuth('access-token')
@Controller('api/v1/users/reminder-preferences')
export class PaymentReminderController {
  constructor(private readonly service: PaymentReminderService) {}

  @Get()
  async getPreferences(
    @CurrentUser() user: { id: string },
  ): Promise<JSendSuccess<unknown>> {
    const data = await this.service.getPreferences(user.id);
    return { status: 'success', data };
  }

  @Put()
  async updatePreferences(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateReminderPreferenceDto,
  ): Promise<JSendSuccess<unknown>> {
    const data = await this.service.updatePreferences(user.id, dto);
    return { status: 'success', data };
  }
}
