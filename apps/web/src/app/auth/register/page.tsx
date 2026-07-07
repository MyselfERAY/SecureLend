'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import Logo from '../../../components/logo';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const [tckn, setTckn] = useState('');
  const [phone, setPhone] = useState(searchParams.get('phone') ?? '');
  const [fullName, setFullName] = useState(searchParams.get('fullName') ?? '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [kvkkOnayladi, setKvkkOnayladi] = useState(false);
  const [acikRizaOnayladi, setAcikRizaOnayladi] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(tckn, phone, fullName, dateOfBirth, [
        { type: 'KVKK_AYDINLATMA', version: '2.0' },
        { type: 'KVKK_ACIK_RIZA', version: '2.0' },
      ]);
      router.push(`/auth/verify-otp?p=${encodeURIComponent(phone)}`);
    } catch (err: any) {
      setError(err.message || 'Kayıt hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <Logo className="mb-6" />
      </div>
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-8 text-white sm:p-10 animate-fade-up">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-indigo-600/15 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">Hesap Oluşturma</p>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight">Platforma güvenli kayıt</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Bilgileriniz doğrulandıktan sonra taraf rolünüzle panel ekranlarına erişirsiniz.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-slate-200">
              {['Rol bazlı yetkilendirme', 'Doğrulanmış kullanıcı profili', 'Sözleşme ve ödeme akışları için hazır altyapı'].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                    <svg className="h-3 w-3 text-blue-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-card sm:p-10 animate-fade-up animation-delay-150">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">Kayıt Ol</h2>
            <p className="mt-2 text-sm text-slate-600">Hesap oluşturmak için bilgilerinizi girin.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Ad Soyad</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ad Soyad"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">TCKN</label>
              <input
                type="text"
                value={tckn}
                onChange={(e) => setTckn(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="11 haneli TCKN"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                maxLength={11}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Telefon</label>
              <div className="flex items-center">
                <span className="rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 px-3 py-3 text-sm font-semibold text-slate-500">+90</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="5XX XXX XX XX"
                  className="w-full rounded-r-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Doğum Tarihi</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kvkkOnayladi}
                  onChange={(e) => setKvkkOnayladi(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-700"
                  required
                />
                <span className="text-sm text-slate-700 leading-snug">
                  <Link href="/kvkk" target="_blank" className="font-semibold text-blue-700 hover:underline">
                    KVKK Aydınlatma Metni
                  </Link>
                  &apos;ni okudum, kişisel verilerimin işlenmesine ilişkin bilgilendirildim.{' '}
                  <span className="text-rose-600 font-semibold">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acikRizaOnayladi}
                  onChange={(e) => setAcikRizaOnayladi(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-700"
                  required
                />
                <span className="text-sm text-slate-700 leading-snug">
                  T.C. Kimlik No, IBAN, gelir belgesi, istihdam bilgisi ve kredi geçmişimin KMH
                  başvurusu kapsamında işlenip anlaşmalı bankalar ve KKB ile paylaşılmasına{' '}
                  <Link href="/acik-riza" target="_blank" className="font-semibold text-blue-700 hover:underline">
                    açık rıza
                  </Link>{' '}
                  veriyorum.{' '}
                  <span className="text-rose-600 font-semibold">*</span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              data-cta="register-kaydi-tamamla"
              disabled={loading || tckn.length !== 11 || phone.length !== 10 || fullName.length < 3 || !dateOfBirth || !kvkkOnayladi || !acikRizaOnayladi}
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kaydı Tamamla'}
            </button>

            <p className="text-center text-sm text-slate-600">
              Zaten hesabınız var mı?{' '}
              <Link href="/auth/login" className="font-semibold text-blue-700 hover:text-blue-800">
                Giriş Yap
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
