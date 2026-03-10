import { Module } from '@nestjs/common';
import { CreditScoringModule } from '../credit-scoring/credit-scoring.module';
import { IdentityVerificationModule } from '../identity-verification/identity-verification.module';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { ApplicationRepository } from './application.repository';
import { PrismaApplicationRepository } from './prisma-application.repository';

@Module({
  imports: [CreditScoringModule, IdentityVerificationModule],
  controllers: [ApplicationController],
  providers: [
    ApplicationService,
    {
      provide: ApplicationRepository,
      useClass: PrismaApplicationRepository,
    },
  ],
})
export class ApplicationModule {}
