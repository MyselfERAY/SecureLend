import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { AnalyticsProvider } from '../components/analytics-provider';

export const metadata: Metadata = {
  metadataBase: new URL('https://kiraguvence.com'),
  title: {
    default: 'Kira Güvence - Dijital Kira Ödeme Platformu | Güvenli Kira Yönetimi',
    template: '%s | Kira Güvence',
  },
  description:
    'Kira Güvence ile kefil ve Findeks derdi bitti. Banka güvencesiyle kira ödeyin, dijital sözleşmeyle hızla kontrat kurun. Ev sahibi ve kiracı için güvenli kira yönetim platformu.',
  keywords: [
    'kira ödeme',
    'dijital kira',
    'kira güvence',
    'kiracı',
    'ev sahibi',
    'KMH',
    'kira garantisi',
    'kefil',
    'kefil olmadan ev kiralama',
    'findeks',
    'kira kefil',
    'banka güvencesi kira',
    'fintech',
    'kira yönetimi',
    'Kira Güvence',
    'kiraguvence',
    'kira sözleşmesi',
    'dijital kira sözleşmesi',
    'online kira ödeme',
    'kira takip sistemi',
    'KPS kimlik doğrulama',
    'güvenli kira platformu',
    'kira sigortası',
    'kiracı güvencesi',
  ],
  authors: [{ name: 'Kira Güvence' }],
  creator: 'Kira Güvence',
  publisher: 'Kira Güvence',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Kira Güvence',
    title: 'Kira Güvence - Kefil Derdi Biten Kira Platformu',
    description:
      'Banka güvencesiyle kira ödeyin, kefil ve Findeks derdi bitsin. Dijital sözleşme, otomatik ödeme takibi — ev sahibi ve kiracı için.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kira Güvence - Kefil Derdi Biten Kira Platformu',
    description:
      'Banka güvencesiyle kira ödeyin, kefil ve Findeks derdi bitsin.',
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
    'google-site-verification': 'h5BpCsjdu1jdMFvQpiqh1Uat9EVhgNNX7tE',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kira Güvence',
  legalName: 'Kira Güvence Teknoloji',
  url: 'https://kiraguvence.com',
  logo: 'https://kiraguvence.com/opengraph-image',
  description:
    'Dijital kira ödeme platformu. Kiracı, ev sahibi ve banka arasındaki süreci tek merkezde yönetir.',
  foundingDate: '2024',
  areaServed: {
    '@type': 'Country',
    name: 'Turkey',
  },
  serviceType: ['Dijital Kira Yönetimi', 'KMH Finansman', 'KPS Kimlik Doğrulama'],
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
  name: 'Kira Güvence',
  url: 'https://kiraguvence.com',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web, iOS, Android',
  description:
    'Kiracı, ev sahibi ve banka arasındaki kira ödeme sürecini dijital ortamda güvenle yönetin.',
  featureList: [
    'Dijital kira sözleşmesi',
    'Otomatik kira ödeme takibi',
    'KPS kimlik doğrulama',
    'KMH (Kredili Mevduat Hesabı) başvurusu',
    'Anlık bildirimler',
    'Mülk yönetimi',
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'TRY',
    description: 'Ücretsiz kayıt ve temel özellikler',
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
      name: 'Kira Güvence nedir?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Kira Güvence, kefil ve Findeks gereksinimini ortadan kaldıran, banka güvenceli dijital kira yönetim platformudur. Ev sahibi kirasını garanti altına alır, kiracı kefil bulmak zorunda kalmaz.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kefil olmadan ev kiralayabilir miyim?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Evet. Kira Güvence ile banka güvencesi kefil yerine geçer. Kiracı kefil aramak, ev sahibi de kefil sormak zorunda kalmaz. Banka destekli KMH sistemi kiracı ödemelerini garanti eder.',
      },
    },
    {
      '@type': 'Question',
      name: 'KMH (Kredili Mevduat Hesabı) nedir?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'KMH, kira ödemeleri için banka tarafından sağlanan bir güvence hesabıdır. Kiracı geçici bir aksaklık yaşarsa bile kira banka tarafından ev sahibine ödenir, kiracı sadece birkaç günlük faiz öder.',
      },
    },
    {
      '@type': 'Question',
      name: 'Ev sahibi için maliyet nedir?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ücretsiz planda komisyon %1.5, ücretli planlarda %0.5-1 arasındadır. Bu, noter masrafı + Findeks ücreti + kefil riskinden çok daha ekonomiktir.',
      },
    },
    {
      '@type': 'Question',
      name: 'Dijital sözleşme mahkemede geçerli mi?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Evet. Kira Güvence sözleşmeleri TBK (Türk Borçlar Kanunu) uyumludur. Tüm ödeme kayıtları ve sözleşme geçmişi zaman damgalı olarak saklanır ve hukuki delil olarak kullanılabilir.',
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
