# Notification System (3 Modül)

> notification + in-app-notification + push-notification birlikte çalışır.

## notification (Global)
SMS ve email servis soyutlaması. Mock implementasyon (gerçek entegrasyon yapılacak).

### Dosyalar
- `notification.module.ts` — Global modül
- `interfaces/sms.interface.ts` — SmsService interface
- `interfaces/email.interface.ts` — EmailService interface

### Servisler (dahili, endpoint yok)
- `SmsService.sendOtp(phone, code)` — OTP gönder
- `SmsService.sendNotification(phone, message)` — SMS bildirim
- `EmailService.sendEmail(email, subject, htmlBody)` — Email gönder

---

## in-app-notification (Global)
Veritabanı tabanlı uygulama içi bildirimler. Push notification tetikler.

### Dosyalar
- `in-app-notification.service.ts` — bildirim CRUD
- `in-app-notification.controller.ts` — endpoint handler

### Endpoint'ler
- `GET /api/v1/notifications?limit=50&offset=0` — Bildirimlerim [Auth]
- `GET /api/v1/notifications/unread-count` — Okunmamış sayısı [Auth]
- `PATCH /api/v1/notifications/:id/read` — Tek okundu [Auth]
- `PATCH /api/v1/notifications/read-all` — Tümü okundu [Auth]

### Servisler (dahili)
- `create(userId, type, title, body, entityType?, entityId?)` — Bildirim + push
- `createForMultipleUsers(userIds[], ...)` — Toplu bildirim

---

## push-notification (Global)
Expo push notification servisi. Mobil cihazlara bildirim gönderir.

### Dosyalar
- `push-notification.service.ts` — token kayıt, push gönder

### Endpoint'ler
- `POST /api/v1/users/push-token` — Cihaz token kaydet [Auth]

### Servisler (dahili)
- `savePushToken(userId, token)`
- `sendPushNotification(userId, title, body, metadata?)`
- `sendPushNotificationToMany(userIds[], ...)`

---

## Bildirim Tipleri (NotificationType enum)
KMH_APPROVED, KMH_REJECTED, KMH_ONBOARDING_COMPLETE, CONTRACT_CREATED, CONTRACT_SIGNED, CONTRACT_ACTIVATED, CONTRACT_TERMINATED, PAYMENT_DUE, PAYMENT_OVERDUE, PAYMENT_COMPLETED, CHAT_MESSAGE, SYSTEM

## Bağımlılıklar
- **İçeri:** PrismaService, PushNotificationService
- **Dışarı:** chat (mesaj bildirimi), payment (ödeme bildirimi), contract (sözleşme bildirimi), bank (KMH bildirimi)

## Kritik Kurallar
- 3 modül Global — tüm modüllerden erişilebilir
- Bildirim oluştururken otomatik push notification tetiklenir
- entityType/entityId ile bildirimi ilgili kaynağa linkler (örn: contract_id)

## Son Değişiklik
[2026-04-09] Push notification Expo entegrasyonu
