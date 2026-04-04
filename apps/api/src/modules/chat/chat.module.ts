import { Module } from '@nestjs/common';
import { InAppNotificationModule } from '../in-app-notification/in-app-notification.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [InAppNotificationModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
