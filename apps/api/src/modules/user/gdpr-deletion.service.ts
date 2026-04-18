import { Injectable, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { ContractStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GdprDeletionService {
  constructor(private readonly prisma: PrismaService) {}

  async requestDeletion(userId: string, ipAddress: string): Promise<void> {
    const blockingCount = await this.prisma.contract.count({
      where: {
        OR: [{ tenantId: userId }, { landlordId: userId }],
        status: {
          in: [
            ContractStatus.ACTIVE,
            ContractStatus.PENDING_SIGNATURES,
            ContractStatus.PENDING_ACTIVATION,
          ],
        },
      },
    });

    if (blockingCount > 0) {
      throw new BadRequestException(
        'Aktif veya bekleyen sözleşmeleriniz bulunduğu için hesabınız silinemez.',
      );
    }

    const anonymizedName = this.irreversibleAnon('name', userId);
    const anonymizedPhone = this.irreversibleAnon('phone', userId);
    const anonymizedTckn = this.irreversibleAnon('tckn', userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          fullName: anonymizedName,
          phone: anonymizedPhone,
          tcknHash: anonymizedTckn,
          tcknMasked: 'ANONYMIZED',
          tcknEncrypted: null,
          email: null,
          dateOfBirth: null,
          address: null,
          isActive: false,
        },
      });

      // deleted_at is not in Prisma schema — use raw SQL
      await tx.$executeRaw`UPDATE users SET deleted_at = NOW() WHERE id = ${userId}::uuid`;

      await tx.auditLog.create({
        data: {
          userId,
          action: 'GDPR_DELETION',
          entityType: 'User',
          entityId: userId,
          ipAddress,
          metadata: { anonymized: true, timestamp: new Date().toISOString() },
        },
      });
    });
  }

  private irreversibleAnon(field: string, userId: string): string {
    const hash = createHash('sha256')
      .update(`kvkk:${field}:${userId}:irreversible`)
      .digest('hex')
      .substring(0, 32);
    return `ANON_${hash}`;
  }
}
