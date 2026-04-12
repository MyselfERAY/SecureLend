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

const heroTemplate = {
  title: 'Kira Sözleşmesi',
  description: 'TBK m.299-378 uyumlu, 9 maddeden oluşan kapsamlı konut kira sözleşmesi. Depozito, ödeme koşulları, fesih ve tahliye hükümlerini içerir.',
  articles: ['Taraf bilgileri', 'Kira bedeli ve artış', 'Depozito', 'Bakım ve onarım', 'Fesih koşulları', 'Islak imza alanları'],
  badge: 'Platform Üzerinden',
  badgeCls: 'bg-blue-100 text-blue-700',
};

const upcomingTemplates = [
  {
    title: 'Tahliye Taahhüdü',
    description: 'TBK m.352/1 kapsamında, kiracının belirli bir tarihte kiralananı boşaltacağına dair yazılı taahhüdü.',
  },
  {
    title: 'İhtar Mektubu (Kira Ödenmemesi)',
    description: 'TBK m.315 gereği kira bedelini ödemeyen kiracıya çekilen ihtar.',
  },
  {
    title: 'Depozito İade Talep Yazısı',
    description: 'Kira sözleşmesinin sona ermesinin ardından, kiracının depozito iadesini talep ettiği resmi yazı.',
  },
  {
    title: 'Kira Artış Bildirimi',
    description: 'TÜFE oranına dayalı kira artış bildirimi.',
  },
  {
    title: 'Eşya Teslim Tutanağı',
    description: 'Kiralananın eşyalı tesliminde, mevcut eşya ve durumlarını listeleyen tutanak.',
  },
];

export default function SablonlarPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav variant="light" />

      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white py-16 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Hukuki Belge Şablonları
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Türk Borçlar Kanunu&apos;na uygun, profesyonel kira hukuku belge şablonları.
            Kira Güvence platformunda ücretsiz kullanın.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              TBK Uyumlu
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Ücretsiz
            </span>
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
              Profesyonel Format
            </span>
          </div>
        </div>
      </section>

      {/* Hero Template — Kira Sözleşmesi */}
      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="relative rounded-2xl border-2 border-blue-200 bg-white p-8 shadow-lg shadow-blue-100 ring-1 ring-blue-100 md:flex md:gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${heroTemplate.badgeCls}`}>
                {heroTemplate.badge}
              </span>
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Hemen Kullanılabilir
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{heroTemplate.title}</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-500">{heroTemplate.description}</p>
            <Link
              href="/auth/register"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Ücretsiz Hesap Oluştur
            </Link>
          </div>

          <div className="mt-6 md:mt-0 md:w-64 shrink-0">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">İçerik</div>
            <ul className="space-y-2">
              {heroTemplate.articles.map((a) => (
                <li key={a} className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Upcoming Templates */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Yakında Eklenecek Şablonlar</h2>
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            {upcomingTemplates.length} şablon
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {upcomingTemplates.map((t) => (
            <div
              key={t.title}
              className="flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 transition hover:bg-slate-100"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-slate-900">{t.title}</h3>
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Yakında
                  </span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{t.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Notification prompt */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 px-6 py-4 text-center">
          <p className="text-sm text-slate-600">
            Yeni şablonlar eklendikçe bildirim almak ister misiniz?{' '}
            <Link href="/auth/register" className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2 transition">
              Ücretsiz kayıt olun
            </Link>
          </p>
        </div>

        {/* Info box */}
        <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <h2 className="mb-3 text-xl font-semibold text-slate-900">
            Neden Kira Güvence Şablonları?
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600">
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
