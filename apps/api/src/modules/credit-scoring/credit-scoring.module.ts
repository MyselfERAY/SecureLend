import { Module } from '@nestjs/common';
import { CreditScoringService } from './credit-scoring.service';
import { MockCreditScoringService } from './mock-credit-scoring.service';

@Module({
  providers: [
    {
      provide: CreditScoringService,
      useClass: MockCreditScoringService,
    },
  ],
  exports: [CreditScoringService],
})
export class CreditScoringModule {}
