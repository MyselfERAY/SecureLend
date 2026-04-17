import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UavtService } from '../uavt/uavt.service';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class PropertyService {
  private readonly logger = new Logger(PropertyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uavtService: UavtService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(userId: string, data: Record<string, unknown>) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    // Ev sahibinin kimlik doğrulamasından geçmiş olması gerek
    if (!user.nviVerified || !user.phoneTcknVerified) {
      throw new BadRequestException(
        'Mulk ekleyebilmek icin hesabinizin kimlik dogrulamasi tamamlanmali.',
      );
    }

    // UAVT kodu verildiyse doğrula + sahiplik kontrolü yap
    const uavtCode = (data.uavtCode as string | undefined)?.replace(/\D/g, '');
    let uavtVerifiedAt: Date | null = null;
    if (uavtCode) {
      // Adres lookup
      const addrResult = await this.uavtService.lookupAddress(uavtCode);
      if (!addrResult.valid) {
        throw new BadRequestException(
          addrResult.reason || 'UAVT kodu gecersiz veya bulunamadi',
        );
      }

      // Sahiplik kontrolü (Tapu)
      if (user.tcknEncrypted) {
        try {
          const userTckn = this.encryptionService.decrypt(user.tcknEncrypted);
          const ownership = await this.uavtService.verifyOwnership(userTckn, uavtCode);
          if (!ownership.ownershipMatched) {
            throw new BadRequestException(
              ownership.reason ||
                'Tapu kaydinda bu mulk size ait olarak gorulmuyor. Farkli bir UAVT kodu deneyin veya destek ile iletisime gecin.',
            );
          }
          uavtVerifiedAt = new Date();
        } catch (err) {
          if (err instanceof BadRequestException) throw err;
          this.logger.error(`UAVT ownership verification error: ${err instanceof Error ? err.message : err}`);
          throw new BadRequestException('UAVT dogrulamasi sirasinda hata olustu.');
        }
      } else {
        // Legacy user — skip ownership check but keep UAVT code
        this.logger.warn(
          `User ${userId} has no encrypted TCKN — UAVT ownership check skipped (legacy account)`,
        );
      }
    }

    // Auto-add LANDLORD role
    if (!user.roles.includes(UserRole.LANDLORD)) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { roles: { push: UserRole.LANDLORD } },
      });
    }

    // Clean data payload — remove uavtCode from spread, pass it explicitly
    const { uavtCode: _omit, ...cleanData } = data;
    void _omit;

    const property = await this.prisma.property.create({
      data: {
        ownerId: userId,
        uavtCode: uavtCode || null,
        uavtVerifiedAt,
        ...cleanData,
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

  async search(filters: { city?: string; district?: string; minRent?: number; maxRent?: number }) {
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

  async update(userId: string, propertyId: string, data: Record<string, unknown>) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Mulk bulunamadi');
    if (property.ownerId !== userId) throw new ForbiddenException('Bu mulk size ait degil');

    // UAVT kodu güncelleniyorsa yeniden doğrula
    const newUavt = (data.uavtCode as string | undefined)?.replace(/\D/g, '');
    if (newUavt && newUavt !== property.uavtCode) {
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
      const addrResult = await this.uavtService.lookupAddress(newUavt);
      if (!addrResult.valid) {
        throw new BadRequestException(addrResult.reason || 'UAVT kodu gecersiz');
      }
      if (user.tcknEncrypted) {
        const userTckn = this.encryptionService.decrypt(user.tcknEncrypted);
        const ownership = await this.uavtService.verifyOwnership(userTckn, newUavt);
        if (!ownership.ownershipMatched) {
          throw new BadRequestException(
            ownership.reason || 'Tapu kaydi eslesmiyor',
          );
        }
        (data as any).uavtCode = newUavt;
        (data as any).uavtVerifiedAt = new Date();
      }
    }

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: data as any,
    });
    return this.formatProperty(updated);
  }

  async deactivate(userId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Mulk bulunamadi');
    if (property.ownerId !== userId) throw new ForbiddenException('Bu mulk size ait degil');

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
      uavtCode: p.uavtCode,
      uavtVerifiedAt: p.uavtVerifiedAt?.toISOString(),
      propertyType: p.propertyType,
      roomCount: p.roomCount,
      areaM2: p.areaM2 ? Number(p.areaM2) : undefined,
      floor: p.floor,
      totalFloors: p.totalFloors,
      monthlyRent: Number(p.monthlyRent),
      depositAmount: p.depositAmount ? Number(p.depositAmount) : undefined,
      description: p.description,
      status: p.status,
      ownerName: p.owner?.fullName,
      createdAt: p.createdAt?.toISOString(),
    };
  }
}
