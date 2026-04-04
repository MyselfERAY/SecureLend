import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InAppNotificationService {
  private readonly logger = new Logger(InAppNotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    entityType?: string,
    entityId?: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body, entityType, entityId },
    });
    this.logger.log(`Notification created: ${type} for user ${userId}`);
    return notification;
  }

  async createForMultipleUsers(
    userIds: string[],
    type: NotificationType,
    title: string,
    body: string,
    entityType?: string,
    entityId?: string,
  ) {
    const data = userIds.map((userId) => ({
      userId,
      type,
      title,
      body,
      entityType,
      entityId,
    }));
    await this.prisma.notification.createMany({ data });
    this.logger.log(`Notification created: ${type} for ${userIds.length} users`);
  }

  async getUserNotifications(userId: string, limit = 50, offset = 0) {
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        entityType: n.entityType,
        entityId: n.entityId,
        isRead: n.isRead,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      total,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) return null;

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { markedCount: result.count };
  }
}
