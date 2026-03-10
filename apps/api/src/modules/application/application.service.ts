import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { maskTckn, validateTckn, ApplicationStatus } from '@securelend/shared';
import type { ApplicationResult } from '@securelend/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { CreditScoringService } from '../credit-scoring/credit-scoring.service';
import { IdentityVerificationService } from '../identity-verification/identity-verification.service';

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly creditScoringService: CreditScoringService,
    private readonly identityVerificationService: IdentityVerificationService,
  ) {}

  async createApplication(
    tckn: string,
    ipAddress: string,
  ): Promise<ApplicationResult> {
    const maskedTckn = maskTckn(tckn);
    this.logger.log(`Processing application for TCKN: ${maskedTckn}`);

    // Backend-side TCKN algorithm validation
    if (!validateTckn(tckn)) {
      throw new BadRequestException('Geçersiz TCKN');
    }

    // Step 1: Hash TCKN
    const tcknHash = this.encryptionService.hash(tckn);

    // Step 2: Verify identity via KPS (mock)
    const identityResult =
      await this.identityVerificationService.verifyIdentity(tckn);

    if (!identityResult.verified) {
      throw new BadRequestException('Kimlik doğrulaması başarısız');
    }

    // Step 3: Evaluate credit via KKB (mock)
    const creditResult =
      await this.creditScoringService.evaluateCredit(tckn);

    // Step 4: Atomic DB write (application + audit log in same transaction)
    const application = await this.prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          tcknHash,
          tcknMasked: maskedTckn,
          status: creditResult.approved ? 'APPROVED' : 'REJECTED',
          creditLimit: creditResult.approved ? creditResult.creditLimit : null,
          interestRate: creditResult.approved ? creditResult.interestRate : null,
          rejectionReason: creditResult.approved
            ? null
            : 'Kredi skoru yetersiz',
          kkbScore: creditResult.score,
          kpsVerified: identityResult.verified,
          ipAddress,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'APPLICATION_CREATED',
          entityType: 'Application',
          entityId: app.id,
          tcknMasked: maskedTckn,
          metadata: {
            status: app.status,
            kpsVerified: identityResult.verified,
          },
          ipAddress,
        },
      });

      return app;
    });

    this.logger.log(
      `Application ${application.id} created: ${application.status}`,
    );

    return {
      applicationId: application.id,
      status: application.status as ApplicationStatus,
      maskedTckn,
      creditLimit: creditResult.approved ? creditResult.creditLimit : undefined,
      interestRate: creditResult.approved
        ? creditResult.interestRate
        : undefined,
      rejectionReason: creditResult.approved
        ? undefined
        : 'Kredi skoru yetersiz',
      createdAt: application.createdAt.toISOString(),
    };
  }

  async findApplication(id: string): Promise<ApplicationResult> {
    const app = await this.prisma.application.findUnique({ where: { id } });

    if (!app) {
      throw new NotFoundException('Başvuru bulunamadı');
    }

    return {
      applicationId: app.id,
      status: app.status as ApplicationStatus,
      maskedTckn: app.tcknMasked,
      creditLimit: app.creditLimit ? Number(app.creditLimit) : undefined,
      interestRate: app.interestRate ? Number(app.interestRate) : undefined,
      rejectionReason: app.rejectionReason ?? undefined,
      createdAt: app.createdAt.toISOString(),
    };
  }
}
