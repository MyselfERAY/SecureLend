import { Injectable } from '@nestjs/common';
import { IdentityVerificationService } from './identity-verification.service';
import { IdentityResult } from './interfaces/identity-result.interface';

@Injectable()
export class MockIdentityVerificationService extends IdentityVerificationService {
  async verifyIdentity(tckn: string): Promise<IdentityResult> {
    await this.simulateLatency();

    // Mock: all valid TCKNs pass identity verification
    return {
      verified: true,
      fullName: 'Test Kullanici',
      verifiedAt: new Date(),
    };
  }

  private simulateLatency(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, 150 + Math.random() * 200),
    );
  }
}
