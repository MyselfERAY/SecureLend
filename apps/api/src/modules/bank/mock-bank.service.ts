import {
  Injectable, Logger, NotFoundException,
  BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { BankAccountType, BankAccountStatus, KmhApplicationStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  BankService,
  KmhApplicationResult,
  OnboardingResult,
  ContractNotificationResult,
  TransferResult,
  AccountBalance,
} from './bank.service';
import { ApplyKmhDto } from './dto/apply-kmh.dto';

@Injectable()
export class MockBankService extends BankService {
  private readonly logger = new Logger(MockBankService.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // ─── KMH Application ──────────────────────────────

  async applyForKmh(userId: string, dto: ApplyKmhDto): Promise<KmhApplicationResult> {
    // Check if user already has an active (APPROVED + not onboarded yet, or PENDING) application
    const existing = await this.prisma.kmhApplication.findFirst({
      where: {
        userId,
        status: { in: [KmhApplicationStatus.PENDING, KmhApplicationStatus.APPROVED] },
        onboardingCompleted: false,
      },
    });
    if (existing) {
      throw new BadRequestException('Zaten bekleyen veya onaylanmis bir KMH basvurunuz var');
    }

    // Mock credit evaluation: income >= estimatedRent * 2 → approved
    const isApproved = dto.monthlyIncome >= dto.estimatedRent * 2;
    const approvedLimit = isApproved
      ? Math.min(dto.monthlyIncome * 3, 500000) // max 500K TL
      : undefined;
    const rejectionReason = isApproved
      ? undefined
      : 'Gelir seviyesi talep edilen kira bedeline gore yetersiz';

    const bankReferenceNo = `KMH-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const application = await this.prisma.$transaction(async (tx) => {
      const app = await tx.kmhApplication.create({
        data: {
          userId,
          employmentStatus: dto.employmentStatus as any,
          monthlyIncome: dto.monthlyIncome,
          employerName: dto.employerName,
          residentialAddress: dto.residentialAddress,
          estimatedRent: dto.estimatedRent,
          status: isApproved ? KmhApplicationStatus.APPROVED : KmhApplicationStatus.REJECTED,
          approvedLimit,
          rejectionReason,
          bankReferenceNo,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'KMH_APPLICATION_SUBMITTED',
          entityType: 'KmhApplication',
          entityId: app.id,
          metadata: {
            status: isApproved ? 'APPROVED' : 'REJECTED',
            estimatedRent: dto.estimatedRent,
            monthlyIncome: dto.monthlyIncome,
            approvedLimit,
          },
        },
      });

      return app;
    });

    this.logger.log(
      `KMH application ${application.id}: ${isApproved ? 'APPROVED' : 'REJECTED'} ` +
      `(income: ${dto.monthlyIncome}, rent: ${dto.estimatedRent}, limit: ${approvedLimit ?? 'N/A'})`,
    );

    return {
      applicationId: application.id,
      status: isApproved ? 'APPROVED' : 'REJECTED',
      approvedLimit,
      rejectionReason,
      bankReferenceNo,
    };
  }

  // ─── Digital Onboarding ────────────────────────────

  async completeOnboarding(kmhApplicationId: string, userId: string): Promise<OnboardingResult> {
    const application = await this.prisma.kmhApplication.findUnique({
      where: { id: kmhApplicationId },
    });

    if (!application) throw new NotFoundException('KMH basvurusu bulunamadi');
    if (application.userId !== userId) throw new ForbiddenException('Bu basvuru size ait degil');
    if (application.status !== KmhApplicationStatus.APPROVED) {
      throw new BadRequestException('Sadece onaylanmis basvurular icin onboarding yapilabilir');
    }
    if (application.onboardingCompleted) {
      throw new BadRequestException('Onboarding zaten tamamlanmis');
    }

    const iban = this.generateMockIban();
    const creditLimit = Number(application.approvedLimit);

    const account = await this.prisma.$transaction(async (tx) => {
      // Mark onboarding as completed
      await tx.kmhApplication.update({
        where: { id: kmhApplicationId },
        data: { onboardingCompleted: true },
      });

      // Create KMH bank account
      const acc = await tx.bankAccount.create({
        data: {
          userId,
          kmhApplicationId,
          accountNumber: iban,
          accountType: BankAccountType.KMH,
          status: BankAccountStatus.ACTIVE,
          balance: 0,
          creditLimit,
          interestRate: 2.49,
          openedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'KMH_ONBOARDING_COMPLETED',
          entityType: 'BankAccount',
          entityId: acc.id,
          metadata: { iban, creditLimit, kmhApplicationId },
        },
      });

      return acc;
    });

    this.logger.log(`KMH onboarding completed: ${iban}, limit: ${creditLimit} TL`);

    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      creditLimit,
    };
  }

  // ─── Contract Signed Notification ──────────────────

  async notifyContractSigned(contractId: string, kmhAccountId?: string): Promise<ContractNotificationResult> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        tenant: { select: { id: true, fullName: true } },
      },
    });

    if (!contract) throw new NotFoundException('Sozlesme bulunamadi');

    // Find tenant's KMH account - use specified ID or fallback to latest
    let kmhAccount;
    if (kmhAccountId) {
      kmhAccount = await this.prisma.bankAccount.findFirst({
        where: {
          id: kmhAccountId,
          userId: contract.tenantId,
          accountType: BankAccountType.KMH,
          status: BankAccountStatus.ACTIVE,
        },
      });
    } else {
      kmhAccount = await this.prisma.bankAccount.findFirst({
        where: {
          userId: contract.tenantId,
          accountType: BankAccountType.KMH,
          status: BankAccountStatus.ACTIVE,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!kmhAccount) {
      throw new BadRequestException('Kiracinin aktif KMH hesabi bulunamadi');
    }

    // Link account to contract
    await this.prisma.bankAccount.update({
      where: { id: kmhAccount.id },
      data: { contractId },
    });

    // Create automatic payment order
    const nextExecDate = this.calculateNextExecutionDate(contract.paymentDayOfMonth);

    const paymentOrder = await this.prisma.$transaction(async (tx) => {
      const po = await tx.paymentOrder.create({
        data: {
          contractId,
          fromAccountId: kmhAccount.id,
          toIban: contract.landlordIban!,
          amount: Number(contract.monthlyRent),
          dayOfMonth: contract.paymentDayOfMonth,
          nextExecutionDate: nextExecDate,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: contract.tenantId,
          action: 'CONTRACT_BANK_NOTIFIED',
          entityType: 'PaymentOrder',
          entityId: po.id,
          metadata: {
            contractId,
            kmhAccountNumber: kmhAccount.accountNumber,
            landlordIban: contract.landlordIban,
            monthlyRent: Number(contract.monthlyRent),
          },
        },
      });

      return po;
    });

    this.logger.log(
      `Bank notified for contract ${contractId}: payment order ${paymentOrder.id} created`,
    );

    return {
      paymentOrderId: paymentOrder.id,
      kmhAccountNumber: kmhAccount.accountNumber,
      kmhLimit: Number(kmhAccount.creditLimit),
      message: `Duzenli odeme talimati olusturuldu. Her ayin ${contract.paymentDayOfMonth}. gunu ${Number(contract.monthlyRent)} TL ${contract.landlordIban} hesabina aktarilacaktir.`,
    };
  }

  // ─── Account Queries ───────────────────────────────

  async getBalance(accountId: string): Promise<AccountBalance> {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Hesap bulunamadi');

    const balance = Number(account.balance);
    const creditLimit = account.creditLimit ? Number(account.creditLimit) : undefined;

    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      balance,
      availableBalance: balance + (creditLimit ?? 0),
      creditLimit,
      currency: account.currency,
    };
  }

  async getAccountsByUser(userId: string): Promise<AccountBalance[]> {
    const accounts = await this.prisma.bankAccount.findMany({
      where: { userId, status: { not: BankAccountStatus.CLOSED } },
      include: { contract: { select: { id: true, property: { select: { title: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((acc) => {
      const balance = Number(acc.balance);
      const creditLimit = acc.creditLimit ? Number(acc.creditLimit) : undefined;
      return {
        accountId: acc.id,
        accountNumber: acc.accountNumber,
        balance,
        availableBalance: balance + (creditLimit ?? 0),
        creditLimit,
        currency: acc.currency,
        contractId: acc.contractId ?? undefined,
        propertyTitle: (acc as any).contract?.property?.title,
      };
    });
  }

  // ─── Transfer (for payment processing) ─────────────

  async transfer(
    fromAccountId: string,
    toIban: string,
    amount: number,
    description: string,
    paymentScheduleId?: string,
  ): Promise<TransferResult> {
    if (amount <= 0) throw new BadRequestException('Tutar pozitif olmalidir');

    const fromAccount = await this.prisma.bankAccount.findUnique({ where: { id: fromAccountId } });
    if (!fromAccount) throw new NotFoundException('Kaynak hesap bulunamadi');
    if (fromAccount.status !== BankAccountStatus.ACTIVE)
      throw new BadRequestException('Hesap aktif degil');

    const balance = Number(fromAccount.balance);
    const creditLimit = fromAccount.creditLimit ? Number(fromAccount.creditLimit) : 0;
    if (amount > balance + creditLimit) throw new BadRequestException('Yetersiz bakiye');

    const toAccount = await this.prisma.bankAccount.findUnique({ where: { accountNumber: toIban } });
    const referenceNo = randomUUID();
    const now = new Date();

    const transaction = await this.prisma.$transaction(async (tx) => {
      await tx.bankAccount.update({ where: { id: fromAccountId }, data: { balance: { decrement: amount } } });
      if (toAccount) {
        await tx.bankAccount.update({ where: { id: toAccount.id }, data: { balance: { increment: amount } } });
      }
      const txn = await tx.bankTransaction.create({
        data: {
          fromAccountId,
          toAccountId: toAccount?.id ?? null,
          paymentScheduleId: paymentScheduleId ?? null,
          amount,
          description,
          referenceNo,
          status: 'COMPLETED',
          processedAt: now,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: fromAccount.userId,
          action: 'BANK_TRANSFER',
          entityType: 'BankTransaction',
          entityId: txn.id,
          metadata: { fromAccountId, toIban, amount, referenceNo },
        },
      });
      return txn;
    });

    return {
      transactionId: transaction.id,
      referenceNo: transaction.referenceNo,
      status: transaction.status,
      processedAt: now.toISOString(),
    };
  }

  // ─── Private helpers ───────────────────────────────

  private generateMockIban(): string {
    const bankCode = '00061';
    const accountNo = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
    return `TR00${bankCode}0${accountNo}`;
  }

  private calculateNextExecutionDate(dayOfMonth: number): Date {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();

    // If day has passed this month, move to next month
    if (now.getDate() >= dayOfMonth) {
      month++;
      if (month > 11) { month = 0; year++; }
    }

    const lastDay = new Date(year, month + 1, 0).getDate();
    const actualDay = Math.min(dayOfMonth, lastDay);
    return new Date(Date.UTC(year, month, actualDay));
  }
}
