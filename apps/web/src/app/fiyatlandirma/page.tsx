import type { Metadata } from 'next';
import PricingContent from './pricing-content';

export const metadata: Metadata = {
  title: 'Fiyatlandirma | Kira Guvence',
  description: 'SecureLend fiyatlandirma planlari. Ucretsiz baslayicidan Pro plana kadar seffaf komisyon oranlari.',
};

export default function FiyatlandirmaPage() {
  return <PricingContent />;
}
