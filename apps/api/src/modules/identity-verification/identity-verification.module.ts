import { Module } from '@nestjs/common';
import { IdentityVerificationService } from './identity-verification.service';
import { MockIdentityVerificationService } from './mock-identity-verification.service';

@Module({
  providers: [
    {
      provide: IdentityVerificationService,
      useClass: MockIdentityVerificationService,
    },
  ],
  exports: [IdentityVerificationService],
})
export class IdentityVerificationModule {}
