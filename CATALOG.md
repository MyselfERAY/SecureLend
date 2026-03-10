# SecureLend - Dijital Kira Platformu

## Urun Katalogu / Platform Tanitimi

---

## 1. Platform Ozeti

**SecureLend**, Turkiye'de kiralama sureclerini dijitallestiren, banka entegrasyonlu bir FinTech platformudur.

| Ozellik | Deger |
|---------|-------|
| **Platform Tipi** | B2B2C Dijital Kira Yonetim Sistemi |
| **Hedef Pazar** | Turkiye - Konut Kiralama |
| **Kullanici Rolleri** | Kiraci (Tenant), Ev Sahibi (Landlord), Admin |
| **Teknoloji** | Full-Stack TypeScript Monorepo |
| **Banka Entegrasyonu** | KMH (Kredili Mevduat Hesabi) |
| **Gelir Modeli** | Kira odemeleri uzerinden %1 komisyon |

---

## 2. Temel Deger Onerileri

### Kiracilara (Tenants)
- Dijital KMH basvurusu ile hizli kredi limiti onay sureci
- Tek platformdan sozlesme imzalama ve odeme yonetimi
- Otomatik kira odemesi ile gecikme riski yok
- Kredi limiti sayesinde nakit akisi esnekligi

### Ev Sahiplerine (Landlords)
- Mulk yonetimi ve sozlesme olusturma tek platformda
- IBAN tanimi ile dogrudan hesaba odeme
- KMH garantili kiracilarin guvenilir odeme kapasitesi
- Dijital imza ile hizli sozlesme sureci

### Platform (Admin)
- Otomatik komisyon hesaplama ve takip
- Tum kullanici, sozlesme ve odemelerin merkezi yonetimi
- KMH bazli risk yonetimi
- Detayli denetim kayitlari (audit log)

---

## 3. Platform Modulleri

### 3.1 Kimlik ve Yetkilendirme

```
+---------------------------+
|     KIMLIK DOGRULAMA      |
+---------------------------+
| - TCKN + Telefon ile Giris|
| - OTP Dogrulama (SMS)     |
| - JWT Token Yonetimi      |
| - Rol Bazli Erisim        |
|   (TENANT/LANDLORD/ADMIN) |
| - KPS Kimlik Dogrulama    |
+---------------------------+
```

**Ozellikler:**
- TCKN algoritmik dogrulama (checksum)
- 6 haneli OTP ile iki faktorlu kimlik dogrulama
- Access + Refresh token cift katmanli guvenlik
- Oturum bazli IP ve User-Agent kaydi
- TCKN/Telefon/OTP loglardan maskeleme

---

### 3.2 KMH (Kredili Mevduat Hesabi) Sistemi

```
+---------------------------------------------+
|            KMH BASVURU AKISI                 |
+---------------------------------------------+
|                                              |
|  [Basvuru Formu] --> [Otomatik Degerlendirme]|
|       |                      |               |
|       v                      v               |
|  Istihdam Bilgisi    Gelir >= Kira x 2 ?     |
|  Aylik Gelir              |                  |
|  Isveren Adi         Evet | Hayir            |
|  Tahmini Kira          |       |             |
|                        v       v             |
|                    [ONAY]  [RED]             |
|                      |                       |
|                      v                       |
|              [Dijital Onboarding]            |
|                      |                       |
|                      v                       |
|              [KMH Hesap Acilisi]             |
|              Limit: Gelir x 3               |
|              (Max 500.000 TL)               |
+---------------------------------------------+
```

**KMH Degerlendirme Kriterleri:**
| Kriter | Formul |
|--------|--------|
| Minimum Gelir | Tahmini Kira x 2 |
| Kredi Limiti | Aylik Gelir x 3 |
| Maksimum Limit | 500.000 TL |
| Faiz Orani | %2.49 (varsayilan) |

**Desteklenen Istihdam Durumlari:**
- Calisan (EMPLOYED)
- Serbest Meslek (SELF_EMPLOYED)
- Emekli (RETIRED)
- Ogrenci (STUDENT)
- Issiz (UNEMPLOYED)

---

### 3.3 Mulk Yonetimi

```
+---------------------------+
|      MULK YONETIMI        |
+---------------------------+
| - Mulk Kayit ve Listeleme |
| - Detayli Adres Bilgisi   |
| - Mulk Tipi Siniflandirma |
| - Oda/Alan/Kat Bilgileri  |
| - Kira ve Depozito Tutari |
| - Durum Takibi            |
|   (ACTIVE/RENTED/INACTIVE)|
+---------------------------+
```

