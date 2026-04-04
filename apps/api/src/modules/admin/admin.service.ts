import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, ContractStatus, KmhApplicationStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverviewStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      newUsersThisMonth,
      totalContracts,
      activeContracts,
      totalPayments,
      completedPayments,
      commissionAgg,
      monthlyRentAgg,
      kmhPending,
      kmhApproved,
      kmhRejected,
      kmhAvgCreditScore,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      this.prisma.contract.count(),
      this.prisma.contract.count({ where: { status: ContractStatus.ACTIVE } }),
      this.prisma.paymentSchedule.count(),
      this.prisma.paymentSchedule.count({ where: { status: PaymentStatus.COMPLETED } }),
      this.prisma.commission.aggregate({
        _sum: { commissionAmount: true, totalAmount: true, landlordAmount: true },
        _count: true,
      }),
      this.prisma.contract.aggregate({
        _sum: { monthlyRent: true },
        where: { status: ContractStatus.ACTIVE },
      }),
      this.prisma.kmhApplication.count({
        where: { status: KmhApplicationStatus.PENDING },
      }),
      this.prisma.kmhApplication.count({
        where: { status: KmhApplicationStatus.APPROVED },
      }),
      this.prisma.kmhApplication.count({
        where: { status: KmhApplicationStatus.REJECTED },
      }),
      this.prisma.kmhApplication.aggregate({
        _avg: { creditScore: true },
        where: {
          status: KmhApplicationStatus.APPROVED,
          creditScore: { not: null },
        },
      }),
    ]);

    return {
      totalUsers,
      newUsersThisMonth,
      totalContracts,
      activeContracts,
      totalPayments,
      completedPayments,
      totalRevenue: Number(commissionAgg._sum.totalAmount || 0),
      totalCommission: Number(commissionAgg._sum.commissionAmount || 0),
      totalLandlordPayouts: Number(commissionAgg._sum.landlordAmount || 0),
      commissionCount: commissionAgg._count,
      totalMonthlyRentVolume: Number(monthlyRentAgg._sum.monthlyRent || 0),
      kmhApplications: {
        pending: kmhPending,
        approved: kmhApproved,
        rejected: kmhRejected,
        total: kmhPending + kmhApproved + kmhRejected,
      },
      averageCreditScoreApprovedKmh: kmhAvgCreditScore._avg.creditScore
        ? Math.round(kmhAvgCreditScore._avg.creditScore)
        : null,
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
            property: { select: { id: true, title: true } },
            tenant: { select: { fullName: true } },
            landlord: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Monthly breakdown (last 12 months)
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthlyMap = new Map<string, {
      totalPayments: number; totalAmount: number;
      totalCommission: number; landlordAmount: number;
    }>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      monthlyMap.set(key, { totalPayments: 0, totalAmount: 0, totalCommission: 0, landlordAmount: 0 });
    }

    // Weekly breakdown (last 4 weeks)
    const weeklyMap = new Map<string, {
      totalPayments: number; totalAmount: number;
      totalCommission: number; landlordAmount: number;
    }>();
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const key = weekStart.toISOString().split('T')[0];
      weeklyMap.set(key, { totalPayments: 0, totalAmount: 0, totalCommission: 0, landlordAmount: 0 });
    }

    // Top properties by commission
    const propertyMap = new Map<string, { propertyId: string; propertyTitle: string; totalCommission: number; totalPayments: number }>();

    for (const c of commissions) {
      const totalAmt = Number(c.totalAmount);
      const commAmt = Number(c.commissionAmount);
      const landlordAmt = Number(c.landlordAmount);

      // Monthly
      const month = c.createdAt.toISOString().slice(0, 7);
      if (monthlyMap.has(month)) {
        const entry = monthlyMap.get(month)!;
        entry.totalPayments += 1;
        entry.totalAmount += totalAmt;
        entry.totalCommission += commAmt;
        entry.landlordAmount += landlordAmt;
      }

      // Weekly
      const createdDate = new Date(c.createdAt);
      for (const [weekKey, weekEntry] of weeklyMap) {
        const weekStart = new Date(weekKey);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (createdDate >= weekStart && createdDate < weekEnd) {
          weekEntry.totalPayments += 1;
          weekEntry.totalAmount += totalAmt;
          weekEntry.totalCommission += commAmt;
          weekEntry.landlordAmount += landlordAmt;
          break;
        }
      }

      // Property aggregation
      const propId = c.contract.property.id;
      const propEntry = propertyMap.get(propId) || {
        propertyId: propId,
        propertyTitle: c.contract.property.title,
        totalCommission: 0,
        totalPayments: 0,
      };
      propEntry.totalCommission += commAmt;
      propEntry.totalPayments += 1;
      propertyMap.set(propId, propEntry);
    }

    const topProperties = Array.from(propertyMap.values())
      .sort((a, b) => b.totalCommission - a.totalCommission)
      .slice(0, 10);

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
      monthly: Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({ month, ...data })),
      weekly: Array.from(weeklyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekStart, data]) => ({ weekStart, ...data })),
      topProperties,
      totals: {
        totalRevenue: commissions.reduce((s, c) => s + Number(c.totalAmount), 0),
        totalCommission: commissions.reduce((s, c) => s + Number(c.commissionAmount), 0),
        totalLandlordPayouts: commissions.reduce((s, c) => s + Number(c.landlordAmount), 0),
        count: commissions.length,
      },
    };
  }

  async exportCommissionsAsCsv(): Promise<string> {
    const commissions = await this.prisma.commission.findMany({
      include: {
        paymentSchedule: { select: { periodLabel: true, dueDate: true } },
        contract: {
          select: {
            id: true,
            property: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const BOM = '\uFEFF';
    const header = 'Tarih,Sozlesme ID,Mulk,Toplam Tutar,Komisyon Orani,Komisyon Tutari,Ev Sahibi Tutari';

    const rows = commissions.map((c) => {
      const date = c.createdAt.toISOString().split('T')[0];
      const contractId = c.contractId;
      const property = `"${c.contract.property.title.replace(/"/g, '""')}"`;
      const totalAmount = Number(c.totalAmount).toFixed(2);
      const rate = (Number(c.commissionRate) * 100).toFixed(2) + '%';
      const commissionAmount = Number(c.commissionAmount).toFixed(2);
      const landlordAmount = Number(c.landlordAmount).toFixed(2);
      return `${date},${contractId},${property},${totalAmount},${rate},${commissionAmount},${landlordAmount}`;
    });

    return BOM + header + '\n' + rows.join('\n');
  }
}
