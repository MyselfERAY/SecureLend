import { Injectable, Logger } from '@nestjs/common';
import { KkbMatchResult, KkbService } from './kkb.service';

/**
 * Mock KKB Servisi — gerçek banka/KKB entegrasyonu yapılana kadar
 * development + staging için kullanılır.
 *
 * Kurallar (deterministic — test'lerde kullanılabilir):
 * - TCKN son rakamı 0 ise eşleşmez (test hesapları için)
 * - Geçerli TCKN (11 rakam) + geçerli phone (10 rakam, 5 ile başlar) → eşleşir
 * - Geçerli TCKN + geçerli IBAN (TR + 24 rakam) → eşleşir
 * - Diğer durumlarda eşleşmez
 */
@Injectable()
export class MockKkbService extends KkbService {
  private readonly logger = new Logger(MockKkbService.name);

  async verifyPhoneTcknMatch(tckn: string, phone: string): Promise<KkbMatchResult> {
    await this.simulateLatency();

    if (!/^\d{11}$/.test(tckn)) {
      return { matched: false, queriedAt: new Date(), reason: 'Gecersiz TCKN formati' };
    }
    if (!/^5\d{9}$/.test(phone)) {
      return { matched: false, queriedAt: new Date(), reason: 'Gecersiz telefon formati' };
    }

    // Test accounts: TCKN son rakamı 0 ise eşleşme başarısız
    if (tckn.endsWith('0')) {
      this.logger.debug(`Mock KKB: TCKN ${tckn.slice(0, 3)}... → phone mismatch (test rule)`);
      return { matched: false, queriedAt: new Date(), reason: 'Telefon TCKN ile eslesmiyor' };
    }

    return { matched: true, queriedAt: new Date() };
  }

  async verifyIbanTcknMatch(tckn: string, iban: string): Promise<KkbMatchResult> {
    await this.simulateLatency();

    if (!/^\d{11}$/.test(tckn)) {
      return { matched: false, queriedAt: new Date(), reason: 'Gecersiz TCKN formati' };
    }
    const cleanedIban = iban.replace(/\s/g, '').toUpperCase();
    if (!/^TR\d{24}$/.test(cleanedIban)) {
      return { matched: false, queriedAt: new Date(), reason: 'Gecersiz IBAN formati' };
    }

    // Test accounts: TCKN son rakamı 0 ise eşleşme başarısız
    if (tckn.endsWith('0')) {
      this.logger.debug(`Mock KKB: TCKN ${tckn.slice(0, 3)}... → IBAN mismatch (test rule)`);
      return { matched: false, queriedAt: new Date(), reason: 'IBAN TCKN ile eslesmiyor' };
    }

    return { matched: true, queriedAt: new Date() };
  }

  private simulateLatency(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 150),
    );
  }
}
