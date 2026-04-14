# SecureLend - Project Context for Claude Code

## Project Overview
SecureLend is a Turkish fintech platform for rental payments and KMH (Kredili Mevduat Hesabi) financing. It operates as an AI-powered autonomous company where GitHub Actions agent workflows handle operations with minimal human intervention.

**Owner:** Eray Karacaoglan
**Domain:** kiraguvence.com
**Language:** Turkish + English mixed

---

## Architecture

### Monorepo Structure (Turborepo)
```
SecureLend/
├── apps/
│   ├── web/          # Next.js 15 frontend (Vercel)
│   └── api/          # NestJS backend (Railway)
├── packages/
│   └── shared/       # Shared types/utils
├── turbo.json
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

### Tech Stack
- **Frontend:** Next.js 15 (App Router), Tailwind CSS, TypeScript
- **Backend:** NestJS, Prisma ORM, PostgreSQL 16, TypeScript strict mode
- **Package Manager:** pnpm (monorepo with workspace:* protocol)
- **Build:** Turborepo

### Hosting & Infrastructure
| Component | Platform | URL | Notes |
|-----------|----------|-----|-------|
| Frontend | Vercel | kiraguvence.com / www.kiraguvence.com | Auto-deploy on main push |
| Backend | Railway | securelend-production.up.railway.app | Dockerfile build, auto-deploy on main push |
| Backend (custom) | Railway | api.kiraguvence.com | CNAME verified, SSL active |
| Database | Railway | PostgreSQL (internal) | Connected via DATABASE_URL reference |
| DNS | Vercel | Vercel nameservers | All DNS records managed here |
| Email | Microsoft 365 | info@kiraguvence.com | Business Basic, $6/mo, 1 user + 4 aliases |

### Email Aliases (all → info@kiraguvence.com inbox)
- eraykaracaoglan@kiraguvence.com
- marketing@kiraguvence.com
- development@kiraguvence.com
- productmanagement@kiraguvence.com

### DNS Records (Vercel)
- TXT: `MS=ms41844744` (Microsoft verification)
- MX: `kiraguvence-com.mail.protection.outlook.com` priority 0
- CNAME: `autodiscover` → `autodiscover.outlook.com`
- TXT: `v=spf1 include:spf.protection.outlook.com -all`
- CNAME: `api` → `quqjrlpn.up.railway.app`
- TXT: `_railway.api` → `railway-verify=f8a940f1a417ca97e97e6ad0700fa708d6c7d90bf843f453f13c697488cd98da`

### Railway Environment Variables
- `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
- `NODE_ENV` = `production`
- `PORT` = Railway auto
- `JWT_SECRET` = configured
- `JWT_EXPIRATION` = `7d`
- `TCKN_HASH_PEPPER` = placeholder (needs real 64-char hex)
- `WEB_URL` = `https://kiraguvence.com`
- `THROTTLE_SHORT_TTL` = 1000, `THROTTLE_SHORT_LIMIT` = 3
- `THROTTLE_MEDIUM_TTL` = 10000, `THROTTLE_MEDIUM_LIMIT` = 10
- `THROTTLE_LONG_TTL` = 60000, `THROTTLE_LONG_LIMIT` = 30

### Vercel Environment Variables
- `NEXT_PUBLIC_API_URL` = `https://securelend-production.up.railway.app` (Production)
- `NEXT_PUBLIC_API_URL` = `http://localhost:4000` (Development)

### Railway Dockerfile (apps/api/Dockerfile)
Uses multi-stage build with pnpm. Key steps:
1. corepack enable + pnpm@8.15.4
2. pnpm install --no-frozen-lockfile
3. Build shared package first
4. **prisma generate** (critical - without this, Prisma types are missing)
5. Build API
6. Slim production image with node dist/main.js

---

## Architecture Summary (Architect Agent)

Architecture dosyaları `architecture/` klasöründe bulunur. Architect Agent tarafından otomatik yönetilir.

