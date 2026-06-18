'use client';

/**
 * Kira Güvence — landing page redesign (production implementation)
 *
 * Fonts: Space Grotesk (display) + Inter (body) are loaded in app/layout.tsx as
 * the CSS variables --font-grotesk and --font-sans. Display text uses
 * var(--font-grotesk); body uses var(--font-sans).
 *
 * Tailwind: uses only stock utilities (blue-700, slate, emerald) — matches repo conventions.
 * Interactions are client-side React; no backend calls. CTAs point to /auth/register & /auth/login.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

const DISPLAY = "var(--font-grotesk), 'Space Grotesk', system-ui, sans-serif";

type Persona = 'tenant' | 'landlord';

const PERSONAS: Record<Persona, {
  title: React.ReactNode; sub: string; checks: string[]; accent: string; accentSoft: string;
}> = {
  tenant: {
    title: <>Kefil derdi bitti.<br /><span className="text-blue-700">Kiranız banka güvencesinde.</span></>,
    sub: 'Findeks raporu, kefil arayışı, noter masrafı — hepsi geride kaldı. 5 dakikada dijital sözleşme, banka güvencesiyle.',
    checks: ['Kefil aramak zorunda değilsiniz', 'Ödeme geçmişinizi inşa edin', 'Birkaç günlük faizle korumadasınız'],
    accent: 'text-blue-700', accentSoft: 'bg-blue-50 text-blue-700',
  },
  landlord: {
    title: <>Kiranız her ay,<br /><span className="text-emerald-700">zamanında ve eksiksiz.</span></>,
    sub: 'Gecikme, tahliye derdi, kefil takibi yok. Banka güvencesiyle kira her ay otomatik hesabınızda.',
    checks: ['Kira banka güvencesinde', 'Otomatik tahsilat ve takip', 'Mahkemede geçerli dijital sözleşme'],
    accent: 'text-emerald-700', accentSoft: 'bg-emerald-50 text-emerald-700',
  },
};

const STEPS = [
  { n: '01', t: 'Başvur & onaylan', d: 'Kiracı banka güvence hesabı (KMH) için başvurur, kimlik KPS ile doğrulanır ve limit belirlenir.' },
  { n: '02', t: 'Dijital sözleşme kur', d: 'Kiracı ve ev sahibi sözleşmeyi 5 dakikada dijital imzalar. Noter ve evrak yok.' },
  { n: '03', t: 'Otomatik öde & al', d: 'Kira her ay otomatik tahsil edilir; ev sahibine zamanında ödenir. Gecikse bile banka güvence verir.' },
];

const FAQS = [
  { q: 'Kira Güvence nedir?', a: 'Kiracının ödeme gücünü banka güvencesi altına alarak ev sahibine zamanında ve eksiksiz kira ödemesini garanti eden dijital bir platformdur. Kefil ve Findeks gereksinimini ortadan kaldırır.' },
  { q: 'Kefil olmadan ev kiralayabilir miyim?', a: 'Evet. Banka güvencesi kefil yerine geçer; kiracı kefil aramak, ev sahibi de kefil sormak zorunda kalmaz.' },
  { q: 'Banka Güvence Hesabı (KMH) nedir?', a: 'Kira ödemeleri için banka tarafından sağlanan bir güvence hesabıdır. Kiracı geçici bir aksaklık yaşasa bile kira banka tarafından ev sahibine ödenir; kiracı sadece birkaç günlük faiz öder.' },
  { q: 'Dijital sözleşme mahkemede geçerli mi?', a: 'Evet. Sözleşmeler Türk Borçlar Kanunu (TBK) uyumludur; tüm kayıtlar zaman damgalı olarak saklanır ve hukuki delil olarak kullanılabilir.' },
  { q: 'Ev sahibi için maliyet nedir?', a: 'Ücretsiz planda güvence ücreti %1.5, ücretli planlarda %0.5–1 arasındadır. Bu, noter + Findeks + kefil riskinden çok daha ekonomiktir.' },
];

const TRUST = ['BDDK Uyumlu Ödeme Modeli', 'KVKK Uyumlu', 'TBK Geçerli Sözleşme', 'KPS Kimlik Doğrulama', 'Banka Düzeyinde Güvenlik'];

function useCountUp(target: number, run: boolean, dec = 0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    const start = performance.now(), dur = 900;
    let raf = 0;
    const frame = (t: number) => {
      const p = Math.min((t - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      setV(target * e);
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [run, target]);
  return dec ? v.toFixed(dec) : Math.round(v).toString();
}

export default function HomePage() {
  const { tokens, isLoading } = useAuth();
  const router = useRouter();
  const [persona, setPersona] = useState<Persona>('tenant');
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [step, setStep] = useState(0);
  const [yearly, setYearly] = useState(false);
  const [statsIn, setStatsIn] = useState(false);
  const bandRef = useRef<HTMLDivElement>(null);
  const p = PERSONAS[persona];

  useEffect(() => {
    if (!isLoading && tokens) {
      router.replace('/dashboard');
    }
  }, [isLoading, tokens, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!bandRef.current) return;
    const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { setStatsIn(true); io.disconnect(); } }), { threshold: 0.3 });
    io.observe(bandRef.current);
    return () => io.disconnect();
  }, []);

  const dk = useCountUp(5, statsIn);
  const rate = useCountUp(99.8, statsIn, 1);

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: "var(--font-sans), 'Inter', system-ui, sans-serif" }}>
      <style>{`@keyframes kg-marq{to{transform:translateX(-50%)}}@keyframes kg-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}`}</style>

      {/* NAV */}
      <nav className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-[0_1px_0_rgba(10,22,40,.06)]' : ''}`}>
        <div className={`mx-auto flex max-w-6xl items-center gap-8 px-7 transition-all ${scrolled ? 'h-[60px]' : 'h-[72px]'}`}>
          <a href="#top" className="flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white transition-colors ${scrolled ? 'bg-blue-600' : 'bg-slate-900'}`} style={{ fontFamily: DISPLAY }}>sL</span>
            <span className="text-xl font-medium tracking-tight" style={{ fontFamily: DISPLAY }}>secure<b className="font-bold">Lend</b></span>
          </a>
          <div className="ml-2 hidden gap-1 md:flex">
            {[['#nasil', 'Nasıl Çalışır'], ['#ozellikler', 'Özellikler'], ['#fiyat', 'Fiyatlandırma'], ['#sss', 'SSS']].map(([href, label]) => (
              <a key={href} href={href} className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">{label}</a>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <a href="/auth/login" className="hidden rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:text-slate-900 md:inline-flex">Giriş Yap</a>
            <a href="/auth/register" className="inline-flex items-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(37,99,235,.28)] transition hover:-translate-y-0.5 hover:bg-blue-800">Ücretsiz Başla</a>
          </div>
        </div>
      </nav>

      <span id="top" />

      {/* HERO */}
      <header className="relative overflow-hidden px-7 pt-[150px] pb-[90px]"
        style={{ background: 'radial-gradient(1200px 600px at 80% -10%, #eef4ff 0%, transparent 55%), radial-gradient(900px 500px at 5% 20%, #ecfdf5 0%, transparent 50%), #fff' }}>
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.04fr_.96fr]">
          <div>
            <div className="mb-6 inline-flex gap-1 rounded-full bg-slate-100 p-1.5">
              {(['tenant', 'landlord'] as Persona[]).map(k => (
                <button key={k} onClick={() => setPersona(k)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${persona === k ? (k === 'tenant' ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,.3)]' : 'bg-emerald-600 text-white shadow-[0_4px_12px_rgba(16,185,129,.3)]') : 'text-slate-600'}`}>
                  {k === 'tenant' ? 'Kiracıyım' : 'Ev sahibiyim'}
                </button>
              ))}
            </div>
            <h1 className="text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl" style={{ fontFamily: DISPLAY }}>{p.title}</h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">{p.sub}</p>
            <div className="mt-8 flex flex-wrap gap-3.5">
              <a href="/auth/register" className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(37,99,235,.28)] transition hover:-translate-y-0.5 hover:bg-blue-800">
                Ücretsiz Hesap Oluştur
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
              <a href="#nasil" className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-blue-300">Nasıl Çalışır?</a>
            </div>
            <div className="mt-6 flex flex-col gap-2.5">
              {p.checks.map(c => (
                <div key={c} className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
                  <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-full ${p.accentSoft}`}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>{c}
                </div>
              ))}
            </div>
          </div>

          {/* floating KMH card */}
          <div className="relative h-[520px]">
            <div className="absolute inset-y-[30px] left-[30px] right-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white p-[30px] shadow-[0_24px_60px_rgba(10,22,40,.12)]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">● Banka Güvence Hesabı</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-[13px] text-base font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,.4)]" style={{ fontFamily: DISPLAY, background: 'linear-gradient(160deg,#2f72ef,#1d4ed8)' }}>sL</span>
              </div>
              <div className="mt-6 text-[15px] font-medium text-slate-500" style={{ fontFamily: DISPLAY }}>Onaylanan limit</div>
              <div className="mt-1 text-[46px] font-bold tracking-tight" style={{ fontFamily: DISPLAY }}>25.000 ₺</div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: '68%', background: 'linear-gradient(90deg,#2563eb,#60a5fa)' }} /></div>
              <div className="mt-2.5 flex justify-between text-[12.5px] text-slate-500"><span>Kullanılan: 17.000 ₺</span><span className="font-semibold text-slate-600">8.000 ₺ kaldı</span></div>
              <div className="mt-5">
                {[['Mart kirası', '01 Mart · Kadıköy 2+1'], ['Şubat kirası', '01 Şubat · Kadıköy 2+1']].map(([nm, sb]) => (
                  <div key={nm} className="flex items-center gap-3 border-t border-slate-100 py-[11px]">
                    <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-emerald-50 text-emerald-700">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </span>
                    <div><div className="text-[13.5px] font-semibold">{nm}</div><div className="text-xs text-slate-500">{sb}</div></div>
                    <span className="ml-auto text-sm font-semibold text-emerald-700" style={{ fontFamily: DISPLAY }}>14.500 ₺</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute right-[-6px] top-[18px] flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_24px_60px_rgba(10,22,40,.12)]" style={{ animation: 'kg-float 5s ease-in-out infinite' }}>
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-amber-50 text-amber-700"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg></span>
              <span className="text-[13px] font-bold">Otomatik tahsilat<small className="block font-medium text-slate-500">her ayın 1&apos;i</small></span>
            </div>
            <div className="absolute bottom-2 right-3.5 flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_24px_60px_rgba(10,22,40,.12)]" style={{ animation: 'kg-float 6s ease-in-out .8s infinite' }}>
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-emerald-50 text-emerald-700"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span>
              <span className="text-[13px] font-bold">Kira ödendi<small className="block font-medium text-slate-500">zamanında</small></span>
            </div>
          </div>
        </div>
      </header>

      {/* TRUST MARQUEE */}
      <div className="overflow-hidden border-y border-slate-200 bg-slate-50 py-5.5" style={{ paddingTop: 22, paddingBottom: 22 }}>
        <div className="flex w-max gap-[60px] whitespace-nowrap" style={{ animation: 'kg-marq 28s linear infinite' }}>
          {[...TRUST, ...TRUST].map((t, i) => (
            <span key={i} className="flex items-center gap-2.5 text-lg font-semibold text-slate-500" style={{ fontFamily: DISPLAY }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* HOW */}
      <section id="nasil" className="px-7 py-24">
        <div className="mx-auto max-w-6xl">
          <SecHead eyebrow="Süreç" title="Üç adımda, herkes kazanır" sub="Banka araya girer; kiracı özgürce kiralar, ev sahibi her ay zamanında alır." />
          <div className="grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.n} onMouseEnter={() => setStep(i)}
                className={`relative cursor-pointer overflow-hidden rounded-[20px] border p-[30px] transition-all ${step === i ? 'border-transparent bg-slate-900 text-white shadow-[0_24px_60px_rgba(10,22,40,.12)] -translate-y-1' : 'border-slate-200 bg-white hover:-translate-y-1 hover:shadow-[0_4px_16px_rgba(10,22,40,.06)]'}`}>
                <div className={`text-sm font-bold ${step === i ? 'text-blue-400' : 'text-blue-700'}`} style={{ fontFamily: DISPLAY }}>{s.n}</div>
                <h3 className="mt-4 mb-2 text-[22px] font-bold" style={{ fontFamily: DISPLAY }}>{s.t}</h3>
                <p className={`text-[14.5px] leading-relaxed ${step === i ? 'text-slate-400' : 'text-slate-600'}`}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COUNT-UP BAND */}
      <section id="ozellikler" className="px-7 pb-24">
        <div ref={bandRef} className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-slate-900 px-14 py-16 text-white">
          <div className="absolute -right-28 -top-40 h-[520px] w-[520px] rounded-full" style={{ background: 'radial-gradient(circle,rgba(37,99,235,.34),transparent 68%)' }} />
          <div className="relative grid gap-10 text-center md:grid-cols-3">
            <Stat v={`${dk} dk`} l="Ortalama sözleşme kurulumu" />
            <Stat v={`%${rate}`} l="Zamanında ödeme oranı" em />
            <Stat v="0 kefil" l="İhtiyacınız olan kefil sayısı" />
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="fiyat" className="bg-slate-50 px-7 py-24">
        <div className="mx-auto max-w-6xl">
          <SecHead eyebrow="Fiyatlandırma" title="Noter + Findeks + kefil riskinden ucuz" sub="Kayıt ücretsiz. Sadece kullandığınız güvence için ödeyin." />
          <div className="mb-10 flex items-center justify-center gap-3.5 text-sm font-semibold text-slate-600">
            <span>Aylık</span>
            <button onClick={() => setYearly(y => !y)} className={`relative h-[30px] w-[54px] rounded-full transition-colors ${yearly ? 'bg-blue-700' : 'bg-slate-300'}`}>
              <i className={`absolute top-[3px] h-6 w-6 rounded-full bg-white shadow transition-transform ${yearly ? 'translate-x-[27px]' : 'translate-x-[3px]'}`} />
            </button>
            <span>Yıllık <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">2 ay bedava</span></span>
          </div>
          <div className="grid items-stretch gap-5 md:grid-cols-3">
            <Plan name="Başlangıç" desc="Tek mülkü olan ev sahipleri için" price="Ücretsiz" note="Güvence ücreti %1.5"
              feats={['1 aktif sözleşme', 'Dijital sözleşme + KPS', 'Otomatik ödeme takibi']} cta="Ücretsiz Başla" />
            <Plan featured name="Profesyonel" desc="Birden fazla mülk yöneten ev sahipleri" price={`${yearly ? '249' : '299'} ₺/ay`} note="Güvence ücreti %0.5–1"
              feats={['Sınırsız sözleşme', 'Düşük güvence ücreti', 'Portföy paneli + raporlar', 'Öncelikli destek']} cta="Profesyonel'i Seç" />
            <Plan name="Emlak Ofisi" desc="Acenteler ve kurumsal portföyler" price="Özel" note="Hacme göre teklif"
              feats={['Çoklu kullanıcı + roller', 'API erişimi', 'Özel entegrasyon']} cta="İletişime Geç" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="sss" className="px-7 py-24">
        <div className="mx-auto max-w-6xl">
          <SecHead eyebrow="SSS" title="Sıkça sorulan sorular" />
          <div className="mx-auto max-w-3xl overflow-hidden rounded-[20px] border border-slate-200 bg-white">
            {FAQS.map((f, i) => (
              <div key={i} className="border-t border-slate-200 first:border-t-0">
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-[26px] py-[22px] text-left text-lg font-semibold transition hover:bg-slate-50" style={{ fontFamily: DISPLAY }}>
                  {f.q}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-transform ${openFaq === i ? 'rotate-180 text-blue-600' : 'text-slate-500'}`}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                <div className="grid transition-all duration-300" style={{ gridTemplateRows: openFaq === i ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden"><p className="px-[26px] pb-[22px] text-[15px] leading-relaxed text-slate-600">{f.a}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-7 pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] px-10 py-[72px] text-center text-white" style={{ background: 'linear-gradient(160deg,#1d4ed8,#1e3a8a)' }}>
          <h2 className="text-4xl font-bold sm:text-[46px]" style={{ fontFamily: DISPLAY }}>Kefil derdi olmadan kiralamaya hazır mısınız?</h2>
          <p className="mt-4 text-lg text-blue-100">Ücretsiz hesap oluşturun, 5 dakikada ilk sözleşmenizi kurun.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <a href="/auth/register" className="inline-flex items-center rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-blue-800 shadow-[0_10px_30px_rgba(0,0,0,.18)] transition hover:-translate-y-0.5">Ücretsiz Hesap Oluştur</a>
            <a href="#" className="inline-flex items-center rounded-2xl border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5">Demo İste</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 px-7 pt-16 pb-8 text-slate-400">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <a href="#top" className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white" style={{ fontFamily: DISPLAY }}>sL</span>
              <span className="text-xl font-medium text-white" style={{ fontFamily: DISPLAY }}>secure<b className="font-bold">Lend</b></span>
            </a>
            <p className="max-w-xs text-sm leading-relaxed">Türkiye&apos;nin dijital kira güvence platformu. Kiracı, ev sahibi ve banka tek yerde.</p>
          </div>
          <FootCol title="Ürün" links={['Nasıl Çalışır', 'Özellikler', 'Fiyatlandırma', 'Güvence Hesabı']} />
          <FootCol title="Şirket" links={['Hakkımızda', 'Rehber', 'Kariyer', 'İletişim']} />
          <FootCol title="Yasal" links={['KVKK', 'Gizlilik', 'Kullanım Koşulları', 'Çerez Politikası']} />
        </div>
        <div className="mx-auto mt-11 flex max-w-6xl flex-col justify-between gap-2.5 border-t border-white/10 px-0 pt-7 text-[13px] text-slate-500 sm:flex-row">
          <span>© 2026 SecureLend · Kira Güvence</span><span>info@kiraguvence.com</span>
        </div>
      </footer>
    </div>
  );
}

function SecHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto mb-14 max-w-2xl text-center">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</span>
      <h2 className="mt-3 text-4xl font-bold leading-tight tracking-tight sm:text-[44px]" style={{ fontFamily: DISPLAY }}>{title}</h2>
      {sub && <p className="mt-3.5 text-lg leading-relaxed text-slate-600">{sub}</p>}
    </div>
  );
}

function Stat({ v, l, em }: { v: string; l: string; em?: boolean }) {
  return (
    <div>
      <div className={`text-6xl font-bold tracking-tight ${em ? 'text-emerald-400' : 'text-white'}`} style={{ fontFamily: DISPLAY }}>{v}</div>
      <div className="mt-3 text-[15px] text-slate-400">{l}</div>
    </div>
  );
}

function Plan({ name, desc, price, note, feats, cta, featured }: { name: string; desc: string; price: string; note: string; feats: string[]; cta: string; featured?: boolean }) {
  return (
    <div className={`relative flex flex-col rounded-[28px] p-[34px] transition-all hover:-translate-y-1 hover:shadow-[0_4px_16px_rgba(10,22,40,.06)] ${featured ? 'bg-slate-900 text-white shadow-[0_24px_60px_rgba(10,22,40,.12)]' : 'border border-slate-200 bg-white'}`}>
      {featured && <span className="absolute right-6 top-6 rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white">En popüler</span>}
      <div className="text-[22px] font-bold" style={{ fontFamily: DISPLAY }}>{name}</div>
      <div className={`mt-1.5 text-[13.5px] ${featured ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</div>
      <div className="mb-1 mt-5.5 text-[46px] font-bold tracking-tight" style={{ fontFamily: DISPLAY }}>{price}</div>
      <div className={`text-[13.5px] ${featured ? 'text-slate-400' : 'text-slate-500'}`}>{note}</div>
      <ul className="my-6 flex flex-1 flex-col gap-3">
        {feats.map(f => (
          <li key={f} className={`flex items-start gap-2.5 text-sm leading-snug ${featured ? 'text-slate-300' : 'text-slate-600'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`mt-0.5 shrink-0 ${featured ? 'text-blue-400' : 'text-emerald-500'}`}><polyline points="20 6 9 17 4 12" /></svg>{f}
          </li>
        ))}
      </ul>
      <a href="/auth/register" className={`inline-flex w-full items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 ${featured ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-900 hover:border-blue-300'}`}>{cta}</a>
    </div>
  );
}

function FootCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-white">{title}</h4>
      {links.map(l => <a key={l} href="#" className="block py-1.5 text-[14.5px] transition hover:text-white">{l}</a>)}
    </div>
  );
}
