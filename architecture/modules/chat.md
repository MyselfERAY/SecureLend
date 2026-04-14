# Chat Module

## Sorumluluk
Sözleşme anlaşmazlıkları ve destek için oda bazlı mesajlaşma sistemi.

## Dosyalar
- `chat.service.ts` — oda oluşturma, mesaj gönderme, okundu işaretleme
- `chat.controller.ts` — endpoint handler
- `dto/send-message.dto.ts` — SendMessageDto: content (max 2000 karakter)

## Endpoint'ler
- `GET /api/v1/chat/rooms` — Odalarım [Auth]
- `POST /api/v1/chat/rooms/contract/:contractId` — Sözleşme odası oluştur/al [Auth, 5/10sec]
- `POST /api/v1/chat/rooms/support` — Destek odası oluştur/al [Auth, 3/10sec]
- `GET /api/v1/chat/admin/support-rooms` — Tüm destek odaları [ADMIN]
- `GET /api/v1/chat/rooms/:roomId/messages?cursor=&limit=50` — Mesajlar (cursor pagination) [Auth]
- `POST /api/v1/chat/rooms/:roomId/messages` — Mesaj gönder [Auth, 10/10sec]
- `POST /api/v1/chat/rooms/:roomId/read` — Okundu işaretle [Auth]
- `GET /api/v1/chat/unread-count` — Okunmamış sayısı [Auth]

## Bağımlılıklar
- **İçeri:** InAppNotificationModule (yeni mesaj bildirimi), PrismaService
- **Dışarı:** Bağımsız modül, dışarıdan kullanılmaz

## Kritik Kurallar
- Oda tipleri: CONTRACT (sözleşme tarafları) ve SUPPORT (kullanıcı + admin)
- Aynı sözleşme/destek için tekrar oda açılmaz (get or create pattern)
- ChatRoomParticipant: chatRoomId + userId unique constraint
- Mesaj içeriği max 2000 karakter
- Cursor-based pagination (büyük sohbetler için)

## Son Değişiklik
[2026-04-09] Admin destek odaları listesi eklendi
