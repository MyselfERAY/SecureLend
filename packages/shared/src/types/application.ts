export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface ApplicationResult {
  applicationId: string;
  status: ApplicationStatus;
  maskedTckn: string;
  creditLimit?: number;
  interestRate?: number;
  rejectionReason?: string;
  createdAt: string;
}
