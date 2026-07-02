import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { randomBytes, randomInt, timingSafeEqual } from 'crypto';
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
  /** OtpCode.purpose VarChar(50) — "APP:" + 40 hex = 44 char sığar */
  private readonly OTP_PURPOSE_PREFIX = 'APP';

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
      await this.ensureColumn('applications', 'result_token', 'VARCHAR(64)');
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

    await this.sendApplicationOtp(phone, tcknHash);
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
    // Sonuç sayfasını UUID sızıntısına karşı korur: sonucu okumak için bu rastgele
    // token gerekir (yalnızca başvuruyu yapan istemciye döner).
    const resultToken = randomBytes(24).toString('hex'); // 48 hex karakter

    // Doğrulanmış cep tel + TCKN eşleşmesi: OTP telefon+TCKN'ye bağlı doğrulanır.
    const otpId = await this.checkApplicationOtp(phone, code, tcknHash);

    // Atomik tek-kullanım claim: OTP'yi kredi sorgusundan ÖNCE tüket. Eşzamanlı
    // ikinci istek count=0 alır → çift kredi sorgusu/çift kayıt engellenir (race).
    const claim = await this.prisma.otpCode.updateMany({
      where: { id: otpId, verifiedAt: null },
      data: { verifiedAt: new Date() },
    });
    if (claim.count === 0) {
      throw new BadRequestException('Doğrulama kodu zaten kullanılmış');
    }

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

      // OTP yukarıda atomik olarak claim edildi (verifiedAt set) — burada tekrar yok.
      const app = await tx.application.create({
        data: {
          tcknHash,
          tcknMasked: maskedTckn,
          phoneHash,
          phoneMasked,
          resultToken,
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
      resultToken,
    };
  }

  async findApplication(id: string, token?: string): Promise<ApplicationResult> {
    const app = await this.prisma.application.findUnique({ where: { id } });

    if (!app) {
      throw new NotFoundException('Başvuru bulunamadı');
    }

    // IDOR koruması: sonucu okumak için oluşturma anında verilen result token gerekir.
    // UUID sızsa bile (referrer/log) token olmadan kredi kararı görüntülenemez.
    // Sabit-zaman karşılaştırma (uzunluk eşitse) — token yoksa/eşleşmezse 404.
    const expected = app.resultToken ?? '';
    const provided = token ?? '';
    const tokenOk =
      expected.length > 0 &&
      expected.length === provided.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
    if (!tokenOk) {
      throw new NotFoundException('Başvuru bulunamadı');
    }

    // Anonim sonuç yalnızca kısa bir süre okunabilir — token sızsa bile
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

  /**
   * OTP'yi hem telefona hem TCKN'ye bağlar (purpose alanına gömülü, VarChar(50)
   * sınırına sığacak şekilde tcknHash'in ilk 40 hex'i). Böylece bir telefon için
   * alınan OTP, başka bir TCKN ile /create'te kullanılamaz.
   */
  private otpPurpose(tcknHash: string): string {
    return `${this.OTP_PURPOSE_PREFIX}:${tcknHash.slice(0, 40)}`;
  }

  private async sendApplicationOtp(
    phone: string,
    tcknHash: string,
  ): Promise<void> {
    const purpose = this.otpPurpose(tcknHash);

    // Hâlâ geçerli, doğrulanmamış bir OTP varsa: deneme sayacını SIFIRLAMA
    // (re-issue ile lockout bypass'ı engelle), aynı kodu yeniden gönder.
    const existing = await this.prisma.otpCode.findFirst({
      where: { phone, purpose, verifiedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      if (existing.attempts >= existing.maxAttempts) {
        throw new BadRequestException(
          'Çok fazla hatalı deneme yapıldı. Lütfen daha sonra tekrar deneyin.',
        );
      }
      await this.smsService.sendOtp(phone, existing.code);
      return;
    }

    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 dk
    await this.prisma.otpCode.create({
      data: { phone, code, purpose, expiresAt },
    });
    await this.smsService.sendOtp(phone, code);
  }

  /**
   * OTP kodunu doğrular (timing-safe, deneme limitli, telefon+TCKN'ye bağlı).
   * Henüz "verified" işaretlemez — çağıran atomik claim ile tüketir. OTP id döner.
   */
  private async checkApplicationOtp(
    phone: string,
    code: string,
    tcknHash: string,
  ): Promise<string> {
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        purpose: this.otpPurpose(tcknHash),
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

    // Length-safe sabit-zaman karşılaştırma (padEnd kaldırıldı — RangeError riski yok)
    const expected = Buffer.from(otp.code);
    const provided = Buffer.from(code);
    const ok =
      expected.length === provided.length &&
      timingSafeEqual(expected, provided);
    if (!ok) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Geçersiz doğrulama kodu');
    }

    return otp.id;
  }

  /**
   * Kriptografik güvenli 6 haneli OTP. Production'da her zaman rastgele; sadece
   * production DIŞINDA ve OTP_TEST_CODE set edilmişse sabit test kodunu döner.
   */
  private generateOtpCode(): string {
    const testCode = process.env.OTP_TEST_CODE;
    if (testCode && process.env.NODE_ENV !== 'production') {
      return testCode;
    }
    return randomInt(100000, 1000000).toString();
  }

  private maskPhone(phone: string): string {
    return phone.length > 4
      ? '*'.repeat(phone.length - 4) + phone.slice(-4)
      : '****';
  }
}
