import type { Metadata } from 'next';
import PricingContent from './pricing-content';

export const metadata: Metadata = {
  title: 'Fiyatlandırma',
  description: 'Kira Güvence fiyatlandırma planları. Ücretsiz başlayıcıdan Portföy plana kadar şeffaf garanti ücreti oranları. Kira garanti ücreti, noter ve kefil masrafından daha hesaplı.',
  openGraph: {
    title: 'Fiyatlandırma | Kira Güvence',
    description: 'Kira Güvence fiyatlandırma planları. Noter ve kefil masrafından daha hesaplı kira güvence sistemi.',
  },
  alternates: { canonical: '/fiyatlandirma' },
};

export default function FiyatlandirmaPage() {
  return <PricingContent />;
}
