import { Global, Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { MockSmsService } from './mock-sms.service';

@Global()
@Module({
  providers: [
    {
      provide: SmsService,
      useClass: MockSmsService,
    },
  ],
  exports: [SmsService],
})
export class NotificationModule {}
