import { Injectable } from '@nestjs/common';
import { Application } from '@prisma/client';

export interface CreateApplicationData {
  tcknHash: string;
  tcknMasked: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  creditLimit?: number | null;
  interestRate?: number | null;
  rejectionReason?: string | null;
  kkbScore?: number | null;
  kpsVerified: boolean;
  ipAddress?: string | null;
}

@Injectable()
export abstract class ApplicationRepository {
  abstract create(data: CreateApplicationData): Promise<Application>;
  abstract findById(id: string): Promise<Application | null>;
  abstract findByTcknHash(tcknHash: string): Promise<Application[]>;
}
