import { Injectable } from '@nestjs/common';
import { IdentityResult } from './interfaces/identity-result.interface';

@Injectable()
export abstract class IdentityVerificationService {
  abstract verifyIdentity(tckn: string): Promise<IdentityResult>;
  abstract verifyByTcknAndBirthYear(
    tckn: string,
    birthYear: number,
    firstName: string,
    lastName: string,
  ): Promise<IdentityResult>;
}
