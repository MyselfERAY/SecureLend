'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteNav from '../../components/site-nav';
import Logo from '../../components/logo';
import { api } from '../../lib/api';

/* ── PLAN DEFINITIONS ─────────────────────────────── */

const plans = [
  {
    name: 'Tek Mülk',
    subtitle: 'Bireysel ev sahipleri',
    price: 'Ücretsiz',
    priceNote: 'Abonelik ücreti yok',
    commission: '%1.5',
    commissionRate: 0.015,
    subscription: 0,
    propertyLimit: 1,
    propertyLabel: '1 mülk',
    rentLimit: '25.000 TL\'ye kadar',
    features: [
      'Banka Güvence Hesabı (KMH) entegrasyonu',
      'Dijital kira sözleşmesi (TBK uyumlu)',
      'Otomatik ödeme takibi',
      'KVKK uyumlu altyapı',
      'Temel e-posta desteği',
    ],
    cta: 'Ücretsiz Hesap Oluştur',
    highlighted: false,
  },
  {
    name: 'Çoklu Mülk',
    subtitle: 'Birden fazla mülk yönetenler',
    price: '149 TL',
    priceNote: '/ay',
    commission: '%1',
    commissionRate: 0.01,
    subscription: 149,
    propertyLimit: 5,
    propertyLabel: '5 mülke kadar',
    rentLimit: 'Sınırsız kira tutarı',
    features: [
      'Banka Güvence Hesabı (KMH) entegrasyonu',
      'Dijital kira sözleşmesi (TBK uyumlu)',
      'Otomatik ödeme takibi',
      'Aylık PDF gelir raporu',
      'KVKK uyumlu altyapı',
      'Standart destek (24 saat)',
    ],
    cta: 'Ücretsiz Hesap Oluştur',
    highlighted: true,
  },
  {
    name: 'Portföy',
    subtitle: 'Profesyonel mülk yöneticileri',
    price: '349 TL',
    priceNote: '/ay',
    commission: '%0.5',
    commissionRate: 0.005,
    subscription: 349,
    propertyLimit: -1,
    propertyLabel: 'Sınırsız mülk',
    rentLimit: 'Sınırsız kira tutarı',
    features: [
      'Banka Güvence Hesabı (KMH) entegrasyonu',
      'Dijital kira sözleşmesi (TBK uyumlu)',
      'Otomatik ödeme takibi',
      'Detaylı PDF gelir/gider raporu',
      'KVKK uyumlu altyapı',
      'Öncelikli destek (1 saat)',
      'API erişimi',
      'Çoklu kullanıcı yönetimi',
    ],
    cta: 'Ücretsiz Hesap Oluştur',
    highlighted: false,
  },
];

/* ── SÜRE İNDİRİMİ ─────────────────────────────── */

const durationDiscounts = [
  { label: '1-6 ay', months: '1-6', discount: 0, note: 'Standart garanti ücreti' },
  { label: '6-12 ay', months: '6-12', discount: 10, note: 'Garanti ücretinde %10 indirim' },
  { label: '12+ ay', months: '12+', discount: 20, note: 'Garanti ücretinde %20 indirim' },
];

/* ── KIRA TUTARI ARALIKLARI ────────────────────── */

const rentTiers = [
  { range: '0 - 10.000 TL', label: 'Düşük', note: 'Standart garanti ücreti oranı' },
  { range: '10.000 - 25.000 TL', label: 'Orta', note: 'Standart garanti ücreti oranı' },
  { range: '25.000 - 50.000 TL', label: 'Yüksek', note: 'Garanti ücretinde %15 indirim (Çoklu Mülk+)' },
  { range: '50.000 TL+', label: 'Premium', note: 'Garanti ücretinde %25 indirim (Portföy)' },
];

/* ── PROMO TYPES ────────────────────────────────── */

interface ActivePromo {
  id: string;
  name: string;
  type: string;
  description: string | null;
  discountPercent: number;
  durationMonths: number;
}

const promoTypeIcon: Record<string, string> = {
  FIRST_MONTHS_FREE: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  LOYALTY_REWARD: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  RENEWAL_DISCOUNT: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z',
  REFERRAL_BONUS: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  CUSTOM: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
};

