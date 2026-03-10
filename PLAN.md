# KMH + Sozlesme Akisi Yeniden Tasarim Plani

## Ozet
Banka modulunu tamamen yeniden yapilandiriyoruz. Mevcut genel-amacli banka islemleri (havale, odeme talimati) kaldirilip, gercek KMH (Kredili Mevduat Hesabi) basvuru + sozlesme entegrasyonu akisina geciliyor.

## Yeni Akis

```
1. Kiraci → KMH Basvurusu (detayli bilgiler ile)
2. Banka API → Degerlendirme → "Onaylandi, XXX TL limit"
3. Kiraci → Digital Onboarding (simulasyon) → KMH acildi
4. Ev sahibi → Sozlesme olustur (landlordIban ekli)
5. Ev sahibi imzalar
6. Kiraci imzalar (KMH ZORUNLU - limiti >= aylik kira)
7. Sozlesme aktif olunca → Banka API cagirilir:
   - Sozlesme bilgileri + tarihler + IBAN gonderilir
   - Banka: Duzenli odeme talimati olusturuldu + KMH hesap no + limit doner
```

---

## FAZA 1: Schema Degisiklikleri

### 1.1 Yeni Model: KmhApplication (kmh_applications)
Kiraci KMH basvurusunu tutar:
- id, userId
- employmentStatus: enum (EMPLOYED, SELF_EMPLOYED, RETIRED, STUDENT, UNEMPLOYED)
- monthlyIncome: Decimal
- employerName: String? (optional)
- residentialAddress: String
- estimatedRent: Decimal
- status: enum (PENDING, APPROVED, REJECTED)
- approvedLimit: Decimal? (banka onayladigi limit)
- rejectionReason: String?
- bankReferenceNo: String? (banka referans no)
- createdAt, updatedAt

### 1.2 BankAccount modeline ek alanlar
- kmhApplicationId: String? (KMH basvurusu ile iliski)

