import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';

export const metadata: Metadata = {
  metadataBase: new URL('https://kiraguvence.com'),
  title: {
    default: 'SecureLend - Dijital Kira Odeme Platformu',
    template: '%s | SecureLend',
  },
  description:
    'SecureLend ile kiraci, ev sahibi ve banka arasindaki kira odeme surecini guvenle yonetin. Dijital sozlesme, otomatik odeme takibi ve KMH destegi tek platformda.',
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
  ],
  authors: [{ name: 'SecureLend' }],
  creator: 'SecureLend',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://kiraguvence.com',
    siteName: 'SecureLend',
    title: 'SecureLend - Dijital Kira Odeme Platformu',
    description:
      'Kiraci, ev sahibi ve banka arasindaki kira surecini tek merkezde yonetin. Sozlesme, odeme ve uygunluk adimlari fintech seviyesinde.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SecureLend - Dijital Kira Odeme Platformu',
    description:
      'Kiraci, ev sahibi ve banka arasindaki kira surecini tek merkezde yonetin.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://kiraguvence.com',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SecureLend',
  url: 'https://kiraguvence.com',
  description:
    'Dijital kira odeme platformu. Kiraci, ev sahibi ve banka arasindaki sureci tek merkezde yonetir.',
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
