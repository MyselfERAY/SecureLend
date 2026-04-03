# SecureLend AI Organization — Tam Organizasyon Planı

## Organizasyon Şeması

```
                    ┌──────────────┐
                    │    ERAY      │
                    │  (Founder)   │
                    └──────┬───────┘
                           │ Telegram
                    ┌──────┴───────┐
                    │  CEO AGENT   │
                    │ Koordinatör  │
                    └──┬───┬───┬───┘
              ┌────────┘   │   └─────────┐
              ▼            ▼             ▼
      ┌───────────┐ ┌───────────┐ ┌──────────────┐
      │  PRODUCT   │ │ DEVELOPER │ │  MARKETING   │
      │  OWNER     │ │   AGENT   │ │  & SALES     │
      └───────────┘ └───────────┘ └──────────────┘
           ▲               ▲              │
           │               │              │
           └───────────────┘──────────────┘
              Karşılıklı iletişim
```

## İletişim Akışları

### Akış 1: Eray'dan Emir Geldiğinde
```
Eray → (Telegram) → CEO Agent
CEO Agent → analiz eder → ilgili agent'a görev atar
İlgili Agent → çalışır → sonucu CEO'ya iletir
CEO Agent → özet + onay talebi → Eray'a (Telegram)
Eray → onay/red → CEO Agent → agent'a bildirir
```

### Akış 2: Marketing → PO → Developer Döngüsü
```
Marketing Agent → pazar analizi + öneri → CEO Agent
CEO Agent → özet → Eray onayı
Eray onay → CEO → PO Agent'a iletir
PO Agent → araştırır, dokümante eder → CEO'ya özet doküman
CEO → Eray onayı → PO → Developer Agent'a spec verir
Developer → geliştirir → PO'ya test için gönderir
PO → test + code quality → onay → CEO'ya bildirir
CEO → deploy onayı → Eray
Eray onay → CEO → Developer deploy eder
```

### Akış 3: Günlük/Haftalık Raporlama
```
Her Agent → günlük durum → CEO Agent
CEO Agent → birleştirir → Telegram ile Eray'a gönderir

Marketing Agent → haftalık kullanım istatistikleri → CEO
Developer Agent → kalite istatistikleri → CEO
PO Agent → ürün ilerleme raporu → CEO
CEO → haftalık strateji raporu → Eray
```

---

## AGENT 1: CEO AGENT (Mevcut — Güncelleme Gerekli)

### Durum: ✅ Çalışıyor (Daily Briefing + Telegram)

### Güncellenecek Görevler
- Eray'dan gelen emirleri alıp ilgili agent'a yönlendirme
- Agent'lar arası iletişim koordinasyonu
- Onay/red mekanizması (Telegram butonları)
- Günlük toplu rapor (tüm agent'lardan)
- Haftalık strateji raporu

### Karar Yetkileri
- ✅ Otonom: Bilgi toplama, agent'lara görev atama, rutin raporlama
- ❌ Eray onayı: Harcama, fiyatlama, feature kararı, deploy, public iletişim

---

## AGENT 2: PRODUCT OWNER AGENT

### Sorumluluklar

**A. Ürün Araştırma & Dokümantasyon**
- Türkiye pazarı için SecureLend'in çalışması gereken özellikleri araştırma
- Türkiye'deki bankacılık/fintech regülasyonları (BDDK, TCMB, SPK)
- Yerel ödeme altyapıları (BKM, FAST, IBAN yapısı, TROY)
- Rakip analizi (Türkiye'deki fintech'ler: Papara, Param, Colendi, Figopara)
- Her feature için detaylı spec dokümanı hazırlama

**B. Entegrasyon Haritası**
- Türkiye bankaları API'leri (açık bankacılık)
- TCMB veri servisleri
- KKB/Findeks entegrasyonu gereksinimleri
- BKM Switch / BKM Express entegrasyonu
- E-Devlet / MERNİS doğrulama
- Erişilecek API'lerin listesi, dokümantasyonları, erişim şartları

**C. Kalite Kontrol**
- Developer'dan gelen geliştirmelerin fonksiyonel testi
- Code quality kontrolü (linting, test coverage, best practices)
- Kullanıcı deneyimi (UX) değerlendirmesi
- Spec'e uygunluk kontrolü

**D. CEO'ya Raporlama**
- Her feature önerisi için: Özet doküman + etki analizi + öncelik önerisi
- Haftalık ürün ilerleme raporu
- Entegrasyon timeline'ı

### Kullanacağı Tool'lar
- Web araması (SerpAPI): Pazar araştırması, API dokümantasyonu bulma
- GitHub API: PR review, code quality metrikleri
- Claude API: Doküman üretimi, analiz, spec yazımı

### n8n Workflow Tetikleyicileri
- CEO'dan görev geldiğinde (webhook)
- Haftalık otomatik pazar taraması (cron)
- Developer PR açtığında (GitHub webhook)
- Marketing'den öneri geldiğinde (agent bus)

---

## AGENT 3: DEVELOPER AGENT

### Sorumluluklar

**A. Geliştirme**
- PO'dan gelen spec'lere göre kod geliştirme
- SecureLend SDK iyileştirmeleri (TypeScript, React, Python)
- MCP server güncellemeleri
- API endpoint geliştirme
- Bug fix'ler

**B. Test & Kalite**
- Unit test yazma ve çalıştırma
- Integration test
- Code coverage raporları
- Performance metrikleri
- Kalite istatistikleri hazırlama (test coverage %, bug sayısı, code smell)

**C. Deployment**
- Deploy planı hazırlama
- CEO'dan (dolayısıyla Eray'dan) onay alma
- Staging → Production deploy süreci
- Rollback planı
- Post-deploy monitoring

