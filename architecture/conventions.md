# SecureLend — Kodlama Kuralları ve Convention'lar

## Genel

- **Dil:** TypeScript strict mode (no implicit any, no type errors)
- **Paket Yöneticisi:** pnpm (workspace:* protocol)
- **Monorepo:** Turborepo (apps/api, apps/web, packages/shared)
- **Commit Mesajları:** `feat:`, `fix:`, `chore:` prefix
- **Branch:** `feat/TASK-{id}-{timestamp}` (PR ile squash merge to main)

## Backend (NestJS)

### Dosya İsimlendirme
```
modules/<modül-adı>/
├── <modül-adı>.module.ts
├── <modül-adı>.service.ts
├── <modül-adı>.controller.ts
└── dto/
    ├── create-<entity>.dto.ts
    └── update-<entity>.dto.ts
```

### DTO Pattern
```typescript
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateEntityDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

### Response Format (JSend)
```typescript
// Başarılı
{ status: 'success', data: { ... } }

// Hatalı (client)
{ status: 'fail', data: { field: 'error message' } }

// Hatalı (server)
{ status: 'error', message: 'Internal server error' }
```

### Controller Pattern
```typescript
@Controller('api/v1/entities')
@UseGuards(ThrottlerGuard)
export class EntityController {
  constructor(private readonly entityService: EntityService) {}

  @Get()
  async findAll(@GetUser() user: User) {
    const data = await this.entityService.findAll(user.id);
    return { status: 'success', data };
  }
}
```

### Guard Kullanımı
- `@Public()` — JWT kontrolünü atla
- `@Roles(UserRole.ADMIN)` — Rol zorunlu kıl
- `@Throttle({ default: { limit: 3, ttl: 10000 } })` — Rate limit

### API Prefix
- Tüm endpoint'ler: `/api/v1/` prefix
- Health check: `/health` (prefix yok)

---

## Frontend (Next.js 15)

### Dosya Convention
```
app/
├── page.tsx          ← Homepage (/)
├── layout.tsx        ← SADECE meta, font, global wrapper — sayfa içeriği KOYMAZ
├── globals.css       ← Tailwind base styles
└── <route>/
    └── page.tsx      ← Alt sayfa
```

### Component Pattern
```tsx
'use client';

export default function ComponentName() {
  // State, hooks
  // API calls via lib/api.ts
  // Return JSX with Tailwind classes
}
```

### Stil Kuralları
- Tailwind CSS sınıfları (inline CSS yok)
- Dashboard: dark tema (#0d1b2a background, slate-700 border)
- Public: light tema (beyaz/gri)
- Primary: blue-600 (#1d4ed8)
- Status: green (aktif), yellow (bekleyen), red (gecikmiş)
- Responsive: `sm:`, `md:`, `lg:` breakpoint'leri

### Form Pattern
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ ... });
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

### API Client Kullanımı
```tsx
import { api } from '@/lib/api';
const response = await api.get('/contracts');
```

---

## Veritabanı (Prisma)

### Model Convention
```prisma
model EntityName {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  // ... fields
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  @@map("entity_names")  // snake_case tablo adı
}
```

### Migration
- Schema değişikliğinde `prisma/migrations/` altına SQL dosyası oluştur
- `schema.prisma` doğrudan düzenlenebilir (ama protected — sadece elle)
- Migration adı: `YYYYMMDDHHMMSS_description`

---

## Protected Dosyalar (Otomatik Değişiklik Yasak)
- `.github/workflows/*` — CI/CD yapılandırmaları
- `prisma/schema.prisma` — DB şeması (migration gerektirir)
- `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`
- `tsconfig.json` (herhangi bir dizindeki)
- `.env` dosyaları
- `CLAUDE.md`

## Türkçe Karakter Kuralları
- Tüm UI metinleri doğru Türkçe karakterler kullanmalı: ö, ü, ç, ş, ğ, ı, İ
- ASCII karşılıkları (o, u, c, s, g, i, I) kabul edilmez
- Değişiklik sonrası grep ile kontrol: `grep -rn '[öüçşğıİ]' apps/web/`

## Throttle Seviyeleri
| Seviye | TTL | Limit | Kullanım |
|--------|-----|-------|----------|
| Short | 1s | 3 | Kritik endpoint'ler (login, register) |
| Medium | 10s | 10 | Normal CRUD |
| Long | 60s | 30 | Analytics, listing |
