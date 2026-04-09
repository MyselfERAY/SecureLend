'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createApplicationSchema,
  type CreateApplicationInput,
} from '@securelend/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function TcknForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateApplicationInput>({
    resolver: zodResolver(createApplicationSchema),
    defaultValues: { tckn: '' },
  });

  async function onSubmit(data: CreateApplicationInput) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tckn: data.tckn }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        router.push(`/result?id=${result.data.applicationId}`);
      } else if (result.status === 'fail') {
        const messages = Object.values(result.data || {}).join(', ');
        setError(messages || 'Dogrulama hatasi');
      } else {
        setError(result.message || 'Bir hata olustu');
      }
    } catch {
      setError('Baglanti hatasi. Lutfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">TCKN</label>
        <input
          {...form.register('tckn')}
          type="text"
          inputMode="numeric"
          maxLength={11}
          placeholder="11 haneli kimlik numarasi"
          autoComplete="off"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 disabled:opacity-50"
          disabled={isLoading}
        />
        {form.formState.errors.tckn && (
          <p className="mt-2 text-sm text-rose-600">
            {form.formState.errors.tckn.message}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <svg
              className="h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Sorgulaniyor...
          </>
        ) : (
          'Uygunluk Sorgula'
        )}
      </button>
    </form>
  );
}
