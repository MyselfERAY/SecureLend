import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KkbService } from './kkb.service';
import { MockKkbService } from './mock-kkb.service';

/**
 * KKB (Kredi Kayıt Bürosu) Modülü — Global
 *
 * Trafik: SecureLend → Banka Partneri → KKB
 * SecureLend KKB ile doğrudan iletişim KURMAZ.
 *
 * KKB_ENABLED=true ise gerçek banka entegrasyonu (henüz yok).
 * Yoksa MockKkbService kullanılır.
 */
@Global()
@Module({
  providers: [
    {
      provide: KkbService,
      useFactory: (config: ConfigService) => {
        const kkbEnabled = config.get<string>('KKB_ENABLED', 'false') === 'true';
        if (kkbEnabled) {
          // TODO: Gerçek banka entegrasyonu (örneğin Finansbank KKB API)
          // return new BankKkbService(...);
        }
        return new MockKkbService();
      },
      inject: [ConfigService],
    },
  ],
  exports: [KkbService],
})
export class KkbModule {}
