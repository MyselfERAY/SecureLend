import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteNav from '../../../components/site-nav';
import { fixTurkish } from '../../../lib/fix-turkish';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  audience: 'TENANT' | 'LANDLORD' | 'BOTH';
  publishedAt: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/articles/${slug}`, {
      next: { revalidate: 60 },
    });
    const json = await res.json();
    return json.status === 'success' ? json.data : null;
  } catch {
    return null;
  }
}

const audienceLabel: Record<string, string> = {
  TENANT: 'Kiracı',
  LANDLORD: 'Ev Sahibi',
  BOTH: 'Herkes İçin',
};

const audienceColor: Record<string, string> = {
  TENANT: 'bg-blue-100 text-blue-700',
  LANDLORD: 'bg-emerald-100 text-emerald-700',
  BOTH: 'bg-slate-100 text-slate-600',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: 'Makale Bulunamadı' };
  return {
    title: `${article.title} | Kira Güvence Rehber`,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: 'article',
      locale: 'tr_TR',
      siteName: 'Kira Güvence',
      publishedTime: article.publishedAt,
    },
    alternates: { canonical: `/rehber/${slug}` },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt,
    author: { '@type': 'Organization', name: 'Kira Güvence' },
    publisher: {
      '@type': 'Organization',
      name: 'Kira Güvence',
      url: 'https://kiraguvence.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://kiraguvence.com/rehber/${slug}`,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: 'https://kiraguvence.com' },
      { '@type': 'ListItem', position: 2, name: 'Rehber', item: 'https://kiraguvence.com/rehber' },
      { '@type': 'ListItem', position: 3, name: article.title },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteNav variant="light" />

      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Back */}
          <div className="mb-8 flex items-center justify-end">
            <Link href="/rehber" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              Tüm Yazılar
            </Link>
          </div>

          {/* Header */}
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-8 sm:p-10">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-medium text-slate-500">{fixTurkish(article.category)}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${audienceColor[article.audience]}`}>
                {audienceLabel[article.audience]}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 leading-snug sm:text-3xl">
              {article.title}
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              {new Date(article.publishedAt).toLocaleDateString('tr-TR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
            <p className="mt-4 text-base text-slate-600 font-medium border-l-4 border-blue-500 pl-4">
              {article.summary}
            </p>
          </div>

          {/* Content */}
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            {article.content.includes('<') ? (
              <div
                className="prose max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-p:text-base prose-p:leading-relaxed prose-p:text-slate-700 prose-strong:text-slate-900 prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-li:text-base prose-li:text-slate-700 prose-li:leading-relaxed prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-slate-200 prose-th:bg-slate-50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-sm prose-th:font-semibold prose-th:text-slate-700 prose-td:border prose-td:border-slate-200 prose-td:px-3 prose-td:py-2 prose-td:text-sm prose-td:text-slate-600 prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <div className="space-y-4">
                {article.content.split('\n\n').filter(Boolean).map((para, i) => (
                  <p key={i} className="text-base text-slate-700 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Footer nav */}
          <div className="mt-8 text-center">
            <Link href="/rehber" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
              ← Tüm yazılara dön
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
