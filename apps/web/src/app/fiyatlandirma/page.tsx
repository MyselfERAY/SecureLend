import type { Metadata } from 'next';
import PricingContent from './pricing-content';

export const metadata: Metadata = {
  title: 'Fiyatlandirma',
  description: 'Kira Guvence fiyatlandirma planlari. Ucretsiz baslayicidan Pro plana kadar seffaf komisyon oranlari. Kira guvence ucreti, noter ve kefil masrafindan daha hesapli.',
  openGraph: {
    title: 'Fiyatlandirma | Kira Guvence',
    description: 'Kira Guvence fiyatlandirma planlari. Noter ve kefil masrafindan daha hesapli kira guvence sistemi.',
  },
  alternates: { canonical: '/fiyatlandirma' },
};

export default function FiyatlandirmaPage() {
  return <PricingContent />;
}