const fallbackPromotions = [
  { name: 'İlk 3 Ay Garanti Ücretsiz', type: 'FIRST_MONTHS_FREE', description: 'Yeni kayıt teşviki. İlk 3 ay hiçbir garanti ücreti ödemeyin.', discountPercent: 100, durationMonths: 3 },
  { name: '12. Ay Garanti Ücretsiz', type: 'LOYALTY_REWARD', description: '1 yıl boyunca platformu kullanın, 12. ay hediye.', discountPercent: 100, durationMonths: 1 },
  { name: '2. Yıl Yenileme İndirimi', type: 'RENEWAL_DISCOUNT', description: 'Sözleşme yenileyen kullanıcılara garanti ücretinde %25 indirim.', discountPercent: 25, durationMonths: 12 },
  { name: 'Arkadaşını Getir', type: 'REFERRAL_BONUS', description: 'Davet ettiğiniz kişi kaydolsun, ikiniz de 1 ay garanti ücretsiz.', discountPercent: 100, durationMonths: 1 },
];

/* ── ICONS ──────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function formatTL(amount: number): string {
  return amount.toLocaleString('tr-TR') + ' TL';
}

/* ── FAQ ────────────────────────────────────────── */

const faqItems = [
  {
    q: 'Banka Güvence Hesabı (KMH) nedir?',
    a: 'Banka Güvence Hesabı (KMH), bankaların sunduğu bir kredi limitidir. Kira ödeme günü hesabınızda yeterli bakiye olmasa bile, güvence limiti üzerinden kira otomatik olarak ödenir. Böylece kira ödememesi ve gecikme riski sıfıra iner.',
  },
  {
    q: 'Her plana banka güvencesi dahil mi?',
    a: 'Evet. Banka güvence hesabı entegrasyonu platformumuzun temel değer önermesidir ve tüm planlarda — ücretsiz plan dahil — standart olarak sunulur.',
  },
  {
    q: 'Kira garanti ücreti nasıl hesaplanıyor?',
    a: 'Garanti ücreti, aylık kira bedelinin plan bazında belirlenen oranı kadardır. Uzun süreli sözleşmelerde ek indirimler uygulanır (6-12 ay %10, 12+ ay %20 garanti ücreti indirimi).',
  },
  {
    q: 'Mülk sayısını nasıl artırabilirim?',
    a: 'Tek Mülk planındaysanız Çoklu Mülk planına (5 mülk) geçebilirsiniz. 5\'ten fazla mülk için Portföy planı sınırsız mülk desteği sunar.',
  },
  {
    q: 'Ödemeyi siz mi alıyorsunuz?',
    a: 'Hayır. Kira Güvence bir ödeme aracısı değildir. Tüm ödemeler banka güvence hesabı üzerinden gerçekleşir. Platform ödeme aracılığı yapmadığı için BDDK düzenleme kapsamında değildir.',
  },
  {
    q: '"İlk 3 ay garanti ücretsiz" nasıl çalışıyor?',
    a: 'Yeni kayıt olan tüm kullanıcılar için ilk 3 ayda hiçbir garanti ücreti alınmaz. 4. aydan itibaren planınıza göre normal garanti ücreti oranı uygulanır.',
  },
  {
    q: 'Sözleşme süresi garanti ücretini etkiler mi?',
    a: 'Evet. 6-12 ay arası sözleşmelerde garanti ücretinde %10, 12 ay ve üzeri sözleşmelerde %20 indirim uygulanır. Uzun süreli sözleşmeler hem siz hem kiracınız için daha avantajlı.',
  },
  {
    q: 'İptal edebilir miyim?',
    a: 'Evet. Aboneliğinizi istediğiniz zaman iptal edebilirsiniz. Mevcut dönem sonuna kadar hizmet devam eder. Otomatik olarak Tek Mülk planına düşürülürsünüz.',
  },
];

/* ── COMPONENT ──────────────────────────────────── */

