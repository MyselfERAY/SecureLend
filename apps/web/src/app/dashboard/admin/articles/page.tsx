'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  audience: 'TENANT' | 'LANDLORD' | 'BOTH';
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  createdAt: string;
}

const audienceLabel: Record<string, string> = {
  TENANT: 'Kiracı',
  LANDLORD: 'Ev Sahibi',
  BOTH: 'Herkes İçin',
};

export default function AdminArticlesPage() {
  const { tokens } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Article | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  const fetchArticles = async () => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    const res = await api<Article[]>('/api/v1/articles/admin/all', { token: tokens.accessToken });
    if (res.status === 'success' && res.data) setArticles(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, [tokens?.accessToken]);

  const handlePublish = async (id: string) => {
    if (!tokens?.accessToken) return;
    setActionLoading(id);
    await api(`/api/v1/articles/${id}/publish`, { method: 'PATCH', token: tokens.accessToken });
    setActionLoading(null);
    setPreview(null);
    fetchArticles();
  };

  const handleUnpublish = async (id: string) => {
    if (!tokens?.accessToken) return;
    setActionLoading(id);
    await api(`/api/v1/articles/${id}/unpublish`, { method: 'PATCH', token: tokens.accessToken });
    setActionLoading(null);
    setPreview(null);
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    if (!tokens?.accessToken || !confirm('Bu makaleyi kalıcı olarak silmek istediğinize emin misiniz?')) return;
    setActionLoading(id);
    await api(`/api/v1/articles/${id}`, { method: 'DELETE', token: tokens.accessToken });
    setActionLoading(null);
    setPreview(null);
    fetchArticles();
  };

  const filtered = articles.filter((a) => a.status === tab);
  const draftCount = articles.filter((a) => a.status === 'DRAFT').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Makaleler</h1>
        <p className="mt-1 text-sm text-slate-500">Taslakları inceleyin, yayınlayın veya silin.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => { setTab('DRAFT'); setPreview(null); }}
          className={`pb-2 px-1 text-sm font-semibold border-b-2 transition ${
            tab === 'DRAFT' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Taslaklar
          {draftCount > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {draftCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setTab('PUBLISHED'); setPreview(null); }}
          className={`pb-2 px-1 text-sm font-semibold border-b-2 transition ${
            tab === 'PUBLISHED' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Yayında
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
          {tab === 'DRAFT' ? 'Bekleyen taslak yok.' : 'Yayında makale yok.'}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* List */}
          <div className="space-y-3">
            {filtered.map((article) => (
              <button
                key={article.id}
                onClick={() => setPreview(article)}
                className={`w-full text-left rounded-2xl border p-5 transition ${
                  preview?.id === article.id
                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-slate-400">{article.category}</span>
                  <span className="ml-auto text-xs text-slate-400">{audienceLabel[article.audience]}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{article.title}</p>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{article.summary}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(article.createdAt).toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </button>
            ))}
          </div>

          {/* Preview panel */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            {!preview ? (
              <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-slate-400">
                Önizlemek için sol taraftan bir makale seçin.
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    preview.status === 'DRAFT'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {preview.status === 'DRAFT' ? 'Taslak' : 'Yayında'}
                  </span>
                  <span className="text-xs text-slate-400">{preview.category}</span>
                  <span className="text-xs text-slate-400">· {audienceLabel[preview.audience]}</span>
                </div>

                <h2 className="text-lg font-extrabold text-slate-900 leading-snug">{preview.title}</h2>
                <p className="text-sm font-medium text-slate-600 border-l-4 border-blue-200 pl-3">
                  {preview.summary}
                </p>

                <div className="max-h-64 overflow-y-auto rounded-xl bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {preview.content}
                </div>

                <div className="flex gap-3 pt-2">
                  {preview.status === 'DRAFT' ? (
                    <button
                      onClick={() => handlePublish(preview.id)}
                      disabled={actionLoading === preview.id}
                      className="flex-1 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
                    >
                      {actionLoading === preview.id ? 'İşleniyor...' : 'Yayınla'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnpublish(preview.id)}
                      disabled={actionLoading === preview.id}
                      className="flex-1 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {actionLoading === preview.id ? 'İşleniyor...' : 'Yayından Kaldır'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(preview.id)}
                    disabled={actionLoading === preview.id}
                    className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    Sil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