### 1.3 Contract modeline ek alan
- landlordIban: String (ev sahibinin IBAN'i - zorunlu)

### 1.4 Yeni Enum: EmploymentStatus
EMPLOYED, SELF_EMPLOYED, RETIRED, STUDENT, UNEMPLOYED

### 1.5 Yeni Enum: KmhApplicationStatus
PENDING, APPROVED, REJECTED

---

## FAZA 2: Backend - KMH Basvuru Akisi

### 2.1 Yeni DTO: ApplyKmhDto
- employmentStatus, monthlyIncome, employerName?, residentialAddress, estimatedRent

### 2.2 MockBankService - Yeni Metodlar

**applyForKmh(userId, dto):**
- TCKN kullanicidan zaten var (user tablosunda)
- KMH basvuru kaydini olustur (PENDING)
- Mock degerlendirme: gelir >= tahmini kira × 2 ise ONAY, degilse RED
- Onaylanirsa: limit = gelir × 3 (max 500.000 TL)
- Reddedilirse: sebep doner
- Return: { applicationId, status, approvedLimit?, rejectionReason? }

**completeOnboarding(kmhApplicationId, userId):**
- KMH basvurusu APPROVED olmali
- BankAccount olustur (KMH tipi, ACTIVE)
- Mock IBAN uret
- creditLimit = approvedLimit
- Return: { accountId, accountNumber, creditLimit }

**notifyContractSigned(contractId):**
- Sozlesme bilgilerini al (kiracinin KMH hesabi, ev sahibi IBAN, tutar, tarihler)
- PaymentOrder olustur (otomatik)
- Return: { paymentOrderId, kmhAccountNumber, kmhLimit, message }

### 2.3 BankService (abstract) guncelle
- Eski openAccount → kaldir (yerine applyForKmh + completeOnboarding)
- transfer → kalsin (ic islerde lazim - odeme islemi icin)
- getBalance → kalsin
- getAccountsByUser → kalsin
- YENi: applyForKmh, completeOnboarding, notifyContractSigned

---

## FAZA 3: Backend - Sozlesme Akisi Guncelleme

### 3.1 CreateContractDto'ya ek
- landlordIban: @IsString, @Length(26, 26) (TR IBAN formati)

### 3.2 Contract create'te
- landlordIban'i contract tablosuna kaydet

### 3.3 signContract'ta KMH kontrolu
- Kiraci imzalarken:
  1. Kiracinin APPROVED KMH basvurusu var mi? (aktif BankAccount KMH tipi)
  2. KMH limiti >= sozlesme aylik kirasi mi?
  3. Yoksa: "KMH basvurunuz olmadan sozlesme imzalayamazsiniz" hatasi
- Sozlesme aktif olunca (2. imza):
  1. bankService.notifyContractSigned(contractId) cagir
  2. Banka otomatik odeme talimati olusturur

### 3.4 getContractDetail'e ek
- landlordIban goster
- Kiracinin KMH durumunu goster (limit, hesap no)

---

## FAZA 4: Backend - Endpoint Degisiklikleri

### 4.1 Kaldirilacak endpoint'ler
- POST /bank/transfers (havale)
- POST /bank/payment-orders (manuel talimati olusturma)
- GET /bank/payment-orders (talimati listesi)
- PATCH /bank/payment-orders/:id/cancel (talimati iptal)

### 4.2 Yeni endpoint'ler
- POST /bank/kmh/apply → KMH basvurusu yap
- POST /bank/kmh/:applicationId/complete-onboarding → Digital onboarding tamamla
- GET /bank/kmh/my-applications → Basvurularimi listele
- GET /bank/kmh/:applicationId → Basvuru detayi

### 4.3 Kalan endpoint'ler
- GET /bank/accounts → Hesaplarimi listele
- GET /bank/accounts/:id/balance → Bakiye sorgula
- GET /bank/accounts/:id/transactions → Islem gecmisi

---

## FAZA 5: Frontend - Banka Sayfasi (Tamamen Yeniden)

### 5.1 Tab yapisi (2 tab):

**Tab 1: KMH Basvurusu**
- Mevcut basvuru varsa: durum goster (Beklemede/Onaylandi/Reddedildi)
- Onaylandiysa: "Digital Onboarding Tamamla" butonu
- Onboarding tamamlandiysa: KMH hesap bilgileri (IBAN, limit)
- Basvuru yoksa: Basvuru formu:
  - Calisma durumu (dropdown)
  - Aylik gelir (input)
  - Isveren adi (opsiyonel input)
  - Ikamet adresi (input)
  - Tahmini kira bedeli (input)
  - "Basvur" butonu

**Tab 2: Hesaplar & Islemler**
- Hesap listesi (IBAN, limit, bakiye, kullanilabilir bakiye)
- Hesap secince islem gecmisi

### 5.2 Kaldirilacaklar
- Havale/Transfer tab'i
- Odeme Talimatlari tab'i

---

## FAZA 6: Frontend - Sozlesme Sayfasi Guncellemeler

### 6.1 Sozlesme olusturma formuna:
- Ev sahibi IBAN alani (zorunlu, TR ile baslar, 26 karakter)

### 6.2 Sozlesme detay sayfasinda:
- Ev sahibi IBAN goster
- Kiraci icin: KMH durumu goster
  - KMH yoksa: "KMH basvurusu yapmaniz gerekiyor" uyarisi + link
  - KMH yetersizse: "KMH limitiniz (X TL) sozlesme kirasini (Y TL) karsilamiyor"
  - KMH yeterliyse: yesil "KMH Hazir" badge'i
- Imzalama butonunda: KMH yoksa/yetersizse disable + aciklama

---

## FAZA 7: Build & Test

- Prisma migration calistir
- Backend build
- Admin dashboard bozulmadigi dogrula
- E2E: KMH basvur → onayla → onboarding → sozlesme olustur → imzala akisi test et

---

## Dokunulmayacak Seyler
- Komisyon sistemi (payment.service.ts)
- Admin modulu
- Auth modulu
- Profil sayfasi
- Odeme sayfasi (payments/page.tsx)
