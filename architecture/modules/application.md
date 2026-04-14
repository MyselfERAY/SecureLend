# Application & Verification (5 Modül)

> application + credit-scoring + identity-verification + encryption + tenant-score birlikte başvuru ve doğrulama altyapısını oluşturur.

## application
Kredi ön başvuru işleme (TCKN doğrulama, skor hesaplama).

### Endpoint'ler
- `POST /api/v1/applications` — Başvuru oluştur [Public, 1/2sec]
- `GET /api/v1/applications/:id` — Başvuru detayı [Auth]

### Akış
```
TCKN gir → KPS kimlik doğrula → KKB kredi skoru → Karar (onay/red)
```

---

## credit-scoring (Dahili Servis)
KKB (Kredi Kayıt Bürosu) kredi değerlendirmesi. Şu an mock.

### Servis Metotları
- `evaluateCredit(tckn)` → `{ approved, creditLimit, interestRate, score }`

---

## identity-verification (Dahili Servis)
KPS (Kimlik Paylaşım Sistemi) kimlik doğrulama. Şu an mock.

### Servis Metotları
- `verifyIdentity(tckn)` → `{ verified, firstName, lastName }`

---

## encryption (Global, Dahili Servis)
Hassas veri şifreleme (TCKN hash).

### Servis Metotları
- `hash(data)` → hash string
- `verify(data, hash)` → boolean

### Kullanım
- TCKN_HASH_PEPPER env variable ile HMAC hash
- Tüm modüllerden erişilebilir (Global)

---

## tenant-score
Kiracı ödeme güvenilirlik skoru. Sözleşme ödeme geçmişine dayalı.

### Endpoint'ler
- `GET /api/v1/tenant-score/me` — Kendi skorum [Auth]
- `GET /api/v1/tenant-score/:tenantId` — Kiracı skoru [LANDLORD - kendi kiracıları]

---

## Bağımlılıklar
- **İçeri:** PrismaService, EncryptionService
- **Dışarı:** auth (register'da KPS doğrulama), bank (KMH başvuruda kredi skoru)

## Kritik Kurallar
- TCKN asla plain text saklanmaz — EncryptionService.hash() ile hashlenip tcknHash field'ına yazılır
- tcknMasked: ilk 3 + son 2 hane gösterilir, ortası ***
- Mock servisler gerçek entegrasyon öncesi placeholder — dosya adlarında belirtilmeli
- Tenant score: zamanında yapılan ödemeler skoru artırır, gecikmeler düşürür
- TCKN_HASH_PEPPER en az 64 karakter hex olmalı (şu an placeholder)

## Son Değişiklik
[2026-04-12] Tenant reliability score eklendi
