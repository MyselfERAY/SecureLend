import { Global, Module } from '@nestjs/common';
import { InAppNotificationService } from './in-app-notification.service';
import { InAppNotificationController } from './in-app-notification.controller';

@Global()
@Module({
  controllers: [InAppNotificationController],
  providers: [InAppNotificationService],
  exports: [InAppNotificationService],
})
export class InAppNotificationModule {}
