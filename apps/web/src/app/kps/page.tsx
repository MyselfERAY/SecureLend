import type { Metadata } from 'next';
import KpsVerification from '@/components/kps-verification';

export const metadata: Metadata = {
  title: 'KPS Kimlik Dogrulama',
  description:
    'KPS (Kimlik Paylasim Sistemi) uzerinden TCKN bazli kimlik dogrulama. Kira Guvence platformunda guvenli kimlik dogrulama islemi yapin.',
  openGraph: {
    title: 'KPS Kimlik Dogrulama | Kira Guvence',
    description: 'TCKN bazli kimlik dogrulama sistemi ile kimliginizi guvenle dogrulayin.',
  },
};

export default function KpsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Kimlik Dogrulama Sistemi
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            KPS uzerinden kimlik bilgilerinizi dogrulayin
          </p>
        </div>

        <KpsVerification />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Bu sistem demo amaclidir. Gercek KPS entegrasyonu icin
            Nufus ve Vatandaslik Isleri Genel Mudurlugu ile iletisime geciniz.
          </p>
        </div>
      </div>
    </div>
  );
}
