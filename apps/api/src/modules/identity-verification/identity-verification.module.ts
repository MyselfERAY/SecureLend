import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdentityVerificationService } from './identity-verification.service';
import { MockIdentityVerificationService } from './mock-identity-verification.service';
import { NviIdentityVerificationService } from './nvi-identity-verification.service';

/**
 * Identity Verification Module (NVI entegrasyonu)
 *
 * NVI (Nüfus ve Vatandaşlık İşleri) KPSPublic servisini kullanır.
 * Public endpoint — herkese açık ama sadece TC+Ad+Soyad+DoğumYılı eşleşmesi kontrol eder.
 *
 * NVI_ENABLED=true ise gerçek NVI SOAP servisi, yoksa mock.
 *
 * NOT: Dışarı açık controller YOK. Bu servis sadece backend servisleri (AuthService, vb.)
 * tarafından çağrılır — TCKN fraud riskini önlemek için.
 */
@Module({
  providers: [
    {
      provide: IdentityVerificationService,
      useFactory: (config: ConfigService) => {
        const nviEnabled = config.get<string>('NVI_ENABLED', 'false') === 'true';
        return nviEnabled
          ? new NviIdentityVerificationService()
          : new MockIdentityVerificationService();
      },
      inject: [ConfigService],
    },
  ],
  exports: [IdentityVerificationService],
})
export class IdentityVerificationModule {}
