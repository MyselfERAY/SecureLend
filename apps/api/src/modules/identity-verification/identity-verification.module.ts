import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdentityVerificationService } from './identity-verification.service';
import { MockIdentityVerificationService } from './mock-identity-verification.service';
import { NviIdentityVerificationService } from './nvi-identity-verification.service';
import { IdentityVerificationController } from './identity-verification.controller';

@Module({
  controllers: [IdentityVerificationController],
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
