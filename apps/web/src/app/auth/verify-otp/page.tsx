'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';

export default function VerifyOtpPage() {
  const router = useRouter();
  const { verifyOtp } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedPhone = sessionStorage.getItem('otp_phone');
    if (!storedPhone) {
      router.replace('/auth/login');
      return;
    }
    setPhone(storedPhone);
    inputRefs.current[0]?.focus();
  }, [router]);

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
      sessionStorage.removeItem('otp_phone');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'OTP dogrulama hatasi');
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
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Second Factor</p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight">SMS dogrulama</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Tek kullanimlik kod ile hesabiniza sadece size ait cihazdan erisim saglayin.
          </p>
          <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-200">
            Gonderilen numara: <span className="font-semibold">{maskedPhone || '-'}</span>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] sm:p-10">
          <h2 className="text-2xl font-extrabold text-slate-900">OTP Kodu</h2>
          <p className="mt-2 text-sm text-slate-600">6 haneli kodu girerek girisi tamamlayin.</p>

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
                  className="h-14 w-11 rounded-xl border border-slate-300 bg-white text-center text-2xl font-extrabold text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 sm:w-12"
                />
              ))}
            </div>

            {loading && (
              <div className="text-center text-sm font-medium text-slate-500">Dogrulaniyor...</div>
            )}

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <strong>Mock SMS:</strong> OTP kodu sunucu loglarinda goruntulenir. <code className="text-xs">tail -f /tmp/securelend-api.log</code>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
