import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { maskTckn, validateTckn, ApplicationStatus } from '@securelend/shared';
import type { ApplicationResult } from '@securelend/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { CreditScoringService } from '../credit-scoring/credit-scoring.service';
import { IdentityVerificationService } from '../identity-verification/identity-verification.service';
import { SmsService } from '../notification/sms.service';

@Injectable()
export class ApplicationService implements OnModuleInit {
  private readonly logger = new Logger(ApplicationService.name);

  /** Aynı telefon/TCKN ile başvuru tekrar penceresi (gün) */
  private readonly DEDUP_WINDOW_DAYS = 30;
  /** Anonim başvuru sonucunun UUID ile okunabilir kalma süresi (saat) */
  private readonly RESULT_TTL_HOURS = 24;
  private readonly OTP_PURPOSE = 'APPLICATION';

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly creditScoringService: CreditScoringService,
    private readonly identityVerificationService: IdentityVerificationService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * DDL self-heal: Prisma migrate deploy bu DB'de güvenilir olmadığı için
   * (projedeki diğer servislerle aynı desen) phone_hash/phone_masked kolonlarını
   * başlangıçta idempotent şekilde oluşturur.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.ensureColumn('applications', 'phone_hash', 'VARCHAR(128)');
      await this.ensureColumn('applications', 'phone_masked', 'VARCHAR(20)');
      await this.prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "idx_application_phone_hash" ON "applications"("phone_hash");`,
      );
    } catch (err) {
      this.logger.error(
        `Application onModuleInit failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private async ensureColumn(
    table: string,
    column: string,
    definition: string,
  ): Promise<void> {
    const check = await this.prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
      ) as exists`;
    if (!check[0]?.exists) {
      this.logger.warn(`${table}.${column} missing — adding via raw SQL`);
      await this.prisma.$executeRawUnsafe(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${definition};`,
      );
      this.logger.log(`${table}.${column} added`);
    }
  }

  /**
   * Adım 1: TCKN + telefon ile başvuru başlat. Kredi sorgusuna GİTMEDEN önce
   * 30 günlük dedup kontrolü yapar (spam önleme), sonra telefona OTP gönderir.
   */
  async startApplication(
    tckn: string,
    phone: string,
    ipAddress: string,
  ): Promise<{ phoneMasked: string; message: string }> {
    if (!validateTckn(tckn)) {
      throw new BadRequestException('Geçersiz TCKN');
    }

    const tcknHash = this.encryptionService.hash(tckn);
    const phoneHash = this.encryptionService.hash(phone);

    // ERKEN KESİM: aynı telefon VEYA TCKN ile son 30 günde başvuru varsa
    // OTP bile gönderme, kredi sorgusuna hiç gitme.
    await this.assertNoRecentApplication(tcknHash, phoneHash);

    await this.sendApplicationOtp(phone);
    this.logger.log(`Application OTP sent for ${this.maskPhone(phone)}`);

    return {
      phoneMasked: this.maskPhone(phone),
      message: 'Doğrulama kodu gönderildi',
    };
  }

  /**
   * Adım 2: OTP doğrula (telefon-TCKN sahipliği), tekrar dedup kontrol et,
   * ardından kimlik + kredi değerlendirmesi yapıp başvuruyu kaydet.
   */
  async createApplication(
    tckn: string,
    phone: string,
    code: string,
    ipAddress: string,
  ): Promise<ApplicationResult> {
    if (!validateTckn(tckn)) {
      throw new BadRequestException('Geçersiz TCKN');
    }

    const maskedTckn = maskTckn(tckn);
    const phoneMasked = this.maskPhone(phone);
    const tcknHash = this.encryptionService.hash(tckn);
    const phoneHash = this.encryptionService.hash(phone);

    // Doğrulanmış cep tel + TCKN eşleşmesi: OTP'yi doğrula (kodu tüket).
    const otpId = await this.checkApplicationOtp(phone, code);

    // Kredi sorgusundan önce tekrar dedup (OTP adımıyla arada oluşmuş olabilir).
    await this.assertNoRecentApplication(tcknHash, phoneHash);

    // Kimlik (KPS) + kredi (KKB) değerlendirmesi
    const identityResult =
      await this.identityVerificationService.verifyIdentity(tckn);
    if (!identityResult.verified) {
      throw new BadRequestException('Kimlik doğrulaması başarısız');
    }
    const creditResult = await this.creditScoringService.evaluateCredit(tckn);

    // Atomik yazım: son dedup + OTP tüketimi + başvuru + audit aynı transaction'da
    const application = await this.prisma.$transaction(async (tx) => {
      const dup = await tx.application.findFirst({
        where: {
          createdAt: { gte: this.windowStart() },
          OR: [{ tcknHash }, { phoneHash }],
        },
        select: { id: true },
      });
      if (dup) {
        throw new BadRequestException(
          'Son 30 gün içinde bu telefon veya TCKN ile başvuru yapılmış.',
        );
      }

      await tx.otpCode.update({
        where: { id: otpId },
        data: { verifiedAt: new Date() },
      });

      const app = await tx.application.create({
        data: {
          tcknHash,
          tcknMasked: maskedTckn,
          phoneHash,
          phoneMasked,
          status: creditResult.approved ? 'APPROVED' : 'REJECTED',
          creditLimit: creditResult.approved ? creditResult.creditLimit : null,
          interestRate: creditResult.approved ? creditResult.interestRate : null,
          rejectionReason: creditResult.approved ? null : 'Kredi skoru yetersiz',
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
      rejectionReason: creditResult.approved ? undefined : 'Kredi skoru yetersiz',
      createdAt: application.createdAt.toISOString(),
    };
  }

  async findApplication(id: string): Promise<ApplicationResult> {
    const app = await this.prisma.application.findUnique({ where: { id } });

    if (!app) {
      throw new NotFoundException('Başvuru bulunamadı');
    }

    // Anonim sonuç yalnızca kısa bir süre UUID ile okunabilir — UUID sızsa bile
    // eski kredi kararları süresiz açıkta kalmasın.
    const ageMs = Date.now() - app.createdAt.getTime();
    if (ageMs > this.RESULT_TTL_HOURS * 60 * 60 * 1000) {
      throw new NotFoundException('Başvuru sonucu artık görüntülenemiyor');
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

  // ─── Private helpers ─────────────────────────────

  private windowStart(): Date {
    return new Date(Date.now() - this.DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  }

  /** 30 gün içinde aynı telefon veya TCKN ile başvuru varsa hata fırlat. */
  private async assertNoRecentApplication(
    tcknHash: string,
    phoneHash: string,
  ): Promise<void> {
    const existing = await this.prisma.application.findFirst({
      where: {
        createdAt: { gte: this.windowStart() },
        OR: [{ tcknHash }, { phoneHash }],
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(
        'Son 30 gün içinde bu telefon veya TCKN ile zaten başvuru yapılmış. Lütfen daha sonra tekrar deneyin.',
      );
    }
  }

  private async sendApplicationOtp(phone: string): Promise<void> {
    // TODO: SMS entegrasyonu tamamlanınca randomInt(100000, 999999) kullan
    const code = '111111';
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 dk

    // Aynı telefonun eski doğrulanmamış başvuru OTP'lerini iptal et
    await this.prisma.otpCode.updateMany({
      where: { phone, purpose: this.OTP_PURPOSE, verifiedAt: null },
      data: { expiresAt: new Date(0) },
    });

    await this.prisma.otpCode.create({
      data: { phone, code, purpose: this.OTP_PURPOSE, expiresAt },
    });

    await this.smsService.sendOtp(phone, code);
  }

  /**
   * OTP kodunu doğrular (timing-safe, deneme limitli). Henüz "verified"
   * işaretlemez — başarılı başvuru transaction'ında işaretlenir. OTP id döner.
   */
  private async checkApplicationOtp(
    phone: string,
    code: string,
  ): Promise<string> {
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        purpose: this.OTP_PURPOSE,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException(
        'Doğrulama kodu süresi dolmuş veya bulunamadı',
      );
    }
    if (otp.attempts >= otp.maxAttempts) {
      throw new BadRequestException('Maksimum deneme sayısına ulaşıldı');
    }
    if (
      !timingSafeEqual(
        Buffer.from(otp.code),
        Buffer.from(code.padEnd(otp.code.length)),
      )
    ) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Geçersiz doğrulama kodu');
    }

    return otp.id;
  }

  private maskPhone(phone: string): string {
    return phone.length > 4
      ? '*'.repeat(phone.length - 4) + phone.slice(-4)
      : '****';
  }
}
