import { Injectable } from '@nestjs/common';
import { IdentityResult } from './interfaces/identity-result.interface';

@Injectable()
export abstract class IdentityVerificationService {
  abstract verifyIdentity(tckn: string): Promise<IdentityResult>;
}
