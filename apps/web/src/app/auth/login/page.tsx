'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import Logo from '../../../components/logo';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [tckn, setTckn] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === '1') {
      setSessionExpired(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(tckn, phone);
      router.push(`/auth/verify-otp?p=${encodeURIComponent(phone)}`);
    } catch (err: any) {
      setError(err.message || 'Giriş hatası');
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
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">Güvenli Giriş</p>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight">Hesabınıza güvenli giriş yapın</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Kimlik doğrulama ve SMS OTP adımları ile kiralama operasyonunu güvenli şekilde yönetin.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-slate-200">
              {['TCKN bazlı kimlik doğrulama', 'OTP ile ikinci katman güvenlik', 'İşlem kayıtları ve izlenebilir süreç'].map((item) => (
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
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">Giriş Yap</h2>
            <p className="mt-2 text-sm text-slate-600">Devam etmek için bilgilerinizi girin.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {sessionExpired && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Oturum süresi doldu. Lütfen tekrar giriş yapın.
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

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
              <label className="mb-2 block text-sm font-semibold text-slate-700">Telefon Numarası</label>
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

            <button
              type="submit"
              data-cta="login-devam-et"
              disabled={loading || tckn.length !== 11 || phone.length !== 10}
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
            >
              {loading ? 'Giriş yapılıyor...' : 'Devam Et'}
            </button>

            <p className="text-center text-sm text-slate-600">
              Hesabınız yok mu?{' '}
              <Link href="/auth/register" className="font-semibold text-blue-700 hover:text-blue-800">
                Kayıt Ol
              </Link>
            </p>

            <p className="text-center text-sm text-slate-600">
              Kimlik doğrulama için{' '}
              <Link href="/kps" className="font-semibold text-blue-700 hover:text-blue-800">
                KPS Doğrulama
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
