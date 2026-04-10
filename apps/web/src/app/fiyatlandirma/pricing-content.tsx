'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteNav from '../../components/site-nav';
import Logo from '../../components/logo';
import { api } from '../../lib/api';

const plans = [
  {
    name: 'Baslangic',
    price: 'Ucretsiz',
    commission: '%1.5 komisyon',
    propertyLimit: '1 mulk',
    commissionRate: 0.015,
    subscription: 0,
    features: [
      { name: 'Dijital sozlesme', included: true },
      { name: 'KVKK uyumlu altyapi', included: true },
      { name: 'Temel destek', included: true },
      { name: 'KMH entegrasyonu', included: false },
      { name: 'Aylik rapor (PDF)', included: false },
      { name: 'Oncelikli destek', included: false },
      { name: 'API erisimi', included: false },
    ],
    cta: 'Ucretsiz Basla',
    highlighted: false,
  },
  {
    name: 'Standart',
    price: '99 TL/ay',
    commission: '%1 komisyon',
    propertyLimit: '5 mulk',
    commissionRate: 0.01,
    subscription: 99,
    features: [
      { name: 'Dijital sozlesme', included: true },
      { name: 'KVKK uyumlu altyapi', included: true },
      { name: 'KMH entegrasyonu', included: true },
      { name: 'Aylik rapor (PDF)', included: true },
      { name: 'Standart destek', included: true },
      { name: 'Oncelikli destek', included: false },
      { name: 'API erisimi', included: false },
    ],
    cta: 'Standart Plana Gec',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '249 TL/ay',
    commission: '%0.75 komisyon',
    propertyLimit: 'Sinirsiz mulk',
    commissionRate: 0.0075,
    subscription: 249,
    features: [
      { name: 'Dijital sozlesme', included: true },
      { name: 'KVKK uyumlu altyapi', included: true },
      { name: 'KMH entegrasyonu', included: true },
      { name: 'Aylik rapor (PDF)', included: true },
      { name: 'Oncelikli destek', included: true },
      { name: 'API erisimi', included: true },
    ],
    cta: 'Pro Plana Gec',
    highlighted: false,
  },
];

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

// Fallback static promos (shown while backend data loads or if fetch fails)
const fallbackPromotions = [
  { name: 'Ilk 3 Ay Komisyonsuz', type: 'FIRST_MONTHS_FREE', description: 'Yeni kayit tesviki. Ilk 3 ay hicbir komisyon odemeyin.', discountPercent: 100, durationMonths: 3 },
  { name: '12. Ay Komisyonsuz', type: 'LOYALTY_REWARD', description: '1 yil boyunca platformu kullanin, 12. ay hediye.', discountPercent: 100, durationMonths: 1 },
  { name: '2. Yil Yenileme Indirimi', type: 'RENEWAL_DISCOUNT', description: 'Sozlesme yenileyen kullanicilara komisyon oraninda %25 indirim.', discountPercent: 25, durationMonths: 12 },
  { name: 'Arkadasini Getir', type: 'REFERRAL_BONUS', description: 'Davet ettiginiz kisi kaydolsun, ikiniz de 1 ay komisyonsuz.', discountPercent: 100, durationMonths: 1 },
];

function CheckIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function formatTL(amount: number): string {
  return amount.toLocaleString('tr-TR') + ' TL';
}

