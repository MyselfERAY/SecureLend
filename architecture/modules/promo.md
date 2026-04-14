# Promo & Newsletter (2 Modül)

> promo + newsletter birlikte kullanıcı edinme ve elde tutma mekanizmalarını yönetir.

## promo
Promosyon kodları, indirimler, referral sistemi.

### Endpoint'ler
- `GET /api/v1/promos/active` — Aktif promosyonlar [Public]
- `GET /api/v1/promos/my` — Promosyonlarım [Auth]
- `GET /api/v1/promos/templates` — Tüm şablonlar [ADMIN]
- `POST /api/v1/promos/templates` — Şablon oluştur [ADMIN, 2/10sec]
- `PATCH /api/v1/promos/templates/:id` — Şablon güncelle [ADMIN, 3/10sec]
- `POST /api/v1/promos/templates/:id/toggle` — Aktif/pasif toggle [ADMIN, 3/10sec]
- `POST /api/v1/promos/assign` — Kullanıcıya ata [ADMIN, 2/10sec]
- `GET /api/v1/promos/referral` — Referral bilgisi (kod, link, davet edilenler) [Auth]
- `GET /api/v1/promos/stats` — İstatistikler [ADMIN]

### Varsayılan Şablonlar
1. İlk 3 Ay Komisyonsuz (auto-apply)
2. 12. Ay Komisyonsuz (sadakat)
3. 2. Yıl Yenileme İndirimi (%25)
4. Arkadaşını Getir (referral: her ikisine 1 ay)

### PromoType Enum
FIRST_MONTHS_FREE, RENEWAL_DISCOUNT, REFERRAL_BONUS, LOYALTY_REWARD, CUSTOM

### PromoStatus Enum
ACTIVE, USED, EXPIRED, CANCELLED

---

## newsletter
Email bülten abonelik yönetimi.

### Endpoint'ler
- `POST /api/v1/newsletter/subscribe` — Abone ol [Public, 3/60sec]
- `POST /api/v1/newsletter/unsubscribe` — Abonelikten çık [Public, 3/60sec]
- `GET /api/v1/newsletter/subscribers` — Aboneler [ADMIN]
- `GET /api/v1/newsletter/stats` — İstatistikler [ADMIN]

---

## Bağımlılıklar
- **İçeri:** PrismaService
- **Dışarı:** auth (register'da referral code kontrolü), payment (komisyon hesabında promo kontrolü)

## Kritik Kurallar
- isAutoApply şablonlar kayıt anında otomatik uygulanır
- Referral: register sırasında referralCode ile ilişkilendirilir
- discountPercent: 100 = tamamen ücretsiz, 50 = %50 indirim
- durationMonths: promosyonun kaç ay geçerli olduğu
- Newsletter email unique constraint

## Son Değişiklik
[2026-04-11] Promo sistemi eklendi
