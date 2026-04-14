# Article Module

## Sorumluluk
Blog/rehber içerik yönetimi (CMS). Article Agent tarafından otomatik üretilir, admin tarafından yayınlanır.

## Dosyalar
- `article.service.ts` — makale CRUD, yayınlama/geri çekme
- `article.controller.ts` — endpoint handler
- `dto/create-article.dto.ts` — CreateArticleDto: title, slug, summary, content, category, audience

## Endpoint'ler
### Public
- `GET /api/v1/articles` — Yayındaki makaleler [Public]
- `GET /api/v1/articles/latest?limit=3` — Son makaleler [Public]
- `GET /api/v1/articles/:slug` — Slug ile makale [Public]

### Admin
- `GET /api/v1/articles/admin/drafts` — Taslaklar [ADMIN]
- `GET /api/v1/articles/admin/all` — Tüm makaleler [ADMIN]
- `POST /api/v1/articles` — Oluştur [ADMIN/SERVICE]
- `PATCH /api/v1/articles/:id/publish` — Yayınla [ADMIN]
- `PATCH /api/v1/articles/:id/unpublish` — Geri çek [ADMIN]
- `DELETE /api/v1/articles/:id` — Sil [ADMIN]

## Bağımlılıklar
- **İçeri:** PrismaService
- **Dışarı:** Frontend rehber sayfaları (/rehber, /rehber/[slug])

## Kritik Kurallar
- Slug unique — SEO için önemli
- Audience: TENANT | LANDLORD | BOTH — hedef kitle filtresi
- Status: DRAFT → PUBLISHED (publishedAt timestamp ile)
- Article Agent Salı ve Perşembe 10:00'da otomatik üretir
- İçerik Türkçe, SEO odaklı

## Son Değişiklik
[2026-04-10] Audience filtresi eklendi
