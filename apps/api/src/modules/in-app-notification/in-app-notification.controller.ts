import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InAppNotificationService } from './in-app-notification.service';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('api/v1/notifications')
export class InAppNotificationController {
  constructor(private readonly notificationService: InAppNotificationService) {}

  @Get()
  async getNotifications(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.notificationService.getUserNotifications(
      userId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
    return { status: 'success', data: result };
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.notificationService.getUnreadCount(userId);
    return { status: 'success', data: { unreadCount: count } };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.notificationService.markAsRead(userId, id);
    return { status: 'success', data: { message: 'Okundu olarak isaretlendi' } };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser('id') userId: string) {
    const result = await this.notificationService.markAllAsRead(userId);
    return { status: 'success', data: result };
  }
}
