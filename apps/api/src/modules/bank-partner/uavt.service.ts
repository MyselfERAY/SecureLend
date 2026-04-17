import { Injectable, Logger } from '@nestjs/common';

export interface UavtVerifyResult {
  verified: boolean;
  reason?: string;
  checkedAt: Date;
}

export interface OwnershipVerifyResult {
  verified: boolean;
  reason?: string;
  checkedAt: Date;
}

/**
 * UAVT (Ulusal Adres Veri Tabanı) + Tapu sahiplik doğrulama.
 *
 * Gerçek erişim: UAVT sorgusu e-Devlet üzerinden, Tapu sahiplik sorgusu
 * TAKBİS (Tapu ve Kadastro Bilgi Sistemi) üzerinden. SecureLend bu servislere
 * doğrudan erişmez — banka partneri üzerinden resmi API çağrısı yapar.
 *
 * Şu an mock. Banka entegrasyonu tamamlanınca gerçek endpoint'lere geçer.
 *
 * SAFETY: Hiçbir metot exception atmaz. Başarısız durum `verified: false`.
 */
@Injectable()
export class UavtService {
  private readonly logger = new Logger(UavtService.name);

  /**
   * UAVT kodunun geçerli olup olmadığını ve adresle eşleşip eşleşmediğini kontrol eder.
   * Mock: 10 haneli sayısal kod formatı kontrolü + simüle edilmiş gecikme.
   */
  async verifyUavtCode(uavtCode: string): Promise<UavtVerifyResult> {
    await this.simulateLatency();
    try {
      const clean = uavtCode.trim();
      const formatValid = /^\d{8,10}$/.test(clean);

      if (!formatValid) {
        return {
          verified: false,
          reason: 'UAVT kodu 8-10 haneli sayısal olmalı',
          checkedAt: new Date(),
        };
      }

      // Mock: son hane 0 değilse geçerli. Gerçekte e-Devlet UAVT sorgusu.
      const lastDigit = parseInt(clean.slice(-1), 10);
      const verified = lastDigit !== 0;

      return {
        verified,
        reason: verified
          ? undefined
          : 'UAVT kodu sistemde bulunamadı',
        checkedAt: new Date(),
      };
    } catch (err) {
      this.logger.error(
        `verifyUavtCode error: ${err instanceof Error ? err.message : err}`,
      );
      return {
        verified: false,
        reason: 'UAVT servisi geçici olarak kullanılamıyor',
        checkedAt: new Date(),
      };
    }
  }

  /**
   * UAVT koduna karşılık gelen gayrimenkulun belirtilen TCKN sahibine ait olup
   * olmadığını TAKBİS üzerinden doğrular.
   *
   * Mock: TCKN ilk hanesi çift ise sahiplik doğrulanır. Gerçekte banka API.
   */
  async verifyOwnership(
    uavtCode: string,
    ownerTckn: string,
  ): Promise<OwnershipVerifyResult> {
    await this.simulateLatency();
    try {
      const uavtValid = /^\d{8,10}$/.test(uavtCode.trim());
      const tcknValid = /^\d{11}$/.test(ownerTckn);

      if (!uavtValid || !tcknValid) {
        return {
          verified: false,
          reason: 'Geçersiz UAVT kodu veya TCKN',
          checkedAt: new Date(),
        };
      }

      // Mock: TCKN'nin ilk hanesi çift ise verified. Gerçekte TAKBİS sorgusu.
      const firstDigit = parseInt(ownerTckn.charAt(0), 10);
      const verified = firstDigit % 2 === 0 || firstDigit === 1;

      return {
        verified,
        reason: verified
          ? undefined
          : 'Bu gayrimenkul belirtilen TCKN sahibine ait değil',
        checkedAt: new Date(),
      };
    } catch (err) {
      this.logger.error(
        `verifyOwnership error: ${err instanceof Error ? err.message : err}`,
      );
      return {
        verified: false,
        reason: 'TAKBİS servisi geçici olarak kullanılamıyor',
        checkedAt: new Date(),
      };
    }
  }

  private simulateLatency(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 150),
    );
  }
}
