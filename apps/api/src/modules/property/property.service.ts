import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: Record<string, unknown>) {
    // Auto-add LANDLORD role if not present
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.roles.includes(UserRole.LANDLORD)) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { roles: { push: UserRole.LANDLORD } },
      });
    }

    const property = await this.prisma.property.create({
      data: { ownerId: userId, ...data } as any,
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
