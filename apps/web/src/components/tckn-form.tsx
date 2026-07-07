'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function validateTckn(tckn: string): boolean {
  if (tckn.length !== 11 || !/^\d{11}$/.test(tckn) || tckn[0] === '0') return false;
  const d = tckn.split('').map(Number);
  const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
  const evenSum = d[1] + d[3] + d[5] + d[7];
  const tenth = (((7 * oddSum - evenSum) % 10) + 10) % 10;
  if (d[9] !== tenth) return false;
  return d[10] === d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
}

const startApplicationSchema = z.object({
  tckn: z
    .string()
    .length(11, 'TCKN 11 haneli olmalıdır')
    .regex(/^\d+$/, 'TCKN sadece rakam içermelidir')
    .refine((val) => val[0] !== '0', 'TCKN 0 ile başlayamaz')
    .refine(validateTckn, 'Geçersiz TCKN'),
  phone: z
    .string()
    .regex(/^5\d{9}$/, 'Geçerli bir cep telefonu girin (5XXXXXXXXX)'),
});

type StartApplicationInput = z.infer<typeof startApplicationSchema>;

const spinner = (
  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 disabled:opacity-50';
const buttonClass =
  'btn-shine inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:bg-blue-800 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0';

export function TcknForm() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [code, setCode] = useState('');

  const form = useForm<StartApplicationInput>({
    resolver: zodResolver(startApplicationSchema),
    defaultValues: { tckn: '', phone: '' },
  });

  function readError(result: { status: string; data?: unknown; message?: string }): string {
    if (result.status === 'fail') {
      const messages = Object.values((result.data as Record<string, unknown>) || {}).join(', ');
      return messages || 'Doğrulama hatası';
    }
    return result.message || 'Bir hata oluştu';
  }

  // Adım 1: TCKN + telefon → OTP gönder
  async function onStart(data: StartApplicationInput) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/applications/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.status === 'success') {
        setMaskedPhone(result.data.phoneMasked ?? '');
        setStep('otp');
      } else {
        setError(readError(result));
      }
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  }

  // Adım 2: OTP doğrula → başvuruyu tamamla
  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Doğrulama kodu 6 haneli olmalıdır');
      return;
    }
    setIsLoading(true);
    setError(null);
    const { tckn, phone } = form.getValues();
    try {
      const response = await fetch('/api/v1/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tckn, phone, code }),
      });
      const result = await response.json();
      if (result.status === 'success') {
        router.push(`/result?id=${result.data.applicationId}`);
      } else {
        setError(readError(result));
      }
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  }

  if (step === 'otp') {
    return (
      <form onSubmit={onVerify} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Doğrulama Kodu
          </label>
          <p className="mb-2 text-sm text-slate-500">
            {maskedPhone} numarasına gönderilen 6 haneli kodu girin.
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6 haneli kod"
            autoComplete="one-time-code"
            className={inputClass}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="animate-fade-in rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        <button type="submit" disabled={isLoading} className={buttonClass}>
          {isLoading ? (
            <>
              {spinner}
              Doğrulanıyor...
            </>
          ) : (
            'Başvuruyu Tamamla'
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setStep('form');
            setCode('');
            setError(null);
          }}
          disabled={isLoading}
          className="w-full text-center text-sm font-medium text-slate-500 transition hover:text-slate-700 disabled:opacity-50"
        >
          ← Bilgileri değiştir
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onStart)} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">TCKN</label>
        <input
          {...form.register('tckn')}
          type="text"
          inputMode="numeric"
          maxLength={11}
          placeholder="11 haneli kimlik numarası"
          autoComplete="off"
          className={inputClass}
          disabled={isLoading}
        />
        {form.formState.errors.tckn && (
          <p className="mt-2 text-sm text-rose-600">{form.formState.errors.tckn.message}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Cep Telefonu
        </label>
        <input
          {...form.register('phone')}
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="5XXXXXXXXX"
          autoComplete="tel-national"
          className={inputClass}
          disabled={isLoading}
        />
        {form.formState.errors.phone && (
          <p className="mt-2 text-sm text-rose-600">{form.formState.errors.phone.message}</p>
        )}
      </div>

      {error && (
        <div className="animate-fade-in rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      <button type="submit" disabled={isLoading} className={buttonClass}>
        {isLoading ? (
          <>
            {spinner}
            Kod gönderiliyor...
          </>
        ) : (
          'Doğrulama Kodu Gönder'
        )}
      </button>
    </form>
  );
}
