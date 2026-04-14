# Analytics Module

## Sorumluluk
Frontend client-side analitik toplama (page view, error, event) ve API monitoring dashboard'ları.

## Dosyalar
- `analytics.service.ts` — event kayıt, dashboard aggregation
- `analytics.controller.ts` — endpoint handler
- `dto/track-event.dto.ts` — TrackEventDto
- `dto/track-batch.dto.ts` — TrackBatchDto

## Endpoint'ler
### Public (Frontend tracking)
- `POST /api/v1/analytics/track` — Tekil event [Public, 30/10sec]
- `POST /api/v1/analytics/track/batch` — Toplu event [Public, 10/10sec]

### Admin Dashboard
- `GET /api/v1/analytics/dashboard?days=30` — Frontend dashboard (page view, session, cihaz, tarayıcı) [ADMIN]
- `GET /api/v1/analytics/api-dashboard?days=30` — API dashboard (istek, hata, status code, yavaş endpoint) [ADMIN]
- `GET /api/v1/analytics/extended?days=30` — Bounce rate, funnel, referrer, CTA, scroll depth [ADMIN]

## Bağımlılıklar
- **İçeri:** PrismaService
- **Dışarı:** Health Agent (api-dashboard verisi), LoggingInterceptor (API request kaydı)

## Event Tipleri
- page_view, page_exit, error, click

## AnalyticsEvent Alanları
- sessionId, eventType, page, referrer, duration
- userId, ipAddress, country, city
- userAgent, device, browser, os
- screenWidth, screenHeight
- errorMessage, errorStack, metadata (JSON)

## Kritik Kurallar
- Track endpoint'leri Public ama throttle edilir
- API dashboard LoggingInterceptor'dan gelen verileri kullanır
- Health Agent bu modülün api-dashboard endpoint'ini okur
- Frontend AnalyticsProvider component'i otomatik track eder

## Son Değişiklik
[2026-04-11] Extended analytics (bounce rate, funnel) eklendi
