# SecureLend - Project Context for Claude Code

## Project Overview
SecureLend is a Turkish fintech platform for rental payments and KMH (Konut Mortgage Hesabi) financing. It operates as an AI-powered autonomous company where n8n multi-agent workflows handle operations with minimal human intervention.

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
| Backend (custom) | Railway | api.kiraguvence.com | CNAME verified, SSL pending |
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
- **CORS:** `origin: true` (needs tightening to WEB_URL + localhost)

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

## n8n Multi-Agent System

### Active Agents
1. **CEO Agent v3** - Orchestrator, daily briefing, dispatches to Marketing
2. **Marketing & Sales Agent** - GTM reports, CEO task analysis
3. **PO Agent v2** - Backlog management, Developer dispatch via webhook
4. **Developer Agent v6** - Senior Autonomous Developer (upgraded from v5)

### Developer Agent v6 Workflow
```
Webhook → Initialize Variables → Get Main SHA → Create Feature Branch →
Get Repo Tree → Parse File Tree (+ Claude prompt) → Claude API - Kod Uret →
Parse + Branch Safety → Prep Review → Claude API - Review → Parse Review →
Review Passed? → [True] Build Git Tree → Create Git Tree → ...commit/PR flow
                → [False] Review Retry Prep → Get Repo Tree (retry loop)
```

### Key Dev Agent v6 Improvements (over v5)
1. **Strict scope prompt** - "SADECE task'ta belirtilen degisikligi yap, baska dosyaya DOKUNMA"
2. **Self-review node** - Second Claude call checks if changes match task
3. **Review retry loop** - If review fails, agent retries (max 5 attempts)
4. **No clarification** - Agent must write code, never ask questions
5. **Next.js file convention** in prompt - Knows page.tsx vs layout.tsx difference

### Dev Agent Known Issues & Fixes
- **Body mapping fix:** CEO Panel sends Baslik/Aciklama (Turkish), Node 2 maps both Turkish and English field names
- **Dispatch fix:** "Specify Body" must be "Using JSON" with `{{ JSON.stringify($input.first().json) }}`
- **Prisma types:** Dockerfile must include `RUN cd apps/api && npx prisma generate` before API build
- **pnpm workspace:** npm can't handle `workspace:*` protocol → Dockerfile uses pnpm
- **Peer deps:** @nestjs/serve-static@5.0.4 wants NestJS 11, project uses 10 → pnpm handles with warnings

### n8n Quirks Catalog
- Classic GitHub PATs require `token` prefix, not `Bearer`
- `JSON.stringify()` must happen in Code nodes, NOT in n8n expressions (Turkish chars, newlines, markdown break expressions)
- `Buffer.from().toString('base64')` must happen in Code nodes
- Google Sheets "Column to match on" must be set via UI dropdown (JSON values ignored in n8n 2.13.3)
- Turkish characters in Code node comments cause syntax errors - use ASCII only
- `N8N_RUNNERS_TASK_TIMEOUT=900` required for long-running loops
- IF node `object exists` operator fails on null strings - use boolean flag in Code node instead
- Webhook node (typeVersion 2): use `responseMode: "onReceived"` for immediate response
- Two separate Header Auth credentials: GitHub (`Authorization: token ...`), Anthropic (`x-api-key: sk-ant-...`)
- After workflow import, credential assignments reset - manually reassign each node

### Google Sheets Backlog
- **Document ID:** `10EGOxn4cOxIo6XX46eGyysKZGN4IkCrZBX7iylxAfHE`
- **Sheets:** Backlog, Sprint, Log, Dashboard
- **Backlog columns:** ID | Kaynak | Baslik | Aciklama | Oncelik | Durum | Atanan | CEO_Onay | CEO_Yorum | PR_Link | Test_Sonucu | Tarih | Guncelleme
- **Log columns:** Tarih | ID | Islem | Yapan | Detay

### CEO Approval Form v2
- **Endpoint:** `GET /webhook/ceo-panel-v2`
- **Respond mode:** "Using Respond to Webhook Node" (not lastNode)
- Approve/reject/add suggestions via query params
- All 3 agents have parallel Backlog append path with smart dev-only extraction

### n8n Credential IDs
- GitHub PAT: `gCMOrHhShldSvItU`
- Anthropic API Key: `unWAUMB020BIfyxs`

---

## Roadmap
- **Phase 1:** Backend infra (NestJS+PostgreSQL deploy ✅, token security, CI/CD, Dev Agent backend support)
- **Phase 1.5:** Domain ✅, test/prod environments, hosting setup ✅
- **Phase 2:** Dev Agent quality (lint/typecheck gate, test gen, repo awareness, Playwright)
- **Phase 3:** Multi-role tasking (PO/Marketing task routing, job description revision, smart dispatcher)
- **Phase 4:** Autonomous company (agent-to-agent, KPI dashboard, self-improvement, CEO exception-only)

---

## Pending Tasks
1. CEO Panel'e screenshot upload (vision support for Dev Agent)
2. Mevcut dosya icerigini Claude'a gonderme (repo awareness - Dev Agent update yaparken mevcut kodu bilmiyor)
3. CORS sikilastirma: `origin: true` → `[process.env.WEB_URL, 'http://localhost:3000']`
4. JWT_SECRET + TCKN_HASH_PEPPER guclu random degerlerle degistir
5. Hardcoded token'lari n8n credentials'a tasi
6. api.kiraguvence.com SSL sertifikasi (Railway TXT verification pending)
7. Dev environment setup (dev branch + separate Railway environment) - deferred
8. PO/Marketing task assignment + job description revision
9. PO Playwright UI testing
10. Vercel NEXT_PUBLIC_API_URL'i api.kiraguvence.com'a guncelle (custom domain aktif olunca)

---

## Important Conventions
- **Commit messages:** `feat:`, `fix:`, `chore:` prefixes
- **Branch naming:** `feat/TASK-{id}-{timestamp}`
- **NEVER commit directly to main** - always via PR squash merge
- **TypeScript strict mode** - no implicit any, no type errors
- **JSend response format** - `{ status: "success"|"fail"|"error", data?, message? }`
- **Dev Agent must ONLY change files relevant to the task** - no "improvements" or "refactoring"
