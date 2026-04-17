'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import {
  PageHeader, Card, Badge, EmptyState, LoadingSkeleton, Button,
} from '../_components/admin-ui';

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

const AUDIENCE_LABEL: Record<string, string> = {
  TENANT: 'Kiracı',
  LANDLORD: 'Ev Sahibi',
  BOTH: 'Herkes',
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
  useEffect(() => {
    const i = setInterval(fetchArticles, 15000);
    return () => clearInterval(i);
  }, [tokens?.accessToken]);

  const handlePublish = async (id: string) => {
    if (!tokens?.accessToken) return;
    setActionLoading(id);
    await api(`/api/v1/articles/${id}/publish`, { method: 'PATCH', token: tokens.accessToken });
    setActionLoading(null); setPreview(null); fetchArticles();
  };
  const handleUnpublish = async (id: string) => {
    if (!tokens?.accessToken) return;
    setActionLoading(id);
    await api(`/api/v1/articles/${id}/unpublish`, { method: 'PATCH', token: tokens.accessToken });
    setActionLoading(null); setPreview(null); fetchArticles();
  };
  const handleDelete = async (id: string) => {
    if (!tokens?.accessToken || !confirm('Bu makaleyi silmek istediğinize emin misiniz?')) return;
    setActionLoading(id);
    await api(`/api/v1/articles/${id}`, { method: 'DELETE', token: tokens.accessToken });
    setActionLoading(null); setPreview(null); fetchArticles();
  };

  const filtered = articles.filter((a) => a.status === tab);
  const draftCount = articles.filter((a) => a.status === 'DRAFT').length;
  const pubCount = articles.filter((a) => a.status === 'PUBLISHED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Makaleler"
        desc="AI taslaklarını inceleyin, yayınlayın veya silin."
        icon={BookOpen}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-slate-800/50 border border-slate-700/50 w-fit">
        <button
          onClick={() => { setTab('DRAFT'); setPreview(null); }}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
            tab === 'DRAFT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Taslaklar
          {draftCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300">
              {draftCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setTab('PUBLISHED'); setPreview(null); }}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
            tab === 'PUBLISHED' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Yayında
          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300">
            {pubCount}
          </span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton rows={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={tab === 'DRAFT' ? 'Bekleyen taslak yok' : 'Yayında makale yok'}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* List */}
          <div className="space-y-3">
            {filtered.map((a) => (
              <button
                key={a.id}
                onClick={() => setPreview(a)}
                className={`w-full text-left rounded-xl border p-4 transition ${
                  preview?.id === a.id
                    ? 'border-blue-500/50 bg-[#0f2037]'
                    : 'border-slate-700/50 bg-[#0d1b2a] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge tone="neutral">{a.category}</Badge>
                  <Badge tone="info">{AUDIENCE_LABEL[a.audience]}</Badge>
                </div>
                <div className="font-semibold text-white text-sm leading-snug line-clamp-2">{a.title}</div>
                <div className="text-xs text-slate-400 mt-1 line-clamp-2">{a.summary}</div>
                <div className="text-xs text-slate-500 mt-2">
                  {new Date(a.createdAt).toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </div>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-6 h-fit">
            {!preview ? (
              <Card>
                <div className="flex items-center justify-center py-16 text-sm text-slate-500">
                  Önizlemek için bir makale seçin
                </div>
              </Card>
            ) : (
              <Card>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={preview.status === 'DRAFT' ? 'warning' : 'success'}>
                      {preview.status === 'DRAFT' ? 'Taslak' : 'Yayında'}
                    </Badge>
                    <Badge tone="neutral">{preview.category}</Badge>
                    <Badge tone="info">{AUDIENCE_LABEL[preview.audience]}</Badge>
                  </div>

                  <h2 className="text-lg font-bold text-white leading-snug">{preview.title}</h2>
                  <p className="text-sm text-slate-300 border-l-2 border-blue-500/50 pl-3 italic">
                    {preview.summary}
                  </p>

                  <div className="max-h-64 overflow-y-auto rounded-lg bg-slate-900/50 border border-slate-700/50 p-4 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {preview.content}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {preview.status === 'DRAFT' ? (
                      <Button variant="primary" icon={Eye} onClick={() => handlePublish(preview.id)} disabled={actionLoading === preview.id} className="flex-1 justify-center">
                        {actionLoading === preview.id ? 'İşleniyor...' : 'Yayınla'}
                      </Button>
                    ) : (
                      <Button variant="secondary" icon={EyeOff} onClick={() => handleUnpublish(preview.id)} disabled={actionLoading === preview.id} className="flex-1 justify-center">
                        {actionLoading === preview.id ? 'İşleniyor...' : 'Yayından Kaldır'}
                      </Button>
                    )}
                    <Button variant="ghost" icon={Trash2} onClick={() => handleDelete(preview.id)} disabled={actionLoading === preview.id} className="text-rose-400 hover:text-rose-300">
                      Sil
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
