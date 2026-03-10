# SecureLend - Gelistirici ve Kullanici Kilavuzu

---

## Icindekiler

1. [Hizli Baslangic](#1-hizli-baslangic)
2. [Gelistirme Ortami Kurulumu](#2-gelistirme-ortami-kurulumu)
3. [Proje Yapisi](#3-proje-yapisi)
4. [Veritabani](#4-veritabani)
5. [Backend API Kilavuzu](#5-backend-api-kilavuzu)
6. [Frontend Kilavuzu](#6-frontend-kilavuzu)
7. [Kullanici Islemleri Kilavuzu](#7-kullanici-islemleri-kilavuzu)
8. [API Endpoint Referansi](#8-api-endpoint-referansi)
9. [Test Kullanicilari](#9-test-kullanicilari)
10. [Sik Karsilasilan Sorunlar](#10-sik-karsilasilan-sorunlar)
11. [Gelistirici Notlari](#11-gelistirici-notlari)

---

## 1. Hizli Baslangic

### On Gereksinimler

| Arac | Minimum Surum | Kontrol Komutu |
|------|---------------|----------------|
| Node.js | v18+ | `node -v` |
| pnpm | v9.15+ | `pnpm -v` |
| PostgreSQL | 14+ | `psql --version` |
| Docker (opsiyonel) | 20+ | `docker -v` |

### 5 Adimda Calistirma

```bash
# 1. Projeyi klonla
git clone <repo-url> securelend
cd securelend

# 2. Bagimliliklari yukle
pnpm install

# 3. PostgreSQL'i baslat (Docker ile)
docker compose up -d

# 4. Veritabanini hazirla
cd apps/api
npx prisma migrate dev
npx prisma generate
cd ../..

# 5. Uygulamayi baslat
pnpm dev
```

Uygulama baslayinca:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:4000
- **API Docs (Swagger):** http://localhost:4000/api/docs

---

## 2. Gelistirme Ortami Kurulumu

### 2.1 Veritabani (Docker ile)

```bash
# PostgreSQL container'ini baslat
docker compose up -d

# Durumu kontrol et
docker compose ps

# Loglari gor
docker compose logs -f postgres
```

**Varsayilan Baglanti Bilgileri:**
| Parametre | Deger |
|-----------|-------|
| Host | localhost |
| Port | 5432 |
| Veritabani | securelend |
| Kullanici | securelend |
| Sifre | securelend_dev_2024 |

### 2.2 Veritabani (Docker olmadan)

```bash
# PostgreSQL'de veritabani olustur
createdb securelend
createuser securelend
psql -c "ALTER USER securelend WITH PASSWORD 'securelend_dev_2024';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE securelend TO securelend;"
```

### 2.3 Backend Ortam Degiskenleri

`apps/api/.env` dosyasi:

```env
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL=postgresql://securelend:securelend_dev_2024@localhost:5432/securelend

# Security
TCKN_HASH_PEPPER=a3f8b2c1d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef

# JWT
JWT_SECRET=dev_jwt_secret_change_in_production_a3f8b2c1d4e5f6789012345678abcdef
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Frontend URL
WEB_URL=http://localhost:3000
```

### 2.4 Prisma Islemleri

```bash
cd apps/api

# Migration olustur
npx prisma migrate dev --name aciklama

# Client'i yeniden olustur
npx prisma generate

# Prisma Studio (goruntuleyici)
npx prisma studio

# Veritabanini sifirla (DIKKAT: veri kaybi)
npx prisma migrate reset
```

### 2.5 Build Islemleri

```bash
# Tum projeyi derle
pnpm build

# Sadece backend derle
cd apps/api
./node_modules/.bin/tsc -p tsconfig.build.json --incremental false

# Sadece shared paketi derle
cd packages/shared
pnpm build

# Sadece frontend derle
cd apps/web
pnpm build
```

### 2.6 Servisleri Baslatma

```bash
# Tum servisleri baslat (Turborepo ile)
pnpm dev

# Sadece backend
cd apps/api && pnpm dev

# Sadece frontend
cd apps/web && pnpm dev

# Production modunda backend
cd apps/api && pnpm start:prod
```

---

## 3. Proje Yapisi

```
securelend/
├── apps/
│   ├── api/                          # NestJS Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Veritabani semasi
│   │   │   └── migrations/           # Migration dosyalari
│   │   ├── src/
│   │   │   ├── main.ts               # Uygulama giris noktasi
│   │   │   ├── app.module.ts         # Ana modul
│   │   │   ├── common/
│   │   │   │   ├── filters/          # Exception filtreleri
│   │   │   │   └── interceptors/     # Log interceptor'lari
│   │   │   └── modules/
│   │   │       ├── auth/             # Kimlik dogrulama
│   │   │       ├── user/             # Kullanici yonetimi
│   │   │       ├── application/      # Kredi basvurusu
│   │   │       ├── property/         # Mulk yonetimi
│   │   │       ├── contract/         # Sozlesme yonetimi
│   │   │       ├── payment/          # Odeme yonetimi
│   │   │       ├── bank/             # Banka & KMH islemleri
│   │   │       ├── admin/            # Admin islemleri
│   │   │       ├── notification/     # SMS servisi
│   │   │       ├── encryption/       # Sifreleme
│   │   │       ├── credit-scoring/   # Kredi skorlama
│   │   │       ├── identity-verification/ # KPS dogrulama
│   │   │       ├── prisma/           # Veritabani servisi
│   │   │       └── health/           # Saglik kontrolu
│   │   ├── .env                      # Ortam degiskenleri
│   │   ├── package.json
│   │   └── tsconfig.build.json
│   │
│   └── web/                          # Next.js Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx        # Root layout
│       │   │   ├── page.tsx          # Ana sayfa
│       │   │   ├── auth/             # Giris/Kayit sayfalari
│       │   │   ├── credit-check/     # Kredi kontrol
│       │   │   ├── result/           # Sonuc sayfasi
│       │   │   └── dashboard/        # Kullanici paneli
│       │   │       ├── admin/        # Admin paneli
│       │   │       ├── bank/         # KMH & hesaplar
│       │   │       ├── contracts/    # Sozlesmeler
│       │   │       ├── payments/     # Odemeler
│       │   │       ├── profile/      # Profil
│       │   │       └── properties/   # Mulkler
│       │   ├── components/           # Ortak bilesenler
│       │   └── lib/
│       │       ├── api.ts            # API istemcisi
│       │       └── auth-context.tsx  # Auth React context
│       ├── package.json
│       └── tailwind.config.ts
│
├── packages/
│   └── shared/                       # Paylasilan TypeScript paketi
│       └── src/
│           ├── index.ts              # Export noktasi
│           ├── validation/           # TCKN dogrulama, Zod semalari
│           ├── utils/                # TCKN maskeleme
│           └── types/                # JSend, Application tipleri
│
├── docker-compose.yml                # PostgreSQL container
├── turbo.json                        # Turborepo konfigurasyonu
├── pnpm-workspace.yaml               # pnpm workspace tanimi
└── package.json                      # Root package.json
```

---

## 4. Veritabani

### 4.1 ER Diyagrami (Basitlestirilmis)

```
User (1) ----< (N) KmhApplication
User (1) ----< (N) Property
User (1) ----< (N) BankAccount
User (1) ----< (N) Application (Kredi)

Property (1) ----< (N) Contract

Contract (1) ----< (N) ContractSignature
Contract (1) ----< (N) PaymentSchedule
Contract (1) ----< (1) PaymentOrder
Contract (1) ----< (N) BankAccount (KMH baglanti)

BankAccount (1) ----< (N) BankTransaction (from/to)
PaymentSchedule (1) ---- (1) Commission
PaymentSchedule (1) ---- (1) BankTransaction

User (1) ----< (N) OtpCode
User (1) ----< (N) RefreshToken
User (1) ----< (N) AuditLog
```

### 4.2 Onemli Enum Degerleri

**UserRole:** `TENANT` | `LANDLORD` | `ADMIN`
- Bir kullanici birden fazla role sahip olabilir (roles dizisi)

**ContractStatus:** `DRAFT` -> `PENDING_SIGNATURES` -> `ACTIVE` | `TERMINATED` | `EXPIRED`

**KmhApplicationStatus:** `PENDING` -> `APPROVED` | `REJECTED`

**BankAccountStatus:** `PENDING_OPENING` -> `ACTIVE` | `FROZEN` | `CLOSED`

**PaymentStatus:** `PENDING` -> `PROCESSING` -> `COMPLETED` | `FAILED` | `OVERDUE`

---

## 5. Backend API Kilavuzu

### 5.1 API Yanit Formati (JSend)

Tum API yanitlari JSend formatindadir:

**Basarili Yanit:**
```json
{
  "status": "success",
  "data": { ... }
}
```

**Hata Yaniti (validation):**
```json
{
  "status": "fail",
  "data": {
    "message": "Dogrulama hatasi",
    "errors": [...]
  }
}
```

**Sunucu Hatasi:**
```json
{
  "status": "error",
  "message": "Beklenmeyen bir hata olustu"
}
```

### 5.2 Kimlik Dogrulama Akisi

```
1. POST /api/auth/login      { tckn, phone }     -> OTP gonderilir
2. POST /api/auth/verify-otp  { phone, code }     -> { accessToken, refreshToken }
3. Tum isteklerde Header:  Authorization: Bearer <accessToken>
4. POST /api/auth/refresh     { refreshToken }    -> Yeni token cifti
```

**Gelistirme OTP'si:** Tum kullanicilar icin sabit OTP: `111111`

### 5.3 Guard ve Decorator Kullanimi

```typescript
// Tum route'lar varsayilan olarak JWT korumasialtindadir

// Public route (JWT gerektirmez)
@Public()

// Belirli roller gerektirir
@Roles(UserRole.ADMIN)
@Roles(UserRole.LANDLORD)
@Roles(UserRole.TENANT, UserRole.LANDLORD)

// Mevcut kullaniciyi al
@CurrentUser() user: { id: string; roles: UserRole[] }
```

### 5.4 Yeni Modul Ekleme

```bash
# 1. NestJS CLI ile modul olustur
cd apps/api
npx nest g module modules/yeni-modul
npx nest g controller modules/yeni-modul
npx nest g service modules/yeni-modul

# 2. app.module.ts'e import et
# 3. DTO'lari olustur (class-validator ile)
# 4. Prisma modeli ekle (gerekirse)
```

### 5.5 Abstract Service Deseni

Dis servisler icin abstract sinif + mock uygulama deseni kullanilir:

```typescript
// bank.service.ts (abstract)
export abstract class BankService {
  abstract openKmhAccount(userId: string, ...): Promise<...>;
  abstract notifyContractSigned(contractId: string, kmhAccountId?: string): Promise<...>;
}

// mock-bank.service.ts (gelistirme)
export class MockBankService extends BankService {
  async openKmhAccount(...) { /* mock islem */ }
  async notifyContractSigned(...) { /* mock islem */ }
}

// bank.module.ts (DI konfigurasyonu)
providers: [
  { provide: BankService, useClass: MockBankService },
]
```

---

## 6. Frontend Kilavuzu

### 6.1 Sayfa Yapisi

Next.js 15 App Router kullanilir. Her sayfa `'use client'` direktifi ile client component olarak calisir.

```
src/app/
├── layout.tsx           # <html>, <body>, font, AuthProvider
├── page.tsx             # Landing sayfasi
├── auth/
│   ├── login/page.tsx   # Login formu
│   └── ...
└── dashboard/
    ├── layout.tsx       # Sidebar navigasyon, auth kontrolu
    ├── page.tsx         # Dashboard ana sayfa
    └── ...
```

### 6.2 API Istemcisi

`src/lib/api.ts` dosyasinda merkezi API istemcisi bulunur:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Kullanim ornegi:
const res = await fetch(`${API_URL}/api/contracts`, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
});
const json = await res.json();
// json.data icinde veri gelir
```

### 6.3 Auth Context

`src/lib/auth-context.tsx` React context ile oturum yonetimi saglar:

```typescript
const { user, token, login, logout, isLoading } = useAuth();

// user nesnesi:
{
  id: string;
  fullName: string;
  roles: UserRole[];
  phone: string;
  email?: string;
}
```

### 6.4 Stillendirme

Tailwind CSS kullanilir. Renk paleti:
- Primary: `blue-600` / `blue-700`
- Success: `green-600`
- Danger: `red-600`
- Warning: `yellow-600`
- Background: `gray-50` / `gray-100`
- Card: `white` with `shadow-md rounded-xl`

Ortak card deseni:
```jsx
<div className="bg-white shadow-md rounded-xl p-6">
  <h2 className="text-xl font-bold mb-4">Baslik</h2>
  {/* icerik */}
</div>
```

---

## 7. Kullanici Islemleri Kilavuzu

### 7.1 Kayit ve Giris

1. `/auth/register` sayfasina git
2. TCKN, telefon, ad-soyad, dogum tarihi gir
3. Rol sec: Kiraci veya Ev Sahibi
4. `/auth/login` sayfasinda TCKN ve telefon gir
5. OTP dogrulama sayfasinda kodu gir (dev: `111111`)
6. Dashboard'a yonlendirilirsin

### 7.2 Kiraci - KMH Basvurusu

1. Dashboard'dan "Banka & KMH" sayfasina git
2. "KMH Basvurusu" sekmesinden formu doldur:
   - Istihdam durumu (Calisan, Serbest Meslek vb.)
   - Aylik gelir (TL)
   - Isveren adi (varsa)
   - Ikamet adresi
   - Tahmini aylik kira
3. Basvuruyu gonder
4. Onay kriterleri: Aylik gelir >= Tahmini kira x 2
5. Onaylanirsa "Dijital Onboarding" butonu cikar
6. Onboarding tamamla -> KMH hesap acilir
7. Limit: Aylik gelir x 3 (max 500.000 TL)

### 7.3 Ev Sahibi - Mulk Ekleme

1. Dashboard'dan "Mulklerim" sayfasina git
2. "Yeni Mulk Ekle" formunu doldur:
   - Baslik, adres, sehir, ilce
   - Mulk tipi, oda sayisi, alan (m2)
   - Kat, toplam kat
   - Aylik kira, depozito
3. Kaydet

### 7.4 Ev Sahibi - Sozlesme Olusturma

1. Dashboard'dan "Sozlesmeler" sayfasina git
2. "Yeni Sozlesme" formunu doldur:
   - Mulk sec (listeden)
   - Kiraci TCKN gir
   - Aylik kira, depozito
   - Baslangic/bitis tarihi
   - Odeme gunu (1-28)
   - **IBAN gir** (TR + 24 rakam)
   - Ozel sartlar (opsiyonel)
3. "Sozlesme Olustur" butonuna bas
4. Sozlesme DRAFT durumunda olusur

### 7.5 Sozlesme Imzalama

**Ev Sahibi (1. imza):**
1. Sozlesme detay sayfasina git
2. "Sozlesmeyi Imzala" butonuna bas
3. Sozlesme PENDING_SIGNATURES durumuna gecer

**Kiraci (2. imza):**
1. Sozlesme detay sayfasina git
2. KMH hesaplarinin listesini gor
3. Uygun KMH hesabini sec (limit >= kira)
4. "Sozlesmeyi Imzala" butonuna bas
5. Sozlesme ACTIVE durumuna gecer
6. PaymentOrder otomatik olusturulur

### 7.6 Odeme Takibi

- Dashboard'dan "Odemeler" sayfasina git
- Gecmis ve gelecek odemeleri gor
- Her odeme icin durum: PENDING, COMPLETED, FAILED, OVERDUE

---

## 8. API Endpoint Referansi

### 8.1 Auth Endpoints

| Method | Endpoint | Aciklama | Auth |
|--------|----------|----------|------|
| POST | `/api/auth/register` | Yeni kullanici kaydi | Hayir |
| POST | `/api/auth/login` | TCKN+telefon ile giris (OTP gonderir) | Hayir |
| POST | `/api/auth/verify-otp` | OTP dogrulama, token al | Hayir |
| POST | `/api/auth/refresh` | Token yenileme | Hayir |

**Register Body:**
```json
{
  "tckn": "10000000146",
  "phone": "5551112233",
  "fullName": "Test Kullanici",
  "dateOfBirth": "1990-01-15",
  "roles": ["LANDLORD"]
}
```

**Login Body:**
```json
{
  "tckn": "10000000146",
  "phone": "5551112233"
}
```

**Verify OTP Body:**
```json
{
  "phone": "5551112233",
  "code": "111111"
}
```

### 8.2 User Endpoints

| Method | Endpoint | Aciklama | Auth |
|--------|----------|----------|------|
| GET | `/api/users/me` | Mevcut kullanici bilgisi | JWT |
| PATCH | `/api/users/me` | Profil guncelle | JWT |
| GET | `/api/users/:id` | Kullanici detayi | JWT |
| POST | `/api/users/add-role` | Rol ekle | JWT |

### 8.3 Property Endpoints

| Method | Endpoint | Aciklama | Auth |
|--------|----------|----------|------|
| GET | `/api/properties` | Mulkleri listele | JWT (LANDLORD) |
| POST | `/api/properties` | Yeni mulk ekle | JWT (LANDLORD) |
| GET | `/api/properties/:id` | Mulk detayi | JWT |
| PATCH | `/api/properties/:id` | Mulk guncelle | JWT (LANDLORD) |

**Create Property Body:**
```json
{
  "title": "Kadikoy 2+1 Daire",
  "addressLine1": "Caferaga Mah. Moda Cad. No:42",
  "city": "Istanbul",
  "district": "Kadikoy",
  "propertyType": "APARTMENT",
  "roomCount": 3,
  "areaM2": 85,
  "floor": 3,
  "totalFloors": 5,
  "monthlyRent": 15000,
  "depositAmount": 30000
}
```

### 8.4 Contract Endpoints

| Method | Endpoint | Aciklama | Auth |
|--------|----------|----------|------|
| GET | `/api/contracts` | Sozlesmeleri listele | JWT |
| POST | `/api/contracts` | Yeni sozlesme olustur | JWT (LANDLORD) |
| GET | `/api/contracts/:id` | Sozlesme detayi | JWT |
| POST | `/api/contracts/:id/sign` | Sozlesme imzala | JWT |
| POST | `/api/contracts/:id/terminate` | Sozlesme feshet | JWT |

**Create Contract Body:**
```json
{
  "propertyId": "uuid",
  "tenantTckn": "10000000078",
  "monthlyRent": 15000,
  "depositAmount": 30000,
  "startDate": "2026-03-01",
  "endDate": "2027-03-01",
  "paymentDayOfMonth": 1,
  "landlordIban": "TR000000000000000000000001",
  "terms": "Standart kira sozlesmesi sartlari",
  "specialClauses": "Evcil hayvan serbesttir"
}
```

**Sign Contract Body (Kiraci):**
```json
{
  "kmhAccountId": "uuid"
}
```

### 8.5 Bank / KMH Endpoints

| Method | Endpoint | Aciklama | Auth |
|--------|----------|----------|------|
| POST | `/api/bank/kmh/apply` | KMH basvurusu | JWT (TENANT) |
| GET | `/api/bank/kmh/applications` | KMH basvurulari listesi | JWT |
| GET | `/api/bank/kmh/applications/:id` | KMH basvuru detayi | JWT |
| POST | `/api/bank/kmh/onboarding/:applicationId` | Dijital onboarding | JWT |
| GET | `/api/bank/accounts` | Banka hesaplari listesi | JWT |
| GET | `/api/bank/accounts/:id` | Hesap detayi | JWT |
| POST | `/api/bank/transfer` | Para transferi | JWT |
| GET | `/api/bank/payment-orders` | Odeme emirleri | JWT |

**KMH Apply Body:**
```json
{
  "employmentStatus": "EMPLOYED",
  "monthlyIncome": 45000,
  "employerName": "Tech A.S.",
  "residentialAddress": "Kadikoy, Istanbul",
  "estimatedRent": 15000
}
```

### 8.6 Payment Endpoints

| Method | Endpoint | Aciklama | Auth |
|--------|----------|----------|------|
| GET | `/api/payments` | Odeme gecmisi | JWT |
| GET | `/api/payments/:id` | Odeme detayi | JWT |
| POST | `/api/payments/:id/pay` | Odeme yap | JWT |

### 8.7 Admin Endpoints

| Method | Endpoint | Aciklama | Auth |
|--------|----------|----------|------|
| GET | `/api/admin/dashboard` | Admin dashboard verileri | JWT (ADMIN) |
| GET | `/api/admin/users` | Tum kullanicilar | JWT (ADMIN) |
| PATCH | `/api/admin/users/:id/role` | Rol degistir | JWT (ADMIN) |
| GET | `/api/admin/contracts` | Tum sozlesmeler | JWT (ADMIN) |
| GET | `/api/admin/payments` | Tum odemeler | JWT (ADMIN) |
| GET | `/api/admin/commissions` | Komisyon raporu | JWT (ADMIN) |

### 8.8 Diger Endpoints

| Method | Endpoint | Aciklama | Auth |
|--------|----------|----------|------|
| GET | `/api/health` | Saglik kontrolu | Hayir |
| POST | `/api/applications` | Kredi basvurusu | Hayir |
| GET | `/api/applications/:id` | Basvuru sonucu | Hayir |

---

## 9. Test Kullanicilari

### 9.1 Hazir Test Kullanicilari

| Rol | Ad | TCKN | Telefon | OTP |
|-----|----|------|---------|-----|
| ADMIN | Admin | 10000000146 | 5000000000 | 111111 |
| LANDLORD | Test Kullanici | 11111111110 | 5551112233 | 111111 |
| LANDLORD | Eray | 20687068490 | 5324761538 | 111111 |
| TENANT | Kiraci Ali | 10000000078 | 5559998877 | 111111 |
| TENANT | Fatma Demir | 60000000028 | 5559876543 | 111111 |

### 9.2 API ile Test (cURL)

```bash
API="http://localhost:4000"

# 1. Login
curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"tckn":"10000000078","phone":"5559998877"}'

# 2. OTP Dogrula
TOKEN=$(curl -s -X POST "$API/api/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone":"5559998877","code":"111111"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# 3. Profil Bilgisi Al
curl -s "$API/api/users/me" \
  -H "Authorization: Bearer $TOKEN"

# 4. KMH Basvurusu
curl -s -X POST "$API/api/bank/kmh/apply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "employmentStatus": "EMPLOYED",
    "monthlyIncome": 45000,
    "employerName": "Tech AS",
    "residentialAddress": "Istanbul",
    "estimatedRent": 15000
  }'
```

### 9.3 Swagger UI

http://localhost:4000/api/docs adresinden Swagger arayuzune erisilir.

1. Herhangi bir kullanici ile login + verify-otp yapin
2. Swagger sayfasinda sag ustteki "Authorize" butonuna tiklayin
3. `Bearer <accessToken>` formatinda token girin
4. Artik tum endpoint'leri test edebilirsiniz

---

## 10. Sik Karsilasilan Sorunlar

### 10.1 "Failed to fetch" Hatasi

**Sorun:** Frontend'den API'ye istek atildiginda "Failed to fetch" hatasi.

**Cozum:** CORS ayarlarini kontrol edin. `apps/api/src/main.ts` dosyasinda frontend URL'inin origin listesinde oldugunundan emin olun:

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',  // frontend farkli portta calisiyorsa
    process.env.WEB_URL,
  ].filter(Boolean),
});
```

### 10.2 Rate Limit (429) Hatasi

**Sorun:** Test sirasinda cok fazla istek atinca 429 Too Many Requests hatasi.

**Cozum:** Gelistirme ortaminda ThrottlerGuard'i devre disi birakin. `apps/api/src/app.module.ts` dosyasinda:

```typescript
// providers dizisinde ThrottlerGuard satirini yorum yaptin:
// {
//   provide: APP_GUARD,
//   useClass: ThrottlerGuard,
// },
```

### 10.3 Prisma Client Uyumsuzlugu

**Sorun:** Schema degisikliginden sonra "Unknown field" veya tip hatalari.

**Cozum:**
```bash
cd apps/api
npx prisma generate     # Client'i yeniden olustur
npx prisma migrate dev  # Migration'lari uygula
```

### 10.4 JWT Token Suresi Dolmus

**Sorun:** 401 Unauthorized hatasi.

**Cozum:** Access token 15 dakikada dolar. Refresh token ile yenileyin:
```bash
curl -X POST "$API/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'
```

### 10.5 KMH Basvurusu Reddedildi

**Sorun:** KMH basvurusu REJECTED olarak donuyor.

**Cozum:** Degerlendirme kriteri: `monthlyIncome >= estimatedRent * 2`. Gelir tutarini en az tahmini kiranin 2 kati olarak girin.

### 10.6 Kiraci Sozlesme Imzalayamiyor

**Sorun:** "Aktif KMH hesabiniz bulunmuyor" hatasi.

**Cozum:**
1. Kiracinin onaylanmis KMH basvurusu oldugundan emin olun
2. Dijital onboarding tamamlanmis olmali
3. KMH hesap durumu ACTIVE olmali
4. KMH limiti >= sozlesme aylik kirasi olmali

### 10.7 Port Cakismasi

**Sorun:** "EADDRINUSE" hatasi.

**Cozum:**
```bash
# Portu kullanan islemi bul ve durdur
lsof -i :4000  # backend portu
lsof -i :3000  # frontend portu
kill -9 <PID>
```

---

## 11. Gelistirici Notlari

### 11.1 Kod Standartlari

- **Dil:** Tum kod Ingilizce, UI metinleri Turkce
- **Format:** TypeScript strict mode
- **API Yanit:** JSend formati (status + data/message)
- **DTO:** class-validator ile dogrulama
- **Hata:** AllExceptionsFilter ile JSend formatlama
- **Log:** TCKN/telefon/OTP otomatik maskelenir

### 11.2 Gercek Servislere Gecis

Mock servisleri gercek entegrasyonlarla degistirmek icin:

1. Gercek servis sinifini olusturun (abstract'i implement edin)
2. Ilgili module dosyasinda `useClass`'i degistirin:

```typescript
// bank.module.ts
providers: [
  {
    provide: BankService,
    useClass: process.env.NODE_ENV === 'production'
      ? RealBankService
      : MockBankService,
  },
]
```

Degistirilecek servisler:
- `MockBankService` -> Gercek banka API'si
- `MockSmsService` -> Netgsm / Iletimerkezi
- `MockCreditScoringService` -> KKB / Findeks
- `MockIdentityVerificationService` -> E-Devlet KPS

### 11.3 Onemli Dosyalar

| Dosya | Aciklama |
|-------|----------|
| `apps/api/src/main.ts` | CORS, Swagger, global pipe/filter |
| `apps/api/src/app.module.ts` | Tum modul importlari, guards |
| `apps/api/prisma/schema.prisma` | Veritabani semasi |
| `apps/web/src/lib/api.ts` | Frontend API istemcisi |
| `apps/web/src/lib/auth-context.tsx` | Oturum yonetimi |
| `packages/shared/src/index.ts` | Paylasilan yardimci fonksiyonlar |

### 11.4 Faydali Komutlar

```bash
# Veritabanina dogrudan erisim
psql -h localhost -U securelend -d securelend

# Tablolari listele
\dt

# Belirli bir tabloyu sorgula
SELECT * FROM users;
SELECT * FROM contracts WHERE status = 'ACTIVE';
SELECT * FROM bank_accounts WHERE account_type = 'KMH';
SELECT * FROM payment_orders;

# Prisma Studio ile gorsel veritabani yonetimi
cd apps/api && npx prisma studio
```

---

*SecureLend v0.1.0 - Gelistirici ve Kullanici Kilavuzu*
*Son Guncelleme: Subat 2026*
