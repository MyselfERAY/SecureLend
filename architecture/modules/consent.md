# Consent & Onboarding (2 Modül)

## consent
KVKK (Türk GDPR) rıza kaydı ve takibi.

### Endpoint'ler
- `GET /api/v1/consents/my` — Rıza kayıtlarım [Auth]
- `GET /api/v1/consents/check/:type?version=` — Aktif rıza kontrolü [Auth]
- `POST /api/v1/consents` — Yeni rıza kaydet [Auth]

### ConsentType Enum
- KVKK_AYDINLATMA — Aydınlatma metni onayı
- KVKK_ACIK_RIZA — Açık rıza
- KVKK_ACIK_RIZA_KMH — KMH için özel açık rıza
- TERMS_OF_SERVICE — Kullanım koşulları

### Consent Alanları
- type, version, accepted, ipAddress, userAgent, acceptedAt

---

## onboarding
Kayıt sonrası otomatik hatırlatma sistemi (24h, 48h, 7 gün).

### Çalışma Mantığı
- Her 30 dakikada çalışır (interval)
- Kayıt sonrası belirli zaman pencerelerinde aktif olmayan kullanıcılara SMS/email gönderir

### Hatırlatmalar
1. **24 saat:** "Mülkünüzü ekleyin" + 3 adımlı rehber
2. **48 saat:** "Platformu henüz keşfetmediniz mi?"
3. **7 gün:** "Son hatırlatma"

---

## Bağımlılıklar
- **İçeri:** PrismaService, NotificationModule (SMS/email)
- **Dışarı:** auth (register'da rıza kaydı zorunlu), bank (KMH başvuruda KVKK_ACIK_RIZA_KMH kontrolü)

## Kritik Kurallar
- Register'da KVKK_AYDINLATMA ve KVKK_ACIK_RIZA version 2.0 zorunlu
- Consent kaydı ipAddress ve userAgent ile birlikte saklanır (KVKK uyumu)
- Version takibi: yeni versiyon çıktığında eski rıza geçersiz sayılır
- Onboarding sadece onboardingCompleted=false kullanıcılara gönderilir

## Son Değişiklik
[2026-04-10] Onboarding hatırlatma sistemi eklendi
