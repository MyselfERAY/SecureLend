import type { Metadata } from 'next';
import KpsVerification from '@/components/kps-verification';

export const metadata: Metadata = {
  title: 'KPS Kimlik Doğrulama',
  description:
    'KPS (Kimlik Paylaşım Sistemi) üzerinden TCKN bazlı kimlik doğrulama. Kira Güvence platformunda güvenli kimlik doğrulama işlemi yapın.',
  openGraph: {
    title: 'KPS Kimlik Doğrulama | Kira Güvence',
    description: 'TCKN bazlı kimlik doğrulama sistemi ile kimliğinizi güvenle doğrulayın.',
  },
};

export default function KpsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Kimlik Doğrulama Sistemi
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            KPS üzerinden kimlik bilgilerinizi doğrulayın
          </p>
        </div>

        <KpsVerification />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Bu sistem demo amaçlıdır. Gerçek KPS entegrasyonu için
            Nüfus ve Vatandaşlık İşleri Genel Müdürlüğü ile iletişime geçiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
