import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';

export const metadata: Metadata = {
  metadataBase: new URL('https://kiraguvence.com'),
  title: {
    default: 'SecureLend - Dijital Kira Odeme Platformu | Guvenli Kira Yonetimi',
    template: '%s | SecureLend',
  },
  description:
    'SecureLend ile kiraci, ev sahibi ve banka arasindaki kira odeme surecini guvenle yonetin. Dijital sozlesme, otomatik odeme takibi, KPS kimlik dogrulama ve KMH destegi tek platformda.',
  keywords: [
    'kira odeme',
    'dijital kira',
    'kira guvence',
    'kiraci',
    'ev sahibi',
    'KMH',
    'konut mortgage hesabi',
    'fintech',
    'kira yonetimi',
    'SecureLend',
    'kiraguvence',
    'kira sozlesmesi',
    'online kira odeme',
    'kira takip sistemi',
    'KPS kimlik dogrulama',
    'guvenli kira platformu',
  ],
  authors: [{ name: 'SecureLend' }],
  creator: 'SecureLend',
  publisher: 'SecureLend',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://kiraguvence.com',
    siteName: 'SecureLend',
    title: 'SecureLend - Dijital Kira Odeme Platformu',
    description:
      'Kiraci, ev sahibi ve banka arasindaki kira surecini tek merkezde yonetin. Dijital sozlesme, otomatik odeme takibi ve KPS kimlik dogrulama.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SecureLend - Dijital Kira Odeme Platformu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SecureLend - Dijital Kira Odeme Platformu',
    description:
      'Kiraci, ev sahibi ve banka arasindaki kira surecini tek merkezde yonetin.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://kiraguvence.com',
  },
  other: {
    'theme-color': '#1d4ed8',
    'google-site-verification': '',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SecureLend',
  url: 'https://kiraguvence.com',
  logo: 'https://kiraguvence.com/og-image.png',
  description:
    'Dijital kira odeme platformu. Kiraci, ev sahibi ve banka arasindaki sureci tek merkezde yonetir.',
  foundingDate: '2024',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'info@kiraguvence.com',
    contactType: 'customer service',
    availableLanguage: 'Turkish',
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'TR',
  },
  sameAs: [
    'https://kiraguvence.com',
  ],
};

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'SecureLend',
  url: 'https://kiraguvence.com',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  description:
    'Kiraci, ev sahibi ve banka arasindaki kira odeme surecini dijital ortamda guvenle yonetin.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'TRY',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="antialiased min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
