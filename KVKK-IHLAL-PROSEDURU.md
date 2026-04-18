# KVKK Veri İhlali Bildirimi — 72 Saat İç Prosedür

**Sürüm:** 1.0 · **Tarih:** Nisan 2026  
**Hukuki Dayanak:** 6698 sayılı KVKK m.12/5 ve Kişisel Veri İhlallerinin Bildirimine İlişkin Tebliğ  
**Veri Sorumlusu:** SecureLend (kiraguvence.com)  
**Sorumlu Kişi:** Eray Karacaoglan (Kurucu & Veri Sorumlusu Temsilcisi)

---

## 1. Kapsam

Bu prosedür; kişisel veri güvenliğini tehdit eden her türlü kazara veya hukuka aykırı olayı kapsar:

| Olay Tipi | Örnek |
|-----------|-------|
| Yetkisiz erişim | Saldırgan Railway/Vercel paneline erişir |
| Veri sızıntısı | Müşteri kayıtları herkese açık hale gelir |
| Veri imhası | DB yanlışlıkla silinir, backup erişilemiyor |
| Yetkisiz değişiklik | Üçüncü taraf ödeme kayıtlarını manipüle eder |
| Kayıp/çalıntı | Yetkili cihaz kaybolur, şifresiz hassas veri içeriyor |

---

## 2. Rol ve Sorumluluk

| Rol | Kişi | Görevi |
|-----|------|--------|
| **Bildirici** (Birincil) | Eray Karacaoglan | Tüm adımları yönetir, Kurul'a bildirim yapar |
| **Teknik Analiz** | Dev Agent / Claude Code | Log toplama, etki analizi, güvenlik yaması |
| **Kullanıcı Bildirimi** | Bildirici | info@kiraguvence.com üzerinden gönderim |

> Bildirici görevde değilse: Kurul bildirimi geciktirilemez. İlk 72 saatte bildirimi diğer yetkili yapabilir; yetki devrini e-posta ile belgele.

---

## 3. 72 Saatlik Eylem Planı

```
[T+0] — İhlal Tespit Edildi
  ├─ İhlali belgele (ekran görüntüsü, log satırları, zaman damgası)
  ├─ Sistemi izole et (Railway env'i durdur veya erişimi kes)
  └─ Bu belgeyi aç, saati kaydet → İhlal Saati: __________

[T+0 ~ T+4] — Teknik Triage
  ├─ Log toplayın (bkz. Bölüm 5)
  ├─ Etkilenen kullanıcı sayısını belirle
  ├─ Etkilenen veri kategorilerini listele
  └─ İhlali durdurmak için gerekli yamayı uygula

[T+4 ~ T+8] — İç Değerlendirme
  ├─ Risk seviyesi: DÜŞÜK / ORTA / YÜKSEK / KRİTİK
  ├─ Kurul'a bildirim zorunluluğu → KVKK m.12/5: Her durumda bildir
  └─ Hukuk danışmanı bilgilendir (KRİTİK veya toplu veri ise)

[T+8 ~ T+48] — Kurul Bildirimi (bkz. Bölüm 4)
  ├─ kvkk.gov.tr Veri İhlali Bildirim Formunu doldur
  ├─ Form numarasını kaydet: __________________
  └─ Onay e-postasını arşivle

[T+48 ~ T+72] — Kullanıcı Bildirimi (bkz. Bölüm 6)
  ├─ Etkilenen kullanıcılara e-posta gönder
  ├─ Gerekirse uygulama içi banner yayınla
  └─ Gönderim kanıtını arşivle (CC veya BCC log)

[T+72+] — Kapanış
  ├─ Olay raporu yaz (Bölüm 7)
  ├─ Güvenlik açığını tamamen kapat
  └─ Kurul'a ek bildirim gerekiyorsa gönder
```

---

## 4. Kurul'a Bildirim — Şablon

**Platform:** https://kvkk.gov.tr → "Veri İhlali Bildirim Formu"  
**Alternatif:** bildirimsistemi@kvkk.gov.tr (form erişilemiyorsa)

Formda doldurulacak alanlar için taslak:

```
VERİ SORUMLUSU BİLGİLERİ
─────────────────────────
Ticaret Ünvanı     : SecureLend / Kira Güvence
Faaliyet Adresi    : [Şirket Adresi]
İletişim Kişisi    : Eray Karacaoglan
E-posta            : eraykaracaoglan@kiraguvence.com
Telefon            : [GSM]
VERBİS Kayıt No   : [VERBİS numarası — henüz alınmadıysa belirt]

VERİ İHLALİ BİLGİLERİ
──────────────────────
İhlal Tarihi/Saati : [GG.AA.YYYY — SS:DD]
Tespit Tarihi/Saati: [GG.AA.YYYY — SS:DD]
Bildirim Tarihi    : [GG.AA.YYYY — SS:DD]

İhlalin Niteliği   : [Yetkisiz erişim / Veri sızıntısı / İmha / Diğer]
İhlalin Kaynağı    : [Harici saldırı / İç hata / Teknik arıza / Kayıp cihaz]

Etkilenen Veri Kategorileri:
  [ ] Kimlik (Ad, TCKN)
  [ ] İletişim (e-posta, telefon)
  [ ] Finansal (IBAN, gelir bilgisi)
  [ ] Konum
  [ ] Özel Nitelikli Veri
  [ ] Diğer: ___________________

Etkilenen Kişi Sayısı (tahmini): ________
Etkilenen Veri Kaydı Sayısı    : ________

İhlalin Muhtemel Sonuçları:
  [Serbest metin — olası zararları madde madde yaz]

Alınan/Alınacak Önlemler:
  [Serbest metin — teknik ve idari tedbirleri yaz]

Etkilenen Kişiler Bilgilendirildi mi? E / H
Bilgilendirme Tarihi (yapıldıysa): ___________
```

