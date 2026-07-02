# @securelend/bi — Sürükle-bırak BI Editörü

Oracle veritabanlarına bağlanan, **server-side** agregasyon / pivot / sayfalama
yapan, çok kullanıcılı ve paylaşımlı basit bir BI editörü.

## Öne çıkanlar

- **Oracle (thin mode)** — `oracledb` 6+, Oracle Instant Client kurulumu
  gerektirmez.
- **Tamamen custom drag-drop** — native HTML5; Satırlar / Sütunlar / Değerler /
  Filtreler rafları.
- **Server-side hesaplama & paging** — `GROUP BY` + `OFFSET/FETCH`, ayrı `COUNT`.
  Büyük tablolar için veriyi tarayıcıya çekmez.
- **Server-side pivot** — tek sütun-boyutu için koşullu agregasyon
  (`SUM(CASE WHEN ...)`), her Oracle sürümünde çalışır, sayfalama bozulmaz.
- **Güvenli SQL** — tablo/kolon adları canlı şemaya karşı doğrulanır ve
  tırnaklanır; tüm değerler **bind değişkeni** ile geçer (SQL injection kapalı).
- **Çok kullanıcılı + paylaşım** — kayıtlı raporlar, görüntüleme/düzenleme
  izniyle paylaşım.

## Çalıştırma

```bash
# repo kökünden
pnpm install
cp apps/bi/.env.example apps/bi/.env   # secret'ları doldur
pnpm --filter @securelend/bi dev        # http://localhost:3100
```

İlk açılışta `.env` içindeki `BI_BOOTSTRAP_ADMIN_*` ile bir admin kullanıcı
oluşturulur (varsayılan `admin` / `admin1234`). Giriş yaptıktan sonra:

1. **+ Bağlantı** ile Oracle bilgilerini gir (host, port, service name/SID,
   kullanıcı, şifre). Kaydetmeden önce bağlantı test edilir.
2. Soldan bir tablo seç → kolonları rafların üzerine sürükle.
3. Sonuç otomatik (server-side) hesaplanır; başlığa tıklayarak sırala, alttan
   sayfala.
4. **Kaydet** / **Paşlaş** ile raporu sakla ve diğer kullanıcılarla paylaş.

## Ortam değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `BI_AUTH_SECRET` | Oturum JWT imza anahtarı (32+ karakter) |
| `BI_CRYPTO_KEY` | Oracle şifrelerini AES-256-GCM ile şifreler (64 hex) |
| `BI_DATA_DIR` | Metadata JSON store dizini (varsayılan `apps/bi/data`) |
| `BI_BOOTSTRAP_ADMIN_USER/PASSWORD` | İlk admin |
| `BI_MAX_PAGE_SIZE` | Sayfa başına azami satır (varsayılan 500) |

## Mimari notları

- Metadata (kullanıcı/bağlantı/rapor/paylaşım) bağımlılıksız bir **JSON store**
  içinde tutulur (`data/db.json`). `lib/store.ts` dar bir arayüz olduğundan
  ileride Prisma/Postgres'e taşınabilir.
- Tüm sorgu üretimi `lib/query-builder.ts` içinde; doğrudan SQL string'e
  hiçbir kullanıcı girdisi enterpolasyon ile girmez.
- Pivot sütun kardinalitesi güvenlik için **50** ile sınırlıdır.

## v1 sonrası (yapılacaklar)

- Oracle dışı motorlar (sürücü soyutlaması hazır değil).
- Çok seviyeli (birden fazla sütun boyutu) pivot ve ara toplamlar.
- Hesaplanmış alanlar / türetilmiş ölçüler.
- CSV/Excel dışa aktarım (server-side stream).
