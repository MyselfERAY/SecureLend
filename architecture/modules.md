# SecureLend — Modül Haritası (Router)

> Bu dosya tüm modüllerin özetini ve routing tablosunu içerir.
> Detay için `modules/<modül-adı>.md` dosyasına bak.

## Nasıl Kullanılır

1. Görevin hangi modülle ilgili olduğunu bu tabloda bul
2. İlgili `modules/<modül>.md` dosyasını oku
3. Gerekirse `impact-map.md`'den etki analizini kontrol et

---

## API Modülleri (28 modül)

### Çekirdek İş Mantığı

| Modül | Yol | Amaç | Detay |
|-------|-----|------|-------|
| auth | `modules/auth/` | Telefon OTP ile kimlik doğrulama, JWT token yönetimi | [modules/auth.md](modules/auth.md) |
| user | `modules/user/` | Kullanıcı profili, dashboard, KYC, rol yönetimi | [modules/user.md](modules/user.md) |
| contract | `modules/contract/` | Kira sözleşmesi yaşam döngüsü, imza, PDF | [modules/contract.md](modules/contract.md) |
| payment | `modules/payment/` | Kira ödeme işleme, takvim, komisyon hesaplama | [modules/payment.md](modules/payment.md) |
| bank | `modules/bank/` | KMH başvuru, banka hesabı, KYC doğrulama | [modules/bank.md](modules/bank.md) |
| property | `modules/property/` | Mülk ilanı CRUD, arama, filtreleme | [modules/property.md](modules/property.md) |

### Kullanıcı Etkileşimi

| Modül | Yol | Amaç | Detay |
|-------|-----|------|-------|
| chat | `modules/chat/` | Sözleşme ve destek sohbet odaları | [modules/chat.md](modules/chat.md) |
| in-app-notification | `modules/in-app-notification/` | Uygulama içi bildirimler (Global) | [modules/notification.md](modules/notification.md) |
| push-notification | `modules/push-notification/` | Expo push notification (Global) | [modules/notification.md](modules/notification.md) |
| notification | `modules/notification/` | SMS ve email servis soyutlaması (Global) | [modules/notification.md](modules/notification.md) |

### İçerik ve Pazarlama

| Modül | Yol | Amaç | Detay |
|-------|-----|------|-------|
| article | `modules/article/` | Blog/rehber içerik yönetimi | [modules/article.md](modules/article.md) |
| newsletter | `modules/newsletter/` | Email bülten aboneliği | [modules/promo.md](modules/promo.md) |
| promo | `modules/promo/` | Promosyon/indirim/referral yönetimi | [modules/promo.md](modules/promo.md) |

### Agent Sistemi

| Modül | Yol | Amaç | Detay |
|-------|-----|------|-------|
| agent-run | `modules/agent-run/` | Agent çalışma kayıtları, istatistikler | [modules/agent-system.md](modules/agent-system.md) |
| suggestion | `modules/suggestion/` | Geliştirme önerileri (Dev Agent task list) | [modules/agent-system.md](modules/agent-system.md) |
| po-agent | `modules/po-agent/` | Product Owner raporları, backlog | [modules/agent-system.md](modules/agent-system.md) |
| marketing-agent | `modules/marketing-agent/` | Pazarlama raporları, görev yönetimi | [modules/agent-system.md](modules/agent-system.md) |

### Başvuru ve Doğrulama

| Modül | Yol | Amaç | Detay |
|-------|-----|------|-------|
| application | `modules/application/` | Kredi ön başvuru (TCKN + skor) | [modules/application.md](modules/application.md) |
| credit-scoring | `modules/credit-scoring/` | KKB kredi skoru (mock) | [modules/application.md](modules/application.md) |
| identity-verification | `modules/identity-verification/` | KPS kimlik doğrulama (mock) | [modules/application.md](modules/application.md) |
| encryption | `modules/encryption/` | TCKN hash ve veri şifreleme (Global) | [modules/application.md](modules/application.md) |
| tenant-score | `modules/tenant-score/` | Kiracı güvenilirlik skoru | [modules/application.md](modules/application.md) |

### Yasal Uyumluluk

| Modül | Yol | Amaç | Detay |
|-------|-----|------|-------|
| consent | `modules/consent/` | KVKK rıza kaydı | [modules/consent.md](modules/consent.md) |
| onboarding | `modules/onboarding/` | Otomatik onboarding hatırlatmaları | [modules/consent.md](modules/consent.md) |

### Altyapı

| Modül | Yol | Amaç | Detay |
|-------|-----|------|-------|
| prisma | `modules/prisma/` | Veritabanı bağlantısı (Global) | Dahili servis |
| health | `modules/health/` | Sağlık kontrolü (`GET /health`) | Dahili servis |
| admin | `modules/admin/` | Yönetici dashboard ve raporlar | [modules/admin.md](modules/admin.md) |
| analytics | `modules/analytics/` | Frontend + API analitik toplama | [modules/analytics.md](modules/analytics.md) |

---

## Frontend Sayfa Grupları

| Grup | Yol | Sayfa Sayısı | Detay |
|------|-----|-------------|-------|
| Public | `/`, `/credit-check`, `/kps`, `/result` | 4 | [modules/web-pages.md](modules/web-pages.md) |
| Auth | `/auth/login`, `/auth/register`, `/auth/verify-otp` | 3 | [modules/web-pages.md](modules/web-pages.md) |
| Legal | `/kvkk`, `/gizlilik`, `/kullanim-kosullari`, vb. | 6 | [modules/web-pages.md](modules/web-pages.md) |
| İçerik | `/rehber`, `/rehber/[slug]`, `/sablonlar`, `/fiyatlandirma` | 4 | [modules/web-pages.md](modules/web-pages.md) |
| Dashboard | `/dashboard`, `/dashboard/profile`, vb. | 11 | [modules/web-pages.md](modules/web-pages.md) |
| Admin | `/dashboard/admin/*` | 14 | [modules/web-pages.md](modules/web-pages.md) |

---

## Global Yapılandırma

- **Guards:** ThrottlerGuard → JwtAuthGuard → RolesGuard (tüm route'lara uygulanır)
- **Filter:** AllExceptionsFilter (JSend format hata yanıtları)
- **Interceptor:** LoggingInterceptor (analytics'e API request kayıt)
- **Global Modüller:** PrismaModule, EncryptionModule, NotificationModule, InAppNotificationModule, PushNotificationModule
