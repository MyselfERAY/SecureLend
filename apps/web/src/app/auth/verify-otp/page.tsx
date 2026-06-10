'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpContent />
    </Suspense>
  );
}

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const p = searchParams.get('p');
    if (!p) {
      router.replace('/auth/login');
      return;
    }
    setPhone(p);
    inputRefs.current[0]?.focus();
  }, [router, searchParams]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newCode.join('');
    if (fullCode.length === 6) {
      handleSubmit(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      handleSubmit(pasted);
    }
  };

  const handleSubmit = async (otpCode: string) => {
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      await verifyOtp(phone, otpCode);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'OTP doğrulama hatası');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const maskedPhone = phone
    ? `+90 ${phone.slice(0, 3)} *** ** ${phone.slice(-2)}`
    : '';

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-8 text-white sm:p-10 animate-fade-up">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-indigo-600/15 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">İkinci Adım</p>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight">SMS doğrulama</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Tek kullanımlık kod ile hesabınıza sadece size ait cihazdan erişim sağlayın.
            </p>
            <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-200">
              Gönderilen numara: <span className="font-semibold">{maskedPhone || '-'}</span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-card sm:p-10 animate-fade-up animation-delay-150">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">OTP Kodu</h2>
          <p className="mt-2 text-sm text-slate-600">6 haneli kodu girerek girişi tamamlayın.</p>

          <div className="mt-6 space-y-6">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-14 w-11 rounded-xl border border-slate-300 bg-white text-center text-2xl font-extrabold text-slate-900 shadow-sm outline-none transition-all duration-150 focus:scale-105 focus:border-blue-600 focus:shadow-glow focus:ring-4 focus:ring-blue-100 sm:w-12"
                />
              ))}
            </div>

            {loading && (
              <div className="text-center text-sm font-medium text-slate-500">Doğrulanıyor...</div>
            )}

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <strong>Mock SMS:</strong> OTP kodu sunucu loglarında görüntülenir. <code className="text-xs">tail -f /tmp/securelend-api.log</code>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
