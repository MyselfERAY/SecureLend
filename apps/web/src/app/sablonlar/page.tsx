import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hukuki Sablonlar',
  description: 'Kira sozlesmesi, tahliye taahhudu, ihtar mektubu ve diger hukuki belge sablonlari. TBK uyumlu, ucretsiz kullanim.',
  openGraph: {
    title: 'Hukuki Sablonlar | Kira Guvence',
    description: 'Kira sozlesmesi ornegi, tahliye taahhudu, ihtar mektubu sablonlari. TBK uyumlu.',
  },
  alternates: { canonical: '/sablonlar' },
};

const templates = [
  {
    title: 'Kira Sozlesmesi',
    description: 'TBK m.299-378 uyumlu, 9 maddeden olusan kapsamli konut kira sozlesmesi. Depozito, odeme kosullari, fesih ve tahliye hukumlerini icerir.',
    articles: ['Taraf bilgileri', 'Kira bedeli ve artis', 'Depozito', 'Bakim ve onarim', 'Fesih kosullari', 'Islak imza alanlari'],
    badge: 'Platform Uzerinden',
    badgeCls: 'bg-blue-500/20 text-blue-400',
    available: true,
  },
  {
    title: 'Tahliye Taahhudu',
    description: 'TBK m.352/1 kapsaminda, kiracinin belirli bir tarihte kiralananibosaltacagina dair yazili taahhudu. Noter onayina uygun format.',
    articles: ['Taahhutu veren (kiraci)', 'Tasinmaz bilgileri', 'Tahliye tarihi', 'Cezai sart', 'Taahhut tarihi ve imza'],
    badge: 'Yakindan',
    badgeCls: 'bg-amber-500/20 text-amber-400',
    available: false,
  },
  {
    title: 'Ihtar Mektubu (Kira Odenmemesi)',
    description: 'TBK m.315 geregi kira bedelini odemeyen kiraciya cekilen ihtar. Konut kiralarinda 30 gun, isyeri kiralarinda 10 gun sure taninir.',
    articles: ['Gonderen/alici bilgileri', 'Odenmemis kira detaylari', 'Yasal sure bildirimi', 'Sonuclar', 'Teblig bilgileri'],
    badge: 'Yakindan',
    badgeCls: 'bg-amber-500/20 text-amber-400',
    available: false,
  },
  {
    title: 'Depozito Iade Talep Yazisi',
    description: 'Kira sozlesmesinin sona ermesinin ardindan, kiracinin depozito iadesini talep ettigi resmi yazi. Tutar, banka bilgileri ve sure iceriri.',
    articles: ['Talep eden (kiraci)', 'Sozlesme referansi', 'Depozito tutari', 'Banka/IBAN bilgisi', 'Yasal dayanak'],
    badge: 'Yakindan',
    badgeCls: 'bg-amber-500/20 text-amber-400',
    available: false,
  },
  {
    title: 'Kira Artis Bildirimi',
    description: 'TUFE oranina dayali kira artis bildirimi. TBK m.344 geregi yillik artis oranini kiraya veren yazili olarak bildirir.',
    articles: ['Mevcut kira bedeli', 'TUFE orani', 'Yeni kira bedeli', 'Gecerlilik tarihi', 'Yasal dayanak'],
    badge: 'Yakindan',
    badgeCls: 'bg-amber-500/20 text-amber-400',
    available: false,
  },
  {
    title: 'Esya Teslim Tutanagi',
    description: 'Kiralananin esyali tesliminde, mevcut esya ve durumlarini listeleyen tutanak. Giris ve cikista karsilastirmali kontrol saglar.',
    articles: ['Esya listesi', 'Durum notu (iyi/orta/hasarli)', 'Fotoraf referansi', 'Taraf imzalari', 'Tarih'],
    badge: 'Yakindan',
    badgeCls: 'bg-amber-500/20 text-amber-400',
    available: false,
  },
];

export default function SablonlarPage() {
  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-[#0d1b2a]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold text-white">
            KiraGuvence
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/fiyatlandirma" className="text-sm text-slate-400 hover:text-white transition">
              Fiyatlandirma
            </Link>
            <Link href="/rehber" className="text-sm text-slate-400 hover:text-white transition">
              Rehber
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Ucretsiz Hesap Olustur
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-700/50 bg-gradient-to-b from-[#0d1b2a] to-[#0a1628] py-16 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Hukuki Belge Sablonlari
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Turk Borclar Kanunu&apos;na uygun, profesyonel kira hukuku belge sablonlari.
            KiraGuvence platformunda ucretsiz kullanin.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
              TBK Uyumlu
            </span>
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-400">
              Ucretsiz
            </span>
            <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-medium text-purple-400">
              Profesyonel Format
            </span>
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div
              key={t.title}
              className={`group relative flex flex-col rounded-xl border bg-[#0d1b2a] p-6 transition ${
                t.available
                  ? 'border-blue-500/30 hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/5'
                  : 'border-slate-700/50'
              }`}
            >
              {/* Badge */}
              <span className={`mb-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.badgeCls}`}>
                {t.badge}
              </span>

              <h3 className="mb-2 text-lg font-semibold text-white">{t.title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-slate-400">{t.description}</p>

              {/* Articles */}
              <div className="mb-5 flex-1">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Icerik</div>
                <ul className="space-y-1.5">
                  {t.articles.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-sm text-slate-400">
                      <svg className="h-3.5 w-3.5 shrink-0 text-emerald-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              {t.available ? (
                <Link
                  href="/auth/register"
                  className="mt-auto block rounded-lg bg-blue-600 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Ucretsiz Hesap Olustur
                </Link>
              ) : (
                <div className="mt-auto rounded-lg border border-slate-700/50 bg-slate-800/30 py-2.5 text-center text-sm font-medium text-slate-500">
                  Cok Yakinda
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info box */}
        <div className="mt-12 rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-8 text-center">
          <h2 className="mb-3 text-xl font-semibold text-white">
            Neden KiraGuvence Sablonlari?
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-400">
            Tum sablonlarimiz hukuk danismanlari tarafindan hazirlanmis ve 6098 sayili
            Turk Borclar Kanunu&apos;na uygun olarak duzenlenmistir. Platformumuza kayit olarak
            sablonlari otomatik doldurma, PDF indirme ve dijital arsivleme ozelliklerinden
            yararlanabilirsiniz.
          </p>
          <Link
            href="/auth/register"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Ucretsiz Hesap Olustur
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4">
          <p>&copy; {new Date().getFullYear()} KiraGuvence. Tum haklari saklidir.</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/gizlilik" className="hover:text-slate-400 transition">Gizlilik</Link>
            <Link href="/kullanim-kosullari" className="hover:text-slate-400 transition">Kullanim Kosullari</Link>
            <Link href="/kvkk" className="hover:text-slate-400 transition">KVKK</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
