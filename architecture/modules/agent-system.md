# Agent System (4 Modül)

> agent-run + suggestion + po-agent + marketing-agent birlikte Agent Sistemi'ni oluşturur.

## agent-run
Agent çalışma kayıtları ve performans istatistikleri.

### Endpoint'ler
- `POST /api/v1/agent-runs` — Yeni çalışma kaydı [ADMIN/SERVICE]
- `PATCH /api/v1/agent-runs/:id` — Durum güncelle (COMPLETED/FAILED) [ADMIN/SERVICE]
- `GET /api/v1/agent-runs` — Listele (?agentType= filtre) [ADMIN/SERVICE]
- `GET /api/v1/agent-runs/stats` — Tip bazlı başarı oranı [ADMIN/SERVICE]

### AgentType Enum
PO, MARKETING, DEV, HEALTH, ARTICLE (+ ARCHITECT eklenecek)

---

## suggestion
Geliştirme önerileri — Dev Agent'ın task kuyruğu.

### Endpoint'ler
- `GET /api/v1/suggestions?status=` — Listele [ADMIN/SERVICE]
- `GET /api/v1/suggestions/:id` — Detay [ADMIN/SERVICE]
- `POST /api/v1/suggestions` — Oluştur [ADMIN/SERVICE]
- `PATCH /api/v1/suggestions/:id` — Güncelle (status, agentNotes, prLink) [ADMIN/SERVICE]
- `DELETE /api/v1/suggestions/:id` — Sil [ADMIN/SERVICE]

### Durum Akışı
```
REJECTED → PENDING → IN_PROGRESS → DONE
              ↑           │
              └───────────┘ (retry durumunda)
```

### SuggestionPriority
CRITICAL > HIGH > MEDIUM > LOW

---

## po-agent
Product Owner raporları ve backlog item yönetimi.

### Endpoint'ler
- `POST /api/v1/po/reports` — Rapor oluştur [ADMIN/SERVICE]
- `GET /api/v1/po/reports` — Listele [ADMIN/SERVICE]
- `GET /api/v1/po/reports/latest` — Son rapor [ADMIN/SERVICE]
- `GET /api/v1/po/reports/:id` — Detay [ADMIN/SERVICE]
- `POST /api/v1/po/items` — Backlog item ekle [ADMIN/SERVICE]
- `PATCH /api/v1/po/items/:id` — Güncelle [ADMIN/SERVICE]
- `POST /api/v1/po/items/:id/move-to-dev` — Dev'e taşı [ADMIN/SERVICE]
- `POST /api/v1/po/items/:id/send-to-tasks` — Görev listesine gönder [ADMIN/SERVICE]
- `GET /api/v1/po/metrics` — Item metrikleri [ADMIN/SERVICE]
- `GET /api/v1/po/agent-context` — Agent context (backlog özeti) [ADMIN/SERVICE]

### PoItemCategory
UX_IMPROVEMENT, COMPETITOR_ANALYSIS, REGULATION_COMPLIANCE, FEATURE_SUGGESTION, BUG_REPORT, METRIC_SUMMARY

---

## marketing-agent
Pazarlama raporları, görev yönetimi, araştırma talepleri.

### Endpoint'ler
- `POST /api/v1/marketing/reports` — Rapor oluştur [ADMIN/SERVICE]
- `GET /api/v1/marketing/reports` — Listele (?type=&page=&limit=) [ADMIN/SERVICE]
- `GET /api/v1/marketing/reports/:id` — Detay [ADMIN/SERVICE]
- `GET /api/v1/marketing/reports/:id/html` — HTML içerik [ADMIN/SERVICE]
- `GET /api/v1/marketing/tasks` — Görevler (?status=&responsible=) [ADMIN/SERVICE]
- `GET /api/v1/marketing/tasks/upcoming` — 7 gün içindeki görevler [ADMIN/SERVICE]
- `PATCH /api/v1/marketing/tasks/:id` — Görev güncelle [ADMIN/SERVICE]
- `GET /api/v1/marketing/agent-context` — Agent context [ADMIN/SERVICE]
- `POST /api/v1/marketing/research` — Araştırma talebi [ADMIN/SERVICE]
- `GET /api/v1/marketing/research` — Talepler [ADMIN/SERVICE]
- `GET /api/v1/marketing/research/:id` — Talep detayı [ADMIN/SERVICE]
- `PATCH /api/v1/marketing/research/:id/complete` — Tamamla [ADMIN/SERVICE]

### MarketingReportType
DAILY_STRATEGY, MARKET_ANALYSIS, RESEARCH, BUSINESS_DEVELOPMENT

---

## Bağımlılıklar
- **İçeri:** PrismaService (tümü)
- **Dışarı:** Dev Agent (suggestion okur/günceller), PO Agent (po-report yazar), Marketing Agent (marketing-report yazar), Health Agent (agent-run kaydı), Article Agent (agent-run kaydı)

## GitHub Actions Entegrasyonu
| Agent | Workflow | Schedule | API Kullanımı |
|-------|----------|----------|---------------|
| PO Agent | po-agent.yml | Günlük 08:00 TR | po-report + po-item oluştur |
| Marketing | mkt-agent.yml | Hafta içi 09:00 TR | marketing-report + task oluştur |
| Article | article-agent.yml | Salı+Perşembe 10:00 TR | article oluştur |
| Dev Agent | dev-agent.yml | Her 30 dk | suggestion oku → implement → güncelle |
| Health | health-agent.yml | 4x/gün | analytics oku → suggestion oluştur |

## Kritik Kurallar
- Tüm endpoint'ler ADMIN veya SERVICE rolü gerektirir
- Agent'lar SERVICE_API_KEY ile x-api-key header'ı gönderir
- Dev Agent en yüksek öncelikli PENDING suggestion'ı alır
- Health Agent sadece CRITICAL/HIGH önerileri auto-approve eder
- move-to-dev: PoItem'ı DevSuggestion'a dönüştürür

## Son Değişiklik
[2026-04-14] ARCHITECT agent type eklenecek
