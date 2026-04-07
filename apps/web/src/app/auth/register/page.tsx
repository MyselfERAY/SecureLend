'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [tckn, setTckn] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(tckn, phone, fullName, dateOfBirth);
      sessionStorage.setItem('otp_phone', phone);
      router.push('/auth/verify-otp');
    } catch (err: any) {
      setError(err.message || 'Kayit hatasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Ana Sayfa
        </Link>
      </div>
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Account Setup</p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight">Platforma guvenli kayit</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Bilgileriniz dogrulandiktan sonra taraf rolunuzle panel ekranlarina erisirsiniz.
          </p>
          <div className="mt-8 space-y-3 text-sm text-slate-200">
            <p>• Rol bazli yetkilendirme</p>
            <p>• Dogrulanmis kullanici profili</p>
            <p>• Sozlesme ve odeme akislari icin hazir altyapi</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] sm:p-10">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Kayit Ol</h2>
            <p className="mt-2 text-sm text-slate-600">Hesap olusturmak icin bilgilerinizi girin.</p>
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
              <label className="mb-2 block text-sm font-semibold text-slate-700">Dogum Tarihi</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || tckn.length !== 11 || phone.length !== 10 || fullName.length < 3 || !dateOfBirth}
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Kayit yapiliyor...' : 'Kaydi Tamamla'}
            </button>

            <p className="text-center text-sm text-slate-600">
              Zaten hesabiniz var mi?{' '}
              <Link href="/auth/login" className="font-semibold text-blue-700 hover:text-blue-800">
                Giris Yap
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