**Mulk Bilgileri:**
- Baslik, adres (satir 1-2), sehir, ilce, posta kodu
- Mulk tipi, oda sayisi, alan (m2), kat/toplam kat
- Aylik kira, depozito, para birimi (TRY)

---

### 3.4 Sozlesme Yonetimi

```
+--------------------------------------------------+
|              SOZLESME YASAM DONGUSU               |
+--------------------------------------------------+
|                                                    |
|  [DRAFT] --> [PENDING_SIGNATURES] --> [ACTIVE]    |
|                   |          |                     |
|           Ev Sahibi      Kiraci                   |
|           Imzalar        Imzalar                   |
|              |         (KMH Secimi)                |
|              v              v                      |
|         [1. Imza]     [2. Imza]                   |
|                          |                         |
|                          v                         |
|                   [Banka Bildirimi]               |
|                          |                         |
|                          v                         |
|               [Otomatik Odeme Emri]               |
|                    Olusturulur                     |
|                                                    |
|  Diger Durumlar: TERMINATED | EXPIRED              |
+--------------------------------------------------+
```

**Sozlesme Icerigi:**
- Mulk bilgisi, kiraci ve ev sahibi atamalari
- Aylik kira, depozito, baslangic/bitis tarihi
- Odeme gunu, ev sahibi IBAN'i
- Ozel sartlar ve sozlesme maddeleri
- Dijital imza kayitlari (IP, tarih, cihaz bilgisi)

**Kiraci Imza Sureci:**
- Aktif KMH hesaplari listelenir
- Kiraci uygun KMH hesabini secer
- KMH limiti >= aylik kira kontrolu yapilir
- Secilen KMH sozlesmeye baglanir

---

### 3.5 Odeme Sistemi

```
+------------------------------------------+
|           ODEME AKISI                     |
+------------------------------------------+
|                                            |
|  [PaymentOrder]                           |
|  Her ay otomatik tetiklenir               |
|       |                                    |
|       v                                    |
|  [PaymentSchedule]                        |
|  Donem bazli odeme kaydi                  |
|       |                                    |
|       v                                    |
|  [BankTransaction]                        |
|  KMH Hesap --> Ev Sahibi IBAN            |
|       |                                    |
|       v                                    |
|  [Commission]                             |
|  Toplam x %1 = Platform Komisyonu        |
|  Ev Sahibi = Toplam - Komisyon            |
+------------------------------------------+
```

**Odeme Durumlari:** PENDING -> PROCESSING -> COMPLETED / FAILED / OVERDUE

**Komisyon Yapisi:**
| Alan | Deger |
|------|-------|
| Komisyon Orani | %1 |
| Komisyon Matrah | Kira Tutari |
| Ev Sahibi Payi | Kira - Komisyon |

---

### 3.6 Admin Paneli

```
+----------------------------------+
|        ADMIN DASHBOARD           |
+----------------------------------+
|                                   |
|  [Genel Bakis]                   |
|  - Toplam kullanici sayisi       |
|  - Aktif sozlesme sayisi         |
|  - Odeme istatistikleri          |
|                                   |
|  [Kullanici Yonetimi]            |
|  - Tum kullanicilari listele     |
|  - Rol atama/degistirme          |
|  - Hesap aktif/pasif yonetimi    |
|                                   |
|  [Sozlesme Yonetimi]             |
|  - Tum sozlesmeleri goruntule    |
|  - Durum bazli filtreleme        |
|                                   |
|  [Odeme Takibi]                  |
|  - Odeme gecmisi                 |
|  - Odeme durum takibi            |
|                                   |
|  [Komisyon Raporu]               |
|  - Komisyon detaylari            |
|  - Toplam kazanc                 |
+----------------------------------+
```

---

## 4. Teknik Mimari

### 4.1 Teknoloji Yigini