export default function PricingContent() {
  const [rentAmount, setRentAmount] = useState<string>('');
  const [duration, setDuration] = useState<number>(12);
  const [propertyCount, setPropertyCount] = useState<number>(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [promos, setPromos] = useState<Array<{ name: string; type: string; description: string | null; discountPercent: number; durationMonths: number }>>(fallbackPromotions);

  useEffect(() => {
    api<ActivePromo[]>('/api/v1/promos/active')
      .then((res) => {
        if (res.status === 'success' && res.data && res.data.length > 0) {
          setPromos(res.data);
        }
      })
      .catch(() => { /* fallback stays */ });
  }, []);

  const rent = parseFloat(rentAmount) || 0;

  // Duration discount
  const durationDiscount = duration >= 12 ? 0.20 : duration >= 6 ? 0.10 : 0;
  const durationLabel = duration >= 12 ? '%20 süre indirimi' : duration >= 6 ? '%10 süre indirimi' : '';

  // Determine suitable plan based on property count
  const suitablePlan = propertyCount > 5 ? 'Portföy' : propertyCount > 1 ? 'Çoklu Mülk' : 'Tek Mülk';

  const calcResults = plans.map((plan) => {
    const baseCommission = rent * plan.commissionRate;
    const discountedCommission = baseCommission * (1 - durationDiscount);
    const total = discountedCommission + plan.subscription;
    const net = rent - discountedCommission;
    const annual = total * 12;
    return {
      name: plan.name,
      commissionLabel: plan.commission,
      baseCommission,
      discountedCommission,
      subscription: plan.subscription,
      total,
      net,
      annual,
      suitable: plan.name === suitablePlan,
    };
  });

  const minTotal = Math.min(...calcResults.filter(r => {
    const plan = plans.find(p => p.name === r.name)!;
    if (plan.propertyLimit > 0 && propertyCount > plan.propertyLimit) return false;
    if (plan.name === 'Tek Mülk' && rent > 25000) return false;
    return true;
  }).map(r => r.total));

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main>
        {/* ── HERO ── */}
        <section className="bg-gradient-to-b from-slate-50 to-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
              Fiyatlandırma
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
              Her Plana Banka Güvencesi Dahil
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
              Banka güvence hesabı entegrasyonu tüm planlarda standart. Mülk sayınıza ve kira tutarınıza göre en uygun planı seçin.
            </p>

            {/* Core value highlight */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-3">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-semibold text-emerald-800">
                Banka güvencesi ile kira ödenmeme riski sıfır — her planda ücretsiz
              </span>
            </div>
          </div>
        </section>

        {/* ── PRICING TIERS ── */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 sm:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                    plan.highlighted
                      ? 'border-blue-500 ring-2 ring-blue-100'
                      : 'border-slate-200'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 right-4">
                      <span className="inline-flex items-center rounded-full bg-blue-700 px-3 py-1 text-xs font-semibold text-white">
                        En Popüler
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{plan.subtitle}</p>

                  <div className="mt-5">
                    <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-sm text-slate-500"> {plan.priceNote}</span>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-blue-600">{plan.commission}</span>
                      <span className="text-slate-500">garanti ücreti</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {plan.propertyLabel}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {plan.rentLimit}
                    </div>
                  </div>

                  <hr className="my-5 border-slate-200" />

                  <ul className="flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckIcon />
                        <span className={`text-sm ${feature.includes('Güvence') ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Link
                      href="/auth/register"
                      data-cta={`plan-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold transition ${
                        plan.highlighted
                          ? 'bg-blue-700 text-white hover:bg-blue-800'
                          : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* KMH highlight strip */}
            <div className="mt-8 flex items-center justify-center gap-3 rounded-xl bg-blue-50 px-6 py-4">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Banka Güvence Hesabı nedir?</span> Banka Güvence Hesabı (KMH), kiracının hesabında yeterli bakiye olmasa bile kiranın banka tarafından otomatik ödenmesini sağlar. Ev sahibi için kira güvencesi, kiracı için kolaylık.
              </p>
            </div>
          </div>
        </section>

        {/* ── MALİYET KARŞILAŞTIRMASI ── */}
        <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Karşılaştırma</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Geleneksel Yöntem vs Kira Güvence</h2>
              <p className="mt-3 text-base text-slate-500">
                Kira sürecindeki gizli maliyetleri ve zaman kaybını ortadan kaldırın.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {/* Traditional */}
              <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                    <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Geleneksel Yöntem</h3>
                </div>
                <ul className="mt-5 space-y-4">
                  <li className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-sm font-semibold text-slate-900">Noter masrafı</span>
                      <span className="ml-2 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">~500-1.000 TL</span>
                      <p className="mt-0.5 text-xs text-slate-500">Her sözleşme için tekrarlayan masraf</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-sm font-semibold text-slate-900">Findeks raporu</span>
                      <span className="ml-2 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">~100-200 TL</span>
                      <p className="mt-0.5 text-xs text-slate-500">Her kiracı için ayrı ücret</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-sm font-semibold text-slate-900">Kefil bulma riski</span>
                      <p className="mt-0.5 text-xs text-slate-500">Kefil bulmak zor, güvensiz ve hukuki sorunlara açık</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-sm font-semibold text-slate-900">Zaman kaybı</span>
                      <span className="ml-2 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Günler</span>
                      <p className="mt-0.5 text-xs text-slate-500">Randevu, belge toplama, noter ziyareti</p>
                    </div>
                  </li>
                </ul>
                <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-red-700">Toplam: 600 - 1.200+ TL + günlerce uğraş</span>
                </div>
              </div>

              {/* KiraGuvence */}
              <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm ring-2 ring-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                    <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Kira Güvence</h3>
                </div>
                <ul className="mt-5 space-y-4">
                  <li className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-sm font-semibold text-slate-900">Garanti ücreti</span>
                      <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Kiranin %0.5-1.5&apos;i</span>
                      <p className="mt-0.5 text-xs text-slate-500">Plana göre düşen oranlar, 15.000 TL kira için sadece 75-225 TL</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-sm font-semibold text-slate-900">Dijital sözleşme</span>
                      <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Ücretsiz</span>
                      <p className="mt-0.5 text-xs text-slate-500">TBK uyumlu, noter gerektirmeyen dijital kira sözleşmesi</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-sm font-semibold text-slate-900">Banka güvencesi (KMH)</span>
                      <p className="mt-0.5 text-xs text-slate-500">Kira ödenmeme riski sıfır, banka otomatik ödeme garantisi</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-sm font-semibold text-slate-900">5 dakikada kurulum</span>
                      <p className="mt-0.5 text-xs text-slate-500">Online kayıt, anında başlama, randevu gereksiz</p>
                    </div>
                  </li>
                </ul>
                <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-emerald-700">Toplam: Sadece garanti ücreti + 5 dakika</span>
                </div>
              </div>
            </div>

            {/* Bottom summary */}
            <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 px-6 py-5 text-center">
              <p className="text-sm font-semibold text-blue-800">
                Kira Güvence ile noter masrafı, Findeks ücreti ve kefil derdinden kurtulun.
              </p>
              <p className="mt-1 text-sm text-blue-600">
                Geleneksel yöntemde her sözleşme için 600-1.200+ TL masraf + günlerce uğraş varken, Kira Güvence&apos;de sadece kiranızın %0.5-1.5&apos;i garanti ücreti ödersiniz.
              </p>
            </div>
          </div>
        </section>

        {/* ── SÜRE İNDİRİMİ ── */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Süre Avantajı</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Uzun Süreli Sözleşme İndirimi</h2>
              <p className="mt-3 text-base text-slate-500">
                Sözleşme süresine göre garanti ücretinde ek indirim kazanın.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {durationDiscounts.map((d) => (
                <div
                  key={d.label}
                  className={`rounded-2xl border p-6 text-center ${
                    d.discount === 20 ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="text-sm font-medium text-slate-500">{d.label}</div>
                  <div className={`mt-2 text-3xl font-extrabold ${d.discount > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
                    {d.discount > 0 ? `%${d.discount}` : '—'}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{d.note}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── KİRA TUTARI ARALIKLARI ── */}
        <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Kira Tutarı</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Kira Tutarına Göre Avantajlar</h2>
              <p className="mt-3 text-base text-slate-500">
                Yüksek kira tutarlarında ek garanti ücreti indirimleri uygulanır.
              </p>
            </div>
            <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {rentTiers.map((tier, idx) => (
                <div
                  key={tier.range}
                  className={`flex items-center justify-between px-6 py-4 ${
                    idx < rentTiers.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900">{tier.range}</div>
                    <div className="text-sm text-slate-500">{tier.note}</div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    tier.label === 'Premium' ? 'bg-purple-50 text-purple-700' :
                    tier.label === 'Yüksek' ? 'bg-blue-50 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {tier.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMMISSION CALCULATOR ── */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Hesaplayıcı</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Maliyet Hesaplayıcı</h2>
              <p className="mt-3 text-base text-slate-500">
                Kira tutarı, mülk adedi ve sözleşme süresini girerek aylık maliyetinizi hesaplayın.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <label htmlFor="rentAmount" className="block text-sm font-semibold text-slate-700">
                    Aylık Kira Tutarı (TL)
                  </label>
                  <input
                    id="rentAmount"
                    type="number"
                    min="0"
                    placeholder="örn. 15000"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-lg font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label htmlFor="propertyCount" className="block text-sm font-semibold text-slate-700">
                    Mülk Adedi
                  </label>
                  <select
                    id="propertyCount"
                    value={propertyCount}
                    onChange={(e) => setPropertyCount(Number(e.target.value))}
                    className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-lg font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value={1}>1 mülk</option>
                    <option value={2}>2 mülk</option>
                    <option value={3}>3 mülk</option>
                    <option value={5}>5 mülk</option>
                    <option value={10}>10+ mülk</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="duration" className="block text-sm font-semibold text-slate-700">
                    Sözleşme Süresi
                  </label>
                  <select
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-lg font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value={3}>3 ay</option>
                    <option value={6}>6 ay</option>
                    <option value={12}>12 ay (1 yıl)</option>
                    <option value={24}>24 ay (2 yıl)</option>
                  </select>
                </div>
              </div>

              {durationDiscount > 0 && (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                  <CheckIcon />
                  <span className="font-medium">{durationLabel} uygulanır</span>
                </div>
              )}

              {rent > 0 && (
                <div className="mt-8 overflow-x-auto">
                  <table className="w-full rounded-2xl border border-slate-200 bg-white text-sm shadow-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-left font-semibold text-slate-600" />
                        {calcResults.map((r) => {
                          const plan = plans.find(p => p.name === r.name)!;
                          const disabled = (plan.propertyLimit > 0 && propertyCount > plan.propertyLimit) ||
                            (plan.name === 'Tek Mülk' && rent > 25000);
                          return (
                            <th
                              key={r.name}
                              className={`px-4 py-3 text-center font-bold ${disabled ? 'text-slate-300' : r.suitable ? 'text-blue-700' : 'text-slate-900'}`}
                            >
                              {r.name}
                              {r.suitable && !disabled && (
                                <div className="mt-0.5 text-xs font-medium text-emerald-600">Sizin için uygun</div>
                              )}
                              {disabled && (
                                <div className="mt-0.5 text-xs font-medium text-slate-400">Uygun değil</div>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-600">Garanti ücreti oranı</td>
                        {calcResults.map((r) => (
                          <td key={r.name} className="px-4 py-3 text-center text-slate-700">
                            {r.commissionLabel}
                            {durationDiscount > 0 && <span className="block text-xs text-emerald-600">(-{durationDiscount * 100}%)</span>}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-600">Aylık garanti ücreti</td>
                        {calcResults.map((r) => (
                          <td key={r.name} className="px-4 py-3 text-center text-slate-700">
                            {durationDiscount > 0 ? (
                              <>
                                <span className="text-xs text-slate-400 line-through">{formatTL(r.baseCommission)}</span>
                                <br />
                                {formatTL(r.discountedCommission)}
                              </>
                            ) : formatTL(r.discountedCommission)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-600">Aylık abonelik</td>
                        {calcResults.map((r) => (
                          <td key={r.name} className="px-4 py-3 text-center text-slate-700">
                            {r.subscription === 0 ? 'Ücretsiz' : formatTL(r.subscription)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          Toplam aylık maliyet
                        </td>
                        {calcResults.map((r) => {
                          const plan = plans.find(p => p.name === r.name)!;
                          const disabled = (plan.propertyLimit > 0 && propertyCount > plan.propertyLimit) ||
                            (plan.name === 'Tek Mülk' && rent > 25000);
                          return (
                            <td
                              key={r.name}
                              className={`px-4 py-3 text-center font-bold ${
                                disabled ? 'text-slate-300' :
                                r.total === minTotal ? 'bg-emerald-50 text-emerald-700' : 'text-slate-900'
                              }`}
                            >
                              {disabled ? '—' : formatTL(r.total)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-600">
                          Ev sahibi net alır
                        </td>
                        {calcResults.map((r) => {
                          const plan = plans.find(p => p.name === r.name)!;
                          const disabled = (plan.propertyLimit > 0 && propertyCount > plan.propertyLimit) ||
                            (plan.name === 'Tek Mülk' && rent > 25000);
                          return (
                            <td key={r.name} className={`px-4 py-3 text-center ${disabled ? 'text-slate-300' : 'text-slate-700'}`}>
                              {disabled ? '—' : formatTL(r.net)}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── PROMOTIONS ── */}
        <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Fırsatlar</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Özel Fırsatlar</h2>
            </div>
            <div className={`mt-10 grid gap-4 sm:grid-cols-2 ${promos.length >= 4 ? 'lg:grid-cols-4' : promos.length === 3 ? 'lg:grid-cols-3' : ''}`}>
              {promos.map((promo) => (
                <div
                  key={promo.name}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                    <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={promoTypeIcon[promo.type] || promoTypeIcon.CUSTOM} />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900">{promo.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{promo.description}</p>
                  {promo.discountPercent === 100 ? (
                    <span className="mt-3 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {promo.durationMonths} ay garanti ücretsiz
                    </span>
                  ) : (
                    <span className="mt-3 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      %{promo.discountPercent} indirim &middot; {promo.durationMonths} ay
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 14 GÜN ÜCRETSİZ TRIAL CTA ── */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sınırlı Süre Teklifi
            </div>
            <h2 className="mt-5 text-3xl font-extrabold text-white sm:text-4xl">
              14 Gün Ücretsiz Çoklu Mülk Planı Deneyin
            </h2>
            <p className="mt-4 text-base leading-7 text-blue-100">
              Kredi kartı gerekmez. 14 gün boyunca Çoklu Mülk planının tüm özelliklerine erişim sağlayın.
              Banka güvence hesabı entegrasyonu, aylık raporlama ve standart destek dahil.
              Deneme süresi sonunda otomatik olarak Tek Mülk planına düşürülür.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/auth/register"
                data-cta="pricing-14-gun-ucretsiz"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-50"
              >
                Ücretsiz Hesap Oluştur
              </Link>
              <div className="flex items-center gap-6 text-sm text-blue-200">
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Banka güvencesi dahil
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Kredi kartı yok
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Otomatik iptal
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SSS / FAQ ── */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">SSS</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Sıkça Sorulan Sorular</h2>
            </div>
            <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
              {faqItems.map((item, idx) => (
                <div key={idx}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-slate-50"
                  >
                    <span className="text-sm font-semibold text-slate-900">{item.q}</span>
                    <svg
                      className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-5">
                      <p className="text-sm leading-6 text-slate-600">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BAND ── */}
        <section className="bg-blue-700 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-white">Hemen başlamaya hazır mısınız?</h2>
            <p className="mt-4 text-base text-blue-100">
              Ücretsiz hesap oluşturun, banka güvencesi ile kiranızı güvence altına alın.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth/register"
                data-cta="pricing-footer-ucretsiz-basla"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-semibold text-blue-700 shadow transition hover:bg-blue-50"
              >
                Ücretsiz Hesap Oluştur
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
      <footer className="border-t border-slate-200 bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo size="sm" variant="light" />
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Türkiye&apos;nin dijital kira güvence platformu. Kiracı, ev sahibi ve banka arasındaki süreci güvenle yönetin.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Platform</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/#nasil-calisir" className="text-sm text-slate-400 hover:text-white transition">Nasıl Çalışır?</Link></li>
                <li><Link href="/rehber" className="text-sm text-slate-400 hover:text-white transition">Rehber</Link></li>
                <li><Link href="/fiyatlandirma" className="text-sm text-slate-400 hover:text-white transition">Fiyatlandırma</Link></li>
                <li><Link href="/sablonlar" className="text-sm text-slate-400 hover:text-white transition">Hukuki Şablonlar</Link></li>
                <li><Link href="/auth/register" className="text-sm text-slate-400 hover:text-white transition">Hesap Oluştur</Link></li>
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
              &copy; {new Date().getFullYear()} Kira Güvence. Tüm hakları saklıdır.
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
