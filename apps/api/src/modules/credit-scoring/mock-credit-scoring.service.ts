import { Injectable } from '@nestjs/common';
import { CreditScoringService } from './credit-scoring.service';
import { CreditScoreResult } from './interfaces/credit-score-result.interface';

@Injectable()
export class MockCreditScoringService extends CreditScoringService {
  /**
   * Mock KKB scoring logic:
   * - First digit of TCKN is 1-4 → REJECTED
   * - First digit of TCKN is 5-9 → APPROVED
   *
   * This provides a simple, controllable mock that works with any valid TCKN.
   * Users can test both scenarios by choosing a TCKN starting with different digits.
   */
  async evaluateCredit(tckn: string): Promise<CreditScoreResult> {
    await this.simulateLatency();

    const firstDigit = parseInt(tckn[0], 10);
    const isApproved = firstDigit >= 5;
    const seedValue = firstDigit;

    if (isApproved) {
      return {
        score: 1200 + seedValue * 50,
        approved: true,
        creditLimit: 10000 + seedValue * 5000,
        interestRate: 2.99 - seedValue * 0.1,
        evaluatedAt: new Date(),
      };
    }

    return {
      score: 300 + seedValue * 30,
      approved: false,
      creditLimit: 0,
      interestRate: 0,
      evaluatedAt: new Date(),
    };
  }

  private simulateLatency(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, 200 + Math.random() * 300),
    );
  }
}
