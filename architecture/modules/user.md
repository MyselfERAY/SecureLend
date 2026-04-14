# User Module

## Sorumluluk
Kullanıcı profili yönetimi, rol bazlı dashboard aggregation, KYC tamamlama, rol ekleme.

## Dosyalar
- `user.service.ts` — profil CRUD, dashboard veri toplama
- `user.controller.ts` — endpoint handler
- `user.repository.ts` — PrismaUserRepository (abstract)
- `dto/update-profile.dto.ts` — UpdateProfileDto: fullName, email, address
- `dto/add-role.dto.ts` — AddRoleDto: role (TENANT | LANDLORD)

## Endpoint'ler
- `GET /api/v1/users/dashboard` — Rol bazlı dashboard (tenant/landlord metrikleri) [Auth]
- `GET /api/v1/users/search?phone=` — Telefon ile kullanıcı ara [LANDLORD/ADMIN, 2/30sec]
- `GET /api/v1/users/me` — Profil bilgisi [Auth]
- `PATCH /api/v1/users/me` — Profil güncelle [Auth, 2/5sec]
- `POST /api/v1/users/me/roles` — Rol ekle (TENANT/LANDLORD) [Auth, 1/10sec]
- `POST /api/v1/users/me/onboarding-complete` — Onboarding tamamla [Auth, 2/5sec]
- `POST /api/v1/users/me/kyc` — KYC doğrulama başlat [Auth, 1/30sec]

## Bağımlılıklar
- **İçeri:** PrismaService, PrismaUserRepository
- **Dışarı:** auth (JWT payload'daki userId), contract (tenantId/landlordId), bank (userId), admin (kullanıcı listesi)

## Kritik Kurallar
- Dashboard verisi role'e göre farklı döner (tenant: kira ödemeleri, landlord: mülk gelirleri)
- TCKN her zaman masked gösterilir (tcknMasked field)
- Roller kümülatif: bir kullanıcı hem TENANT hem LANDLORD olabilir
- Push token kaydetme ayrı endpoint: POST /api/v1/users/push-token

## Son Değişiklik
[2026-04-12] Tenant reliability score entegrasyonu