```
+------------------------------------------------------+
|                  SECURELEND MIMARISI                   |
+------------------------------------------------------+
|                                                        |
|  FRONTEND (Next.js 15)          BACKEND (NestJS 10)   |
|  +--------------------+        +--------------------+  |
|  | App Router         |  REST  | Controllers        |  |
|  | React 19           | <----> | Services           |  |
|  | Tailwind CSS       |  JWT   | Guards & Pipes     |  |
|  | TypeScript         |        | Prisma ORM         |  |
|  +--------------------+        +--------------------+  |
|                                         |              |
|  SHARED PACKAGE                         |              |
|  +--------------------+        +--------------------+  |
|  | TCKN Validation    |        | PostgreSQL 14      |  |
|  | Zod Schemas        |        | 13 Tablo           |  |
|  | JSend Types        |        | 10 Enum            |  |
|  | Masking Utils      |        +--------------------+  |
|  +--------------------+                                |
|                                                        |
|  ALTYAPI                                              |
|  +--------------------+        +--------------------+  |
|  | Docker Compose     |        | Turborepo          |  |
|  | pnpm Workspaces    |        | TypeScript 5       |  |
|  +--------------------+        +--------------------+  |
+------------------------------------------------------+
```

### 4.2 Veritabani Modelleri (13 Tablo)

```
+----------+     +-----------+     +----------+
|   User   |---->| Property  |     | Contract |
| (users)  |     |(properties|     |(contracts|
+----------+     +-----------+     +----------+
     |                |                 |
     |                +---------+-------+
     |                          |
     v                          v
+-----------+          +-----------+
| KmhApp    |          | Contract  |
|(kmh_apps) |          | Signature |
+-----------+          +-----------+
     |
     v
+------------+     +-------------+     +----------+
| BankAccount|---->| PaymentOrder|     | Payment  |
|(bank_accs) |     |(pay_orders) |     | Schedule |
+------------+     +-------------+     +----------+
     |                                       |
     v                                       v
+------------+                        +----------+
| BankTxn    |                        |Commission|
|(bank_txns) |                        +----------+
+------------+

Diger:  OtpCode | RefreshToken | AuditLog
```

### 4.3 API Endpoint Ozeti

