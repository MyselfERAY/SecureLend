import { Global, Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { MockSmsService } from './mock-sms.service';
import { EmailService } from './email.service';
import { MockEmailService } from './mock-email.service';

@Global()
@Module({
  providers: [
    {
      provide: SmsService,
      useClass: MockSmsService,
    },
    {
      provide: EmailService,
      useClass: MockEmailService,
    },
  ],
  exports: [SmsService, EmailService],
})
export class NotificationModule {}
