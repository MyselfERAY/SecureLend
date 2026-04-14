# Bank Module

## Sorumluluk
KMH (Kredili Mevduat Hesabı) başvuru yönetimi, banka hesabı CRUD, KYC doğrulama akışı, hesap bakiye/işlem sorgulama.

## Dosyalar
- `bank.service.ts` — KMH başvuru, KYC adımları, hesap yönetimi
- `bank.controller.ts` — endpoint handler
- `dto/apply-kmh.dto.ts` — ApplyKmhDto: employmentStatus, monthlyIncome, employerName, residentialAddress, estimatedRent

## Endpoint'ler
### KMH Başvuru
- `POST /api/v1/bank/kmh/apply` — KMH başvuru [Auth, 2/10sec]
- `POST /api/v1/bank/kmh/:applicationId/accept-offer` — Teklifi kabul et [Auth]
- `POST /api/v1/bank/kmh/:applicationId/complete-onboarding` — Hesap oluştur [Auth]
- `POST /api/v1/bank/kmh/:applicationId/cancel` — Başvuruyu iptal et [Auth]
- `GET /api/v1/bank/kmh/my-applications` — Başvurularım [Auth]
- `GET /api/v1/bank/kmh/:applicationId` — Başvuru detayı [Auth]

### KYC Doğrulama
- `POST /api/v1/bank/kmh/:applicationId/kyc/start` — KYC başlat [Auth]
- `POST /api/v1/bank/kmh/:applicationId/kyc/verify-id` — Kimlik doğrula [Auth]
- `POST /api/v1/bank/kmh/:applicationId/kyc/verify-selfie` — Selfie doğrula [Auth]
- `POST /api/v1/bank/kmh/:applicationId/kyc/complete-video` — Video görüşme [Auth]
- `POST /api/v1/bank/kmh/:applicationId/kyc/sign-agreements` — Sözleşme imzala [Auth]
- `GET /api/v1/bank/kmh/:applicationId/kyc/status` — KYC durumu [Auth]

### Hesap
- `GET /api/v1/bank/accounts` — Hesaplarım [Auth]
- `GET /api/v1/bank/accounts/:id/balance` — Bakiye [Auth]
- `GET /api/v1/bank/accounts/:id/transactions` — Son 50 işlem [Auth]

## Bağımlılıklar
- **İçeri:** PrismaService, BankService (mock)
- **Dışarı:** contract (imzada KMH hesap seçimi), payment (ödeme transferleri)

## KYC Akışı
```
START → VERIFY_ID → VERIFY_SELFIE → VIDEO_CALL → SIGN_AGREEMENTS → COMPLETED
```

## Kritik Kurallar
- Tüm banka servisleri şu an mock — gerçek banka entegrasyonu yapılacak
- KMH başvurusunda creditScore, approvedLimit, debtToIncomeRatio hesaplanır
- Hesap numarası (IBAN) unique
- Hesap tipleri: KMH (güvence) ve STANDARD
- KMH hesabı sözleşmeye bağlanabilir (contractId referansı)

## Son Değişiklik
[2026-04-10] KYC adımları eklendi
