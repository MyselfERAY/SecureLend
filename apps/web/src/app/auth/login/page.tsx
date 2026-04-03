'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [tckn, setTckn] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(tckn, phone);
      sessionStorage.setItem('otp_phone', phone);
      router.push('/auth/verify-otp');
    } catch (err: any) {
      setError(err.message || 'Giris hatasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Secure Access</p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight">Hesabiniza guvenli giris yapin</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Kimlik dogrulama ve SMS OTP adimlari ile kiralama operasyonunu guvenli sekilde yonetin.
          </p>
          <div className="mt-8 space-y-3 text-sm text-slate-200">
            <p>• TCKN bazli kimlik dogrulama</p>
            <p>• OTP ile ikinci katman guvenlik</p>
            <p>• Islem kayitlari ve izlenebilir surec</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] sm:p-10">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Giris Yap</h2>
            <p className="mt-2 text-sm text-slate-600">Devam etmek icin bilgilerinizi girin.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
              <label className="mb-2 block text-sm font-semibold text-slate-700">Telefon Numarasi</label>
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
              disabled={loading || tckn.length !== 11 || phone.length !== 10}
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Giris yapiliyor...' : 'Devam Et'}
            </button>

            <p className="text-center text-sm text-slate-600">
              Hesabiniz yok mu?{' '}
              <Link href="/auth/register" className="font-semibold text-blue-700 hover:text-blue-800">
                Kayit Ol
              </Link>
            </p>

            <p className="text-center text-sm text-slate-600">
              Kimlik dogrulama icin{' '}
              <Link href="/kps" className="font-semibold text-blue-700 hover:text-blue-800">
                KPS Dogrulama
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
