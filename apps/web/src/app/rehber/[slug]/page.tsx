import Link from 'next/link';
import { notFound } from 'next/navigation';

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
  TENANT: 'bg-blue-50 text-blue-700',
  LANDLORD: 'bg-emerald-50 text-emerald-700',
  BOTH: 'bg-slate-100 text-slate-600',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: 'Makale Bulunamadı' };
  return {
    title: `${article.title} | Kira Güvence Rehber`,
    description: article.summary,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const paragraphs = article.content.split('\n\n').filter(Boolean);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Back */}
        <Link href="/rehber" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Rehber
        </Link>

        {/* Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-medium text-slate-400">{article.category}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${audienceColor[article.audience]}`}>
              {audienceLabel[article.audience]}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 leading-snug sm:text-3xl">
            {article.title}
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            {new Date(article.publishedAt).toLocaleDateString('tr-TR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
          <p className="mt-4 text-base text-slate-600 font-medium border-l-4 border-blue-200 pl-4">
            {article.summary}
          </p>
        </div>

        {/* Content */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="prose-like space-y-4">
            {paragraphs.map((para, i) => (
              <p key={i} className="text-base text-slate-700 leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        </div>

        {/* Footer nav */}
        <div className="mt-8 text-center">
          <Link href="/rehber" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            ← Tüm yazılara dön
          </Link>
        </div>
      </div>
    </main>
  );
}
