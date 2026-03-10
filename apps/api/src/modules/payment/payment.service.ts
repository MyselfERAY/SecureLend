import {
  Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BankService } from '../bank/bank.service';

const COMMISSION_RATE = 0.01; // %1 platform komisyonu
const PLATFORM_ACCOUNT_NUMBER = 'TR00000610000000000000001';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bankService: BankService,
  ) {}

  async getScheduleByContract(userId: string, contractId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Sozlesme bulunamadi');
    if (contract.tenantId !== userId && contract.landlordId !== userId)
      throw new ForbiddenException('Erisim yetkiniz yok');

    const payments = await this.prisma.paymentSchedule.findMany({
      where: { contractId },
      orderBy: { dueDate: 'asc' },
    });

    return payments.map((p) => ({
      id: p.id,
      dueDate: p.dueDate.toISOString().split('T')[0],
      amount: Number(p.amount),
      periodLabel: p.periodLabel,
      status: p.status,
      paidAt: p.paidAt?.toISOString(),
      paidAmount: p.paidAmount ? Number(p.paidAmount) : undefined,
    }));
  }

  async getPaymentSummary(userId: string, contractId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Sozlesme bulunamadi');
    if (contract.tenantId !== userId && contract.landlordId !== userId)
      throw new ForbiddenException('Erisim yetkiniz yok');

    const payments = await this.prisma.paymentSchedule.findMany({
      where: { contractId },
      orderBy: { dueDate: 'asc' },
    });

    const totalAmount = payments.reduce((s, p) => s + Number(p.amount), 0);
    const paidAmount = payments
      .filter((p) => p.status === PaymentStatus.COMPLETED)
      .reduce((s, p) => s + Number(p.paidAmount || p.amount), 0);
    const overdueCount = payments.filter((p) => p.status === PaymentStatus.OVERDUE).length;

    const nextPayment = payments.find(
      (p) => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.OVERDUE,
    );

    return {
      totalAmount,
      paidAmount,
      remainingAmount: totalAmount - paidAmount,
      nextDueDate: nextPayment?.dueDate.toISOString().split('T')[0],
      nextAmount: nextPayment ? Number(nextPayment.amount) : undefined,
      overdueCount,
      totalPayments: payments.length,
      completedPayments: payments.filter((p) => p.status === PaymentStatus.COMPLETED).length,
    };
  }

  async processPayment(userId: string, paymentId: string, ipAddress: string) {
    const payment = await this.prisma.paymentSchedule.findUnique({
      where: { id: paymentId },
      include: { contract: true },
    });

    if (!payment) throw new NotFoundException('Odeme bulunamadi');
    if (payment.contract.tenantId !== userId)
      throw new ForbiddenException('Sadece kiraci odeme yapabilir');
    if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.OVERDUE)
      throw new BadRequestException('Bu odeme islenebilir durumda degil');

    const totalAmount = Number(payment.amount);
    const commissionAmount = Math.round(totalAmount * COMMISSION_RATE * 100) / 100;
    const landlordAmount = Math.round((totalAmount - commissionAmount) * 100) / 100;

    // DB transaction: mark payment + create commission record
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.paymentSchedule.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
          paidAmount: payment.amount,
        },
      });

      // Komisyon kaydı oluştur
      await tx.commission.create({
        data: {
          paymentScheduleId: paymentId,
          contractId: payment.contractId,
          totalAmount: totalAmount,
          commissionRate: COMMISSION_RATE,
          commissionAmount: commissionAmount,
          landlordAmount: landlordAmount,
          currency: payment.currency,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'PAYMENT_PROCESSED',
          entityType: 'PaymentSchedule',
          entityId: paymentId,
          metadata: {
            contractId: payment.contractId,
            amount: totalAmount,
            commissionAmount,
            landlordAmount,
            commissionRate: COMMISSION_RATE,
          },
          ipAddress,
        },
      });

      return updated;
    });

    // Bank transfers (best-effort, payment already marked complete)
    try {
      // Kiracının KMH hesabını bul
      const tenantAccount = await this.prisma.bankAccount.findFirst({
        where: { userId, contractId: payment.contractId, status: 'ACTIVE' },
      });

      if (tenantAccount) {
        // Ev sahibinin hesabını bul (varsa)
        const landlordAccount = await this.prisma.bankAccount.findFirst({
          where: {
            userId: payment.contract.landlordId,
            contractId: payment.contractId,
            status: 'ACTIVE',
          },
        });

        const landlordIban = landlordAccount?.accountNumber;

        if (landlordIban) {
          // Ev sahibine net tutarı transfer et
          await this.bankService.transfer(
            tenantAccount.id,
            landlordIban,
            landlordAmount,
            `Kira odemesi - ${payment.periodLabel}`,
            paymentId,
          );
        }

        // Platform komisyon hesabına komisyonu transfer et
        await this.bankService.transfer(
          tenantAccount.id,
          PLATFORM_ACCOUNT_NUMBER,
          commissionAmount,
          `Platform komisyonu - ${payment.periodLabel}`,
        );
      }
    } catch (err) {
      this.logger.warn(`Bank transfer failed for payment ${paymentId}: ${err}`);
    }

    this.logger.log(
      `Payment ${paymentId} processed: ${totalAmount} TL (commission: ${commissionAmount} TL, landlord: ${landlordAmount} TL)`,
    );

    return {
      id: result.id,
      status: result.status,
      paidAt: result.paidAt?.toISOString(),
      amount: totalAmount,
      commissionAmount,
      landlordAmount,
    };
  }

  async getMyPayments(userId: string) {
    const payments = await this.prisma.paymentSchedule.findMany({
      where: {
        contract: {
          OR: [{ tenantId: userId }, { landlordId: userId }],
        },
      },
      include: {
        contract: {
          select: {
            id: true,
            property: { select: { title: true } },
          },
        },
      },
      orderBy: { dueDate: 'desc' },
      take: 50,
    });

    return payments.map((p) => ({
      id: p.id,
      contractId: p.contractId,
      propertyTitle: p.contract.property.title,
      dueDate: p.dueDate.toISOString().split('T')[0],
      amount: Number(p.amount),
      periodLabel: p.periodLabel,
      status: p.status,
      paidAt: p.paidAt?.toISOString(),
    }));
  }
}
