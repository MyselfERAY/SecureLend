import {
  Injectable, Logger, NotFoundException,
  BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { BankAccountType, BankAccountStatus, KmhApplicationStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InAppNotificationService } from '../in-app-notification/in-app-notification.service';
import {
  BankService,
  KmhApplicationResult,
  OnboardingResult,
  ContractNotificationResult,
  TransferResult,
  AccountBalance,
} from './bank.service';
import { ApplyKmhDto } from './dto/apply-kmh.dto';

interface CreditScoringResult {
  score: number;
  factors: { name: string; impact: string; detail: string }[];
}

@Injectable()
export class MockBankService extends BankService {
  private readonly logger = new Logger(MockBankService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inAppNotificationService: InAppNotificationService,
  ) {
    super();
  }

  // ─── Credit Scoring ───────────────────────────────

  /**
   * Simulate KKB (Kredi Kayit Burosu) query — in production this calls the real KKB API.
   * Returns existing monthly debt payments for the user.
   */
  private simulateKkbQuery(userId: string): { existingDebtPayments: number; kkbScore: number } {
    // Mock: generate a deterministic but varied result based on userId hash
    const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const existingDebtPayments = (hash % 5) * 500; // 0, 500, 1000, 1500, or 2000 TL
    const kkbScore = 400 + (hash % 6) * 100; // 400-900 range
    this.logger.log(`KKB query for user ${userId}: debt=${existingDebtPayments} TL, kkbScore=${kkbScore}`);
    return { existingDebtPayments, kkbScore };
  }

  /**
   * Check if user is an existing bank customer — in production this queries the core banking system via TCKN.
   */
  private async checkExistingCustomer(userId: string): Promise<boolean> {
    // Check if user already has any bank account with us
    const existingAccount = await this.prisma.bankAccount.findFirst({
      where: { userId, status: { not: BankAccountStatus.CLOSED } },
    });
    const isExisting = !!existingAccount;
    this.logger.log(`Existing customer check for user ${userId}: ${isExisting}`);
    return isExisting;
  }

  private calculateCreditScore(dto: ApplyKmhDto, kkbData: { existingDebtPayments: number; kkbScore: number }): CreditScoringResult {
    let score = 500; // base score (range 0-1000 like KKB/Findeks)
    const factors: { name: string; impact: string; detail: string }[] = [];

    // KKB score factor (from bureau query)
    if (kkbData.kkbScore >= 700) {
      score += 120;
      factors.push({ name: 'KKB Skoru', impact: 'pozitif', detail: `${kkbData.kkbScore} - iyi kredi gecmisi` });
    } else if (kkbData.kkbScore >= 500) {
      score += 40;
      factors.push({ name: 'KKB Skoru', impact: 'notr', detail: `${kkbData.kkbScore} - orta kredi gecmisi` });
    } else {
      score -= 60;
      factors.push({ name: 'KKB Skoru', impact: 'negatif', detail: `${kkbData.kkbScore} - dusuk kredi gecmisi` });
    }

    // Employment factor
    if (dto.employmentStatus === 'EMPLOYED') {
      score += 150;
      factors.push({ name: 'Calisma Durumu', impact: 'pozitif', detail: 'Maasli calisan' });
    } else if (dto.employmentStatus === 'SELF_EMPLOYED') {
      score += 100;
      factors.push({ name: 'Calisma Durumu', impact: 'pozitif', detail: 'Serbest meslek' });
    } else if (dto.employmentStatus === 'RETIRED') {
      score += 120;
      factors.push({ name: 'Calisma Durumu', impact: 'pozitif', detail: 'Emekli - duzenli gelir' });
    } else if (dto.employmentStatus === 'STUDENT') {
      score -= 50;
      factors.push({ name: 'Calisma Durumu', impact: 'negatif', detail: 'Ogrenci' });
    } else {
      score -= 100;
      factors.push({ name: 'Calisma Durumu', impact: 'negatif', detail: 'Calismayan' });
    }

    // Income-to-rent ratio
    const ratio = Number(dto.monthlyIncome) / Number(dto.estimatedRent);
    if (ratio >= 4) {
      score += 200;
      factors.push({ name: 'Gelir/Kira Orani', impact: 'pozitif', detail: `${ratio.toFixed(1)}x - cok iyi` });
    } else if (ratio >= 3) {
      score += 150;
      factors.push({ name: 'Gelir/Kira Orani', impact: 'pozitif', detail: `${ratio.toFixed(1)}x - iyi` });
    } else if (ratio >= 2) {
      score += 50;
      factors.push({ name: 'Gelir/Kira Orani', impact: 'notr', detail: `${ratio.toFixed(1)}x - yeterli` });
    } else {
      score -= 100;
      factors.push({ name: 'Gelir/Kira Orani', impact: 'negatif', detail: `${ratio.toFixed(1)}x - yetersiz` });
    }

    // DTI (debt-to-income) — using KKB data, not user-provided
    const dti = (kkbData.existingDebtPayments + Number(dto.estimatedRent)) / Number(dto.monthlyIncome);
    if (dti <= 0.3) {
      score += 100;
      factors.push({ name: 'Borc/Gelir Orani', impact: 'pozitif', detail: `%${(dti * 100).toFixed(0)} - dusuk risk` });
    } else if (dti <= 0.5) {
      score += 30;
      factors.push({ name: 'Borc/Gelir Orani', impact: 'notr', detail: `%${(dti * 100).toFixed(0)} - orta` });
    } else {
      score -= 80;
      factors.push({ name: 'Borc/Gelir Orani', impact: 'negatif', detail: `%${(dti * 100).toFixed(0)} - yuksek risk` });
    }

    // Employer (named employer is better)
    if (dto.employerName && dto.employerName.length > 3) {
      score += 30;
      factors.push({ name: 'Isveren Bilgisi', impact: 'pozitif', detail: 'Isveren bilgisi mevcut' });
    }

    // Clamp 0-1000
    score = Math.max(0, Math.min(1000, score));

    return { score, factors };
  }

  private determineInterestRate(score: number): number {
    if (score >= 800) return 1.89;
    if (score >= 700) return 2.29;
    return 2.89;
  }

  private calculateMonthlyInstallment(limit: number, interestRate: number): number {
    // Simple monthly installment calculation (12-month term assumed for display)
    const monthlyRate = interestRate / 100;
    const months = 12;
    const installment = (limit * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
    return Math.round(installment * 100) / 100;
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

    // Bank-side queries (KKB + existing customer check)
    const kkbData = this.simulateKkbQuery(userId);
    const isExistingCustomer = await this.checkExistingCustomer(userId);

    // Realistic credit scoring using bank-queried data
    const scoring = this.calculateCreditScore(dto, kkbData);
    const isApproved = scoring.score >= 600;

    // Calculate DTI using KKB data
    const dti = (kkbData.existingDebtPayments + Number(dto.estimatedRent)) / Number(dto.monthlyIncome);
    const dtiRounded = Math.round(dti * 10000) / 10000;

    // Approval details
    const scoreFactor = scoring.score / 1000;
    const approvedLimit = isApproved
      ? Math.round(Math.min(dto.monthlyIncome * 3, 500000) * scoreFactor)
      : undefined;
    const interestRate = isApproved ? this.determineInterestRate(scoring.score) : undefined;
    const monthlyInstallment = isApproved && approvedLimit
      ? this.calculateMonthlyInstallment(approvedLimit, interestRate!)
      : undefined;

    const rejectionReason = isApproved
      ? undefined
      : `Kredi skoru yetersiz (${scoring.score}/1000). Minimum 600 puan gereklidir.`;

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
          creditScore: scoring.score,
          debtToIncomeRatio: dtiRounded,
          interestRate: interestRate ?? null,
          monthlyInstallment: monthlyInstallment ?? null,
          existingCustomer: isExistingCustomer,
          evaluationDetails: {
            factors: scoring.factors,
            evaluatedAt: new Date().toISOString(),
            modelVersion: 'mock-v2',
          },
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
            creditScore: scoring.score,
            dti: dtiRounded,
          },
        },
      });

      return app;
    });

    this.logger.log(
      `KMH application ${application.id}: ${isApproved ? 'APPROVED' : 'REJECTED'} ` +
      `(score: ${scoring.score}, income: ${dto.monthlyIncome}, rent: ${dto.estimatedRent}, limit: ${approvedLimit ?? 'N/A'})`,
    );

    // Send in-app notification
    try {
      if (isApproved) {
        await this.inAppNotificationService.create(
          userId,
          NotificationType.KMH_APPROVED,
          'KMH Basvurunuz Onaylandi',
          `KMH basvurunuz onaylandi. Onaylanan limit: ${approvedLimit?.toLocaleString('tr-TR')} TL.`,
          'KmhApplication',
          application.id,
        );
      } else {
        await this.inAppNotificationService.create(
          userId,
          NotificationType.KMH_REJECTED,
          'KMH Basvurunuz Reddedildi',
          rejectionReason ?? 'Basvurunuz degerlendirme sonucunda reddedilmistir.',
          'KmhApplication',
          application.id,
        );
      }
    } catch (err) {
      this.logger.warn(`Failed to create in-app notification for KMH application ${application.id}: ${err}`);
    }

    const scoreLabel = scoring.score >= 800 ? 'Cok Iyi' : scoring.score >= 700 ? 'Iyi' : scoring.score >= 600 ? 'Yeterli' : 'Yetersiz';

    return {
      applicationId: application.id,
      status: isApproved ? 'APPROVED' : 'REJECTED',
      creditScore: scoring.score,
      creditScoreLabel: scoreLabel,
      approvedLimit,
      interestRate,
      monthlyInstallment,
      debtToIncomeRatio: dtiRounded,
      evaluationFactors: scoring.factors,
      rejectionReason,
      bankReferenceNo,
      existingCustomer: isExistingCustomer,
    };
  }

  // ─── Offer Accept/Reject ──────────────────────────

  async acceptOffer(applicationId: string, userId: string): Promise<any> {
    const app = await this.prisma.kmhApplication.findUnique({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('KMH basvurusu bulunamadi');
    if (app.userId !== userId) throw new ForbiddenException('Bu basvuru size ait degil');
    if (app.status !== KmhApplicationStatus.APPROVED) {
      throw new BadRequestException('Sadece onaylanmis basvurularda teklif kabul edilebilir');
    }
    if (app.offerAccepted) {
      throw new BadRequestException('Teklif zaten kabul edilmis');
    }

    const updated = await this.prisma.kmhApplication.update({
      where: { id: applicationId },
      data: {
        offerAccepted: true,
        offerAcceptedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'KMH_OFFER_ACCEPTED',
        entityType: 'KmhApplication',
        entityId: applicationId,
        metadata: {
          approvedLimit: updated.approvedLimit ? Number(updated.approvedLimit) : null,
          interestRate: updated.interestRate ? Number(updated.interestRate) : null,
        },
      },
    });

    this.logger.log(`KMH offer accepted for application ${applicationId}`);

    return {
      applicationId,
      offerAccepted: true,
      offerAcceptedAt: updated.offerAcceptedAt?.toISOString(),
      message: 'Teklif basariyla kabul edildi. Simdi KYC surecini baslatin.',
    };
  }

  // ─── KYC Flow ─────────────────────────────────────

  private async getApplicationForKyc(applicationId: string, userId: string) {
    const app = await this.prisma.kmhApplication.findUnique({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('KMH basvurusu bulunamadi');
    if (app.userId !== userId) throw new ForbiddenException('Bu basvuru size ait degil');
    if (app.status !== KmhApplicationStatus.APPROVED) {
      throw new BadRequestException('Sadece onaylanmis basvurularda KYC yapilabilir');
    }
    if (!app.offerAccepted) {
      throw new BadRequestException('Once teklifi kabul etmelisiniz');
    }
    return app;
  }

  async startKyc(applicationId: string, userId: string): Promise<any> {
    const app = await this.getApplicationForKyc(applicationId, userId);

    if (app.kycStatus !== 'NOT_STARTED') {
      throw new BadRequestException('KYC sureci zaten baslatilmis');
    }

    await this.prisma.kmhApplication.update({
      where: { id: applicationId },
      data: { kycStatus: 'IN_PROGRESS' },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'KMH_KYC_STARTED',
        entityType: 'KmhApplication',
        entityId: applicationId,
        metadata: {},
      },
    });

    this.logger.log(`KYC started for application ${applicationId}`);

    return {
      applicationId,
      kycStatus: 'IN_PROGRESS',
      message: 'KYC sureci baslatildi. Ilk adim: Kimlik dogrulama.',
      nextStep: 'id_verification',
    };
  }

  async verifyId(applicationId: string, userId: string): Promise<any> {
    const app = await this.getApplicationForKyc(applicationId, userId);

    if (app.kycStatus === 'NOT_STARTED') {
      throw new BadRequestException('Once KYC surecini baslatin');
    }
    if (app.kycIdVerified) {
      throw new BadRequestException('Kimlik zaten dogrulanmis');
    }

    await this.prisma.kmhApplication.update({
      where: { id: applicationId },
      data: {
        kycIdVerified: true,
        kycStatus: 'ID_VERIFIED',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'KMH_KYC_ID_VERIFIED',
        entityType: 'KmhApplication',
        entityId: applicationId,
        metadata: { method: 'NFC_MOCK' },
      },
    });

    this.logger.log(`KYC ID verified for application ${applicationId}`);

    return {
      applicationId,
      step: 'id_verification',
      completed: true,
      kycStatus: 'ID_VERIFIED',
      message: 'Kimlik basariyla dogrulandi (NFC). Sonraki adim: Canlilik testi.',
      nextStep: 'selfie',
    };
  }

  async verifySelfie(applicationId: string, userId: string): Promise<any> {
    const app = await this.getApplicationForKyc(applicationId, userId);

    if (!app.kycIdVerified) {
      throw new BadRequestException('Once kimlik dogrulamasi tamamlanmalidir');
    }
    if (app.kycSelfieVerified) {
      throw new BadRequestException('Canlilik testi zaten tamamlanmis');
    }

    await this.prisma.kmhApplication.update({
      where: { id: applicationId },
      data: {
        kycSelfieVerified: true,
        kycStatus: 'SELFIE_VERIFIED',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'KMH_KYC_SELFIE_VERIFIED',
        entityType: 'KmhApplication',
        entityId: applicationId,
        metadata: { method: 'LIVENESS_MOCK' },
      },
    });

    this.logger.log(`KYC selfie verified for application ${applicationId}`);

    const nextStep = app.existingCustomer ? 'agreements' : 'video_call';
    return {
      applicationId,
      step: 'selfie',
      completed: true,
      kycStatus: 'SELFIE_VERIFIED',
      message: 'Canlilik testi basarili. ' + (app.existingCustomer
        ? 'Mevcut musteri olarak goruntulu gorusme atlanmistir. Sonraki adim: Sozlesme onaylari.'
        : 'Sonraki adim: Goruntulu gorusme.'),
      nextStep,
    };
  }

  async completeVideoCall(applicationId: string, userId: string): Promise<any> {
    const app = await this.getApplicationForKyc(applicationId, userId);

    if (!app.kycSelfieVerified) {
      throw new BadRequestException('Once canlilik testi tamamlanmalidir');
    }
    if (app.existingCustomer) {
      throw new BadRequestException('Mevcut musteriler icin goruntulu gorusme gerekli degildir');
    }
    if (app.kycVideoCompleted) {
      throw new BadRequestException('Goruntulu gorusme zaten tamamlanmis');
    }

    await this.prisma.kmhApplication.update({
      where: { id: applicationId },
      data: {
        kycVideoCompleted: true,
        kycStatus: 'VIDEO_COMPLETED',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'KMH_KYC_VIDEO_COMPLETED',
        entityType: 'KmhApplication',
        entityId: applicationId,
        metadata: { method: 'VIDEO_CALL_MOCK', duration: '3m 42s' },
      },
    });

    this.logger.log(`KYC video call completed for application ${applicationId}`);

    return {
      applicationId,
      step: 'video_call',
      completed: true,
      kycStatus: 'VIDEO_COMPLETED',
      message: 'Goruntulu gorusme basariyla tamamlandi. Sonraki adim: Sozlesme onaylari.',
      nextStep: 'agreements',
    };
  }

  async signAgreements(applicationId: string, userId: string): Promise<any> {
    const app = await this.getApplicationForKyc(applicationId, userId);

    if (!app.kycSelfieVerified) {
      throw new BadRequestException('Once canlilik testi tamamlanmalidir');
    }
    if (!app.existingCustomer && !app.kycVideoCompleted) {
      throw new BadRequestException('Once goruntulu gorusme tamamlanmalidir');
    }
    if (app.kycAgreementsSigned) {
      throw new BadRequestException('Sozlesmeler zaten imzalanmis');
    }

    await this.prisma.kmhApplication.update({
      where: { id: applicationId },
      data: {
        kycAgreementsSigned: true,
        kycStatus: 'COMPLETED',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'KMH_KYC_AGREEMENTS_SIGNED',
        entityType: 'KmhApplication',
        entityId: applicationId,
        metadata: {
          agreements: ['KMH Sozlesmesi', 'KVKK Aydinlatma Metni', 'Acik Riza Beyani', 'Odeme Hizmetleri Cerceve Sozlesmesi'],
        },
      },
    });

    this.logger.log(`KYC agreements signed for application ${applicationId}`);

    return {
      applicationId,
      step: 'agreements',
      completed: true,
      kycStatus: 'COMPLETED',
      message: 'Tum sozlesmeler onaylandi. KYC sureci tamamlandi. Artik onboarding tamamlanabilir.',
      canComplete: true,
    };
  }

  async getKycStatus(applicationId: string, userId: string): Promise<any> {
    const app = await this.prisma.kmhApplication.findUnique({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('KMH basvurusu bulunamadi');
    if (app.userId !== userId) throw new ForbiddenException('Bu basvuru size ait degil');

    const isExisting = app.existingCustomer;

    const steps = [
      {
        key: 'id_verification',
        label: 'Kimlik Dogrulama',
        description: 'NFC ile kimlik tarama',
        completed: app.kycIdVerified,
        required: true,
      },
      {
        key: 'selfie',
        label: 'Canlilik Testi',
        description: 'Yuz tanima ve canlilik dogrulamasi',
        completed: app.kycSelfieVerified,
        required: true,
      },
      {
        key: 'video_call',
        label: 'Goruntulu Gorusme',
        description: 'Banka yetkili ile goruntulu gorusme',
        completed: app.kycVideoCompleted,
        required: !isExisting,
      },
      {
        key: 'agreements',
        label: 'Sozlesme Onaylari',
        description: 'KMH, KVKK ve diger sozlesmeler',
        completed: app.kycAgreementsSigned,
        required: true,
      },
    ];

    const requiredSteps = steps.filter((s) => s.required);
    const completedSteps = requiredSteps.filter((s) => s.completed).length;
    const totalSteps = requiredSteps.length;
    const canComplete = requiredSteps.every((s) => s.completed);

    return {
      applicationId,
      kycStatus: app.kycStatus,
      existingCustomer: isExisting,
      steps,
      completedSteps,
      totalSteps,
      canComplete,
    };
  }

  // ─── Cancel Application ────────────────────────────

  async cancelApplication(applicationId: string, userId: string): Promise<any> {
    const app = await this.prisma.kmhApplication.findUnique({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('KMH basvurusu bulunamadi');
    if (app.userId !== userId) throw new ForbiddenException('Bu basvuru size ait degil');

    if (app.onboardingCompleted) {
      throw new BadRequestException('Tamamlanmis basvurular iptal edilemez');
    }
    if (app.status === KmhApplicationStatus.REJECTED) {
      throw new BadRequestException('Reddedilmis basvurular zaten iptal durumundadir');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.kmhApplication.update({
        where: { id: applicationId },
        data: { status: KmhApplicationStatus.REJECTED, rejectionReason: 'Kullanici tarafindan iptal edildi' },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'KMH_APPLICATION_CANCELLED',
          entityType: 'KmhApplication',
          entityId: applicationId,
          metadata: { previousStatus: app.status },
        },
      });
    });

    this.logger.log(`KMH application ${applicationId} cancelled by user`);

    return {
      applicationId,
      status: 'CANCELLED',
      message: 'Basvurunuz basariyla iptal edildi.',
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
    if (!application.offerAccepted) {
      throw new BadRequestException('Once teklifi kabul etmelisiniz');
    }

    // Check all KYC steps are completed
    const requiredKycDone = application.kycIdVerified
      && application.kycSelfieVerified
      && application.kycAgreementsSigned
      && (application.existingCustomer || application.kycVideoCompleted);

    if (!requiredKycDone) {
      throw new BadRequestException('Tum KYC adimlari tamamlanmadan onboarding yapilamaz');
    }

    const iban = this.generateMockIban();
    const creditLimit = Number(application.approvedLimit);
    const appInterestRate = application.interestRate ? Number(application.interestRate) : 2.49;

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
          interestRate: appInterestRate,
          openedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'KMH_ONBOARDING_COMPLETED',
          entityType: 'BankAccount',
          entityId: acc.id,
          metadata: { iban, creditLimit, kmhApplicationId, interestRate: appInterestRate },
        },
      });

      return acc;
    });

    this.logger.log(`KMH onboarding completed: ${iban}, limit: ${creditLimit} TL`);

    // Send in-app notification
    try {
      await this.inAppNotificationService.create(
        userId,
        NotificationType.KMH_ONBOARDING_COMPLETE,
        'KMH Hesabiniz Acildi',
        `KMH hesabiniz basariyla acildi. IBAN: ${iban}, Limit: ${creditLimit.toLocaleString('tr-TR')} TL.`,
        'BankAccount',
        account.id,
      );
    } catch (err) {
      this.logger.warn(`Failed to create in-app notification for onboarding ${kmhApplicationId}: ${err}`);
    }

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
