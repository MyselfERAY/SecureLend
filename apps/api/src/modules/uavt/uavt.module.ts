import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UavtService } from './uavt.service';
import { MockUavtService } from './mock-uavt.service';

/**
 * UAVT Modülü — Global
 *
 * Trafik: SecureLend → Banka/Resmi API → UAVT + Tapu kadastro
 */
@Global()
@Module({
  providers: [
    {
      provide: UavtService,
      useFactory: (config: ConfigService) => {
        const uavtEnabled = config.get<string>('UAVT_ENABLED', 'false') === 'true';
        if (uavtEnabled) {
          // TODO: Gerçek UAVT entegrasyonu (banka partneri üzerinden)
        }
        return new MockUavtService();
      },
      inject: [ConfigService],
    },
  ],
  exports: [UavtService],
})
export class UavtModule {}
