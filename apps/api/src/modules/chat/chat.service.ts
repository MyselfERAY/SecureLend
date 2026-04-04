import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create a CONTRACT chat room for a given contract.
   * Both tenant and landlord are added as participants.
   */
  async getOrCreateContractRoom(contractId: string, userId: string) {
    // Verify user is part of the contract
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, tenantId: true, landlordId: true },
    });
    if (!contract) throw new NotFoundException('Sozlesme bulunamadi');
    if (contract.tenantId !== userId && contract.landlordId !== userId) {
      throw new ForbiddenException('Bu sozlesmeye erisim yetkiniz yok');
    }

    // Check if room already exists
    let room = await this.prisma.chatRoom.findFirst({
      where: { type: 'CONTRACT', contractId },
      include: {
        participants: { include: { user: { select: { id: true, fullName: true } } } },
      },
    });

    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: {
          type: 'CONTRACT',
          contractId,
          participants: {
            createMany: {
              data: [
                { userId: contract.tenantId },
                { userId: contract.landlordId },
              ],
            },
          },
        },
        include: {
          participants: { include: { user: { select: { id: true, fullName: true } } } },
        },
      });
    }

    return this.formatRoom(room);
  }

  /**
   * Get or create a SUPPORT chat room for a user.
   * User + all ADMIN users are added as participants.
   */
  async getOrCreateSupportRoom(userId: string) {
    // Check if user already has a support room
    let room = await this.prisma.chatRoom.findFirst({
      where: {
        type: 'SUPPORT',
        participants: { some: { userId } },
      },
      include: {
        participants: { include: { user: { select: { id: true, fullName: true, roles: true } } } },
      },
    });

    if (!room) {
      // Find all admin users
      const admins = await this.prisma.user.findMany({
        where: { roles: { has: 'ADMIN' } },
        select: { id: true },
      });

      const participantIds = [userId, ...admins.map((a) => a.id)];
      // Deduplicate (in case user is admin)
      const uniqueIds = [...new Set(participantIds)];

      room = await this.prisma.chatRoom.create({
        data: {
          type: 'SUPPORT',
          title: 'Teknik Destek',
          participants: {
            createMany: {
              data: uniqueIds.map((id) => ({ userId: id })),
            },
          },
        },
        include: {
          participants: { include: { user: { select: { id: true, fullName: true, roles: true } } } },
        },
      });
    }

    return this.formatRoom(room);
  }

  /**
   * List all chat rooms for a user
   */
  async getMyRooms(userId: string) {
    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        isActive: true,
        participants: { some: { userId } },
      },
      include: {
        participants: { include: { user: { select: { id: true, fullName: true } } } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, senderId: true },
        },
        contract: {
          select: { id: true, property: { select: { title: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return rooms.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title || r.contract?.property?.title || 'Sohbet',
      contractId: r.contractId,
      participants: r.participants.map((p) => ({
        id: p.user.id,
        fullName: p.user.fullName,
      })),
      lastMessage: r.messages[0]
        ? {
            content: r.messages[0].content.length > 60
              ? r.messages[0].content.slice(0, 60) + '...'
              : r.messages[0].content,
            createdAt: r.messages[0].createdAt,
            senderId: r.messages[0].senderId,
          }
        : null,
      updatedAt: r.updatedAt,
    }));
  }

  /**
   * Get all SUPPORT rooms (for admin)
   */
  async getAllSupportRooms() {
    const rooms = await this.prisma.chatRoom.findMany({
      where: { type: 'SUPPORT', isActive: true },
      include: {
        participants: { include: { user: { select: { id: true, fullName: true, roles: true } } } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, senderId: true, isRead: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return rooms.map((r) => {
      // Find the non-admin participant as the "customer"
      const customer = r.participants.find(
        (p) => !(p.user as any).roles?.includes('ADMIN'),
      );
      return {
        id: r.id,
        type: r.type,
        title: r.title || 'Teknik Destek',
        customerName: customer?.user?.fullName || 'Kullanici',
        participants: r.participants.map((p) => ({
          id: p.user.id,
          fullName: p.user.fullName,
        })),
        lastMessage: r.messages[0]
          ? {
              content: r.messages[0].content.length > 60
                ? r.messages[0].content.slice(0, 60) + '...'
                : r.messages[0].content,
              createdAt: r.messages[0].createdAt,
              senderId: r.messages[0].senderId,
              isRead: r.messages[0].isRead,
            }
          : null,
        updatedAt: r.updatedAt,
      };
    });
  }

  /**
   * Get messages for a room (with pagination)
   */
  async getMessages(roomId: string, userId: string, cursor?: string, limit = 50) {
    // Verify participant
    await this.verifyParticipant(roomId, userId);

    const messages = await this.prisma.chatMessage.findMany({
      where: { chatRoomId: roomId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        sender: { select: { id: true, fullName: true } },
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;

    return {
      messages: items.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.senderId,
        senderName: m.sender.fullName,
        isRead: m.isRead,
        createdAt: m.createdAt,
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  /**
   * Send a message
   */
  async sendMessage(roomId: string, userId: string, content: string) {
    await this.verifyParticipant(roomId, userId);

    const message = await this.prisma.chatMessage.create({
      data: {
        chatRoomId: roomId,
        senderId: userId,
        content,
      },
      include: {
        sender: { select: { id: true, fullName: true } },
      },
    });

    // Update room's updatedAt
    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender.fullName,
      isRead: false,
      createdAt: message.createdAt,
    };
  }

  /**
   * Mark all messages in a room as read (for the current user, from other senders)
   */
  async markAsRead(roomId: string, userId: string) {
    await this.verifyParticipant(roomId, userId);

    const result = await this.prisma.chatMessage.updateMany({
      where: {
        chatRoomId: roomId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { markedCount: result.count };
  }

  /**
   * Get unread message count for a user across all rooms
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.chatMessage.count({
      where: {
        senderId: { not: userId },
        isRead: false,
        chatRoom: {
          participants: { some: { userId } },
        },
      },
    });
    return { count };
  }

  // ─── Helpers ───────────────────────────────────

  private async verifyParticipant(roomId: string, userId: string) {
    const participant = await this.prisma.chatRoomParticipant.findUnique({
      where: { uq_chat_participant: { chatRoomId: roomId, userId } },
    });
    if (!participant) {
      throw new ForbiddenException('Bu sohbet odasina erisim yetkiniz yok');
    }
  }

  private formatRoom(room: any) {
    return {
      id: room.id,
      type: room.type,
      title: room.title,
      contractId: room.contractId,
      isActive: room.isActive,
      participants: room.participants.map((p: any) => ({
        id: p.user.id,
        fullName: p.user.fullName,
      })),
      createdAt: room.createdAt,
    };
  }
}
