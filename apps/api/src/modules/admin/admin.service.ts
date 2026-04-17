import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, ContractStatus, KmhApplicationStatus, KycStatus } from '@prisma/client';
import { CreateInviteDto } from './dto/create-invite.dto';

interface InviteTokenRow {
  id: string;
  token: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  used: boolean;
  used_at: Date | null;
  expires_at: Date;
  created_at: Date;
}

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureInviteTable();
  }

  private async ensureInviteTable(): Promise<void> {
    try {
      const [{ exists }] = await this.prisma.$queryRaw<[{ exists: boolean }]>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'invite_tokens'
        ) as exists`;
      if (!exists) {
        this.logger.warn('invite_tokens table missing — creating via raw SQL');
        await this.prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "invite_tokens" (
            "id"                  UUID NOT NULL DEFAULT gen_random_uuid(),
            "token"               VARCHAR(64) NOT NULL,
            "full_name"           VARCHAR(200) NOT NULL,
            "email"               VARCHAR(255),
            "phone"               VARCHAR(20),
            "note"                TEXT,
            "used"                BOOLEAN NOT NULL DEFAULT false,
            "used_at"             TIMESTAMP(3),
            "used_by_user_id"     UUID,
            "created_by_admin_id" UUID NOT NULL,
            "expires_at"          TIMESTAMP(3) NOT NULL,
            "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "invite_tokens_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "invite_tokens_token_key" UNIQUE ("token")
          )
        `);
        await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "invite_tokens_token_idx" ON "invite_tokens"("token")`);
        this.logger.log('invite_tokens table created');
      }
    } catch (err) {
      this.logger.error(`ensureInviteTable failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  async createInvite(adminId: string, dto: CreateInviteDto) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + (dto.expiresInDays ?? 7) * 24 * 60 * 60 * 1000);
    const webUrl = process.env.WEB_URL || 'https://kiraguvence.com';

    const [row] = await this.prisma.$queryRaw<InviteTokenRow[]>`
      INSERT INTO "invite_tokens" (token, full_name, email, phone, note, expires_at, created_by_admin_id)
      VALUES (
        ${token},
        ${dto.fullName},
        ${dto.email ?? null},
        ${dto.phone ?? null},
        ${dto.note ?? null},
        ${expiresAt},
        ${adminId}::uuid
      )
      RETURNING
        id::text as id, token, full_name, email, phone, note,
        used, used_at, expires_at, created_at
    `;

    return {
      id: row.id,
      token: row.token,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      note: row.note,
      used: row.used,
      expiresAt: row.expires_at.toISOString(),
      createdAt: row.created_at.toISOString(),
      inviteUrl: `${webUrl}/davet/${row.token}`,
    };
  }

  async listInvites(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const webUrl = process.env.WEB_URL || 'https://kiraguvence.com';

    const [rows, [{ count }]] = await Promise.all([
      this.prisma.$queryRaw<InviteTokenRow[]>`
        SELECT id::text as id, token, full_name, email, phone, note,
               used, used_at, expires_at, created_at
        FROM "invite_tokens"
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count FROM "invite_tokens"
      `,
    ]);

    const now = new Date();
    return {
      invites: rows.map((r) => ({
        id: r.id,
        token: r.token,
        fullName: r.full_name,
        email: r.email,
        phone: r.phone,
        note: r.note,
        used: r.used,
        usedAt: r.used_at?.toISOString() ?? null,
        expired: !r.used && now > r.expires_at,
        expiresAt: r.expires_at.toISOString(),
        createdAt: r.created_at.toISOString(),
        inviteUrl: `${webUrl}/davet/${r.token}`,
      })),
      total: Number(count),
      page,
      limit,
    };
  }

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

  async getActivationFunnel(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Step 1: All users registered in period
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, fullName: true, tcknMasked: true, kycStatus: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    if (users.length === 0) {
      return {
        steps: [
          { step: 1, name: 'Kayıt', count: 0, rate: 100 },
          { step: 2, name: 'KYC Tamamlama', count: 0, rate: 0 },
          { step: 3, name: 'Sözleşme Oluşturma', count: 0, rate: 0 },
          { step: 4, name: 'İmza', count: 0, rate: 0 },
          { step: 5, name: 'İlk Ödeme', count: 0, rate: 0 },
        ],
        users: [],
        period: { days, since: since.toISOString() },
      };
    }

    const userIds = users.map((u) => u.id);

    // Step 2: KYC completion timestamps from audit log
    const kycLogs = await this.prisma.auditLog.findMany({
      where: { userId: { in: userIds }, action: 'KYC_COMPLETED' },
      select: { userId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const kycTimestampMap = new Map<string, Date>();
    for (const log of kycLogs) {
      if (log.userId && !kycTimestampMap.has(log.userId)) {
        kycTimestampMap.set(log.userId, log.createdAt);
      }
    }

    // Step 3: Earliest contract created as tenant
    const contracts = await this.prisma.contract.findMany({
      where: { tenantId: { in: userIds } },
      select: { id: true, tenantId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const contractMap = new Map<string, { id: string; createdAt: Date }>();
    for (const c of contracts) {
      if (!contractMap.has(c.tenantId)) {
        contractMap.set(c.tenantId, { id: c.id, createdAt: c.createdAt });
      }
    }

    // Step 4: Contract signature by tenant (earliest signedAt)
    const contractIds = [...new Set(contracts.map((c) => c.id))];
    const signatures = contractIds.length > 0
      ? await this.prisma.contractSignature.findMany({
          where: { userId: { in: userIds }, contractId: { in: contractIds } },
          select: { userId: true, signedAt: true },
          orderBy: { signedAt: 'asc' },
        })
      : [];
    const signatureMap = new Map<string, Date>();
    for (const sig of signatures) {
      if (!signatureMap.has(sig.userId)) {
        signatureMap.set(sig.userId, sig.signedAt);
      }
    }

    // Step 5: First completed payment on tenant's contracts
    const contractToUser = new Map<string, string>();
    for (const c of contracts) contractToUser.set(c.id, c.tenantId);

    const completedPayments = contractIds.length > 0
      ? await this.prisma.paymentSchedule.findMany({
          where: { contractId: { in: contractIds }, status: PaymentStatus.COMPLETED, paidAt: { not: null } },
          select: { contractId: true, paidAt: true },
          orderBy: { paidAt: 'asc' },
        })
      : [];
    const firstPaymentMap = new Map<string, Date>();
    for (const p of completedPayments) {
      const uid = contractToUser.get(p.contractId);
      if (uid && p.paidAt && !firstPaymentMap.has(uid)) {
        firstPaymentMap.set(uid, p.paidAt);
      }
    }

    // Build per-user funnel rows
    const userRows = users.map((u) => {
      const kycAt = kycTimestampMap.get(u.id) ?? null;
      const contract = contractMap.get(u.id) ?? null;
      const signedAt = signatureMap.get(u.id) ?? null;
      const paymentAt = firstPaymentMap.get(u.id) ?? null;

      const kycDone = u.kycStatus === KycStatus.COMPLETED || kycAt !== null;
      let currentStep = 1;
      if (kycDone) currentStep = 2;
      if (contract) currentStep = 3;
      if (signedAt) currentStep = 4;
      if (paymentAt) currentStep = 5;

      return {
        userId: u.id,
        fullName: u.fullName,
        tcknMasked: u.tcknMasked,
        kycStatus: u.kycStatus,
        registeredAt: u.createdAt.toISOString(),
        kycCompletedAt: kycAt?.toISOString() ?? null,
        contractCreatedAt: contract?.createdAt.toISOString() ?? null,
        contractSignedAt: signedAt?.toISOString() ?? null,
        firstPaymentAt: paymentAt?.toISOString() ?? null,
        currentStep,
      };
    });

    const total = users.length;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    const kycCount = userRows.filter((u) => u.currentStep >= 2).length;
    const contractCount = userRows.filter((u) => u.currentStep >= 3).length;
    const signedCount = userRows.filter((u) => u.currentStep >= 4).length;
    const paidCount = userRows.filter((u) => u.currentStep >= 5).length;

    return {
      steps: [
        { step: 1, name: 'Kayıt', count: total, rate: 100 },
        { step: 2, name: 'KYC Tamamlama', count: kycCount, rate: pct(kycCount) },
        { step: 3, name: 'Sözleşme Oluşturma', count: contractCount, rate: pct(contractCount) },
        { step: 4, name: 'İmza', count: signedCount, rate: pct(signedCount) },
        { step: 5, name: 'İlk Ödeme', count: paidCount, rate: pct(paidCount) },
      ],
      users: userRows,
      period: { days, since: since.toISOString() },
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
