import { Injectable } from '@nestjs/common';

export interface KkbMatchResult {
  /** KKB sorgu sonucu eşleşti mi */
  matched: boolean;
  /** Sorgu zamanı */
  queriedAt: Date;
  /** Eşleşmediyse sebep (varsa) */
  reason?: string;
}

/**
 * KKB (Kredi Kayıt Bürosu) Servis Soyutlaması
 *
 * ÖNEMLİ: SecureLend KKB ile doğrudan entegre OLMAZ.
 * Trafik akışı: SecureLend → Banka Partneri API → KKB
 *
 * Bankaların KKB üyeliği vardır ve SecureLend banka üzerinden sorgulama yapar.
 * Bu servis soyutlaması, gerçek hayatta BankKkbService gibi bir implementasyonla
 * doldurulur (ör: FinansbankKkbService) — o servis banka API'sini çağırır,
 * banka da kendi üyelik altyapısı üzerinden KKB'ye gider.
 *
 * Şu an için MockKkbService kullanılıyor (development/staging).
 */
@Injectable()
export abstract class KkbService {
  /** TCKN + cep telefonu eşleşme kontrolü */
  abstract verifyPhoneTcknMatch(tckn: string, phone: string): Promise<KkbMatchResult>;

  /** TCKN + IBAN eşleşme kontrolü */
  abstract verifyIbanTcknMatch(tckn: string, iban: string): Promise<KkbMatchResult>;
}