**Bir değişiklik yapmadan önce ilgili dosyayı oku:**
- Hangi modülle ilgili → `architecture/modules.md` (router — hangi md'ye gidileceğini gösterir)
- Modül detayı → `architecture/modules/<modül>.md`
- Etki analizi → `architecture/impact-map.md` (neyi değiştirince ne etkilenir)
- DB yapısı → `architecture/db-schema.md`
- API endpoint'ler → `architecture/api-contracts.md`
- Kodlama kuralları → `architecture/conventions.md`
- Son değişiklikler → `architecture/changelog.md`

> **Not:** Architect Agent workflow şu an devre dışı. Architecture dosyaları referans olarak repo'da duruyor, sadece Claude Code oturumlarında kullanılıyor.

---

## GitHub Repository
- **Repo:** MyselfERAY/SecureLend
- **Branch strategy:** main only (no dev branch yet - prod used as test)
- **Deploy pipeline:** Push to main → Vercel auto-deploy (frontend) + Railway auto-deploy (backend)
- **Dev Agent creates feature branches** (feat/*) → PR to main → squash merge

---

## API Structure
- **Health:** `GET /health` → `{ status, data: { version, environment, uptime, timestamp, totalRequests } }`
- **Swagger:** `GET /api/docs`
- **API prefix:** `/api/v1/`
- **Modules:** auth, user, property, contract, payment, bank, admin, health
- **Global:** ValidationPipe (whitelist, transform), AllExceptionsFilter (JSend format), LoggingInterceptor (masks TCKN/phone/OTP)
- **CORS:** Configured with specific origins (WEB_URL + localhost in dev)

### API Routes (from NestJS logs)
```
GET  /health
GET  /api/v1/contracts
GET  /api/v1/contracts/:id
POST /api/v1/contracts/:id/sign
POST /api/v1/contracts/:id/terminate
GET  /api/v1/contracts/:contractId/payments
POST /api/v1/bank/kmh/apply
POST /api/v1/bank/kmh/:applicationId/complete-onboarding
GET  /api/v1/bank/kmh/my-applications
GET  /api/v1/bank/kmh/:applicationId
GET  /api/v1/bank/accounts
GET  /api/v1/bank/accounts/:id/balance
GET  /api/v1/bank/accounts/:id/transactions
GET  /api/v1/payments/summary/:contractId
GET  /api/v1/payments/my
POST /api/v1/payments/:id/process
GET  /api/v1/admin/overview
GET  /api/v1/admin/users
GET  /api/v1/admin/contracts
GET  /api/v1/admin/payments
GET  /api/v1/admin/commissions
```

---

## Frontend Structure (apps/web/src/)
```
src/
├── app/           # Next.js App Router pages
│   ├── page.tsx   # Homepage (ana sayfa / acilis sayfasi)
│   ├── layout.tsx # Global wrapper (DON'T add page content here)
│   └── globals.css
├── components/    # Reusable components
├── context/       # React contexts
├── contexts/      # Auth context (legacy?)
└── lib/
    ├── api.ts         # API client (uses NEXT_PUBLIC_API_URL)
    ├── auth-context.tsx
    └── version.ts
```

### API Client (lib/api.ts)
- Uses `NEXT_PUBLIC_API_URL` env var
- Handles localhost detection (falls back to same-origin if env points to localhost but app is on remote host)
- JSend format responses: `{ status, data?, message? }`

### Next.js App Router File Convention
- `app/page.tsx` = Homepage (/), landing page, ana sayfa, acilis sayfasi
- `app/layout.tsx` = ONLY for meta, fonts, global wrapper. NOT for page content (footer, header, banner)
- `app/[folder]/page.tsx` = Sub-pages (/about, /kps, etc.)

---

## GitHub Actions Agent System

All agents run as GitHub Actions workflows in `.github/workflows/`. They use Claude Code CLI (`@anthropic-ai/claude-code`) for AI generation, and communicate with the backend via `SERVICE_API_KEY` authenticated REST calls.

### Active Agents
| Agent | Workflow | Schedule | Function |
|-------|----------|----------|----------|
| PO Agent | `po-agent.yml` | Daily 08:00 TR | Daily product report, platform metrics analysis, dev suggestions |
| Marketing Agent | `marketing-agent.yml` | Weekdays 09:00 TR | Daily strategy or research reports, task generation |
| Article Agent | `article-agent.yml` | Tue+Thu 10:00 TR | SEO blog articles in Turkish for /rehber section |
| Developer Agent | `dev-agent.yml` | Every 30 min | Picks up PENDING suggestions, implements, builds, deploys, verifies |
| Health Agent | `health-agent.yml` | 4x/day (06:00/12:00/18:00/00:00 TR) | Error analytics, fix suggestions, architecture staleness check |

### Agent Data Flow
```
GitHub Actions (cron/manual) → Create AgentRun → Claude Code CLI → Generate content →
POST to API (reports/articles/suggestions) → Update AgentRun status (COMPLETED/FAILED)
```

### Developer Agent Features
1. **Priority queue** - Picks highest priority PENDING suggestion
2. **Retry loop** - Up to 3 attempts with error feedback
3. **Safety checks** - Protected files, diff size limits, build verification
4. **Self-review** - Second Claude call validates changes before push
5. **Auto-deploy** - Pushes to main, waits for deploy, health check
6. **Auto-revert** - Reverts commit if deploy health check fails

### Concurrency Groups (prevent mutual cancellation)
- `securelend-po` - PO Agent
- `securelend-marketing` - Marketing Agent
- `securelend-article` - Article Agent
- Dev Agent has no concurrency group (runs independently)

### Required GitHub Secrets
- `ANTHROPIC_API_KEY` - Claude API key for Claude Code CLI
- `SERVICE_API_KEY` - Backend service authentication
- `GH_PAT` - GitHub Personal Access Token (for Dev Agent pushes)

---

## Roadmap
- **Phase 1:** Backend infra ✅ (NestJS+PostgreSQL, Railway, Vercel, domain, SSL)
- **Phase 2:** Agent system ✅ (4 GitHub Actions agents: PO, Marketing, Article, Developer)
- **Phase 3:** Agent quality (repo awareness, KPI dashboard, agent-to-agent coordination)
- **Phase 4:** Product maturity (SMS/OTP integration, dev/test environments, Playwright testing)
- **Phase 5:** Autonomous company (self-improvement, CEO exception-only, full automation)

---

## Pending Tasks (Active)
1. SMS/OTP entegrasyonu (provider secimi: Netgsm, Ileti Merkezi, Twilio) - deferred
2. Dev/Test environment setup (dev branch + separate Railway environment) - deferred
3. Production secret'lar guclendirme (JWT_SECRET, JWT_REFRESH_SECRET) - deferred
4. Vercel NEXT_PUBLIC_API_URL'i api.kiraguvence.com'a guncelle - deferred

---

## Important Conventions
- **Commit messages:** `feat:`, `fix:`, `chore:` prefixes
- **Branch naming:** `feat/TASK-{id}-{timestamp}`
- **NEVER commit directly to main** - always via PR squash merge
- **TypeScript strict mode** - no implicit any, no type errors
- **JSend response format** - `{ status: "success"|"fail"|"error", data?, message? }`
- **Dev Agent must ONLY change files relevant to the task** - no "improvements" or "refactoring"
