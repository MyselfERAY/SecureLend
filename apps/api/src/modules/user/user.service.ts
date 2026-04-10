import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole, KycStatus, ContractStatus, PaymentStatus } from '@prisma/client';
import { UserRepository } from './user.repository';
import { PrismaService } from '../prisma/prisma.service';
import type { DashboardData } from './dto/dashboard.dto';

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
      onboardingCompleted: user.onboardingCompleted,
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
      phone: '****' + user.phone.slice(-2),
      roles: user.roles,
    };
  }

  async getDashboard(userId: string): Promise<DashboardData> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        roles: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('Kullanici bulunamadi');

    const hasTenantRole = user.roles.includes(UserRole.TENANT);
    const hasLandlordRole = user.roles.includes(UserRole.LANDLORD);

    // Check if user has contracts even without the role explicitly set
    const [tenantContractCount, landlordContractCount] = await Promise.all([
      !hasTenantRole
        ? this.prisma.contract.count({ where: { tenantId: userId } })
        : Promise.resolve(1), // skip count if role already present
      !hasLandlordRole
        ? this.prisma.contract.count({ where: { landlordId: userId } })
        : Promise.resolve(1),
    ]);

    const isTenant = hasTenantRole || tenantContractCount > 0;
    const isLandlord = hasLandlordRole || landlordContractCount > 0;

    const [tenantData, landlordData, notifications] = await Promise.all([
      isTenant ? this.buildTenantMetrics(userId) : Promise.resolve(undefined),
      isLandlord ? this.buildLandlordMetrics(userId) : Promise.resolve(undefined),
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          isRead: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      roles: user.roles,
      fullName: user.fullName,
      memberSince: user.createdAt.toISOString(),
      tenant: tenantData,
      landlord: landlordData,
      recentNotifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }

  private async buildTenantMetrics(userId: string): Promise<NonNullable<DashboardData['tenant']>> {
    const [
      activeContracts,
      paymentAggregates,
      latestKmhApp,
      nextPayment,
    ] = await Promise.all([
      this.prisma.contract.findMany({
        where: { tenantId: userId, status: ContractStatus.ACTIVE },
        select: { id: true, monthlyRent: true },
      }),
      this.prisma.paymentSchedule.groupBy({
        by: ['status'],
        where: {
          contract: { tenantId: userId, status: ContractStatus.ACTIVE },
        },
        _sum: { paidAmount: true },
        _count: { id: true },
      }),
      this.prisma.kmhApplication.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { status: true, approvedLimit: true },
      }),
      this.prisma.paymentSchedule.findFirst({
        where: {
          contract: { tenantId: userId, status: ContractStatus.ACTIVE },
          status: PaymentStatus.PENDING,
        },
        orderBy: { dueDate: 'asc' },
        select: { dueDate: true, amount: true },
      }),
    ]);

    const totalMonthlyRent = activeContracts.reduce(
      (sum, c) => sum + Number(c.monthlyRent),
      0,
    );

    let pendingPayments = 0;
    let overduePayments = 0;
    let totalPaid = 0;

    for (const agg of paymentAggregates) {
      if (agg.status === PaymentStatus.PENDING) {
        pendingPayments = agg._count.id;
      } else if (agg.status === PaymentStatus.OVERDUE) {
        overduePayments = agg._count.id;
      } else if (agg.status === PaymentStatus.COMPLETED) {
        totalPaid = Number(agg._sum.paidAmount ?? 0);
      }
    }

    return {
      activeContracts: activeContracts.length,
      totalMonthlyRent,
      pendingPayments,
      overduePayments,
      totalPaid,
      kmhStatus: latestKmhApp?.status ?? null,
      kmhLimit: latestKmhApp?.approvedLimit ? Number(latestKmhApp.approvedLimit) : null,
      nextPaymentDate: nextPayment?.dueDate?.toISOString().split('T')[0] ?? null,
      nextPaymentAmount: nextPayment ? Number(nextPayment.amount) : null,
    };
  }

  private async buildLandlordMetrics(userId: string): Promise<NonNullable<DashboardData['landlord']>> {
    const [
      activeContracts,
      totalProperties,
      rentedProperties,
      paymentAggregates,
    ] = await Promise.all([
      this.prisma.contract.findMany({
        where: { landlordId: userId, status: ContractStatus.ACTIVE },
        select: { id: true, monthlyRent: true },
      }),
      this.prisma.property.count({
        where: { ownerId: userId },
      }),
      this.prisma.property.count({
        where: { ownerId: userId, status: 'RENTED' },
      }),
      this.prisma.paymentSchedule.groupBy({
        by: ['status'],
        where: {
          contract: { landlordId: userId, status: ContractStatus.ACTIVE },
        },
        _sum: { paidAmount: true },
        _count: { id: true },
      }),
    ]);

    const totalMonthlyIncome = activeContracts.reduce(
      (sum, c) => sum + Number(c.monthlyRent),
      0,
    );

    let pendingPayments = 0;
    let overduePayments = 0;
    let totalReceived = 0;

    for (const agg of paymentAggregates) {
      if (agg.status === PaymentStatus.PENDING) {
        pendingPayments = agg._count.id;
      } else if (agg.status === PaymentStatus.OVERDUE) {
        overduePayments = agg._count.id;
      } else if (agg.status === PaymentStatus.COMPLETED) {
        totalReceived = Number(agg._sum.paidAmount ?? 0);
      }
    }

    const occupancyRate = totalProperties > 0
      ? Math.round((rentedProperties / totalProperties) * 10000) / 100
      : 0;

    return {
      activeContracts: activeContracts.length,
      totalProperties,
      rentedProperties,
      totalMonthlyIncome,
      totalReceived,
      pendingPayments,
      overduePayments,
      occupancyRate,
    };
  }

  async completeOnboarding(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });
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
