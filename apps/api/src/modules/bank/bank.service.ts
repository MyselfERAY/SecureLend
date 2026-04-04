import { Injectable } from '@nestjs/common';
import { ApplyKmhDto } from './dto/apply-kmh.dto';

export interface KmhApplicationResult {
  applicationId: string;
  status: 'APPROVED' | 'REJECTED';
  creditScore: number;
  creditScoreLabel: string;
  approvedLimit?: number;
  interestRate?: number;
  monthlyInstallment?: number;
  debtToIncomeRatio: number;
  evaluationFactors: { name: string; impact: string; detail: string }[];
  rejectionReason?: string;
  bankReferenceNo: string;
  existingCustomer: boolean;
}

export interface OnboardingResult {
  accountId: string;
  accountNumber: string;
  creditLimit: number;
}

export interface ContractNotificationResult {
  paymentOrderId: string;
  kmhAccountNumber: string;
  kmhLimit: number;
  message: string;
}

export interface TransferResult {
  transactionId: string;
  referenceNo: string;
  status: string;
  processedAt: string;
}

export interface AccountBalance {
  accountId: string;
  accountNumber: string;
  balance: number;
  availableBalance: number;
  creditLimit?: number;
  currency: string;
  contractId?: string;
  propertyTitle?: string;
}

@Injectable()
export abstract class BankService {
  // KMH Application Flow
  abstract applyForKmh(userId: string, dto: ApplyKmhDto): Promise<KmhApplicationResult>;
  abstract completeOnboarding(kmhApplicationId: string, userId: string): Promise<OnboardingResult>;
  abstract notifyContractSigned(contractId: string, kmhAccountId?: string): Promise<ContractNotificationResult>;

  // Offer & KYC flow
  abstract acceptOffer(applicationId: string, userId: string): Promise<any>;
  abstract startKyc(applicationId: string, userId: string): Promise<any>;
  abstract verifyId(applicationId: string, userId: string): Promise<any>;
  abstract verifySelfie(applicationId: string, userId: string): Promise<any>;
  abstract completeVideoCall(applicationId: string, userId: string): Promise<any>;
  abstract signAgreements(applicationId: string, userId: string): Promise<any>;
  abstract getKycStatus(applicationId: string, userId: string): Promise<any>;

  // Account queries
  abstract getBalance(accountId: string): Promise<AccountBalance>;
  abstract getAccountsByUser(userId: string): Promise<AccountBalance[]>;

  // Transfer (used internally for payment processing)
  abstract transfer(
    fromAccountId: string,
    toIban: string,
    amount: number,
    description: string,
    paymentScheduleId?: string,
  ): Promise<TransferResult>;
}
