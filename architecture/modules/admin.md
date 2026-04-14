# Admin Module

## Sorumluluk
Yönetici dashboard'ları: genel istatistikler, kullanıcı/sözleşme/ödeme listeleri, komisyon raporları, aktivasyon hunisi.

## Dosyalar
- `admin.service.ts` — istatistik aggregation, hunisi hesaplama
- `admin.controller.ts` — endpoint handler

## Endpoint'ler
- `GET /api/v1/admin/overview` — Genel istatistikler (kullanıcı, sözleşme, ödeme, KMH) [ADMIN]
- `GET /api/v1/admin/users` — Sayfalı kullanıcı listesi (KYC durumu ile) [ADMIN]
- `GET /api/v1/admin/contracts` — Sayfalı sözleşme listesi [ADMIN]
- `GET /api/v1/admin/payments` — Sayfalı ödeme listesi [ADMIN]
- `GET /api/v1/admin/activation-funnel` — 7 adımlı aktivasyon hunisi [ADMIN]
- `GET /api/v1/admin/commissions` — Komisyon raporu (aylık/haftalık) [ADMIN]
- `GET /api/v1/admin/commissions/export` — Komisyon CSV export [ADMIN]

## Bağımlılıklar
- **İçeri:** PrismaService (doğrudan DB sorgulama)
- **Dışarı:** Frontend admin dashboard sayfaları

## Aktivasyon Hunisi (7 adım)
1. Kayıt (registration)
2. Telefon doğrulama
3. Mülk ekleme
4. Sözleşme oluşturma
5. Sözleşme imzalama
6. KMH başvurusu
7. İlk ödeme

## Kritik Kurallar
- Tüm endpoint'ler ADMIN rolü gerektirir
- Overview istatistikleri cached değil, her çağrıda hesaplanır
- Komisyon export CSV formatında döner
- Pagination: page + limit query parametreleri

## Son Değişiklik
[2026-04-11] Aktivasyon hunisi eklendi
