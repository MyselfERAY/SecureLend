import { Injectable } from '@nestjs/common';
import { ConsentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  async recordConsent(
    userId: string,
    type: ConsentType,
    version: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.consent.create({
      data: { userId, type, version, accepted: true, ipAddress, userAgent },
    });
  }

  async recordMultipleConsents(
    userId: string,
    consents: { type: ConsentType; version: string }[],
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.$transaction(
      consents.map((c) =>
        this.prisma.consent.create({
          data: {
            userId,
            type: c.type,
            version: c.version,
            accepted: true,
            ipAddress,
            userAgent,
          },
        }),
      ),
    );
  }

  async getUserConsents(userId: string) {
    return this.prisma.consent.findMany({
      where: { userId },
      orderBy: { acceptedAt: 'desc' },
    });
  }

  async hasActiveConsent(
    userId: string,
    type: ConsentType,
    version: string,
  ): Promise<boolean> {
    const consent = await this.prisma.consent.findFirst({
      where: { userId, type, version, accepted: true },
    });
    return !!consent;
  }
}
