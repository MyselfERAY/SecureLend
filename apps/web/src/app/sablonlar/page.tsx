import type { Metadata } from 'next';
import Link from 'next/link';
import SiteNav from '../../components/site-nav';

export const metadata: Metadata = {
  title: 'Hukuki Şablonlar',
  description: 'Kira sözleşmesi, tahliye taahhüdü, ihtar mektubu ve diğer hukuki belge şablonları. TBK uyumlu, ücretsiz kullanım.',
  openGraph: {
    title: 'Hukuki Şablonlar | Kira Güvence',
    description: 'Kira sözleşmesi örneği, tahliye taahhüdü, ihtar mektubu şablonları. TBK uyumlu.',
  },
  alternates: { canonical: '/sablonlar' },
};

const templates = [
  {
    title: 'Kira Sözleşmesi',
    description: 'TBK m.299-378 uyumlu, 9 maddeden oluşan kapsamlı konut kira sözleşmesi. Depozito, ödeme koşulları, fesih ve tahliye hükümlerini içerir.',
    articles: ['Taraf bilgileri', 'Kira bedeli ve artış', 'Depozito', 'Bakım ve onarım', 'Fesih koşulları', 'Islak imza alanları'],
    badge: 'Platform Üzerinden',
    badgeCls: 'bg-blue-500/20 text-blue-400',
    available: true,
  },
  {
    title: 'Tahliye Taahhudu',
    description: 'TBK m.352/1 kapsamında, kiracının belirli bir tarihte kiralananı boşaltacağına dair yazılı taahhüdü. Noter onayına uygun format.',
    articles: ['Taahhüdü veren (kiracı)', 'Taşınmaz bilgileri', 'Tahliye tarihi', 'Cezai şart', 'Taahhüt tarihi ve imza'],
    badge: 'Yakından',
    badgeCls: 'bg-amber-500/20 text-amber-400',
    available: false,
  },
  {
    title: 'İhtar Mektubu (Kira Ödenmemesi)',
    description: 'TBK m.315 gereği kira bedelini ödemeyen kiracıya çekilen ihtar. Konut kiralarında 30 gün, işyeri kiralarında 10 gün süre tanınır.',
    articles: ['Gönderen/alıcı bilgileri', 'Ödenmemiş kira detayları', 'Yasal süre bildirimi', 'Sonuçlar', 'Tebliğ bilgileri'],
    badge: 'Yakından',
    badgeCls: 'bg-amber-500/20 text-amber-400',
    available: false,
  },
  {
    title: 'Depozito İade Talep Yazısı',
    description: 'Kira sözleşmesinin sona ermesinin ardından, kiracının depozito iadesini talep ettiği resmi yazı. Tutar, banka bilgileri ve süre içerir.',
    articles: ['Talep eden (kiracı)', 'Sözleşme referansı', 'Depozito tutarı', 'Banka/IBAN bilgisi', 'Yasal dayanak'],
    badge: 'Yakından',
    badgeCls: 'bg-amber-500/20 text-amber-400',
    available: false,
  },
  {
    title: 'Kira Artış Bildirimi',
    description: 'TÜFE oranına dayalı kira artış bildirimi. TBK m.344 gereği yıllık artış oranını kiraya veren yazılı olarak bildirir.',
    articles: ['Mevcut kira bedeli', 'TÜFE oranı', 'Yeni kira bedeli', 'Geçerlilik tarihi', 'Yasal dayanak'],
    badge: 'Yakından',
    badgeCls: 'bg-amber-500/20 text-amber-400',
    available: false,
  },
  {
    title: 'Eşya Teslim Tutanağı',
    description: 'Kiralananın eşyalı tesliminde, mevcut eşya ve durumlarını listeleyen tutanak. Giriş ve çıkışta karşılaştırmalı kontrol sağlar.',
    articles: ['Eşya listesi', 'Durum notu (iyi/orta/hasarlı)', 'Fotoğraf referansı', 'Taraf imzaları', 'Tarih'],
    badge: 'Yakından',
    badgeCls: 'bg-amber-500/20 text-amber-400',
    available: false,
  },
];

export default function SablonlarPage() {
  return (
    <div className="min-h-screen bg-[#0a1628]">
      <SiteNav variant="dark" />

      {/* Hero */}
      <section className="border-b border-slate-700/50 bg-gradient-to-b from-[#0d1b2a] to-[#0a1628] py-16 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Hukuki Belge Şablonları
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Türk Borçlar Kanunu&apos;na uygun, profesyonel kira hukuku belge şablonları.
            Kira Güvence platformunda ücretsiz kullanın.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
              TBK Uyumlu
            </span>
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-400">
              Ücretsiz
            </span>
            <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-medium text-purple-400">
              Profesyonel Format
            </span>
          </div>
        </div>
      </section>

      {/* Hero Template — Kira Sozlesmesi */}
      <section className="mx-auto max-w-6xl px-4 pt-12">
        {(() => {
          const hero = templates.find((t) => t.available)!;
          return (
            <div className="relative rounded-2xl border-2 border-blue-500/50 bg-[#0d1b2a] p-8 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20 md:flex md:gap-10">
              {/* Glow effect */}
              <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10" />

              <div className="relative flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${hero.badgeCls}`}>
                    {hero.badge}
                  </span>
                  <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                    Hemen Kullanılabilir
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">{hero.title}</h2>
                <p className="mt-3 text-base leading-relaxed text-slate-300">{hero.description}</p>
                <Link
                  href="/auth/register"
                  className="mt-6 inline-block rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Ücretsiz Hesap Oluştur
                </Link>
              </div>

              <div className="relative mt-6 md:mt-0 md:w-64 shrink-0">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">İçerik</div>
                <ul className="space-y-2">
                  {hero.articles.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-sm text-slate-300">
                      <svg className="h-4 w-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Upcoming Templates Grid */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-xl font-semibold text-white">Yakında Eklenecek Şablonlar</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.filter((t) => !t.available).map((t) => (
            <div
              key={t.title}
              className="group relative flex flex-col rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 transition"
            >
              <span className={`mb-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.badgeCls}`}>
                {t.badge}
              </span>
              <h3 className="mb-2 text-base font-semibold text-white">{t.title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-slate-400">{t.description}</p>
              <div className="mb-4 flex-1">
                <ul className="space-y-1">
                  {t.articles.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="h-3 w-3 shrink-0 text-emerald-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto rounded-lg border border-slate-700/50 bg-slate-800/30 py-2 text-center text-sm font-medium text-slate-500">
                Çok Yakında
              </div>
            </div>
          ))}
        </div>

        {/* Notification prompt */}
        <div className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/5 px-6 py-4 text-center">
          <p className="text-sm text-slate-300">
            Yeni şablonlar eklendikçe bildirim almak ister misiniz?{' '}
            <Link href="/auth/register" className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2 transition">
              Ücretsiz kayıt olun
            </Link>
          </p>
        </div>

        {/* Info box */}
        <div className="mt-12 rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-8 text-center">
          <h2 className="mb-3 text-xl font-semibold text-white">
            Neden Kira Güvence Şablonları?
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-400">
            Tüm şablonlarımız hukuk danışmanları tarafından hazırlanmış ve 6098 sayılı
            Türk Borçlar Kanunu&apos;na uygun olarak düzenlenmiştir. Platformumuza kayıt olarak
            şablonları otomatik doldurma, PDF indirme ve dijital arşivleme özelliklerinden
            yararlanabilirsiniz.
          </p>
          <Link
            href="/auth/register"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Ücretsiz Hesap Oluştur
          </Link>
        </div>
      </section>

    </div>
  );
}
