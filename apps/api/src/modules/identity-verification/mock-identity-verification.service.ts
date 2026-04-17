import { Injectable } from '@nestjs/common';
import { IdentityVerificationService } from './identity-verification.service';
import { IdentityResult } from './interfaces/identity-result.interface';

@Injectable()
export class MockIdentityVerificationService extends IdentityVerificationService {
  async verifyIdentity(tckn: string): Promise<IdentityResult> {
    await this.simulateLatency();
    return {
      verified: true,
      fullName: 'Test Kullanici',
      verifiedAt: new Date(),
    };
  }

  async verifyByTcknAndBirthYear(
    tckn: string,
    birthYear: number,
    firstName: string,
    lastName: string,
  ): Promise<IdentityResult> {
    await this.simulateLatency();
    const isValid =
      /^\d{11}$/.test(tckn) && birthYear >= 1900 && birthYear <= 2010;
    return {
      verified: isValid,
      fullName: isValid ? `${firstName} ${lastName}` : undefined,
      verifiedAt: new Date(),
    };
  }

  private simulateLatency(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, 150 + Math.random() * 200),
    );
  }
}
