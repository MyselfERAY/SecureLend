import type { Metadata } from 'next';
import PricingContent from './pricing-content';

export const metadata: Metadata = {
  title: 'Fiyatlandirma',
  description: 'Kira Güvence fiyatlandirma planlari. Ucretsiz baslayicidan Portfoy plana kadar seffaf garanti ucreti oranlari. Kira garanti ucreti, noter ve kefil masrafindan daha hesapli.',
  openGraph: {
    title: 'Fiyatlandirma | Kira Güvence',
    description: 'Kira Güvence fiyatlandirma planlari. Noter ve kefil masrafindan daha hesapli kira guvence sistemi.',
  },
  alternates: { canonical: '/fiyatlandirma' },
};

export default function FiyatlandirmaPage() {
  return <PricingContent />;
}
