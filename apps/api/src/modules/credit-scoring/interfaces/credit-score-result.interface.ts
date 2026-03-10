export interface CreditScoreResult {
  score: number;
  approved: boolean;
  creditLimit: number;
  interestRate: number;
  evaluatedAt: Date;
}
