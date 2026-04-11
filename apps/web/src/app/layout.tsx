import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { AnalyticsProvider } from '../components/analytics-provider';

export const metadata: Metadata = {
  metadataBase: new URL('https://kiraguvence.com'),
  title: {
    default: 'Kira Guvence - Dijital Kira Odeme Platformu | Guvenli Kira Yonetimi',
    template: '%s | Kira Guvence',
  },
  description:
    'Kira Guvence ile kefil ve Findeks derdi bitti. Banka guvencesiyle kira odeyin, dijital sozlesmeyle hizla kontrat kurun. Ev sahibi ve kiraci icin guvenli kira yonetim platformu.',
  keywords: [
    'kira odeme',
    'dijital kira',
    'kira guvence',
    'kiraci',
    'ev sahibi',
    'KMH',
    'kira garantisi',
    'kefil',
    'kefil olmadan ev kiralama',
    'findeks',
    'kira kefil',
    'banka guvencesi kira',
    'fintech',
    'kira yonetimi',
    'Kira Guvence',
    'kiraguvence',
    'kira sozlesmesi',
    'dijital kira sozlesmesi',
    'online kira odeme',
    'kira takip sistemi',
    'KPS kimlik dogrulama',
    'guvenli kira platformu',
    'kira sigortasi',
    'kiracı guvencesi',
  ],
  authors: [{ name: 'Kira Guvence' }],
  creator: 'Kira Guvence',
  publisher: 'Kira Guvence',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Kira Guvence',
    title: 'Kira Guvence - Kefil Derdi Biten Kira Platformu',
    description:
      'Banka guvencesiyle kira odeyin, kefil ve Findeks derdi bitsin. Dijital sozlesme, otomatik odeme takibi — ev sahibi ve kiraci icin.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kira Guvence - Kefil Derdi Biten Kira Platformu',
    description:
      'Banka guvencesiyle kira odeyin, kefil ve Findeks derdi bitsin.',
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
    canonical: './',
  },
  other: {
    'theme-color': '#1d4ed8',
    'google-site-verification': '',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kira Guvence',
  legalName: 'Kira Guvence Teknoloji',
  url: 'https://kiraguvence.com',
  logo: 'https://kiraguvence.com/opengraph-image',
  description:
    'Dijital kira odeme platformu. Kiraci, ev sahibi ve banka arasindaki sureci tek merkezde yonetir.',
  foundingDate: '2024',
  areaServed: {
    '@type': 'Country',
    name: 'Turkey',
  },
  serviceType: ['Dijital Kira Yonetimi', 'KMH Finansman', 'KPS Kimlik Dogrulama'],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      email: 'info@kiraguvence.com',
      contactType: 'customer service',
      availableLanguage: 'Turkish',
    },
    {
      '@type': 'ContactPoint',
      email: 'development@kiraguvence.com',
      contactType: 'technical support',
      availableLanguage: ['Turkish', 'English'],
    },
  ],
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'TR',
    addressLocality: 'Istanbul',
  },
  sameAs: [
    'https://kiraguvence.com',
  ],
};

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Kira Guvence',
  url: 'https://kiraguvence.com',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web, iOS, Android',
  description:
    'Kiraci, ev sahibi ve banka arasindaki kira odeme surecini dijital ortamda guvenle yonetin.',
  featureList: [
    'Dijital kira sozlesmesi',
    'Otomatik kira odeme takibi',
    'KPS kimlik dogrulama',
    'KMH (Kredili Mevduat Hesabi) basvurusu',
    'Anlık bildirimler',
    'Mulk yonetimi',
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'TRY',
    description: 'Ucretsiz kayit ve temel ozellikler',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
    bestRating: '5',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Kira Guvence nedir?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Kira Guvence, kefil ve Findeks gereksinimini ortadan kaldiran, banka guvenceli dijital kira yonetim platformudur. Ev sahibi kirasini garanti altina alir, kiraci kefil bulmak zorunda kalmaz.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kefil olmadan ev kiralayabilir miyim?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Evet. Kira Guvence ile banka guvencesi kefil yerine gecer. Kiraci kefil aramak, ev sahibi de kefil sormak zorunda kalmaz. Banka destekli KMH sistemi kiraci odemelerini garanti eder.',
      },
    },
    {
      '@type': 'Question',
      name: 'KMH (Kredili Mevduat Hesabi) nedir?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'KMH, kira odemeleri icin banka tarafindan saglanan bir guvence hesabidir. Kiraci gecici bir aksaklik yasarsa bile kira banka tarafindan ev sahibine odenir, kiraci sadece birkaç gunluk faiz oder.',
      },
    },
    {
      '@type': 'Question',
      name: 'Ev sahibi icin maliyet nedir?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ucretsiz planda komisyon %1.5, ucretli planlarda %0.5-1 arasindadir. Bu, noter masrafi + Findeks ucreti + kefil riskinden cok daha ekonomiktir.',
      },
    },
    {
      '@type': 'Question',
      name: 'Dijital sozlesme mahkemede gecerli mi?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Evet. Kira Guvence sozlesmeleri TBK (Turk Borclar Kanunu) uyumludur. Tum odeme kayitlari ve sozlesme gecmisi zaman damgali olarak saklanir ve hukuki delil olarak kullanilabilir.',
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <AuthProvider>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
