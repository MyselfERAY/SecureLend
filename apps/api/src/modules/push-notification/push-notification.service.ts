import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send a push notification to a specific user.
   * Fails silently - push errors should never block business logic.
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { pushToken: true },
      });

      if (!user?.pushToken) {
        this.logger.debug(`No push token for user ${userId}, skipping push`);
        return;
      }

      await this.sendToExpo({
        to: user.pushToken,
        title,
        body,
        data,
        sound: 'default',
        channelId: 'default',
      });

      this.logger.log(`Push notification sent to user ${userId}: ${title}`);
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to user ${userId}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Send push notifications to multiple users.
   */
  async sendPushNotificationToMany(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds }, pushToken: { not: null } },
        select: { id: true, pushToken: true },
      });

      if (users.length === 0) {
        this.logger.debug('No users with push tokens found, skipping batch push');
        return;
      }

      const messages: ExpoPushMessage[] = users
        .filter((u): u is typeof u & { pushToken: string } => u.pushToken !== null)
        .map((u) => ({
          to: u.pushToken,
          title,
          body,
          data,
          sound: 'default' as const,
          channelId: 'default',
        }));

      await this.sendToExpo(messages);

      this.logger.log(`Push notifications sent to ${messages.length} users: ${title}`);
    } catch (error) {
      this.logger.error(
        `Failed to send batch push notifications: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Save or update the push token for a user.
   */
  async savePushToken(userId: string, token: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pushToken: token },
    });
    this.logger.log(`Push token saved for user ${userId}`);
  }

  /**
   * Remove the push token for a user (e.g., on logout).
   */
  async removePushToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pushToken: null },
    });
    this.logger.log(`Push token removed for user ${userId}`);
  }

  private async sendToExpo(
    messages: ExpoPushMessage | ExpoPushMessage[],
  ): Promise<ExpoPushTicket[]> {
    const payload = Array.isArray(messages) ? messages : [messages];

    const response = await fetch(this.EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Expo Push API returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json() as { data: ExpoPushTicket[] };
    const tickets = result.data;

    // Log any errors from Expo
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        this.logger.warn(
          `Expo push error: ${ticket.message} (${ticket.details?.error ?? 'unknown'})`,
        );

        // If the token is invalid, remove it from the database
        if (ticket.details?.error === 'DeviceNotRegistered') {
          const failedMessage = payload.find(
            (_, index) => tickets[index] === ticket,
          );
          if (failedMessage) {
            await this.handleInvalidToken(failedMessage.to);
          }
        }
      }
    }

    return tickets;
  }

  private async handleInvalidToken(token: string): Promise<void> {
    try {
      await this.prisma.user.updateMany({
        where: { pushToken: token },
        data: { pushToken: null },
      });
      this.logger.log(`Removed invalid push token: ${token.substring(0, 20)}...`);
    } catch (error) {
      this.logger.error(
        `Failed to remove invalid token: ${(error as Error).message}`,
      );
    }
  }
}
