'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';

const features = [
  {
    icon: 'shield',
    title: 'Kimlik Guvenligi',
    desc: 'TCKN dogrulama ve kural bazli risk kontrolleri ile guvenli onboarding.',
  },
  {
    icon: 'document',
    title: 'Dijital Sozlesme',
    desc: 'Taraflar arasinda izlenebilir, saklanabilir ve denetlenebilir kontrat akisi.',
  },
  {
    icon: 'bank',
    title: 'Banka Entegrasyonu',
    desc: 'KMH odakli odeme altyapisi ile tahsilat ve teminat surecini netlestirir.',
  },
];

const testimonials = [
  {
    name: 'Ahmet Yılmaz',
    role: 'Kiracı',
    comment: 'Kiramı artık unutmuyorum, otomatik ödeniyor. Çok rahat bir sistem.',
    avatar: 'AY'
  },
  {
    name: 'Fatma Kaya',
    role: 'Ev Sahibi',
    comment: 'Kira gecikmesi tarih oldu. Tüm ödemeler zamanında geliyor.',
    avatar: 'FK'
  },
  {
    name: 'Mehmet Özkan',
    role: 'Emlakçı',
    comment: 'Tüm işlemleri tek platformdan yönetiyorum. Müşterilerim çok memnun.',
    avatar: 'MÖ'
  }
];

export default function HomePage() {
  const { tokens, isLoading } = useAuth();
  const router = useRouter();
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

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

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                Kira Guvence Platform
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
                Kira Guvence - Dijital Kira Odeme Platformu
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Kira Guvence; kiraci, ev sahibi ve banka arasindaki sureci tek merkezde yonetir. Sozlesme,
                odeme ve uygunluk adimlari fintech seviyesinde kontrol edilebilir hale gelir.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Hesap Olustur
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Giris Yap
                </Link>
              </div>
              
              <p className="mt-4 text-sm text-slate-600">
                Kira Guvence ile kiranizi guvenle odeyin.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Operasyon Ozeti</p>
              <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                apiStatus === 'online' ? 'bg-emerald-50 text-emerald-700' :
                apiStatus === 'offline' ? 'bg-red-50 text-red-700' :
                'bg-slate-100 text-slate-500'
              }`}>
                <span className={`h-2 w-2 rounded-full ${
                  apiStatus === 'online' ? 'bg-emerald-500' :
                  apiStatus === 'offline' ? 'bg-red-500' :
                  'bg-slate-400'
                }`} />
                {apiStatus === 'online' ? 'API Baglantisi Aktif' :
                 apiStatus === 'offline' ? 'API Baglantisi Pasif' :
                 'Kontrol ediliyor...'}
              </div>
              <div className="mt-5 space-y-4">
                <Metric label="Dogrulama ve onboarding" value="< 5 dk" />
                <Metric label="Sozlesme durumu takibi" value="Gercek zamanli" />
                <Metric label="Odeme takvim gorunurlugu" value="Uctan uca" />
              </div>
              <Link
                href="/credit-check"
                className="mt-6 inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Kredi Uygunluk Kontrolu
                <span className="ml-1" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </section>

        <section className="mt-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Müşteri Yorumları</h2>
            <p className="mt-4 text-lg text-slate-600">
              Kira Guvence kullanıcılarımızın deneyimlerini keşfedin
            </p>
          </div>
          
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
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
    <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
        <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={icons[icon]} />
        </svg>
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
    </article>
  );
}

function TestimonialCard({ name, role, comment, avatar }: { name: string; role: string; comment: string; avatar: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <span className="text-sm font-semibold text-blue-700">{avatar}</span>
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">{name}</h3>
          <p className="text-sm text-blue-600">{role}</p>
        </div>
      </div>
      <blockquote className="mt-4 text-sm leading-6 text-slate-600">
        "{comment}"
      </blockquote>
      <div className="mt-4 flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    </article>
  );
}
