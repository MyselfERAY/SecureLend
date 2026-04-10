# SecureLend AI Organization Blueprint

## Organizasyon Semasi

```
                    +------------------+
                    |      ERAY        |
                    |    (Founder)     |
                    +--------+---------+
                             |
                    Admin Dashboard (kiraguvence.com)
                             |
              +--------------+--------------+
              |              |              |
     +--------+----+  +-----+------+  +----+--------+
     |  PO Agent   |  | Marketing  |  |  Developer  |
     | (Daily 08)  |  |  (Daily 09)|  | (Every 30m) |
     +--------+----+  +-----+------+  +----+--------+
              |              |              |
              |        +-----+------+      |
              |        |  Article   |      |
              |        | (Tue+Thu)  |      |
              |        +------------+      |
              |                            |
              +------- PO Item -------->---+
              (isDevTask=true -> DevSuggestion)
```

## Agent Akislari

### Akis 1: Gunluk PO Raporu
```
Cron (08:00 TR) -> PO Agent -> Platform metriklerini cek ->
Claude Code ile rapor uret -> POST /api/v1/po/reports ->
Admin PO Gunlugu sayfasinda gorunur
```

### Akis 2: PO -> Developer Dongusu
```
PO Raporu'ndaki item -> Admin "Move to Dev" tiklar ->
DevSuggestion olusur (PENDING) -> Developer Agent alir ->
Implement + Build + Deploy + Verify -> DONE
```

### Akis 3: Marketing Stratejisi
```
Cron (09:00 TR) -> Marketing Agent -> Gunluk strateji veya
arastirma raporu uret -> POST /api/v1/marketing/reports ->
Admin Pazarlama sayfasinda gorunur
```

### Akis 4: Makale Uretimi
```
Cron (Tue+Thu 10:00 TR) -> Article Agent -> Mevcut makale basliklarini cek ->
Tekrar etmeyen SEO makale uret -> POST /api/v1/articles (DRAFT) ->
Admin Makaleler sayfasinda incele ve yayinla
```

### Akis 5: Developer Agent Detay
```
Cron (*/30) -> GET /api/v1/suggestions?status=PENDING ->
En yuksek oncelikli suggestion'i al -> IN_PROGRESS yap ->
Repo checkout + Claude Code implement -> Safety checks:
  1. Protected files check
  2. Diff size check (max 10 files, 500 lines)
  3. Frontend build check
  4. Backend build check
-> Self-review (second Claude call) ->
Push to main -> Wait for deploy -> Health check ->
Success: DONE | Fail: Revert + PENDING
```

## Teknik Mimari

```
+---------------------------------------------------+
|           GitHub Actions (Cron Triggers)            |
+------+-------+--------+--------+-----------------+
| PO   | Mktg  | Article| Dev    |                 |
| Agent| Agent | Agent  | Agent  |                 |
+------+-------+--------+--------+-----------------+
       |              |
       v              v
+---------------------------------------------------+
|   Claude Code CLI (@anthropic-ai/claude-code)      |
+---------------------------------------------------+
       |
       v
+---------------------------------------------------+
|   NestJS Backend (Railway)                         |
|   api.kiraguvence.com                              |
|   SERVICE_API_KEY auth                             |
+---+------+--------+--------+--------+------------+
    |      |        |        |        |
    v      v        v        v        v
+------+------+--------+--------+-----------+
|Agent | PO   | Mktg   | Dev    | Article   |
|Runs  |Report| Report | Sugg.  | Module    |
+------+------+--------+--------+-----------+
       |
       v
+---------------------------------------------------+
|   PostgreSQL (Railway)                             |
+---------------------------------------------------+
       |
       v
+---------------------------------------------------+
|   Next.js Frontend (Vercel)                        |
|   kiraguvence.com/dashboard/admin/*                |
+---------------------------------------------------+
```

## API Endpointleri (Agent)

| Method | Endpoint | Aciklama |
|--------|----------|----------|
| POST   | /api/v1/agent-runs | Agent calismasini baslatir |
| PATCH  | /api/v1/agent-runs/:id | Durumu gunceller (COMPLETED/FAILED) |
| GET    | /api/v1/agent-runs | Tum agent calismalarini listeler |
| GET    | /api/v1/agent-runs/stats | KPI istatistikleri |
| POST   | /api/v1/po/reports | PO raporu olusturur |
| GET    | /api/v1/po/reports | PO raporlarini listeler |
| GET    | /api/v1/po/metrics | Platform metriklerini cekerr |
| POST   | /api/v1/marketing/reports | Pazarlama raporu olusturur |
| GET    | /api/v1/marketing/reports | Pazarlama raporlarini listeler |
| POST   | /api/v1/marketing/research | Arastirma talebi olusturur |
| POST   | /api/v1/articles | Makale olusturur (DRAFT) |
| GET    | /api/v1/suggestions | Gelistirme onerilerini listeler |
| PATCH  | /api/v1/suggestions/:id | Oneri durumunu gunceller |

## Karar Yetkileri

- **Otonom (Agent karar verir):** Rapor uretimi, metrik toplama, makale taslagi, kod implementasyonu
- **Admin onay gerekir:** Makale yayinlama, DevSuggestion'a tasima, gorev atama
- **Eray onay gerekir:** Deploy (otomatik ama revert mekanizmasi var), fiyatlama, harcama
