import Link from 'next/link';
import SiteNav from '../../components/site-nav';

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
  TENANT: 'bg-blue-50 text-blue-700',
  LANDLORD: 'bg-emerald-50 text-emerald-700',
  BOTH: 'bg-slate-100 text-slate-600',
};

export const metadata = {
  title: 'Rehber | Kira Güvence',
  description: 'Kiracılar ve ev sahipleri için kira, hukuk ve finans konularında aydınlatıcı rehber yazılar.',
};

export default async function RehberPage() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav />

      {/* Hero */}
      <section className="bg-white border-b border-slate-200 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Rehber</p>
          <h1 className="mt-3 text-4xl font-extrabold text-slate-900">Kira Dünyasında Rehberiniz</h1>
          <p className="mt-4 text-base text-slate-500">
            Kiracılar ve ev sahipleri için haklarınızı, sorumluluklarınızı ve finansal süreçleri anlatan sade yazılar.
          </p>
        </div>
      </section>

      {/* Articles */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {articles.length === 0 ? (
          <div className="py-20 text-center text-slate-400">Henüz yayınlanmış makale yok.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/rehber/${article.slug}`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-blue-200"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-slate-400">{article.category}</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${audienceColor[article.audience]}`}>
                    {audienceLabel[article.audience]}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-700 transition">
                  {article.title}
                </h2>
                <p className="mt-2 text-sm text-slate-500 flex-1 line-clamp-3">{article.summary}</p>
                <p className="mt-4 text-xs text-slate-400">
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
