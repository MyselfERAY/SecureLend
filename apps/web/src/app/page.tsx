'use client';

import { useEffect } from 'react';
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

export default function HomePage() {
  const { tokens, isLoading } = useAuth();
  const router = useRouter();

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
                SecureLend Platform
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
                SecureLend - Dijital Kira Odeme Platformu
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                SecureLend; kiraci, ev sahibi ve banka arasindaki sureci tek merkezde yonetir. Sozlesme,
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
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Operasyon Ozeti</p>
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