import { Injectable, Logger } from '@nestjs/common';

export interface KkbVerifyResult {
  verified: boolean;
  reason?: string;
  checkedAt: Date;
}

/**
 * KKB (Kredi Kayıt Bürosu) — TCKN ile telefon ve IBAN eşleşme doğrulamaları.
 *
 * Gerçek KKB'ye doğrudan erişim yok — SecureLend banka partneri üzerinden
 * KKB sorgusu yapar. Bu modül banka entegrasyonu tamamlanınca gerçek çağrıya
 * geçer. Şu an mock: heuristik doğrulama + küçük gecikme.
 *
 * SAFETY: Tüm metotlar **asla exception atmaz**. Doğrulama başarısızsa
 * `{ verified: false, reason }` döner; caller karar verir (engelle veya uyar).
 */
@Injectable()
export class KkbService {
  private readonly logger = new Logger(KkbService.name);

  /**
   * Telefon numarasının TCKN sahibine ait olup olmadığını KKB'den sorgular.
   * Mock: TCKN + phone'un her ikisi de geçerli formatta ise true döner.
   * Gerçek entegrasyonda: banka API'si üzerinden KKB çağrısı.
   */
  async verifyPhoneTcknMatch(
    tckn: string,
    phone: string,
  ): Promise<KkbVerifyResult> {
    await this.simulateLatency();
    try {
      const tcknValid = /^\d{11}$/.test(tckn);
      const phoneValid = /^(\+?90)?5\d{9}$/.test(phone.replace(/\s/g, ''));

      if (!tcknValid || !phoneValid) {
        return {
          verified: false,
          reason: 'Geçersiz TCKN veya telefon formatı',
          checkedAt: new Date(),
        };
      }

      // Mock: Son haneleri kontrol ederek %95 başarı simüle et.
      // Gerçek entegrasyonda bu blok kaldırılacak, banka API'sine istek gidecek.
      const lastTcknDigit = parseInt(tckn.slice(-1), 10);
      const verified = lastTcknDigit !== 9; // %90 başarı oranı simüle

      return {
        verified,
        reason: verified ? undefined : 'TCKN-telefon eşleşmesi doğrulanamadı',
        checkedAt: new Date(),
      };
    } catch (err) {
      this.logger.error(
        `verifyPhoneTcknMatch error: ${err instanceof Error ? err.message : err}`,
      );
      return {
        verified: false,
        reason: 'KKB servisi geçici olarak kullanılamıyor',
        checkedAt: new Date(),
      };
    }
  }

  /**
   * IBAN sahibinin TCKN ile eşleşip eşleşmediğini KKB üzerinden sorgular.
   * Kira sözleşmesinde kiracının ödeme yapacağı IBAN'ın ev sahibinin
   * TCKN'sine bağlı olduğunu doğrulamak için kullanılır.
   */
  async verifyIbanTcknMatch(
    iban: string,
    tckn: string,
  ): Promise<KkbVerifyResult> {
    await this.simulateLatency();
    try {
      const cleanIban = iban.replace(/\s/g, '').toUpperCase();
      const ibanValid = /^TR\d{24}$/.test(cleanIban);
      const tcknValid = /^\d{11}$/.test(tckn);

      if (!ibanValid || !tcknValid) {
        return {
          verified: false,
          reason: 'Geçersiz IBAN veya TCKN formatı',
          checkedAt: new Date(),
        };
      }

      // Mock: IBAN'ın son hanesi 9 değilse true. Gerçekte banka API sorgusu.
      const lastIbanDigit = parseInt(cleanIban.slice(-1), 10);
      const verified = lastIbanDigit !== 9;

      return {
        verified,
        reason: verified
          ? undefined
          : 'IBAN sahibi ile TCKN eşleşmiyor',
        checkedAt: new Date(),
      };
    } catch (err) {
      this.logger.error(
        `verifyIbanTcknMatch error: ${err instanceof Error ? err.message : err}`,
      );
      return {
        verified: false,
        reason: 'KKB servisi geçici olarak kullanılamıyor',
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
