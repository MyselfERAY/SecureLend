# Contract Module

## Sorumluluk
Kira sözleşmesi yaşam döngüsü: oluşturma, dijital imza, PDF üretimi, aktivasyon (UAVT), fesih.

## Dosyalar
- `contract.service.ts` — sözleşme CRUD, imza, aktivasyon, fesih
- `contract.controller.ts` — endpoint handler
- `contract-pdf.service.ts` — PDFKit ile sözleşme PDF üretimi
- `dto/create-contract.dto.ts` — CreateContractDto: propertyId, tenantId, monthlyRent, startDate, endDate, paymentDayOfMonth, terms, specialClauses, landlordIban, Faz D alanları
- `dto/activate-contract.dto.ts` — ActivateContractDto: uavtCode

## Endpoint'ler
- `POST /api/v1/contracts` — Sözleşme oluştur [LANDLORD, 1/10sec]
- `GET /api/v1/contracts` — Kullanıcının sözleşmeleri [Auth]
- `GET /api/v1/contracts/:id` — Sözleşme detayı [Auth]
- `GET /api/v1/contracts/:id/pdf` — PDF indir [Auth]
- `POST /api/v1/contracts/:id/sign` — İmzala (opsiyonel kmhAccountId) [Auth, 1/30sec]
- `POST /api/v1/contracts/:id/upload-document` — Fiziksel kopya yükle [Auth]
- `POST /api/v1/contracts/:id/activate` — UAVT kodu ile aktive et [Auth]
- `POST /api/v1/contracts/:id/terminate` — Fesih (sebep gerekli) [Auth]

## Bağımlılıklar
- **İçeri:** BankModule (KMH hesap bağlama), PrismaService, ContractPdfService
- **Dışarı:** payment (contractId ile ödeme takvimi), chat (sözleşme sohbet odası), admin (sözleşme listesi)

## Durum Akışı
```
DRAFT → PENDING_SIGNATURES → PENDING_ACTIVATION → ACTIVE → TERMINATED/EXPIRED
                                    ↑
                             (UAVT kodu ile)
```

## Faz D Alanları (Sözleşme Detayları)
- rentIncreaseType (TUFE/FIXED_RATE/NONE), rentIncreaseRate
- furnitureIncluded, petsAllowed, sublettingAllowed
- noticePeriodDays, landlordIban

## Kritik Kurallar
- Sadece LANDLORD rolü sözleşme oluşturabilir
- Her iki taraf (landlord + tenant) imzalamalı → PENDING_SIGNATURES'tan ilerler
- İmza: ContractSignature kaydı (userId + contractId unique)
- Tenant imzalarken KMH hesap seçebilir (creditLimit >= monthlyRent kontrolü)
- PDF üretimi anlık (on-the-fly), saklanmaz
- Fesih sebebi zorunlu, terminatedAt timestamp kaydedilir

## Son Değişiklik
[2026-04-13] Çift taraflı imza durum göstergesi (PENDING_SIGNATURES)
