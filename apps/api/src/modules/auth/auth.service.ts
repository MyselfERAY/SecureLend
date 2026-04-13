import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID, randomInt, createHmac, timingSafeEqual, randomBytes } from 'crypto';
import { maskTckn, validateTckn } from '@securelend/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { IdentityVerificationService } from '../identity-verification/identity-verification.service';
import { SmsService } from '../notification/sms.service';
import { PromoService } from '../promo/promo.service';
import { ConsentType } from '@prisma/client';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthTokens } from './interfaces/auth-tokens.interface';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly identityService: IdentityVerificationService,
    private readonly smsService: SmsService,
    private readonly promoService: PromoService,
  ) {
    this.refreshSecret = this.configService.getOrThrow<string>('JWT_SECRET');
  }

  async onModuleInit() {
    try {
      // Ensure referral_code column exists on users table
      const colCheck = await this.prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'referral_code'
        ) as exists`;

      if (!colCheck[0]?.exists) {
        this.logger.warn('referral_code column missing on users — adding via raw SQL...');
        await this.prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN "referral_code" VARCHAR(10) UNIQUE;`);
        this.logger.log('referral_code column added successfully');
      }

      // Ensure newsletter_subscribers table exists
      const nlCheck = await this.prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'newsletter_subscribers'
        ) as exists`;

      if (!nlCheck[0]?.exists) {
        this.logger.warn('newsletter_subscribers table missing — will be created by NewsletterService');
      }
    } catch (err) {
      this.logger.error(`Auth onModuleInit failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  async register(
    tckn: string,
    phone: string,
    fullName: string,
    dateOfBirth: string,
    ipAddress: string,
    consents?: { type: ConsentType; version: string }[],
    userAgent?: string,
    referralCode?: string,
  ) {
    if (!validateTckn(tckn)) {
      throw new BadRequestException('Gecersiz TCKN');
    }

    const maskedTckn = maskTckn(tckn);
    const tcknHash = this.encryptionService.hash(tckn);

    // Check duplicate
    const existing = await this.prisma.user.findUnique({
      where: { tcknHash },
    });
    if (existing) {
      throw new ConflictException('Bu TCKN ile kayitli bir kullanici mevcut');
    }

    // KPS identity verification
    const identity = await this.identityService.verifyIdentity(tckn);
    if (!identity.verified) {
      throw new BadRequestException('Kimlik dogrulamasi basarisiz');
    }

    // Validate referrer if referral code provided
    let referrer: { id: string } | null = null;
    if (referralCode) {
      referrer = await this.prisma.user.findUnique({
        where: { referralCode },
        select: { id: true },
      });
      if (!referrer) {
        this.logger.warn(`Invalid referral code used: ${referralCode}`);
        // Don't block registration for invalid referral code
      }
    }

    // Generate unique referral code for new user
    const newReferralCode = await this.generateReferralCode();

    // Create user
    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          tcknHash,
          tcknMasked: maskedTckn,
          fullName,
          phone,
          dateOfBirth: new Date(dateOfBirth),
          kpsVerified: true,
          referralCode: newReferralCode,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: u.id,
          action: 'USER_REGISTERED',
          entityType: 'User',
          entityId: u.id,
          tcknMasked: maskedTckn,
          ipAddress: this.safeIp(ipAddress),
        },
      });

      // Record KVKK consents if provided
      if (consents && consents.length > 0) {
        for (const consent of consents) {
          await tx.consent.create({
            data: {
              userId: u.id,
              type: consent.type,
              version: consent.version,
              accepted: true,
              ipAddress: this.safeIp(ipAddress),
              userAgent: this.safeUserAgent(userAgent),
            },
          });
        }
      }

      return u;
    });

    this.logger.log(`User registered: ${user.id} (${maskedTckn})`);

    // Apply auto promos (e.g. first 3 months free)
    try {
      await this.promoService.applyAutoPromos(user.id);
    } catch (err) {
      this.logger.error(`Auto-promo failed for ${user.id}: ${err instanceof Error ? err.message : err}`);
    }

    // Apply referral bonus for both parties
    if (referrer) {
      try {
        await this.promoService.applyReferralBonus(user.id, referrer.id);
        this.logger.log(`Referral bonus applied: referrer=${referrer.id}, referred=${user.id}`);
      } catch (err) {
        this.logger.error(`Referral bonus failed: ${err instanceof Error ? err.message : err}`);
      }
    }

    // Send OTP
    await this.sendOtp(phone, user.id, 'REGISTER');

    return { userId: user.id, maskedTckn, phone: this.maskPhone(phone) };
  }

  async login(tckn: string, phone: string, ipAddress?: string) {
    if (!validateTckn(tckn)) {
      throw new BadRequestException('Gecersiz TCKN');
    }

    const tcknHash = this.encryptionService.hash(tckn);
    const user = await this.prisma.user.findUnique({ where: { tcknHash } });

    if (!user || user.phone !== phone || !user.isActive) {
      // Log failed login attempt
      await this.prisma.auditLog.create({
        data: {
          userId: user?.id,
          action: 'LOGIN_FAILED',
          entityType: 'User',
          entityId: user?.id,
          ipAddress: this.safeIp(ipAddress),
          tcknMasked: user ? user.tcknMasked : maskTckn(tckn),
        },
      });
      throw new UnauthorizedException('TCKN veya telefon numarasi hatali');
    }

    await this.sendOtp(phone, user.id, 'LOGIN');

    return { userId: user.id, phone: this.maskPhone(phone) };
  }

  async verifyOtp(
    phone: string,
    code: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthTokens> {
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('OTP suresi dolmus veya bulunamadi');
    }

    if (otp.attempts >= otp.maxAttempts) {
      throw new BadRequestException('Maksimum deneme sayisina ulasildi');
    }

    if (!timingSafeEqual(Buffer.from(otp.code), Buffer.from(code.padEnd(otp.code.length)))) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Gecersiz OTP kodu');
    }

    // Mark OTP as verified + update user
    const user = await this.prisma.$transaction(async (tx) => {
      await tx.otpCode.update({
        where: { id: otp.id },
        data: { verifiedAt: new Date() },
      });

      const u = await tx.user.update({
        where: { id: otp.userId! },
        data: {
          phoneVerified: true,
          lastLoginAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: u.id,
          action: otp.purpose === 'REGISTER' ? 'OTP_VERIFIED_REGISTER' : 'USER_LOGIN',
          entityType: 'User',
          entityId: u.id,
          ipAddress: this.safeIp(ipAddress),
        },
      });

      return u;
    });

    return this.generateTokens(user.id, user.roles, maskTckn(user.tcknMasked), ipAddress, userAgent);
  }

  async refreshTokens(
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthTokens> {
    const tokenHash = this.hashRefreshToken(refreshToken);

    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Gecersiz veya suresi dolmus token');
    }

    // Revoke old, issue new (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(
      stored.user.id,
      stored.user.roles,
      stored.user.tcknMasked,
      ipAddress,
      userAgent,
    );
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ─── Private helpers ─────────────────────────────

  private async sendOtp(phone: string, userId: string, purpose: string) {
    // TODO: SMS entegrasyonu tamamlaninca randomInt(100000, 999999) kullan
    const code = '111111';
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    // Eski doğrulanmamış OTP'leri iptal et (race condition önlemi)
    await this.prisma.otpCode.updateMany({
      where: { phone, verifiedAt: null },
      data: { expiresAt: new Date(0) },
    });

    await this.prisma.otpCode.create({
      data: { userId, phone, code, purpose, expiresAt },
    });

    await this.smsService.sendOtp(phone, code);
  }

  /** DB kolon limitlerini aşan değerleri truncate et */
  private safeIp(ip?: string): string {
    return (ip || 'unknown').substring(0, 45);
  }
  private safeUserAgent(ua?: string): string {
    return (ua || '').substring(0, 500);
  }

  private async generateTokens(
    userId: string,
    roles: string[],
    tcknMasked: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: userId,
      roles,
      tcknMasked,
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate opaque refresh token
    const refreshToken = randomUUID();
    const tokenHash = this.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt, ipAddress: this.safeIp(ipAddress), userAgent: this.safeUserAgent(userAgent) },
    });

    return { accessToken, refreshToken, expiresIn: 900 }; // 15 min
  }

  private hashRefreshToken(token: string): string {
    return createHmac('sha256', this.refreshSecret).update(token).digest('hex');
  }

  private maskPhone(phone: string): string {
    if (phone.length < 4) return '****';
    return `****${phone.slice(-4)}`;
  }

  private async generateReferralCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
    for (let attempt = 0; attempt < 10; attempt++) {
      const bytes = randomBytes(8);
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars[bytes[i] % chars.length];
      }
      const exists = await this.prisma.user.findUnique({ where: { referralCode: code } });
      if (!exists) return code;
    }
    // Fallback: longer code
    return randomBytes(6).toString('hex').toUpperCase().slice(0, 10);
  }
}