| Modul | Endpoint Grubu | Sayi |
|-------|---------------|------|
| Auth | /api/auth/* | 4 |
| User | /api/users/* | 4 |
| Application | /api/applications/* | 3 |
| Property | /api/properties/* | 4 |
| Contract | /api/contracts/* | 5 |
| Payment | /api/payments/* | 3 |
| Bank | /api/bank/* | 8 |
| Admin | /api/admin/* | 6 |
| Health | /api/health | 1 |
| **Toplam** | | **~38** |

### 4.4 Guvenlik Katmanlari

```
+---------------------------------------------+
|            GUVENLIK MIMARISI                 |
+---------------------------------------------+
|                                               |
|  1. Helmet - HTTP Guvenlik Basliklari        |
|  2. CORS - Origin Kontrolu                   |
|  3. Rate Limiting - Throttler (3 katman)     |
|  4. JWT Auth Guard - Token Dogrulama         |
|  5. Roles Guard - Rol Bazli Erisim           |
|  6. Validation Pipe - DTO Dogrulama          |
|  7. TCKN Hash - Kriptografik Saklama         |
|  8. Log Masking - Hassas Veri Gizleme        |
|  9. Audit Logging - Islem Kaydi              |
| 10. AllExceptions Filter - Guvenli Hata Msjl |
+---------------------------------------------+
```

---

## 5. Kullanici Akislari

### 5.1 Kiraci Yolculugu (Tenant Journey)

```
[Kayit/Giris]
     |
     v
[Profil Tamamla]
     |
     v
[KMH Basvurusu Yap]
  - Istihdam durumu
  - Aylik gelir
  - Tahmini kira
     |
     v
[Onay Bekle] --> [RED ise: Yeni basvuru]
     |
     v (ONAYLANDI)
[Dijital Onboarding]
     |
     v
[KMH Hesap Acildi]
     |
     v
[Sozlesme Davetini Goruntule]
     |
     v
[KMH Hesabi Sec & Sozlesme Imzala]
     |
     v
[Otomatik Kira Odemesi Baslar]
     |
     v
[Odeme Gecmisini Takip Et]
```

### 5.2 Ev Sahibi Yolculugu (Landlord Journey)

```
[Kayit/Giris]
     |
     v
[Profil Tamamla]
     |
     v
[Mulk Ekle]
  - Adres, oda, alan
  - Kira, depozito
     |
     v
[Sozlesme Olustur]
  - Mulk sec
  - Kiraci sec (TCKN)
  - Tarih, odeme gunu
  - IBAN gir
  - Ozel sartlar
     |
     v
[Sozlesmeyi Imzala] (1. imza)
     |
     v
[Kiraci Imzasini Bekle]
     |
     v
[Sozlesme AKTIF]
     |
     v
[Kira Odemelerini Takip Et]
```

### 5.3 Admin Yolculugu

```
[Admin Giris]
     |
     v
[Dashboard - Genel Bakis]
     |
     +---> [Kullanici Yonetimi]
     |       - Listele, rol degistir
     |
     +---> [Sozlesme Takibi]
     |       - Tum sozlesmeleri gor
     |
     +---> [Odeme Takibi]
     |       - Durum bazli filtreleme
     |
     +---> [Komisyon Raporu]
             - Platform kazanci
```

---

## 6. Sayfa Haritasi

```
securelend.com/
|
+-- /                        Ana Sayfa (Landing)
+-- /credit-check            Kredi Kontrol Formu
+-- /result                  Kredi Sonuc Sayfasi
|
+-- /auth/
|   +-- login                TCKN + Telefon ile Giris
|   +-- register             Yeni Kullanici Kaydi
|   +-- verify-otp           OTP Dogrulama
|
+-- /dashboard/              Kullanici Paneli
|   +-- /                    Ana Panel (Dashboard)
|   +-- profile              Profil Bilgileri
|   +-- properties           Mulk Yonetimi (Ev Sahibi)
|   +-- bank                 KMH Basvuru & Hesaplar
|   +-- contracts/           Sozlesme Listesi
|   |   +-- [id]             Sozlesme Detay & Imzalama
|   +-- payments             Odeme Gecmisi
|   |
|   +-- admin/               Admin Paneli
|       +-- /                Admin Dashboard
|       +-- users            Kullanici Yonetimi
|       +-- contracts        Sozlesme Yonetimi
|       +-- payments         Odeme Yonetimi
|       +-- commissions      Komisyon Raporu
```

**Toplam:** 18 sayfa + 3 layout

---

## 7. Entegrasyon Mimari Deseni

SecureLend, **Abstract Service Pattern** kullanarak dis servis entegrasyonlarini yonetir:

```
+-------------------+     +--------------------+
| BankService       |     | SmsService         |
| (abstract)        |     | (abstract)         |
+-------------------+     +--------------------+
         |                          |
         v                          v
+-------------------+     +--------------------+
| MockBankService   |     | MockSmsService     |
| (development)     |     | (development)      |
+-------------------+     +--------------------+
         |                          |
         v                          v
+-------------------+     +--------------------+
| RealBankService   |     | RealSmsService     |
| (production)      |     | (production)       |
+-------------------+     +--------------------+

Ayni desen:
- CreditScoringService    --> MockCreditScoringService
- IdentityVerification     --> MockIdentityVerificationService
- EncryptionService        --> HashEncryptionService
```

Bu desen sayesinde:
- Development ortaminda mock servisler kullanilir
- Production'da gercek banka/SMS API'leri takilir
- Kod degisikligi gerekmez, sadece DI konfigurasyonu degisir

---

## 8. Platform Metrikleri

| Metrik | Deger |
|--------|-------|
| Frontend Sayfa Sayisi | 18 |
| Backend Modul Sayisi | 13 |
| API Endpoint Sayisi | ~38 |
| Veritabani Tablo Sayisi | 13 |
| Enum Sayisi | 10 |
| Shared Paket Fonksiyon Sayisi | 5 |
| Guvenlik Katmani Sayisi | 10 |
| Desteklenen Kullanici Rolu | 3 |

---

## 9. Gelecek Yol Haritasi

| Ozellik | Oncelik | Durum |
|---------|---------|-------|
| Gercek Banka API Entegrasyonu | Yuksek | Planli |
| Gercek SMS Gateway (Netgsm/Iletimerkezi) | Yuksek | Planli |
| E-Devlet / KPS Entegrasyonu | Yuksek | Planli |
| Gercek Kredi Skorlama (KKB/Findeks) | Yuksek | Planli |
| Mobil Uygulama (React Native) | Orta | Planli |
| Bildirim Sistemi (Push/Email) | Orta | Planli |
| Raporlama ve Analitik Dashboard | Orta | Planli |
| Coklu Para Birimi Destegi | Dusuk | Planli |

---

*SecureLend v0.1.0 - Dijital Kira Platformu Katalogu*
*Tarih: Subat 2026*
