import { Injectable, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, VerifyOtpDto } from './dto';
import { AuthTokens } from './interfaces/auth-tokens.interface';
import { EncryptionService } from '../encryption/encryption.service';
import { NotificationService } from '../notification/notification.module';
import { SmsService } from '../notification/sms.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private encryptionService: EncryptionService,
    private smsService: SmsService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string; userId: string }> {
    try {
      // TCKN doğrulama
      if (!this.validateTCKN(dto.tckn)) {
        throw new BadRequestException('Geçersiz TCKN formatı');
      }

      // Telefon numarası formatı kontrolü
      if (!this.validatePhoneNumber(dto.phone)) {
        throw new BadRequestException('Geçersiz telefon numarası formatı');
      }

      // Ad Soyad kontrolü
      if (!dto.fullName || dto.fullName.trim().length < 3) {
        throw new BadRequestException('Ad Soyad en az 3 karakter olmalıdır');
      }

      // Mevcut kullanıcı kontrolü
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { tckn: dto.tckn },
            { phone: dto.phone }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.tckn === dto.tckn) {
          throw new ConflictException('Bu TCKN ile zaten kayıtlı bir kullanıcı bulunmaktadır');
        }
        if (existingUser.phone === dto.phone) {
          throw new ConflictException('Bu telefon numarası ile zaten kayıtlı bir kullanıcı bulunmaktadır');
        }
      }

      // TCKN şifrele
      const encryptedTckn = await this.encryptionService.encrypt(dto.tckn);
      
      // OTP oluştur
      const otp = this.generateOtp();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 dakika

      // Kullanıcı oluştur
      const user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName.trim(),
          tckn: encryptedTckn,
          phone: dto.phone,
          otp,
          otpExpiry,
          isVerified: false,
        }
      });

      // OTP gönder
      try {
        await this.smsService.sendOtp(dto.phone, otp);
      } catch (smsError) {
        // SMS gönderimi başarısız olursa kullanıcıyı sil
        await this.prisma.user.delete({ where: { id: user.id } });
        throw new InternalServerErrorException('OTP gönderiminde hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }

      return {
        message: 'Kayıt başarılı. Telefonunuza gönderilen OTP kodunu girin.',
        userId: user.id
      };

    } catch (error) {
      // Eğer hata zaten bizim fırlattığımız bir hata ise, olduğu gibi fırlat
      if (error instanceof ConflictException || 
          error instanceof BadRequestException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }

      // Beklenmeyen hatalar için genel hata mesajı
      console.error('Register error:', error);
      throw new InternalServerErrorException('Kayıt işlemi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone }
    });

    if (!user || !user.isVerified) {
      throw new BadRequestException('Geçersiz telefon numarası veya henüz doğrulanmamış hesap');
    }

    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry }
    });

    await this.smsService.sendOtp(dto.phone, otp);

    return {
      message: 'OTP kodu telefonunuza gönderildi',
      userId: user.id
    } as any;
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId }
    });

    if (!user) {
      throw new BadRequestException('Kullanıcı bulunamadı');
    }

    if (user.otp !== dto.otp) {
      throw new BadRequestException('Geçersiz OTP kodu');
    }

    if (user.otpExpiry < new Date()) {
      throw new BadRequestException('OTP kodunun süresi dolmuş');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null
      }
    });

    const payload = { sub: user.id, phone: user.phone };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        isVerified: user.isVerified
      }
    };
  }

  private validateTCKN(tckn: string): boolean {
    if (!tckn || tckn.length !== 11) return false;
    
    const digits = tckn.split('').map(Number);
    if (digits.some(isNaN)) return false;
    if (digits[0] === 0) return false;
    
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    
    const tenthDigit = ((oddSum * 7) - evenSum) % 10;
    const eleventhDigit = (oddSum + evenSum + tenthDigit) % 10;
    
    return digits[9] === tenthDigit && digits[10] === eleventhDigit;
  }

  private validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+90[0-9]{10}$/;
    return phoneRegex.test(phone);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}