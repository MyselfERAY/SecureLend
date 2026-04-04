import {
  Controller, Post, Get, Body, Param,
  ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import { BankService } from './bank.service';
import { ApplyKmhDto } from './dto/apply-kmh.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Bank')
@ApiBearerAuth('access-token')
@Controller('api/v1/bank')
export class BankController {
  constructor(
    private readonly bankService: BankService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── KMH Application ───────────────────────

  @Post('kmh/apply')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { limit: 2, ttl: seconds(10) } })
  async applyForKmh(
    @CurrentUser('id') userId: string,
    @Body() dto: ApplyKmhDto,
  ) {
    const result = await this.bankService.applyForKmh(userId, dto);
    return { status: 'success', data: result };
  }

  @Post('kmh/:applicationId/complete-onboarding')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 2, ttl: seconds(5) } })
  async completeOnboarding(
    @CurrentUser('id') userId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const result = await this.bankService.completeOnboarding(applicationId, userId);
    return { status: 'success', data: result };
  }

  // ─── Offer Accept ─────────────────────────

  @Post('kmh/:applicationId/accept-offer')
  @HttpCode(HttpStatus.OK)
  async acceptOffer(
    @CurrentUser('id') userId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const result = await this.bankService.acceptOffer(applicationId, userId);
    return { status: 'success', data: result };
  }

  // ─── KYC Endpoints ────────────────────────

  @Post('kmh/:applicationId/kyc/start')
  @HttpCode(HttpStatus.OK)
  async startKyc(
    @CurrentUser('id') userId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const result = await this.bankService.startKyc(applicationId, userId);
    return { status: 'success', data: result };
  }

  @Post('kmh/:applicationId/kyc/verify-id')
  @HttpCode(HttpStatus.OK)
  async verifyId(
    @CurrentUser('id') userId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const result = await this.bankService.verifyId(applicationId, userId);
    return { status: 'success', data: result };
  }

  @Post('kmh/:applicationId/kyc/verify-selfie')
  @HttpCode(HttpStatus.OK)
  async verifySelfie(
    @CurrentUser('id') userId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const result = await this.bankService.verifySelfie(applicationId, userId);
    return { status: 'success', data: result };
  }

  @Post('kmh/:applicationId/kyc/complete-video')
  @HttpCode(HttpStatus.OK)
  async completeVideo(
    @CurrentUser('id') userId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const result = await this.bankService.completeVideoCall(applicationId, userId);
    return { status: 'success', data: result };
  }

  @Post('kmh/:applicationId/kyc/sign-agreements')
  @HttpCode(HttpStatus.OK)
  async signAgreements(
    @CurrentUser('id') userId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const result = await this.bankService.signAgreements(applicationId, userId);
    return { status: 'success', data: result };
  }

  @Get('kmh/:applicationId/kyc/status')
  async getKycStatus(
    @CurrentUser('id') userId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const result = await this.bankService.getKycStatus(applicationId, userId);
    return { status: 'success', data: result };
  }

  // ─── KMH Application Queries ───────────────

  @Get('kmh/my-applications')
  async getMyKmhApplications(@CurrentUser('id') userId: string) {
    const applications = await this.prisma.kmhApplication.findMany({
      where: { userId },
      include: {
        bankAccount: {
          select: {
            id: true,
            accountNumber: true,
            creditLimit: true,
            balance: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: 'success',
      data: applications.map((app) => ({
        id: app.id,
        employmentStatus: app.employmentStatus,
        monthlyIncome: Number(app.monthlyIncome),
        employerName: app.employerName,
        residentialAddress: app.residentialAddress,
        estimatedRent: Number(app.estimatedRent),
        status: app.status,
        approvedLimit: app.approvedLimit ? Number(app.approvedLimit) : null,
        rejectionReason: app.rejectionReason,
        bankReferenceNo: app.bankReferenceNo,
        onboardingCompleted: app.onboardingCompleted,
        creditScore: app.creditScore,
        interestRate: app.interestRate ? Number(app.interestRate) : null,
        monthlyInstallment: app.monthlyInstallment ? Number(app.monthlyInstallment) : null,
        debtToIncomeRatio: app.debtToIncomeRatio ? Number(app.debtToIncomeRatio) : null,
        offerAccepted: app.offerAccepted,
        kycStatus: app.kycStatus,
        existingCustomer: app.existingCustomer,
        bankAccount: app.bankAccount ? {
          id: app.bankAccount.id,
          accountNumber: app.bankAccount.accountNumber,
          creditLimit: app.bankAccount.creditLimit ? Number(app.bankAccount.creditLimit) : null,
          balance: Number(app.bankAccount.balance),
          status: app.bankAccount.status,
        } : null,
        createdAt: app.createdAt.toISOString(),
      })),
    };
  }

  @Get('kmh/:applicationId')
  async getKmhApplication(
    @CurrentUser('id') userId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const app = await this.prisma.kmhApplication.findUnique({
      where: { id: applicationId },
      include: {
        bankAccount: {
          select: {
            id: true,
            accountNumber: true,
            creditLimit: true,
            balance: true,
            status: true,
          },
        },
      },
    });

    if (!app || app.userId !== userId) {
      return { status: 'fail', data: { message: 'Basvuru bulunamadi' } };
    }

    return {
      status: 'success',
      data: {
        id: app.id,
        employmentStatus: app.employmentStatus,
        monthlyIncome: Number(app.monthlyIncome),
        employerName: app.employerName,
        residentialAddress: app.residentialAddress,
        estimatedRent: Number(app.estimatedRent),
        status: app.status,
        approvedLimit: app.approvedLimit ? Number(app.approvedLimit) : null,
        rejectionReason: app.rejectionReason,
        bankReferenceNo: app.bankReferenceNo,
        onboardingCompleted: app.onboardingCompleted,
        creditScore: app.creditScore,
        interestRate: app.interestRate ? Number(app.interestRate) : null,
        monthlyInstallment: app.monthlyInstallment ? Number(app.monthlyInstallment) : null,
        debtToIncomeRatio: app.debtToIncomeRatio ? Number(app.debtToIncomeRatio) : null,
        offerAccepted: app.offerAccepted,
        offerAcceptedAt: app.offerAcceptedAt?.toISOString() ?? null,
        kycStatus: app.kycStatus,
        existingCustomer: app.existingCustomer,
        evaluationDetails: app.evaluationDetails,
        bankAccount: app.bankAccount ? {
          id: app.bankAccount.id,
          accountNumber: app.bankAccount.accountNumber,
          creditLimit: app.bankAccount.creditLimit ? Number(app.bankAccount.creditLimit) : null,
          balance: Number(app.bankAccount.balance),
          status: app.bankAccount.status,
        } : null,
        createdAt: app.createdAt.toISOString(),
      },
    };
  }

  // ─── Account Queries ────────────────────────

  @Get('accounts')
  async getMyAccounts(@CurrentUser('id') userId: string) {
    const accounts = await this.bankService.getAccountsByUser(userId);
    return { status: 'success', data: accounts };
  }

  @Get('accounts/:id/balance')
  async getBalance(@Param('id', ParseUUIDPipe) id: string) {
    const balance = await this.bankService.getBalance(id);
    return { status: 'success', data: balance };
  }

  @Get('accounts/:id/transactions')
  async getTransactions(@Param('id', ParseUUIDPipe) id: string) {
    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        OR: [{ fromAccountId: id }, { toAccountId: id }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const mapped = transactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      description: t.description,
      referenceNo: t.referenceNo,
      status: t.status,
      direction: t.fromAccountId === id ? 'OUT' : 'IN',
      processedAt: t.processedAt?.toISOString(),
      createdAt: t.createdAt.toISOString(),
    }));

    return { status: 'success', data: mapped };
  }
}
