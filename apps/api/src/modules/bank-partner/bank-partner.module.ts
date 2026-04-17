import { Global, Module } from '@nestjs/common';
import { KkbService } from './kkb.service';
import { UavtService } from './uavt.service';

/**
 * Banka partneri entegrasyonu — KKB (kredi bürosu) + UAVT (adres/tapu) mock'ları.
 *
 * SecureLend bu servislere doğrudan erişmez; gerçek entegrasyonda tüm sorgular
 * banka partneri üzerinden çalışır. Şu an mock modunda.
 */
@Global()
@Module({
  providers: [KkbService, UavtService],
  exports: [KkbService, UavtService],
})
export class BankPartnerModule {}
