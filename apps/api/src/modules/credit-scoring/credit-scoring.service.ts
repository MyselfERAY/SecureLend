import { Injectable } from '@nestjs/common';
import { CreditScoreResult } from './interfaces/credit-score-result.interface';

@Injectable()
export abstract class CreditScoringService {
  abstract evaluateCredit(tckn: string): Promise<CreditScoreResult>;
}
