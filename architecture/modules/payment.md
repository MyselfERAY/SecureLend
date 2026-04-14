# Payment Module

## Sorumluluk
Kira ödeme işleme, ödeme takvimi yönetimi, komisyon hesaplama (%1 platform ücreti), ev sahibine fon dağıtımı.

## Dosyalar
- `payment.service.ts` — ödeme işleme, takvim oluşturma, komisyon hesaplama
- `payment.controller.ts` — endpoint handler

## Endpoint'ler
- `GET /api/v1/contracts/:contractId/payments` — Sözleşmenin ödeme takvimi [Auth]
- `GET /api/v1/payments/summary/:contractId` — Ödeme özeti (toplam/ödenen/kalan/gecikmiş) [Auth]
- `GET /api/v1/payments/my` — Kullanıcının son 50 ödemesi [Auth]
- `POST /api/v1/payments/:id/process` — Ödeme işle [Auth, 1/30sec]

## Bağımlılıklar
- **İçeri:** BankModule (hesap transferi), InAppNotificationModule (ödeme bildirimi), PrismaService
- **Dışarı:** contract (sözleşme aktivasyonunda ödeme takvimi oluşturulur), admin (ödeme raporları)

## İş Mantığı
- Komisyon oranı: %1 (sabit)
- Ev sahibi alır: ödeme tutarının %99'u
- Platform alır: ödeme tutarının %1'i
- Banka transferleri: kiracı hesabı → ev sahibi hesabı + platform hesabı
- Gecikmiş ödemeler: PaymentStatus.OVERDUE olarak işaretlenir

## Kritik Kurallar
- Ödeme sadece PENDING veya OVERDUE durumundaysa işlenebilir
- Her ödeme için Commission kaydı oluşturulur
- BankTransaction referenceNo unique olmalı
- periodLabel formatı: "Ocak 2026", "Şubat 2026" vb.

## Son Değişiklik
[2026-04-10] Ödeme özeti endpoint eklendi
