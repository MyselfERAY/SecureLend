'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { Megaphone, Download, Play, Plus, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import {
  PageHeader, Card, Badge, EmptyState, LoadingSkeleton, Button,
  type BadgeTone,
} from '../_components/admin-ui';

function SafeHtml({ html }: { html: string }) {
  const clean = useMemo(
    () =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p','br','strong','em','ul','ol','li','h1','h2','h3','h4','h5','h6','a','span','div','table','thead','tbody','tr','th','td','blockquote','code','pre'],
        ALLOWED_ATTR: ['href','target','rel','class'],
      }),
    [html],
  );
  return (
    <div
      className="text-sm text-slate-200 leading-relaxed
        [&_h1]:text-white [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2
        [&_h2]:text-white [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
        [&_h3]:text-white [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5
        [&_h4]:text-white [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-2 [&_h4]:mb-1
        [&_strong]:text-white [&_strong]:font-semibold
        [&_em]:text-slate-300 [&_em]:italic
        [&_a]:text-blue-400 [&_a]:underline hover:[&_a]:text-blue-300
        [&_p]:mb-2 [&_p]:text-slate-200
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:text-slate-200
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:text-slate-200
        [&_li]:my-0.5 [&_li]:text-slate-200
        [&_blockquote]:border-l-2 [&_blockquote]:border-blue-500/50 [&_blockquote]:pl-3 [&_blockquote]:text-slate-300 [&_blockquote]:italic [&_blockquote]:my-3
        [&_code]:bg-slate-800 [&_code]:text-amber-300 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
        [&_pre]:bg-slate-800 [&_pre]:text-slate-200 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:my-3 [&_pre]:text-xs [&_pre]:overflow-x-auto
        [&_table]:w-full [&_table]:my-3 [&_table]:border-collapse [&_table]:text-xs
        [&_th]:bg-slate-800/60 [&_th]:text-slate-200 [&_th]:font-semibold [&_th]:text-left [&_th]:p-2 [&_th]:border [&_th]:border-slate-700
        [&_td]:text-slate-300 [&_td]:p-2 [&_td]:border [&_td]:border-slate-700/50"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

// ── Types ──

type ReportType = 'DAILY_STRATEGY' | 'MARKET_ANALYSIS' | 'RESEARCH' | 'BUSINESS_DEVELOPMENT';
type ResearchStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface MarketingTask {
  id: string;
  title: string;
  description: string | null;
  source: 'MARKETING' | 'PO';
  status: TaskStatus;
  responsible: string | null;
  targetDate: string | null;
}

interface MarketingReport {
  id: string;
  type: ReportType;
  title: string;
  content: string;
  reportDate: string;
  tasks: MarketingTask[];
}

interface ResearchRequest {
  id: string;
  topic: string;
  details: string | null;
  status: ResearchStatus;
  reportId: string | null;
  createdAt: string;
}

const REPORT_META: Record<ReportType, { label: string; tone: BadgeTone }> = {
  DAILY_STRATEGY: { label: 'Günlük Strateji', tone: 'info' },
  MARKET_ANALYSIS: { label: 'Pazar Analizi', tone: 'success' },
  RESEARCH: { label: 'Araştırma', tone: 'info' },
  BUSINESS_DEVELOPMENT: { label: 'İş Geliştirme', tone: 'warning' },
};

const RESEARCH_STATUS_META: Record<ResearchStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Bekliyor', tone: 'warning' },
  IN_PROGRESS: { label: 'Devam Ediyor', tone: 'info' },
  COMPLETED: { label: 'Tamamlandı', tone: 'success' },
  FAILED: { label: 'Başarısız', tone: 'danger' },
};

const TASK_STATUS_META: Record<TaskStatus, { label: string; tone: BadgeTone }> = {
  TODO: { label: 'Yapılacak', tone: 'neutral' },
  IN_PROGRESS: { label: 'Devam', tone: 'info' },
  COMPLETED: { label: 'Tamam', tone: 'success' },
  CANCELLED: { label: 'İptal', tone: 'danger' },
};

type FilterType = 'ALL' | ReportType;

const filterOptions: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'Tümü' },
  { key: 'DAILY_STRATEGY', label: 'Günlük Strateji' },
  { key: 'MARKET_ANALYSIS', label: 'Pazar Analizi' },
  { key: 'RESEARCH', label: 'Araştırma' },
  { key: 'BUSINESS_DEVELOPMENT', label: 'İş Geliştirme' },
];

function formatDate(d: string) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatDateTime(d: string) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MarketingReportsPage() {
  const { tokens } = useAuth();

  const [reports, setReports] = useState<MarketingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MarketingReport | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const selectedRef = useRef<MarketingReport | null>(null);
  selectedRef.current = selected;

  const [researchRequests, setResearchRequests] = useState<ResearchRequest[]>([]);
  const [showResearchForm, setShowResearchForm] = useState(false);
  const [researchForm, setResearchForm] = useState({ topic: '', details: '' });
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [taskActionLoading, setTaskActionLoading] = useState<string | null>(null);

  const fetchReports = async (background = false) => {
    if (!tokens?.accessToken) return;
    if (background) setRefreshing(true); else setLoading(true);
    try {
      const res = await api<any>('/api/v1/marketing/reports', { token: tokens.accessToken });
      if (res.status === 'success' && res.data) {
        const raw = Array.isArray(res.data) ? res.data : Array.isArray(res.data.data) ? res.data.data : [];
        const list: MarketingReport[] = raw.map((r: any) => ({ ...r, tasks: r.tasks ?? [] }));
        setReports(list);
        const cur = selectedRef.current;
        if (cur) {
          const updated = list.find((r) => r.id === cur.id);
          if (updated) setSelected(updated);
        }
      }
    } catch {}
    if (background) setRefreshing(false); else setLoading(false);
  };

  const fetchResearch = async () => {
    if (!tokens?.accessToken) return;
    try {
      const res = await api<ResearchRequest[]>('/api/v1/marketing/research', { token: tokens.accessToken });
      if (res.status === 'success' && res.data) {
        setResearchRequests(Array.isArray(res.data) ? res.data : []);
      }
    } catch {}
  };

  useEffect(() => { fetchReports(false); fetchResearch(); }, [tokens?.accessToken]);
  useEffect(() => {
    const i = setInterval(() => { fetchReports(true); fetchResearch(); }, 30000);
    return () => clearInterval(i);
  }, [tokens?.accessToken]);

  const handleDownloadHtml = async (reportId: string) => {
    if (!tokens?.accessToken) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || '';
      const res = await fetch(`${baseUrl}/api/v1/marketing/reports/${reportId}/html`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapor-${reportId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  };

  const handleAddTaskToTracking = async (taskId: string) => {
    if (!tokens?.accessToken) return;
    setTaskActionLoading(taskId);
    try {
      await api(`/api/v1/marketing/tasks/${taskId}`, {
        method: 'PATCH',
        token: tokens.accessToken,
        body: { responsible: '', targetDate: new Date().toISOString().split('T')[0] },
      });
      fetchReports(true);
    } catch {}
    setTaskActionLoading(null);
  };

  const handleCreateResearch = async () => {
    if (!tokens?.accessToken) return;
    if (!researchForm.topic.trim()) { setResearchError('Konu alanı zorunludur.'); return; }
    setResearchError(null);
    setResearchLoading(true);
    try {
      const body: Record<string, string> = { topic: researchForm.topic.trim() };
      if (researchForm.details.trim()) body.details = researchForm.details.trim();
      const res = await api('/api/v1/marketing/research', { method: 'POST', token: tokens.accessToken, body });
      if (res.status === 'success') {
        setResearchForm({ topic: '', details: '' });
        setShowResearchForm(false);
        fetchResearch();
      } else {
        setResearchError(res.message || 'Talep gönderilemedi.');
      }
    } catch {
      setResearchError('Bir hata oluştu. Tekrar deneyin.');
    }
    setResearchLoading(false);
  };

  const handleTriggerAgent = () => {
    window.open('https://github.com/MyselfERAY/SecureLend/actions/workflows/mkt-agent.yml', '_blank');
  };

  const filtered = filterType === 'ALL' ? reports : reports.filter((r) => r.type === filterType);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pazarlama & Strateji"
        desc="Raporlar, araştırma talepleri ve pazarlama görevleri"
        icon={Megaphone}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
        actions={
          <>
            <Button variant="secondary" icon={Play} onClick={handleTriggerAgent}>Agent Başlat</Button>
            <Button variant="primary" icon={Plus} onClick={() => setShowResearchForm(!showResearchForm)}>
              Araştırma Talebi
            </Button>
          </>
        }
      />

      {showResearchForm && (
        <Card className="border-blue-500/30">
          <h3 className="text-sm font-semibold text-white mb-3">Yeni Araştırma Talebi</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={researchForm.topic}
              onChange={(e) => setResearchForm({ ...researchForm, topic: e.target.value })}
              placeholder="Araştırma konusu"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <textarea
              value={researchForm.details}
              onChange={(e) => setResearchForm({ ...researchForm, details: e.target.value })}
              placeholder="Ek detaylar (opsiyonel)..."
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
            {researchError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {researchError}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleCreateResearch} disabled={researchLoading}>
                {researchLoading ? 'Gönderiliyor...' : 'Gönder'}
              </Button>
              <Button variant="secondary" onClick={() => setShowResearchForm(false)}>İptal</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilterType(opt.key)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              filterType === opt.key
                ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                : 'border-slate-700/50 bg-[#0d1b2a] text-slate-400 hover:border-slate-600 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Reports + Detail */}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={filterType === 'ALL' ? 'Henüz rapor yok' : 'Bu türde rapor bulunamadı'}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Report list */}
          <div className="lg:col-span-2 space-y-3">
            {refreshing && (
              <div className="text-right text-xs text-slate-500 animate-pulse">Güncelleniyor...</div>
            )}
            {filtered.map((r) => {
              const meta = REPORT_META[r.type];
              const active = selected?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`w-full text-left rounded-xl border p-4 transition ${
                    active
                      ? 'border-blue-500/50 bg-[#0f2037]'
                      : 'border-slate-700/50 bg-[#0d1b2a] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    {(r.tasks?.length ?? 0) > 0 && (
                      <span className="ml-auto text-xs text-slate-500">{r.tasks.length} görev</span>
                    )}
                  </div>
                  <div className="font-semibold text-white text-sm leading-snug line-clamp-2">{r.title}</div>
                  <div className="text-xs text-slate-500 mt-2">{formatDate(r.reportDate)}</div>
                </button>
              );
            })}
          </div>

          {/* Detail panel — sticky with self-scroll */}
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-6">
              {!selected ? (
                <Card>
                  <div className="flex items-center justify-center py-16 text-sm text-slate-500">
                    Detay için bir rapor seçin
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className="space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto pr-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={REPORT_META[selected.type].tone}>
                        {REPORT_META[selected.type].label}
                      </Badge>
                      <span className="text-xs text-slate-500">{formatDate(selected.reportDate)}</span>
                      <div className="ml-auto">
                        <Button variant="secondary" size="sm" icon={Download} onClick={() => handleDownloadHtml(selected.id)}>
                          HTML
                        </Button>
                      </div>
                    </div>

                    <h2 className="text-lg font-bold text-white leading-snug">{selected.title}</h2>

                    <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
                      <SafeHtml html={selected.content} />
                    </div>

                    {selected.tasks.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Rapor Görevleri ({selected.tasks.length})
                        </h3>
                        {selected.tasks.map((task) => (
                          <div key={task.id} className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge tone={TASK_STATUS_META[task.status].tone}>{TASK_STATUS_META[task.status].label}</Badge>
                              <Badge tone="neutral">{task.source}</Badge>
                            </div>
                            <div className="text-sm font-medium text-white">{task.title}</div>
                            {task.description && (
                              <div className="text-xs text-slate-400">{task.description}</div>
                            )}
                            <div className="flex items-center gap-3 flex-wrap">
                              {task.responsible && (
                                <span className="text-xs text-slate-500">Sorumlu: <span className="text-slate-300">{task.responsible}</span></span>
                              )}
                              {task.targetDate && (
                                <span className="text-xs text-slate-500">Hedef: <span className="text-slate-300">{formatDate(task.targetDate)}</span></span>
                              )}
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={Plus}
                                onClick={() => handleAddTaskToTracking(task.id)}
                                disabled={taskActionLoading === task.id}
                                className="ml-auto"
                              >
                                {taskActionLoading === task.id ? 'Ekleniyor...' : 'Görev Takibine Ekle'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Research Requests */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Araştırma Talepleri · {researchRequests.length}
        </h2>
        {researchRequests.length === 0 ? (
          <EmptyState title="Henüz araştırma talebi yok" />
        ) : (
          <div className="space-y-2">
            {researchRequests.map((req) => {
              const meta = RESEARCH_STATUS_META[req.status];
              return (
                <div key={req.id} className="flex items-center gap-4 rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{req.topic}</div>
                    {req.details && (
                      <div className="text-xs text-slate-400 truncate mt-0.5">{req.details}</div>
                    )}
                    <div className="text-xs text-slate-500 mt-1">{formatDateTime(req.createdAt)}</div>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  {req.reportId && (
                    <button
                      onClick={() => {
                        const report = reports.find((r) => r.id === req.reportId);
                        if (report) setSelected(report);
                      }}
                      className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
                    >
                      Rapora Git <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
