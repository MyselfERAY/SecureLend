import { Injectable, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserService } from '../user/user.service';
import { EncryptionService } from '../encryption/encryption.service';
import { NotificationService } from '../notification/sms.service';
import { IdentityVerificationService } from '../identity-verification/identity-verification.service';
import { AuthTokens } from './interfaces/auth-tokens.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly encryptionService: EncryptionService,
    private readonly notificationService: NotificationService,
    private readonly identityVerificationService: IdentityVerificationService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    try {
      const { fullName, nationalId, phoneNumber } = registerDto;

      // TCKN formatını kontrol et
      if (!this.validateTCKN(nationalId)) {
        throw new BadRequestException('Geçersiz T.C. Kimlik Numarası formatı');
      }

      // Telefon numarası formatını kontrol et
      if (!this.validatePhoneNumber(phoneNumber)) {
        throw new BadRequestException('Geçersiz telefon numarası formatı');
      }

      // Mevcut kullanıcı kontrolü
      const existingUserByNationalId = await this.userService.findByNationalId(nationalId);
      if (existingUserByNationalId) {
        throw new ConflictException('Bu T.C. Kimlik Numarası ile kayıtlı kullanıcı zaten mevcut');
      }

      const existingUserByPhone = await this.userService.findByPhoneNumber(phoneNumber);
      if (existingUserByPhone) {
        throw new ConflictException('Bu telefon numarası ile kayıtlı kullanıcı zaten mevcut');
      }

      // Kimlik doğrulama
      const identityResult = await this.identityVerificationService.verifyIdentity({
        nationalId,
        fullName,
      });

      if (!identityResult.isValid) {
        throw new BadRequestException('Kimlik bilgileri doğrulanamadı');
      }

      // Kullanıcı oluştur
      const user = await this.userService.create({
        fullName,
        nationalId,
        phoneNumber,
        isVerified: false,
      });

      // OTP gönder
      const otpResult = await this.notificationService.sendOtp(phoneNumber);
      if (!otpResult.success) {
        // Kullanıcı oluşturuldu ama OTP gönderilemedi, kullanıcıyı sil
        await this.userService.delete(user.id);
        throw new InternalServerErrorException('OTP gönderilemedi, lütfen tekrar deneyin');
      }

      return {
        message: 'Kayıt işlemi başarılı. Telefon numaranıza gönderilen doğrulama kodunu girin.',
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Register error:', error);
      throw new InternalServerErrorException('Kayıt işlemi sırasında bir hata oluştu');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthTokens> {
    try {
      const { phoneNumber } = loginDto;

      const user = await this.userService.findByPhoneNumber(phoneNumber);
      if (!user) {
        throw new BadRequestException('Bu telefon numarası ile kayıtlı kullanıcı bulunamadı');
      }

      if (!user.isVerified) {
        throw new BadRequestException('Hesabınız henüz doğrulanmamış');
      }

      // OTP gönder
      const otpResult = await this.notificationService.sendOtp(phoneNumber);
      if (!otpResult.success) {
        throw new InternalServerErrorException('OTP gönderilemedi');
      }

      return {
        message: 'Telefon numaranıza doğrulama kodu gönderildi',
      } as any;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Login error:', error);
      throw new InternalServerErrorException('Giriş işlemi sırasında bir hata oluştu');
    }
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<AuthTokens> {
    try {
      const { phoneNumber, otp } = verifyOtpDto;

      const user = await this.userService.findByPhoneNumber(phoneNumber);
      if (!user) {
        throw new BadRequestException('Kullanıcı bulunamadı');
      }

      // OTP doğrula
      const isOtpValid = await this.notificationService.verifyOtp(phoneNumber, otp);
      if (!isOtpValid) {
        throw new BadRequestException('Geçersiz doğrulama kodu');
      }

      // Kullanıcıyı doğrulanmış olarak işaretle
      if (!user.isVerified) {
        await this.userService.updateVerificationStatus(user.id, true);
      }

      // JWT tokenları oluştur
      const payload: JwtPayload = {
        userId: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          isVerified: true,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Verify OTP error:', error);
      throw new InternalServerErrorException('OTP doğrulama sırasında bir hata oluştu');
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      const { refreshToken } = refreshTokenDto;

      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findById(payload.userId);
      
      if (!user) {
        throw new BadRequestException('Geçersiz token');
      }

      const newPayload: JwtPayload = {
        userId: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          isVerified: user.isVerified,
        },
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      throw new BadRequestException('Token yenileme başarısız');
    }
  }

  private validateTCKN(tckn: string): boolean {
    // TCKN 11 haneli olmalı
    if (tckn.length !== 11) return false;
    
    // Tümü rakam olmalı
    if (!/^\d{11}$/.test(tckn)) return false;
    
    // İlk hane 0 olamaz
    if (tckn[0] === '0') return false;
    
    // TCKN algoritması
    const digits = tckn.split('').map(Number);
    const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
    const check1 = (sum1 * 7 - sum2) % 10;
    const check2 = (sum1 + sum2 + digits[9]) % 10;
    
    return digits[9] === check1 && digits[10] === check2;
  }

  private validatePhoneNumber(phone: string): boolean {
    // +90 ile başlayan 14 haneli format veya 0 ile başlayan 11 haneli format
    const phoneRegex = /^(\+90|0)?5\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }
}