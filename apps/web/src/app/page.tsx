'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import Logo from '../components/logo';

const features = [
  {
    icon: 'shield',
    title: 'Kimlik Güvenliği',
    desc: 'TCKN doğrulama ve kural bazlı risk kontrolleri ile güvenli onboarding.',
  },
  {
    icon: 'document',
    title: 'Dijital Sözleşme',
    desc: 'Taraflar arasında izlenebilir, saklanabilir ve denetlenebilir kontrat akışı.',
  },
  {
    icon: 'bank',
    title: 'Banka Entegrasyonu',
    desc: 'KMH odaklı ödeme altyapısı ile tahsilat ve teminat sürecini netleştirir.',
  },
];

const steps = [
  { number: '01', title: 'Kayıt Ol', desc: 'TCKN doğrulamalı hızlı kayıt. 5 dakikadan az.' },
  { number: '02', title: 'Sözleşme Oluştur', desc: 'Kiracı ve ev sahibi dijital sözleşmeyi imzalar.' },
  { number: '03', title: 'Otomatik Ödeme', desc: 'Kira her ay belirlenen tarihte otomatik tahsil edilir.' },
  { number: '04', title: 'Takip Et', desc: 'Tüm ödemeler ve belgeler tek panelden görüntülenir.' },
];

const stats = [
  { value: '500+', label: 'Aktif Kullanıcı' },
  { value: '₺2M+', label: 'İşlem Hacmi' },
  { value: '%99.8', label: 'Ödeme Başarısı' },
  { value: '< 5 dk', label: 'Onboarding Süresi' },
];

const testimonials = [
  {
    name: 'Ahmet Yılmaz',
    role: 'Kiracı',
    comment: 'Kiramı artık unutmuyorum, otomatik ödeniyor. Çok rahat bir sistem.',
    avatar: 'AY',
  },
  {
    name: 'Fatma Kaya',
    role: 'Ev Sahibi',
    comment: 'Kira gecikmesi tarih oldu. Tüm ödemeler zamanında geliyor.',
    avatar: 'FK',
  },
  {
    name: 'Mehmet Özkan',
    role: 'Emlakçı',
    comment: 'Tüm işlemleri tek platformdan yönetiyorum. Müşterilerim çok memnun.',
    avatar: 'MÖ',
  },
];

interface LatestArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  audience: 'TENANT' | 'LANDLORD' | 'BOTH';
  publishedAt: string;
}

