import { Module } from '@nestjs/common';
import { PaymentReminderController } from './payment-reminder.controller';
import { PaymentReminderService } from './payment-reminder.service';

@Module({
  controllers: [PaymentReminderController],
  providers: [PaymentReminderService],
})
export class PaymentReminderModule {}
