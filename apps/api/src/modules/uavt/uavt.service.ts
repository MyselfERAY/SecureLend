import { Injectable } from '@nestjs/common';

export interface UavtLookupResult {
  /** UAVT kodu geçerli mi */
  valid: boolean;
  /** Adres bilgisi (geçerliyse) */
  address?: {
    city: string;
    district: string;
    neighborhood: string;
    street: string;
    buildingNo?: string;
    apartmentNo?: string;
    postalCode?: string;
  };
  queriedAt: Date;
  reason?: string;
}

export interface UavtOwnershipResult {
  /** TCKN bu UAVT'nin sahibi mi (Tapu kaydına göre) */
  ownershipMatched: boolean;
  queriedAt: Date;
  reason?: string;
}

/**
 * UAVT (Ulusal Adres Veri Tabanı) Servis Soyutlaması
 *
 * Gerçek entegrasyon: Nüfus ve Vatandaşlık İşleri UAVT servisi + Tapu kadastro
 * sorgusu — bankalar/resmi kurumlar aracılığıyla erişilir.
 *
 * Trafik: SecureLend → Banka/Resmi API → UAVT + Tapu
 *
 * Şu an için mock implementasyon (MockUavtService).
 */
@Injectable()
export abstract class UavtService {
  /** UAVT kodunun geçerli olup olmadığını ve adres bilgisini döndürür */
  abstract lookupAddress(uavtCode: string): Promise<UavtLookupResult>;

  /** TCKN'nin verilen UAVT'ye ait mülkün sahibi olup olmadığını kontrol eder (Tapu sorgusu) */
  abstract verifyOwnership(tckn: string, uavtCode: string): Promise<UavtOwnershipResult>;
}
