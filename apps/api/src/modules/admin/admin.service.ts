import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, ContractStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverviewStats() {
    const [
      totalUsers,
      totalContracts,
      activeContracts,
      totalPayments,
      completedPayments,
      commissionAgg,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.contract.count(),
      this.prisma.contract.count({ where: { status: ContractStatus.ACTIVE } }),
      this.prisma.paymentSchedule.count(),
      this.prisma.paymentSchedule.count({ where: { status: PaymentStatus.COMPLETED } }),
      this.prisma.commission.aggregate({
        _sum: { commissionAmount: true, totalAmount: true, landlordAmount: true },
        _count: true,
      }),
    ]);

    return {
      totalUsers,
      totalContracts,
      activeContracts,
      totalPayments,
      completedPayments,
      totalRevenue: Number(commissionAgg._sum.totalAmount || 0),
      totalCommission: Number(commissionAgg._sum.commissionAmount || 0),
      totalLandlordPayouts: Number(commissionAgg._sum.landlordAmount || 0),
      commissionCount: commissionAgg._count,
    };
  }

  async getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true, fullName: true, tcknMasked: true, phone: true,
          email: true, roles: true, kycStatus: true, isActive: true,
          createdAt: true, lastLoginAt: true,
          _count: { select: { tenantContracts: true, landlordContracts: true, bankAccounts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        tcknMasked: u.tcknMasked,
        phone: u.phone,
        email: u.email,
        roles: u.roles,
        kycStatus: u.kycStatus,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt?.toISOString(),
        contractCount: u._count.tenantContracts + u._count.landlordContracts,
        accountCount: u._count.bankAccounts,
      })),
      total,
      page,
      limit,
    };
  }

  async getContracts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        include: {
          property: { select: { title: true, city: true } },
          tenant: { select: { fullName: true } },
          landlord: { select: { fullName: true } },
          _count: { select: { payments: true, commissions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contract.count(),
    ]);

    return {
      contracts: contracts.map((c) => ({
        id: c.id,
        status: c.status,
        monthlyRent: Number(c.monthlyRent),
        startDate: c.startDate.toISOString().split('T')[0],
        endDate: c.endDate.toISOString().split('T')[0],
        propertyTitle: c.property.title,
        city: c.property.city,
        tenantName: c.tenant.fullName,
        landlordName: c.landlord.fullName,
        paymentCount: c._count.payments,
        commissionCount: c._count.commissions,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  async getPayments(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      this.prisma.paymentSchedule.findMany({
        include: {
          contract: {
            select: {
              property: { select: { title: true } },
              tenant: { select: { fullName: true } },
              landlord: { select: { fullName: true } },
            },
          },
          commission: true,
        },
        orderBy: { dueDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.paymentSchedule.count(),
    ]);

    return {
      payments: payments.map((p) => ({
        id: p.id,
        status: p.status,
        dueDate: p.dueDate.toISOString().split('T')[0],
        amount: Number(p.amount),
        paidAt: p.paidAt?.toISOString(),
        paidAmount: p.paidAmount ? Number(p.paidAmount) : null,
        periodLabel: p.periodLabel,
        propertyTitle: p.contract.property.title,
        tenantName: p.contract.tenant.fullName,
        landlordName: p.contract.landlord.fullName,
        commission: p.commission
          ? {
              commissionAmount: Number(p.commission.commissionAmount),
              landlordAmount: Number(p.commission.landlordAmount),
              rate: Number(p.commission.commissionRate),
            }
          : null,
      })),
      total,
      page,
      limit,
    };
  }

  async getCommissionReport() {
    const commissions = await this.prisma.commission.findMany({
      include: {
        paymentSchedule: { select: { periodLabel: true, dueDate: true } },
        contract: {
          select: {
            property: { select: { title: true } },
            tenant: { select: { fullName: true } },
            landlord: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Aylık bazda gruplama
    const monthlyMap = new Map<string, { total: number; commission: number; count: number }>();
    for (const c of commissions) {
      const month = c.createdAt.toISOString().slice(0, 7);
      const entry = monthlyMap.get(month) || { total: 0, commission: 0, count: 0 };
      entry.total += Number(c.totalAmount);
      entry.commission += Number(c.commissionAmount);
      entry.count += 1;
      monthlyMap.set(month, entry);
    }

    return {
      records: commissions.map((c) => ({
        id: c.id,
        totalAmount: Number(c.totalAmount),
        commissionAmount: Number(c.commissionAmount),
        landlordAmount: Number(c.landlordAmount),
        rate: Number(c.commissionRate),
        propertyTitle: c.contract.property.title,
        tenantName: c.contract.tenant.fullName,
        landlordName: c.contract.landlord.fullName,
        periodLabel: c.paymentSchedule.periodLabel,
        createdAt: c.createdAt.toISOString(),
      })),
      monthly: Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        ...data,
      })),
      totals: {
        totalRevenue: commissions.reduce((s, c) => s + Number(c.totalAmount), 0),
        totalCommission: commissions.reduce((s, c) => s + Number(c.commissionAmount), 0),
        totalLandlordPayouts: commissions.reduce((s, c) => s + Number(c.landlordAmount), 0),
        count: commissions.length,
      },
    };
  }
}