**D. Raporlama**
- Günlük: Neler geliştirdi, neler bekleniyor
- Haftalık: Kalite istatistikleri, velocity, technical debt

### Kullanacağı Tool'lar
- GitHub API: Commit, PR, branch yönetimi
- Claude Code: Kod üretimi ve review
- Docker: Test ortamları
- AWS CLI: Deployment (Lambda, S3, DynamoDB)

### n8n Workflow Tetikleyicileri
- PO'dan spec geldiğinde (webhook)
- Deploy onayı geldiğinde (CEO'dan)
- Günlük kalite raporu (cron)
- Bug/issue atandığında (GitHub webhook)

---

## AGENT 4: MARKETING & SALES AGENT

### Sorumluluklar

**A. Pazarlama Stratejisi**
- Ürün konumlandırma (fintech B2B, developer tools, AI-native)
- Hedef kitle tanımlama (Türkiye fintech'leri, bankalar, yazılım şirketleri)
- Rakip pozisyonlama analizi
- İçerik stratejisi (blog, social media, developer docs)
- SEO stratejisi ve keyword araştırması

**B. Pazarlama Planı & Bütçe**
- Aylık/çeyreklik pazarlama planı
- Kanal bazlı bütçe önerisi (Google Ads, LinkedIn, GitHub Sponsors, DevTo)
- ROI tahminleri
- CEO'ya özet + bütçe sunumu → Eray onayı

**C. Satış**
- Lead generation stratejisi
- Outreach mesaj şablonları
- Demo/pitch deck hazırlama
- Potansiyel müşteri listesi (Türkiye bankaları, fintech'ler)

**D. PO'ya Öneriler**
- Müşteri geri bildirimlerinden feature önerileri
- Pazar trendlerine göre ürün önerileri
- Rakiplerin yeni özellikleri → PO'ya bildirim

**E. İstatistik & Raporlama**
- Günlük: Website traffic, npm downloads, GitHub stars
- Haftalık: Pazarlama performansı, lead sayısı, dönüşüm oranları
- Kampanya bazlı ROI raporları

### Kullanacağı Tool'lar
- SerpAPI: SEO analizi, keyword araştırması, rakip takibi
- Google Analytics API (ileride): Traffic analizi
- GitHub API: Stars, forks, contributor metrikleri
- npm API: Download istatistikleri
- Claude API: İçerik üretimi, analiz, rapor

### n8n Workflow Tetikleyicileri
- Günlük metrik toplama (cron)
- Haftalık pazarlama raporu (cron)
- CEO'dan kampanya onayı geldiğinde (webhook)
- Rakipte değişiklik algılandığında (web tarama)

---

## Uygulama Yol Haritası

### Hafta 1 (Şimdi): CEO Agent Güncelleme ✅→🔄
- [x] Temel briefing çalışıyor
- [x] Telegram entegrasyonu aktif
- [ ] Agent bus (Redis pub/sub) kurulumu
- [ ] Çok agent koordinasyon mantığı
- [ ] Telegram butonlu karar mekanizması

### Hafta 2: Marketing & Sales Agent
- Neden önce bu? Diğer agent'lar ürün geliştirmeye başlamadan pazar analizi lazım.
- Türkiye pazarı araştırması
- Rakip analizi
- İlk SEO raporu
- İlk pazarlama planı önerisi

### Hafta 3: Product Owner Agent
- Türkiye entegrasyon haritası
- İlk feature spec dokümanı
- Marketing önerilerini değerlendirme
- API araştırması (açık bankacılık, KKB, BKM)

### Hafta 4: Developer Agent
- PO'dan gelen ilk spec'i geliştirme
- Test pipeline kurulumu
- Deploy süreci tanımlama
- İlk kalite raporu

### Ay 2: Tam Koordinasyon
- Tüm agent'lar aktif ve birbiriyle konuşuyor
- Eray sadece kritik kararları onaylıyor
- Otomatik raporlama döngüsü çalışıyor
- İlk ürün iyileştirmesi canlıya çıkıyor

---

## Teknik Mimari (Tüm Agent'lar)

```
┌─────────────────────────────────────────────────┐
│              n8n Workflow Engine                  │
├─────────┬──────────┬───────────┬────────────────┤
│ CEO     │ PO       │ Developer │ Marketing      │
│ Workflow│ Workflow  │ Workflow  │ Workflow       │
└────┬────┴────┬─────┴─────┬────┴───────┬────────┘
     │         │           │            │
     └─────────┴─────┬─────┴────────────┘
                     │
              ┌──────┴──────┐
              │ Agent Bus   │
              │ (Redis +    │
              │  Webhooks)  │
              └──────┬──────┘
                     │
              ┌──────┴──────┐
              │ PostgreSQL  │
              │ (Logs +     │
              │  State)     │
              └─────────────┘
```

### Agent Arası İletişim
Her agent diğerine n8n webhook üzerinden mesaj gönderir:
- `POST /webhook/ceo-task` → CEO Agent'a görev/rapor
- `POST /webhook/po-task` → PO Agent'a spec talebi
- `POST /webhook/dev-task` → Developer Agent'a geliştirme talebi
- `POST /webhook/mkt-task` → Marketing Agent'a analiz talebi

Her mesaj formatı:
```json
{
  "from": "marketing_agent",
  "to": "ceo_agent",
  "type": "report|request|response|alert",
  "subject": "Haftalık SEO Raporu",
  "payload": { ... },
  "priority": "low|medium|high|urgent",
  "requires_eray_approval": false,
  "timestamp": "2026-03-10T22:00:00Z"
}
```
