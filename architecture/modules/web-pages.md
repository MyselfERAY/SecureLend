# Frontend Sayfa Haritası

## API Client (lib/api.ts)
- Base URL: `NEXT_PUBLIC_API_URL` (prod: relative path, dev: localhost:4000)
- Auth: Bearer token + httpOnly refresh token cookie
- 401'de otomatik token refresh → başarısızsa `/auth/login?expired=1`'e redirect
- Credentials: 'include' (cookie desteği)

## Middleware (middleware.ts)
- `/dashboard/*` route'ları korumalı
- `__rt` (refresh token) cookie kontrolü
- Yoksa → `/auth/login` redirect

---

## Public Sayfalar

| Route | Dosya | Amaç | API Kullanımı |
|-------|-------|------|---------------|
| `/` | `app/page.tsx` | Landing page, özellikler, adımlar, testimonial | `GET /articles/latest?limit=3` |
| `/credit-check` | `app/credit-check/page.tsx` | TCKN ile kredi uygunluk kontrolü | `POST /applications` |
| `/kps` | `app/kps/page.tsx` | KPS kimlik doğrulama demo | — |
| `/result` | `app/result/page.tsx` | Kredi sonucu (onay/red) | — |
| `/fiyatlandirma` | `app/fiyatlandirma/page.tsx` | Fiyatlandırma sayfası | — |
| `/sablonlar` | `app/sablonlar/page.tsx` | Şablonlar | — |
| `/rehber` | `app/rehber/page.tsx` | Rehber makale listesi | `GET /articles` |
| `/rehber/[slug]` | `app/rehber/[slug]/page.tsx` | Makale detay | `GET /articles/:slug` |

## Auth Sayfaları

| Route | Amaç | API |
|-------|------|-----|
| `/auth/login` | TCKN + telefon ile giriş | `POST /auth/login` |
| `/auth/register` | Yeni kayıt (TCKN + rıza) | `POST /auth/register` |
| `/auth/verify-otp` | 6 haneli OTP doğrulama | `POST /auth/verify-otp` |

## Legal Sayfalar (Statik İçerik)

| Route | Amaç |
|-------|------|
| `/kvkk` | KVKK Aydınlatma Metni |
| `/gizlilik` | Gizlilik Politikası |
| `/kullanim-kosullari` | Kullanım Koşulları |
| `/veri-talebi` | Veri Talebi Formu |
| `/acik-riza` | Açık Rıza Metni |
| `/cerez-politikasi` | Çerez Politikası |

## Dashboard Sayfaları (Auth Gerekli)

| Route | Amaç | API |
|-------|------|-----|
| `/dashboard` | Ana panel (rol bazlı) | `GET /users/dashboard`, `GET /contracts`, `GET /payments/my` |
| `/dashboard/profile` | Profil yönetimi | `GET/PATCH /users/me`, `POST /users/me/roles`, `POST /users/me/kyc` |
| `/dashboard/properties` | Mülk yönetimi | `GET/POST/PATCH/DELETE /properties/*` |
| `/dashboard/contracts` | Sözleşme listesi + oluşturma | `GET/POST /contracts`, `GET /properties/my`, `GET /users/search` |
| `/dashboard/contracts/[id]` | Sözleşme detay, imza, fesih | `GET /contracts/:id`, `POST /contracts/:id/sign`, `GET /contracts/:id/pdf` |
| `/dashboard/payments` | Ödeme takibi | `GET /payments/my`, `POST /payments/:id/process` |
| `/dashboard/bank` | KMH başvuru + hesaplar | `GET/POST /bank/kmh/*`, `GET /bank/accounts/*` |
| `/dashboard/referral` | Referral programı | `GET /promos/referral` |
| `/dashboard/tenant-score` | Kiracı güvenilirlik skoru | `GET /tenant-score/me` |
| `/dashboard/notifications` | Bildirim merkezi | `GET /notifications`, `PATCH /notifications/*/read` |

## Admin Sayfaları (ADMIN Rolü Gerekli)

| Route | Amaç |
|-------|------|
| `/dashboard/admin` | Admin genel bakış |
| `/dashboard/admin/users` | Kullanıcı yönetimi |
| `/dashboard/admin/contracts` | Tüm sözleşmeler |
| `/dashboard/admin/payments` | Ödeme işlemleri |
| `/dashboard/admin/commissions` | Gelir/komisyon raporu |
| `/dashboard/admin/support` | Destek mesajları |
| `/dashboard/admin/articles` | Makale yayınlama |
| `/dashboard/admin/suggestions` | Geliştirme önerileri |
| `/dashboard/admin/po` | PO günlük raporu |
| `/dashboard/admin/marketing` | Pazarlama raporları |
| `/dashboard/admin/tasks` | Görev takibi |
| `/dashboard/admin/agents` | Agent KPI |
| `/dashboard/admin/promos` | Promosyon yönetimi |
| `/dashboard/admin/analytics` | Site analitik |
| `/dashboard/admin/newsletter` | Bülten yönetimi |

---

## Tema / Stil
- Framework: Tailwind CSS
- Dashboard: Dark tema (#0d1b2a, slate-700 border)
- Public: Light tema (beyaz/gri)
- Primary: blue-600 (#1d4ed8)
- Status renkleri: green (aktif), yellow (bekleyen), red (gecikmiş/hata)

## Son Değişiklik
[2026-04-13] Dashboard sözleşme oluşturma wizard'ı güncellendi
