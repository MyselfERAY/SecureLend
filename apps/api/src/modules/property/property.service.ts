import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { UavtService } from '../bank-partner/uavt.service';

@Injectable()
export class PropertyService {
  private readonly logger = new Logger(PropertyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly uavtService: UavtService,
  ) {}

  async create(userId: string, data: Record<string, unknown>) {
    // Auto-add LANDLORD role if not present
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!user.roles.includes(UserRole.LANDLORD)) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { roles: { push: UserRole.LANDLORD } },
      });
    }

    const uavtCode =
      typeof data.uavtCode === 'string' ? data.uavtCode.trim() : undefined;

    let uavtVerifiedAt: Date | null = null;
    let ownershipVerified = false;

    // UAVT + tapu sahiplik doğrulaması (banka partneri üzerinden, mock)
    // UAVT kodu opsiyonel — yoksa check çalıştırılmaz, eski flow korunur.
    if (uavtCode) {
      const uavtResult = await this.uavtService.verifyUavtCode(uavtCode);
      if (!uavtResult.verified) {
        throw new BadRequestException(
          uavtResult.reason || 'UAVT kodu doğrulanamadı',
        );
      }
      uavtVerifiedAt = uavtResult.checkedAt;

      // Tapu sahiplik — ancak kullanıcının encrypted TCKN'si varsa check edebiliriz.
      if (user.tcknEncrypted) {
        const ownerTckn = this.encryptionService.decrypt(user.tcknEncrypted);
        if (ownerTckn) {
          const ownership = await this.uavtService.verifyOwnership(
            uavtCode,
            ownerTckn,
          );
          if (!ownership.verified) {
            throw new BadRequestException(
              ownership.reason ||
                'Bu gayrimenkul sizin adınıza tapu kayıtlarında bulunamadı',
            );
          }
          ownershipVerified = true;
        } else {
          this.logger.warn(
            `User ${userId} TCKN decrypt failed — ownership check skipped`,
          );
        }
      } else {
        this.logger.warn(
          `User ${userId} has no encrypted TCKN — ownership check skipped (legacy user)`,
        );
      }
    }

    const property = await this.prisma.property.create({
      data: {
        ownerId: userId,
        ...data,
        uavtCode: uavtCode ?? null,
        uavtVerifiedAt,
        ownershipVerified,
      } as any,
    });

    return this.formatProperty(property);
  }

  async getMyProperties(userId: string) {
    const properties = await this.prisma.property.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return properties.map((p) => this.formatProperty(p));
  }

  async getById(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { owner: { select: { fullName: true } } },
    });
    if (!property) throw new NotFoundException('Mulk bulunamadi');
    return this.formatProperty(property);
  }

  async search(filters: {
    city?: string;
    district?: string;
    minRent?: number;
    maxRent?: number;
  }) {
    const where: Record<string, unknown> = { status: 'ACTIVE' };
    if (filters.city) where.city = filters.city;
    if (filters.district) where.district = filters.district;
    if (filters.minRent || filters.maxRent) {
      where.monthlyRent = {
        ...(filters.minRent ? { gte: filters.minRent } : {}),
        ...(filters.maxRent ? { lte: filters.maxRent } : {}),
      };
    }

    const properties = await this.prisma.property.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return properties.map((p) => this.formatProperty(p));
  }

  async update(
    userId: string,
    propertyId: string,
    data: Record<string, unknown>,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) throw new NotFoundException('Mulk bulunamadi');
    if (property.ownerId !== userId)
      throw new ForbiddenException('Bu mulk size ait degil');

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: data as any,
    });
    return this.formatProperty(updated);
  }

  async deactivate(userId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) throw new NotFoundException('Mulk bulunamadi');
    if (property.ownerId !== userId)
      throw new ForbiddenException('Bu mulk size ait degil');

    await this.prisma.property.update({
      where: { id: propertyId },
      data: { status: 'INACTIVE' },
    });
  }

  private formatProperty(p: any) {
    return {
      id: p.id,
      title: p.title,
      addressLine1: p.addressLine1,
      addressLine2: p.addressLine2,
      city: p.city,
      district: p.district,
      neighborhood: p.neighborhood,
      street: p.street,
      propertyType: p.propertyType,
      roomCount: p.roomCount,
      areaM2: p.areaM2 ? Number(p.areaM2) : undefined,
      floor: p.floor,
      totalFloors: p.totalFloors,
      monthlyRent: Number(p.monthlyRent),
      depositAmount: p.depositAmount ? Number(p.depositAmount) : undefined,
      description: p.description,
      status: p.status,
      uavtCode: p.uavtCode,
      uavtVerifiedAt: p.uavtVerifiedAt?.toISOString(),
      ownershipVerified: p.ownershipVerified,
      ownerName: p.owner?.fullName,
      createdAt: p.createdAt?.toISOString(),
    };
  }
}