export default function HomePage() {
  const { tokens, isLoading } = useAuth();
  const router = useRouter();
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [latestArticles, setLatestArticles] = useState<LatestArticle[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
      .then((r) => r.json())
      .then((d) => setApiStatus(d.status === 'success' ? 'online' : 'offline'))
      .catch(() => setApiStatus('offline'));
  }, []);

  useEffect(() => {
    if (!isLoading && tokens) {
      router.replace('/dashboard');
    }
  }, [isLoading, tokens, router]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/articles/latest?limit=3`)
      .then((r) => r.json())
      .then((d) => { if (d.status === 'success') setLatestArticles(d.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Logo height={32} />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#nasil-calisir" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
              Nasıl Çalışır?
            </a>
            <Link href="/rehber" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
              Rehber
            </Link>
            <a href="#iletisim" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
              İletişim
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/auth/login"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Giriş Yap
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Hesap Oluştur
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#nasil-calisir" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600">Nasıl Çalışır?</a>
              <Link href="/rehber" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600">Rehber</Link>
              <a href="#iletisim" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600">İletişim</a>
              <hr className="border-slate-200" />
              <Link href="/auth/login" className="text-sm font-semibold text-slate-700">Giriş Yap</Link>
              <Link href="/auth/register" className="rounded-lg bg-blue-700 px-4 py-2 text-center text-sm font-semibold text-white">Hesap Oluştur</Link>
            </div>
          </div>
        )}
      </header>

      <main>

        {/* ── HERO ── */}
        <section className="bg-gradient-to-b from-slate-50 to-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                  Türkiye&apos;nin Dijital Kira Platformu
                </span>
                <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
                  Kiranızı güvenle ödeyin, sözleşmenizi dijitalde yönetin
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
                  Kiracı, ev sahibi ve banka arasındaki süreci tek merkezde yönetin.
                  Sözleşme, ödeme ve uygunluk adımları fintech seviyesinde güvence altında.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                  >
                    Ücretsiz Başla
                  </Link>
                  <a
                    href="#nasil-calisir"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Nasıl Çalışır?
                  </a>
                </div>

                <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Kayıt ücretsiz
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    5 dakikada kurulum
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    SSL & KVKK uyumlu
                  </span>
                </div>
              </div>

              {/* Operasyon Özeti card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Operasyon Özeti</p>
                <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                  apiStatus === 'online' ? 'bg-emerald-50 text-emerald-700' :
                  apiStatus === 'offline' ? 'bg-red-50 text-red-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    apiStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
                    apiStatus === 'offline' ? 'bg-red-500' :
                    'bg-slate-400'
                  }`} />
                  {apiStatus === 'online' ? 'API Bağlantısı Aktif' :
                   apiStatus === 'offline' ? 'API Bağlantısı Pasif' :
                   'Kontrol ediliyor...'}
                </div>
                <div className="mt-5 space-y-4">
                  <Metric label="Doğrulama ve onboarding" value="< 5 dk" />
                  <Metric label="Sözleşme durumu takibi" value="Gerçek zamanlı" />
                  <Metric label="Ödeme takvim görünürlüğü" value="Uçtan uca" />
                </div>
                <Link
                  href="/credit-check"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  Kredi Uygunluk Kontrolü
                  <span className="ml-2" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="border-y border-slate-200 bg-slate-900 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-extrabold text-white">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Platform</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Her şey tek yerde</h2>
              <p className="mt-3 text-base text-slate-500">Kiracıdan ev sahibine, bankadan emlakçıya — tüm süreç dijitalde.</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* ── NASIL ÇALIŞIR ── */}
        <section id="nasil-calisir" className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Süreç</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Nasıl Çalışır?</h2>
              <p className="mt-3 text-base text-slate-500">4 adımda dijital kira yönetimine geçin.</p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <div key={step.number} className="relative rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                  {i < steps.length - 1 && (
                    <div className="absolute right-0 top-8 hidden h-px w-6 bg-slate-300 lg:block" style={{ right: '-24px' }} />
                  )}
                  <span className="text-3xl font-black text-blue-100">{step.number}</span>
                  <h3 className="mt-3 text-base font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{step.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                Hemen Başla
              </Link>
            </div>
          </div>
        </section>

        {/* ── SON YAZILAR ── */}
        {latestArticles.length > 0 && (
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Rehber</p>
                  <h2 className="mt-1 text-3xl font-extrabold text-slate-900">Son Yazılar</h2>
                </div>
                <Link href="/rehber" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                  Tümünü gör →
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {latestArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/rehber/${article.slug}`}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-200"
                  >
                    <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {article.category}
                    </span>
                    <h3 className="mt-3 text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-700 transition line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">{article.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── TESTİMONIALS ── */}
        <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Müşteri Yorumları</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Kullanıcılarımız ne diyor?</h2>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BAND ── */}
        <section className="bg-blue-700 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-white">Hemen başlamaya hazır mısınız?</h2>
            <p className="mt-4 text-base text-blue-100">
              Ücretsiz hesap oluşturun, 5 dakikada kira yönetiminizi dijitale taşıyın.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-semibold text-blue-700 shadow transition hover:bg-blue-50"
              >
                Ücretsiz Başla
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-xl border border-blue-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                Giriş Yap
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer id="iletisim" className="border-t border-slate-200 bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo height={28} />
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Türkiye&apos;nin dijital kira güvence platformu. Kiracı, ev sahibi ve banka arasındaki süreci güvenle yönetin.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Platform</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#nasil-calisir" className="text-sm text-slate-400 hover:text-white transition">Nasıl Çalışır?</a></li>
                <li><Link href="/rehber" className="text-sm text-slate-400 hover:text-white transition">Rehber</Link></li>
                <li><Link href="/auth/register" className="text-sm text-slate-400 hover:text-white transition">Hesap Oluştur</Link></li>
                <li><Link href="/auth/login" className="text-sm text-slate-400 hover:text-white transition">Giriş Yap</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Yasal</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/kvkk" className="text-sm text-slate-400 hover:text-white transition">KVKK Aydınlatma Metni</Link></li>
                <li><Link href="/gizlilik" className="text-sm text-slate-400 hover:text-white transition">Gizlilik Politikası</Link></li>
                <li><Link href="/kullanim-kosullari" className="text-sm text-slate-400 hover:text-white transition">Kullanım Koşulları</Link></li>
                <li><Link href="/cerez-politikasi" className="text-sm text-slate-400 hover:text-white transition">Çerez Politikası</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">İletişim</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="mailto:info@kiraguvence.com" className="text-sm text-slate-400 hover:text-white transition">
                    info@kiraguvence.com
                  </a>
                </li>
                <li className="text-sm text-slate-400">İstanbul, Türkiye</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-800 pt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Kira Güvence. Tüm hakları saklıdır.
            </p>
            <p className="text-xs text-slate-500">
              Bu platform 6698 sayılı KVKK kapsamında kişisel verileri korumaktadır.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-base font-bold text-slate-900">{value}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  const icons: Record<string, string> = {
    shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    bank: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
        <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={icons[icon]} />
        </svg>
      </div>
      <h2 className="mt-4 text-base font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
    </article>
  );
}

function TestimonialCard({ name, role, comment, avatar }: { name: string; role: string; comment: string; avatar: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="h-4 w-4 fill-amber-400" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <blockquote className="mt-3 text-sm leading-6 text-slate-600">
        &ldquo;{comment}&rdquo;
      </blockquote>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <span className="text-xs font-bold text-blue-700">{avatar}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
      </div>
    </article>
  );
}
