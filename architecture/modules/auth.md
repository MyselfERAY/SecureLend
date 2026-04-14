# Auth Module

## Sorumluluk
Telefon OTP ile kimlik doğrulama, JWT access/refresh token üretimi, kullanıcı kaydı, oturum yönetimi.

## Dosyalar
- `auth.service.ts` — register, login (OTP gönder), verifyOtp, refresh, logout
- `auth.controller.ts` — endpoint handler
- `dto/register.dto.ts` — RegisterDto: tckn, phone, fullName, dateOfBirth, consents
- `dto/login.dto.ts` — LoginDto: tckn, phone
- `dto/verify-otp.dto.ts` — VerifyOtpDto: phone, otpCode
- `dto/refresh-token.dto.ts` — RefreshTokenDto
- `guards/jwt-auth.guard.ts` — JWT doğrulama (global)
- `guards/roles.guard.ts` — Rol bazlı erişim (global)
- `decorators/public.decorator.ts` — @Public() ile JWT'yi atla
- `decorators/roles.decorator.ts` — @Roles() ile rol zorunlu kıl
- `interfaces/jwt-payload.interface.ts` — JWT payload tipi

## Endpoint'ler
- `POST /api/v1/auth/register` — Telefon kaydı (TCKN + rıza) [Public, 1/5sec throttle]
- `POST /api/v1/auth/login` — OTP gönder [Public, 1/5sec]
- `POST /api/v1/auth/verify-otp` — OTP doğrula, token üret [Public, 3/60sec]
- `POST /api/v1/auth/refresh` — Access token yenile [Public, 3/10sec]
- `POST /api/v1/auth/logout` — Refresh token iptal [Auth]

## Bağımlılıklar
- **İçeri:** IdentityVerificationModule (KPS), PromoModule (referral), PrismaService, EncryptionService, SmsService
- **Dışarı:** Tüm authenticated modüller JwtAuthGuard ve RolesGuard kullanır

## Kritik Kurallar
- TCKN asla plain text saklanmaz — TCKN_HASH_PEPPER ile hash'lenir
- JWT access token süresi 15 dakika
- Refresh token httpOnly cookie'de, 7 gün geçerli
- OTP 5 dakika geçerli, maksimum 3 deneme
- Register'da KVKK_AYDINLATMA ve KVKK_ACIK_RIZA rızası zorunlu
- Referral code desteği var (PromoModule ile)

## Son Değişiklik
[2026-04-10] Register endpoint'e phone alanı eklendi
