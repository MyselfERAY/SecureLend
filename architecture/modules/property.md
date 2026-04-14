# Property Module

## Sorumluluk
Kiralık mülk ilanı CRUD, arama/filtreleme, ev sahibi mülk yönetimi.

## Dosyalar
- `property.service.ts` — mülk CRUD, arama
- `property.controller.ts` — endpoint handler
- `dto/create-property.dto.ts` — CreatePropertyDto: title, addressLine1/2, city, district, neighborhood, street, postalCode, propertyType, roomCount, areaM2, floor, totalFloors, monthlyRent, depositAmount, description

## Endpoint'ler
- `POST /api/v1/properties` — Mülk ekle [Auth, 2/10sec]
- `GET /api/v1/properties/my` — Mülklerim [Auth]
- `GET /api/v1/properties/search?city=&district=&minRent=&maxRent=` — Ara [Auth, 50 limit]
- `GET /api/v1/properties/:id` — Mülk detayı [Auth]
- `PATCH /api/v1/properties/:id` — Güncelle [Auth, 2/10sec]
- `DELETE /api/v1/properties/:id` — Pasifleştir [Auth, 1/10sec]

## Bağımlılıklar
- **İçeri:** PrismaService
- **Dışarı:** contract (sözleşme oluştururken propertyId gerekir), admin (mülk istatistikleri)

## Kritik Kurallar
- Mülk ekleyince kullanıcıya otomatik LANDLORD rolü verilir
- DELETE gerçekten silmez, status'u INACTIVE yapar (soft delete)
- Arama: city + district + rent aralığı filtreleri
- Durum: ACTIVE | RENTED | INACTIVE
- Index: ownerId, city+district, status, monthlyRent

## Son Değişiklik
[2026-04-08] İl/ilçe bazlı arama eklendi
