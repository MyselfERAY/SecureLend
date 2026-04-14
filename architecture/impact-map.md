# SecureLend — Modüller Arası Bağımlılık ve Etki Haritası

> Bir modül değiştiğinde neyin etkileneceğini gösterir.
> Dev Agent ve Claude Code bu dosyayı etki analizi için kullanır.

## Bağımlılık Grafiği

### Çekirdek Bağımlılıklar (Değişiklik yüksek etkili)

```
prisma (Global) ──────────► TÜM MODÜLLER
encryption (Global) ──────► auth, application, user
notification (Global) ────► auth (OTP SMS), onboarding, chat, payment, contract, bank
in-app-notification (G) ──► chat, payment, contract, bank
push-notification (G) ────► in-app-notification
```

### İş Akışı Bağımlılıkları

```
auth ─────► user (profil), contract (imza), bank (başvuru), payment (ödeme)
           │
           └─► identity-verification (KPS), encryption (TCKN hash), promo (referral)

user ─────► property (LANDLORD rolü), contract (tenant/landlord), bank (hesap)

property ──► contract (propertyId bağlantısı)

contract ──► payment (ödeme takvimi oluşturma)
           ├► bank (KMH hesap bağlama)
           ├► chat (sözleşme sohbet odası)
           ├► commission (ödeme komisyonu)
           └► notification (sözleşme bildirimleri)

payment ───► bank (hesap transferi)
           ├► commission (komisyon hesaplama)
           └► notification (ödeme bildirimleri)

bank ──────► notification (KMH durum bildirimleri)
```

### Agent Bağımlılıkları

```
agent-run ◄── PO Agent, Marketing Agent, Dev Agent, Health Agent, Article Agent
suggestion ◄── Health Agent (oluşturur) ──► Dev Agent (implement eder)
po-agent ◄── PO Agent workflow
marketing-agent ◄── Marketing Agent workflow
article ◄── Article Agent workflow
analytics ──► Health Agent (api-dashboard verisi okur)
```

---

## Etki Analizi Tablosu

Bir modülde değişiklik yapıldığında kontrol edilmesi gereken diğer modüller:

| Değişen Modül | Kontrol Et | Neden |
|---------------|-----------|-------|
| **auth** | user, contract, bank, payment, promo | JWT payload değişirse tüm authenticated modüller etkilenir |
| **user** | auth (register), contract, property, admin | User model field değişikliği yaygın etki yaratır |
| **contract** | payment, bank, chat, notification, admin, frontend (3 sayfa) | Sözleşme yaşam döngüsü birçok modüle bağlı |
| **payment** | bank, commission, notification, admin, frontend (2 sayfa) | Ödeme akışı finansal doğruluğu etkiler |
| **bank** | contract (KMH seçimi), payment (transfer), notification | Banka hesap yapısı değişikliği geniş etki |
| **property** | contract (propertyId), admin, frontend (1 sayfa) | Mülk alanları sözleşmeye yansır |
| **prisma (schema)** | TÜM MODÜLLER | Model değişikliği herkesi etkiler — migration gerekir |
| **shared package** | api + web (tüm importlar) | Type/validation değişikliği build kırabilir |
| **notification** | auth, chat, payment, contract, bank, onboarding | Global servis — interface değişikliği yaygın |
| **analytics** | health-agent workflow, admin frontend | Dashboard veri formatı değişikliği |
| **suggestion** | dev-agent workflow, health-agent workflow, admin frontend | Status/priority enum değişikliği |

---

## Build Sırası ve Workspace Bağımlılıkları

```
1. packages/shared    → İlk build (type'lar ve validation)
2. apps/api          → İkinci (prisma generate → build)
3. apps/web          → Son (shared type'lara bağlı)
```

### Kritik Zincir
```
shared type değişti → api + web rebuild gerekir
prisma schema değişti → prisma generate → api rebuild
api endpoint değişti → web API client kontrolü
```

---

## Frontend ↔ Backend Bağlantı Noktaları

| Frontend Sayfası | Backend Modülü | API Endpoint'leri |
|-----------------|----------------|-------------------|
| `/dashboard` | user, contract, payment | dashboard, contracts, payments/my |
| `/dashboard/contracts` | contract, property, user | contracts, properties/my, users/search |
| `/dashboard/contracts/[id]` | contract, payment, bank | contracts/:id, sign, terminate, pdf, payments |
| `/dashboard/payments` | payment | payments/my, payments/:id/process |
| `/dashboard/bank` | bank | kmh/*, accounts/* |
| `/dashboard/properties` | property | properties/* |
| `/dashboard/profile` | user | users/me, roles, kyc |
| `/auth/*` | auth | register, login, verify-otp |
| `/credit-check` | application | applications |
| `/rehber/*` | article | articles, articles/:slug |

---

## Yüksek Riskli Değişiklik Alanları

1. **Prisma Schema** — Migration gerektirir, tüm modülleri etkiler. Protected dosya.
2. **Auth JWT Payload** — Payload yapısı değişirse tüm guard'lar ve decorator'lar etkilenir.
3. **Shared Package Types** — api-response.ts veya application.ts değişirse hem api hem web rebuild.
4. **Payment İş Mantığı** — Komisyon hesaplama, banka transferi — finansal doğruluk kritik.
5. **Notification Interface** — Global servis, interface değişikliği 6+ modülü etkiler.
