# Frontend Component'ler

## Reusable Component'ler (apps/web/src/components/)

| Component | Dosya | Amaç | Kullanıldığı Yerler |
|-----------|-------|------|---------------------|
| Navbar | `navbar.tsx` | Ana navigasyon (logo, linkler, profil dropdown) | Tüm dashboard sayfaları |
| Logo | `logo.tsx` | Marka logosu | Auth sayfaları, homepage |
| SiteNav | `site-nav.tsx` | Sidebar navigasyon | Dashboard layout |
| OnboardingWizard | `onboarding-wizard.tsx` | Çok adımlı onboarding (rol seçimi, mülk ekleme, kiracı davet) | Dashboard ilk giriş |
| KpsVerification | `kps-verification.tsx` | KPS kimlik doğrulama wrapper | /kps sayfası |
| TcknForm | `tckn-form.tsx` | TCKN giriş + kredi kontrol formu | /credit-check sayfası |
| ResultApproved | `result-approved.tsx` | Onay sonuç ekranı (limit gösterimi) | /result sayfası |
| ResultRejected | `result-rejected.tsx` | Red sonuç ekranı | /result sayfası |
| AnalyticsProvider | `analytics-provider.tsx` | Analytics tracking wrapper | app/layout.tsx (global) |

## Context'ler

| Context | Dosya | Amaç |
|---------|-------|------|
| AuthProvider | `lib/auth-context.tsx` | Kimlik doğrulama durumu (login, register, verifyOtp, logout, token yönetimi) |

## Utility'ler

| Dosya | Amaç |
|-------|------|
| `lib/api.ts` | API client (fetch wrapper, token refresh, error handling) |
| `lib/version.ts` | Uygulama versiyon bilgisi |

## Onboarding Wizard Adımları
1. Rol seçimi (TENANT / LANDLORD / her ikisi)
2. (Landlord) Mülk ekleme formu
3. (Landlord) Kiracı davet (telefon ile arama)
4. Tamamlama + özet

## Navbar Linkleri
- Panel (/dashboard)
- Mülkler (/dashboard/properties)
- Sözleşmeler (/dashboard/contracts)
- Ödemeler (/dashboard/payments)
- Banka (/dashboard/bank)
- Admin (/dashboard/admin) — sadece ADMIN rolü

## Kritik Kurallar
- Tüm component'ler client-side ('use client' directive)
- Tailwind CSS sınıfları kullanılır, inline CSS yok
- Türkçe UI label'ları (ö, ü, ç, ş, ğ, ı, İ doğru kullanılmalı)
- Form validation: react-hook-form + zod
- DOMPurify: user-generated HTML sanitize edilir

## Son Değişiklik
[2026-04-13] Sözleşme oluşturma wizard güncellendi