const faqItems = [
  {
    q: 'Komisyon nasil hesaplaniyor?',
    a: 'Komisyon, aylik kira bedelinin plan bazinda belirlenen orani kadardir. Ornegin Standart planda 15.000 TL kira icin %1 = 150 TL/ay komisyon alinir. Komisyon, banka tarafindan odeme talimati sirasinda otomatik olarak kesilir.',
  },
  {
    q: 'Odemeyi siz mi aliyorsunuz?',
    a: 'Hayir. KiraGuvence bir odeme aracisi degildir. Tum odemeler banka duzenli odeme talimati (Konut Mortgage Hesabi) uzerinden gerceklesir. Komisyon banka tarafindan kaynakta kesilir.',
  },
  {
    q: 'Plan degistirmek istersem ne olur?',
    a: 'Istediginiz zaman plan yukseltebilir veya dusurubilirsiniz. Yeni plan bir sonraki fatura donemin basindan itibaren gecerli olur. Mevcut sozlesmeleriniz etkilenmez.',
  },
  {
    q: '"Ilk 3 ay komisyonsuz" nasil calisiyor?',
    a: 'Yeni kayit olan tum kullanicilar icin ilk 3 ayda hicbir komisyon alinmaz. 4. aydan itibaren planiniza gore normal komisyon orani uygulanir.',
  },
  {
    q: '2. yil yenileme indirimi nedir?',
    a: 'Sozlesmesini platform uzerinden yenileyen kullanicilara komisyon oraninda %25 indirim uygulanir. Ornegin Standart planda %1 yerine %0.75 komisyon odersiniz.',
  },
  {
    q: 'Iptal edebilir miyim?',
    a: 'Evet. Aboneliginizi istediginiz zaman iptal edebilirsiniz. Iptal sonrasi mevcut donem sonuna kadar hizmet devam eder. Baslangic planina (ucretsiz) otomatik olarak dusurulursunuz.',
  },
  {
    q: 'BDDK duzenlemelerine tabi misiniz?',
    a: 'Hayir. KiraGuvence odeme araciligi yapmadigi icin BDDK duzenleme kapsaminda degildir. Finansal islemler tamamen banka altyapisi uzerinden yururlur.',
  },
];