---

## 5. Log Kanıtı Toplama — Adımlar

### 5.1 Railway API Logları
```bash
# Railway Dashboard → Deployments → Logs → "Download"
# veya Railway CLI:
railway logs --json > ihlal-$(date +%Y%m%d-%H%M)-railway.json
```

### 5.2 Veritabanı Audit Kayıtları
```sql
-- AuditLog tablosu (Prisma modeli mevcut)
SELECT * FROM "AuditLog"
WHERE "createdAt" >= '[ihlal_saati - 24h]'
ORDER BY "createdAt" ASC;

-- Şüpheli kullanıcı aktivitesi
SELECT u."email", al.*
FROM "AuditLog" al
JOIN "User" u ON u."id" = al."userId"
WHERE al."createdAt" >= '[ihlal_saati]'
  AND al."action" ILIKE '%delete%'
   OR al."action" ILIKE '%export%';
```

### 5.3 Vercel Access Logları
Vercel Dashboard → Project → Functions → Logs → "Export"

### 5.4 Etkilenen Kullanıcı Listesi
```sql
-- Sızdırılan tabloya bağlı kullanıcıları bul
SELECT DISTINCT u."id", u."email", u."phone"
FROM "User" u
WHERE u."id" IN (
  -- Etkilenen kayıtların userId'lerini buraya koy
);
```

### 5.5 Kanıtların Saklanması
- Dosya adı formatı: `ihlal-YYYYMMDD-[kisa-aciklama]-[v1].log`
- Konum: Google Drive / iCloud → `SecureLend / KVKK / İhlaller / [Yıl]`
- Hashleri kaydet (SHA-256) — mahkeme kanıtı için bütünlük doğrulaması

---

## 6. Etkilenen Kullanıcılara Bildirim — E-posta Şablonu

**Gönderen:** info@kiraguvence.com  
**Konu:** Kira Güvence — Kişisel Verilerinize İlişkin Önemli Bilgilendirme

```
Sayın [Ad Soyad],

Kira Güvence platformunu kullanan değerli kullanıcımız olarak sizi
önemli bir konuda bilgilendirmek istiyoruz.

[TARİH] tarihinde, sistemlerimizde bir güvenlik olayı yaşandığını
tespit ettik. Bu olay kapsamında aşağıdaki kişisel verileriniz
etkilenmiş olabilir:

  • [Etkilenen veri kategorileri — örn: e-posta adresi, telefon numarası]

Etkilenmediği belirlenen veriler:
  • Şifreniz (hashlendi, açık metin tutulmaz)
  • Ödeme bilgileriniz (şifreli saklanmaktaydı)
  • [Diğer güvende olan veriler]

Aldığımız önlemler:
  • [Alınan teknik tedbirler — örn: ilgili endpoint'ler devre dışı bırakıldı]
  • Kişisel Verileri Koruma Kurulu'na bildirimde bulunduk (Ref: [Kurul No])

Sizden beklentimiz:
  • Başka platformlarda aynı parolayı kullanıyorsanız lütfen değiştirin.
  • Şüpheli bir aktivite fark ederseniz info@kiraguvence.com adresine bildirin.

KVKK m.11 kapsamındaki haklarınızı kullanmak için:
kiraguvence.com/veri-talebi

Üzüntülerimizi ve özürlerimizi sunarız.

Eray Karacaoglan
Kira Güvence — Veri Sorumlusu Temsilcisi
info@kiraguvence.com
```

---

## 7. Olay Sonrası — Kapanış Raporu Şablonu

Dosya adı: `ihlal-raporu-YYYYMMDD.md`  
Saklama: `SecureLend / KVKK / İhlaller / [Yıl]`

```markdown
## Olay Özeti
- Tespit tarihi/saati:
- İhlal tarihi/saati (tahmini):
- Süre (ihlal süresi):
- Etkilenen kullanıcı sayısı:
- Etkilenen veri kategorileri:

## Kök Neden
[Teknik analiz — ne neden oldu]

## Zaman Çizelgesi
| Saat | Eylem | Yapan |
|------|-------|-------|

## Alınan Önlemler
- Anlık: ...
- Uzun vadeli: ...

## Kurul Bildirimi
- Bildirim tarihi:
- Form/Referans numarası:
- Ek bildirim gerekti mi?

## Kullanıcı Bildirimi
- Gönderim tarihi:
- Gönderilen kişi sayısı:
- Gönderim kanıtı (dosya adı):

## Açık Kalan Eylemler
- [ ] ...
```

---

## 8. Hızlı Başvuru — Acil İletişim

| Kurum/Kişi | İletişim |
|------------|----------|
| Kişisel Verileri Koruma Kurulu | kvkk.gov.tr / +90 312 216 50 00 |
| Kurul Bildirim E-posta | bildirimsistemi@kvkk.gov.tr |
| Hukuk Danışmanı | [Avukat adı / GSM] |
| Railway Destek | railway.app/help |
| Vercel Güvenlik | security@vercel.com |

---

> **Hatırlatma:** 72 saatlik süre ihlalden değil, **tespetten** itibaren işlemeye başlar. Sürenin aşılması durumunda bile bildirim yap — geç bildirim, hiç bildirmemekten hukuki açıdan çok daha iyidir.
