import type { Metadata } from 'next';
import { TcknForm } from '../../components/tckn-form';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Kredi Uygunluk Kontrolü',
  description:
    'TCKN ile kredi uygunluk kontrolü yapın. Kira Güvence üzerinden kira ödeme uygunluğunuzu ve KMH limitinizi hızlıca öğrenin.',
  openGraph: {
    title: 'Kredi Uygunluk Kontrolü | Kira Güvence',
    description: 'TCKN ile kredi uygunluk kontrolü yapın. Kira ödeme uygunluğunuzu öğrenin.',
  },
};

export default function CreditCheckPage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900">
            <span aria-hidden="true" className="mr-2">←</span>
            Ana Sayfa
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Kredi Uygunluk Kontrolü
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Kimlik bilginizi kullanarak ön değerlendirme sonucu alın. Sonuç ekranında limit ve risk kararını
            kurumsal formatta görüntüleyebilirsiniz.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] sm:p-8">
          <TcknForm />
        </div>
      </div>
    </main>
  );
}