export default function PricingContent() {
  const [rentAmount, setRentAmount] = useState<string>('');
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

  const calcResults = plans.map((plan) => {
    const commission = rent * plan.commissionRate;
    const total = commission + plan.subscription;
    const net = rent - commission;
    return {
      name: plan.name,
      commissionLabel: plan.commission,
      commission,
      subscription: plan.subscription,
      total,
      net,
    };
  });

  const minTotal = Math.min(...calcResults.map((r) => r.total));

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main>
        {/* ── HERO ── */}
        <section className="bg-gradient-to-b from-slate-50 to-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
              Fiyatlandirma
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
              Seffaf ve Rekabetci Fiyatlandirma
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
              Ev sahibi ve kiracilar icin uygun planlar. Gizli ucret yok, ne goruyorsaniz o.
            </p>
          </div>
        </section>

        {/* ── PRICING TIERS ── */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 sm:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border bg-white p-6 shadow-sm ${
                    plan.highlighted
                      ? 'border-blue-500 ring-2 ring-blue-100'
                      : 'border-slate-200'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 right-4">
                      <span className="inline-flex items-center rounded-full bg-blue-700 px-3 py-1 text-xs font-semibold text-white">
                        En Populer
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-blue-600">{plan.commission}</p>
                  <p className="mt-1 text-sm text-slate-500">{plan.propertyLimit}</p>

                  <hr className="my-6 border-slate-200" />

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-center gap-3">
                        {feature.included ? <CheckIcon /> : <XIcon />}
                        <span
                          className={`text-sm ${
                            feature.included ? 'text-slate-700' : 'text-slate-400'
                          }`}
                        >
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Link
                      href="/auth/register"
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
          </div>
        </section>

        {/* ── PROMOTIONS ── */}
        <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Firsatlar</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Ozel Firsatlar</h2>
            </div>
            <div className={`mt-10 grid gap-4 sm:grid-cols-2 ${promos.length >= 4 ? 'lg:grid-cols-4' : promos.length === 3 ? 'lg:grid-cols-3' : ''}`}>
              {promos.map((promo) => (
                <div
                  key={promo.name}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                    <svg
                      className="h-5 w-5 text-blue-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d={promoTypeIcon[promo.type] || promoTypeIcon.CUSTOM}
                      />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900">{promo.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{promo.description}</p>
                  {promo.discountPercent === 100 ? (
                    <span className="mt-3 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {promo.durationMonths} ay komisyonsuz
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

        {/* ── COMMISSION CALCULATOR ── */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Hesaplayici</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Komisyon Hesaplayici</h2>
              <p className="mt-3 text-base text-slate-500">
                Aylik kira tutarini girin, her plan icin maliyetinizi goruntuleyin.
              </p>
            </div>

            <div className="mt-10 flex justify-center">
              <div className="w-full max-w-sm">
                <label
                  htmlFor="rentAmount"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Aylik Kira Tutari (TL)
                </label>
                <input
                  id="rentAmount"
                  type="number"
                  min="0"
                  placeholder="orn. 15000"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-lg font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {rent > 0 && (
              <div className="mt-10 overflow-x-auto">
                <table className="w-full rounded-2xl border border-slate-200 bg-white text-sm shadow-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-600" />
                      {calcResults.map((r) => (
                        <th
                          key={r.name}
                          className="px-4 py-3 text-center font-bold text-slate-900"
                        >
                          {r.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-600">Komisyon orani</td>
                      {calcResults.map((r) => (
                        <td key={r.name} className="px-4 py-3 text-center text-slate-700">
                          {r.commissionLabel}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-600">Aylik komisyon</td>
                      {calcResults.map((r) => (
                        <td key={r.name} className="px-4 py-3 text-center text-slate-700">
                          {formatTL(r.commission)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-600">Aylik abonelik</td>
                      {calcResults.map((r) => (
                        <td key={r.name} className="px-4 py-3 text-center text-slate-700">
                          {r.subscription === 0 ? 'Ucretsiz' : formatTL(r.subscription)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        Toplam aylik maliyet
                      </td>
                      {calcResults.map((r) => (
                        <td
                          key={r.name}
                          className={`px-4 py-3 text-center font-bold ${
                            r.total === minTotal
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {formatTL(r.total)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-600">
                        Ev sahibi net alir
                      </td>
                      {calcResults.map((r) => (
                        <td key={r.name} className="px-4 py-3 text-center text-slate-700">
                          {formatTL(r.net)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ── 14 GUN UCRETSIZ TRIAL CTA ── */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sinirli Sure Teklifi
            </div>
            <h2 className="mt-5 text-3xl font-extrabold text-white sm:text-4xl">
              14 Gun Ucretsiz Standart Plan Deneyin
            </h2>
            <p className="mt-4 text-base leading-7 text-blue-100">
              Kredi karti gerekmez. 14 gun boyunca Standart planin tum ozelliklerine erisim saglayin.
              KMH entegrasyonu, aylik raporlama ve oncelikli destek dahil.
              Deneme suresi sonunda otomatik olarak Baslangic planina dusurulur.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-50"
              >
                14 Gun Ucretsiz Basla
              </Link>
              <div className="flex items-center gap-6 text-sm text-blue-200">
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Kredi karti yok
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Otomatik iptal
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Tam erisim
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
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Sikca Sorulan Sorular</h2>
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
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
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
            <h2 className="text-3xl font-extrabold text-white">Hemen baslamaya hazir misiniz?</h2>
            <p className="mt-4 text-base text-blue-100">
              Ucretsiz hesap olusturun, kiranizi dijitale tasiyin.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-semibold text-blue-700 shadow transition hover:bg-blue-50"
              >
                Ucretsiz Basla
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-xl border border-blue-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                Giris Yap
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
                Turkiye&apos;nin dijital kira guvence platformu. Kiraci, ev sahibi ve banka arasindaki sureci guvenle yonetin.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Platform</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/#nasil-calisir" className="text-sm text-slate-400 hover:text-white transition">
                    Nasil Calisir?
                  </Link>
                </li>
                <li>
                  <Link href="/rehber" className="text-sm text-slate-400 hover:text-white transition">
                    Rehber
                  </Link>
                </li>
                <li>
                  <Link href="/fiyatlandirma" className="text-sm text-slate-400 hover:text-white transition">
                    Fiyatlandirma
                  </Link>
                </li>
                <li>
                  <Link href="/auth/register" className="text-sm text-slate-400 hover:text-white transition">
                    Hesap Olustur
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-sm text-slate-400 hover:text-white transition">
                    Giris Yap
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Yasal</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/kvkk" className="text-sm text-slate-400 hover:text-white transition">
                    KVKK Aydinlatma Metni
                  </Link>
                </li>
                <li>
                  <Link href="/gizlilik" className="text-sm text-slate-400 hover:text-white transition">
                    Gizlilik Politikasi
                  </Link>
                </li>
                <li>
                  <Link href="/kullanim-kosullari" className="text-sm text-slate-400 hover:text-white transition">
                    Kullanim Kosullari
                  </Link>
                </li>
                <li>
                  <Link href="/cerez-politikasi" className="text-sm text-slate-400 hover:text-white transition">
                    Cerez Politikasi
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Iletisim</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href="mailto:info@kiraguvence.com"
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    info@kiraguvence.com
                  </a>
                </li>
                <li className="text-sm text-slate-400">Istanbul, Turkiye</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-800 pt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} Kira Guvence. Tum haklari saklidir.
            </p>
            <p className="text-xs text-slate-500">
              Bu platform 6698 sayili KVKK kapsaminda kisisel verileri korumaktadir.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
