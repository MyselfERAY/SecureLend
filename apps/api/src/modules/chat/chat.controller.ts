import {
  Controller, Get, Post, Body, Param, Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import type { JSendSuccess } from '@securelend/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /** Get all my chat rooms */
  @Get('rooms')
  async getMyRooms(
    @CurrentUser() user: { id: string },
  ): Promise<JSendSuccess<unknown>> {
    const rooms = await this.chatService.getMyRooms(user.id);
    return { status: 'success', data: rooms };
  }

  /** Get or create contract chat room */
  @Post('rooms/contract/:contractId')
  @Throttle({ short: { limit: 5, ttl: seconds(10) } })
  async getOrCreateContractRoom(
    @CurrentUser() user: { id: string },
    @Param('contractId', ParseUUIDPipe) contractId: string,
  ): Promise<JSendSuccess<unknown>> {
    const room = await this.chatService.getOrCreateContractRoom(contractId, user.id);
    return { status: 'success', data: room };
  }

  /** Get or create support chat room */
  @Post('rooms/support')
  @Throttle({ short: { limit: 3, ttl: seconds(10) } })
  async getOrCreateSupportRoom(
    @CurrentUser() user: { id: string },
  ): Promise<JSendSuccess<unknown>> {
    const room = await this.chatService.getOrCreateSupportRoom(user.id);
    return { status: 'success', data: room };
  }

  /** Get all support rooms (admin only) */
  @Get('admin/support-rooms')
  @Roles(UserRole.ADMIN)
  async getAllSupportRooms(): Promise<JSendSuccess<unknown>> {
    const rooms = await this.chatService.getAllSupportRooms();
    return { status: 'success', data: rooms };
  }

  /** Get messages in a room */
  @Get('rooms/:roomId/messages')
  async getMessages(
    @CurrentUser() user: { id: string },
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<JSendSuccess<unknown>> {
    const data = await this.chatService.getMessages(
      roomId,
      user.id,
      cursor,
      limit ? Math.min(Number(limit), 100) : 50,
    );
    return { status: 'success', data };
  }

  /** Send a message */
  @Post('rooms/:roomId/messages')
  @Throttle({ short: { limit: 10, ttl: seconds(10) } })
  async sendMessage(
    @CurrentUser() user: { id: string },
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: SendMessageDto,
  ): Promise<JSendSuccess<unknown>> {
    const message = await this.chatService.sendMessage(roomId, user.id, dto.content);
    return { status: 'success', data: message };
  }

  /** Mark messages as read */
  @Post('rooms/:roomId/read')
  async markAsRead(
    @CurrentUser() user: { id: string },
    @Param('roomId', ParseUUIDPipe) roomId: string,
  ): Promise<JSendSuccess<unknown>> {
    const result = await this.chatService.markAsRead(roomId, user.id);
    return { status: 'success', data: result };
  }

  /** Get unread message count */
  @Get('unread-count')
  async getUnreadCount(
    @CurrentUser() user: { id: string },
  ): Promise<JSendSuccess<unknown>> {
    const data = await this.chatService.getUnreadCount(user.id);
    return { status: 'success', data };
  }
}
