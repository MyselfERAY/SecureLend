import Link from 'next/link';
import SiteNav from '../../components/site-nav';
import { fixTurkish } from '../../lib/fix-turkish';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  audience: 'TENANT' | 'LANDLORD' | 'BOTH';
  publishedAt: string;
}

async function getArticles(): Promise<Article[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/articles`, {
      next: { revalidate: 60 },
    });
    const json = await res.json();
    return json.status === 'success' ? json.data : [];
  } catch {
    return [];
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

export const metadata = {
  title: 'Rehber',
  description: 'Kiracılar ve ev sahipleri için kira sözleşmesi, kefil, Findeks, kira artışı, depozito ve hukuk konularında aydınlatıcı rehber yazılar.',
  openGraph: {
    title: 'Kira Rehberi | Kira Güvence',
    description: 'Kira sözleşmesi, kefil hakları, kira artış oranı ve daha fazlası.',
  },
  alternates: { canonical: '/rehber' },
};

export default async function RehberPage() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen bg-white">
      <SiteNav variant="light" />

      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Rehber</p>
          <h1 className="mt-3 text-4xl font-extrabold text-slate-900">Kira Dünyasında Rehberiniz</h1>
          <p className="mt-4 text-base text-slate-600">
            Kiracılar ve ev sahipleri için haklarınızı, sorumluluklarınızı ve finansal süreçleri anlatan sade yazılar.
          </p>
        </div>
      </section>

      {/* Articles */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {articles.length === 0 ? (
          <div className="py-20 text-center text-slate-500">Henüz yayınlanmış makale yok.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/rehber/${article.slug}`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-slate-500">{fixTurkish(article.category)}</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${audienceColor[article.audience]}`}>
                    {audienceLabel[article.audience]}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition">
                  {article.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600 flex-1 line-clamp-3">{article.summary}</p>
                <p className="mt-4 text-xs text-slate-500">
                  {new Date(article.publishedAt).toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
