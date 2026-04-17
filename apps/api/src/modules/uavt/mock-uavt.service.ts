import { Injectable, Logger } from '@nestjs/common';
import { UavtLookupResult, UavtOwnershipResult, UavtService } from './uavt.service';

/**
 * Mock UAVT Service — development/staging için.
 *
 * Test kuralları:
 * - UAVT kodu: 10 rakam olmalı
 * - Son rakam 0 ise "geçersiz adres" (test)
 * - Son rakam 9 ise "sahiplik eşleşmiyor" (test)
 * - Diğer durumlarda geçerli + eşleşiyor
 */
@Injectable()
export class MockUavtService extends UavtService {
  private readonly logger = new Logger(MockUavtService.name);

  async lookupAddress(uavtCode: string): Promise<UavtLookupResult> {
    await this.simulateLatency();

    const clean = uavtCode.replace(/\D/g, '');
    if (!/^\d{10}$/.test(clean)) {
      return {
        valid: false,
        queriedAt: new Date(),
        reason: 'Gecersiz UAVT formati (10 rakam olmali)',
      };
    }

    if (clean.endsWith('0')) {
      return {
        valid: false,
        queriedAt: new Date(),
        reason: 'UAVT kodu bulunamadi',
      };
    }

    // Mock address
    return {
      valid: true,
      address: {
        city: 'Istanbul',
        district: 'Kadikoy',
        neighborhood: 'Caferaga',
        street: 'Moda Cad.',
        buildingNo: '12',
        apartmentNo: '4',
        postalCode: '34710',
      },
      queriedAt: new Date(),
    };
  }

  async verifyOwnership(tckn: string, uavtCode: string): Promise<UavtOwnershipResult> {
    await this.simulateLatency();

    if (!/^\d{11}$/.test(tckn)) {
      return {
        ownershipMatched: false,
        queriedAt: new Date(),
        reason: 'Gecersiz TCKN formati',
      };
    }
    const clean = uavtCode.replace(/\D/g, '');
    if (!/^\d{10}$/.test(clean)) {
      return {
        ownershipMatched: false,
        queriedAt: new Date(),
        reason: 'Gecersiz UAVT formati',
      };
    }

    if (clean.endsWith('9')) {
      this.logger.debug(`Mock UAVT: TCKN ${tckn.slice(0, 3)}... does not own UAVT ${clean}`);
      return {
        ownershipMatched: false,
        queriedAt: new Date(),
        reason: 'Tapu kaydinda bu TCKN mulkun sahibi olarak gorulmuyor',
      };
    }

    return { ownershipMatched: true, queriedAt: new Date() };
  }

  private simulateLatency(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, 150 + Math.random() * 200),
    );
  }
}
