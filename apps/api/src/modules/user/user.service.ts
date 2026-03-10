import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole, KycStatus } from '@prisma/client';
import { UserRepository } from './user.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Kullanici bulunamadi');

    return {
      id: user.id,
      maskedTckn: user.tcknMasked,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      dateOfBirth: user.dateOfBirth?.toISOString().split('T')[0],
      address: user.address,
      roles: user.roles,
      kycStatus: user.kycStatus,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateProfile(userId: string, data: {
    fullName?: string;
    email?: string;
    dateOfBirth?: string;
    address?: string;
  }) {
    const updateData: Record<string, unknown> = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.email) updateData.email = data.email;
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.address) updateData.address = data.address;

    const user = await this.userRepository.update(userId, updateData);
    return this.getProfile(user.id);
  }

  async addRole(userId: string, role: UserRole) {
    if (role === UserRole.ADMIN) {
      throw new ForbiddenException('Admin rolu bu yontemle eklenemez');
    }
    await this.userRepository.addRole(userId, role);
    return this.getProfile(userId);
  }

  async searchByPhone(phone: string, requesterId: string) {
    const user = await this.prisma.user.findFirst({
      where: { phone, phoneVerified: true },
      select: {
        id: true,
        fullName: true,
        tcknMasked: true,
        phone: true,
        roles: true,
      },
    });

    if (!user) return null;
    if (user.id === requesterId) return null; // Kendini bulamasın

    return {
      id: user.id,
      fullName: user.fullName,
      maskedTckn: user.tcknMasked,
      phone: user.phone.slice(0, 3) + '****' + user.phone.slice(7),
      roles: user.roles,
    };
  }

  async completeKyc(userId: string, ipAddress: string) {
    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { kycStatus: KycStatus.COMPLETED },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'KYC_COMPLETED',
          entityType: 'User',
          entityId: userId,
          ipAddress,
        },
      });

      return u;
    });

    return this.getProfile(user.id);
  }
}
