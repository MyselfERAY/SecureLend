'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

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

// ── Display helpers ──

const reportTypeLabel: Record<ReportType, string> = {
  DAILY_STRATEGY: 'Gunluk Strateji',
  MARKET_ANALYSIS: 'Pazar Analizi',
  RESEARCH: 'Arastirma',
  BUSINESS_DEVELOPMENT: 'Is Gelistirme',
};

const reportTypeColor: Record<ReportType, string> = {
  DAILY_STRATEGY: 'bg-blue-100 text-blue-700',
  MARKET_ANALYSIS: 'bg-emerald-100 text-emerald-700',
  RESEARCH: 'bg-purple-100 text-purple-700',
  BUSINESS_DEVELOPMENT: 'bg-amber-100 text-amber-700',
};

const researchStatusLabel: Record<ResearchStatus, string> = {
  PENDING: 'Bekliyor',
  IN_PROGRESS: 'Devam Ediyor',
  COMPLETED: 'Tamamlandi',
  FAILED: 'Basarisiz',
};

const researchStatusColor: Record<ResearchStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-rose-100 text-rose-700',
};

const taskStatusLabel: Record<TaskStatus, string> = {
  TODO: 'Yapilacak',
  IN_PROGRESS: 'Devam Ediyor',
  COMPLETED: 'Tamamlandi',
  CANCELLED: 'Iptal',
};

const taskStatusColor: Record<TaskStatus, string> = {
  TODO: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

type FilterType = 'ALL' | ReportType;

const filterOptions: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'Tumu' },
  { key: 'DAILY_STRATEGY', label: 'Gunluk Strateji' },
  { key: 'MARKET_ANALYSIS', label: 'Pazar Analizi' },
  { key: 'RESEARCH', label: 'Arastirma' },
  { key: 'BUSINESS_DEVELOPMENT', label: 'Is Gelistirme' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Component ──

export default function MarketingReportsPage() {
  const { tokens } = useAuth();

  // Report state
  const [reports, setReports] = useState<MarketingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MarketingReport | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const selectedRef = useRef<MarketingReport | null>(null);
  selectedRef.current = selected;

  // Research state
  const [researchRequests, setResearchRequests] = useState<ResearchRequest[]>([]);
  const [showResearchForm, setShowResearchForm] = useState(false);
  const [researchForm, setResearchForm] = useState({ topic: '', details: '' });
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);

  // Task tracking action
  const [taskActionLoading, setTaskActionLoading] = useState<string | null>(null);

  // ── Fetch reports ──
  const fetchReports = async (background = false) => {
    if (!tokens?.accessToken) return;
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await api<any>('/api/v1/marketing/reports', {
        token: tokens.accessToken,
      });
      if (res.status === 'success' && res.data) {
        // API returns { data: [...], total, page, limit }
        const raw = Array.isArray(res.data) ? res.data : Array.isArray(res.data.data) ? res.data.data : [];
        // Ensure each report has a tasks array (list query uses _count, not include)
        const list: MarketingReport[] = raw.map((r: any) => ({
          ...r,
          tasks: r.tasks ?? [],
        }));
        setReports(list);
        const currentSelected = selectedRef.current;
        if (currentSelected) {
          const updated = list.find((r: MarketingReport) => r.id === currentSelected.id);
          if (updated) setSelected(updated);
        }
      }
    } catch {
      // silent
    }
    if (background) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  };

  // ── Fetch research requests ──
  const fetchResearch = async () => {
    if (!tokens?.accessToken) return;
    try {
      const res = await api<ResearchRequest[]>('/api/v1/marketing/research', {
        token: tokens.accessToken,
      });
      if (res.status === 'success' && res.data) {
        const list = Array.isArray(res.data) ? res.data : [];
        setResearchRequests(list);
      }
    } catch {
      // silent
    }
  };

  // ── Initial load ──
  useEffect(() => {
    fetchReports(false);
    fetchResearch();
  }, [tokens?.accessToken]);

  // ── Auto-refresh every 30s ──
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReports(true);
      fetchResearch();
    }, 30000);
    return () => clearInterval(interval);
  }, [tokens?.accessToken]);

  // ── Download HTML ──
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
    } catch {
      // silent
    }
  };

  // ── Add task to tracking ──
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
    } catch {
      // silent
    }
    setTaskActionLoading(null);
  };

  // ── Create research request ──
  const handleCreateResearch = async () => {
    if (!tokens?.accessToken) return;
    if (!researchForm.topic.trim()) {
      setResearchError('Konu alani zorunludur.');
      return;
    }
    setResearchError(null);
    setResearchLoading(true);
    try {
      const body: Record<string, string> = { topic: researchForm.topic.trim() };
      if (researchForm.details.trim()) body.details = researchForm.details.trim();
      const res = await api('/api/v1/marketing/research', {
        method: 'POST',
        token: tokens.accessToken,
        body,
      });
      if (res.status === 'success') {
        setResearchForm({ topic: '', details: '' });
        setShowResearchForm(false);
        fetchResearch();
      } else {
        setResearchError(res.message || 'Talep gonderilemedi.');
      }
    } catch {
      setResearchError('Bir hata olustu. Tekrar deneyin.');
    }
    setResearchLoading(false);
  };

  // ── Trigger GitHub Actions ──
  const handleTriggerAgent = () => {
    window.open('https://github.com/MyselfERAY/SecureLend/actions', '_blank');
  };

  // ── Filtering ──
  const filtered =
    filterType === 'ALL'
      ? reports
      : reports.filter((r) => r.type === filterType);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Pazarlama & Strateji</h1>
          <p className="mt-1 text-sm text-slate-500">
            Raporlar, arastirma talepleri ve pazarlama gorevleri
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowResearchForm(!showResearchForm)}
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Arastirma Talebi
          </button>
          <button
            onClick={handleTriggerAgent}
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            Agent Baslat
          </button>
        </div>
      </div>

      {/* ── Research Request Form ── */}
      {showResearchForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Yeni Arastirma Talebi</h2>
          <input
            type="text"
            value={researchForm.topic}
            onChange={(e) => setResearchForm({ ...researchForm, topic: e.target.value })}
            placeholder="Arastirma konusu"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
          <textarea
            value={researchForm.details}
            onChange={(e) => setResearchForm({ ...researchForm, details: e.target.value })}
            placeholder="Ek detaylar (opsiyonel)..."
            rows={3}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none resize-none"
          />
          {researchError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-600 font-medium">
              {researchError}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleCreateResearch}
              disabled={researchLoading}
              className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {researchLoading ? 'Gonderiliyor...' : 'Gonder'}
            </button>
            <button
              onClick={() => setShowResearchForm(false)}
              className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Iptal
            </button>
          </div>
        </div>
      )}

      {/* ── Report Type Filter ── */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilterType(opt.key)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              filterType === opt.key
                ? 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Report List + Detail ── */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Yukleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
          {filterType === 'ALL' ? 'Henuz rapor yok.' : 'Bu turde rapor bulunamadi.'}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Left: Report list (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            {refreshing && (
              <div className="text-right text-xs text-slate-400 animate-pulse">Guncelleniyor...</div>
            )}
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full text-left rounded-2xl border p-5 transition ${
                  selected?.id === r.id
                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${reportTypeColor[r.type]}`}
                  >
                    {reportTypeLabel[r.type]}
                  </span>
                  {(r.tasks?.length ?? 0) > 0 && (
                    <span className="ml-auto text-xs text-slate-400">
                      {r.tasks.length} gorev
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                  {r.title}
                </p>
                <p className="mt-2 text-xs text-slate-400">{formatDate(r.reportDate)}</p>
              </button>
            ))}
          </div>

          {/* Right: Detail panel (3 cols) */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white sticky top-20">
            {!selected ? (
              <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-slate-400">
                Detay icin bir rapor secin.
              </div>
            ) : (
              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${reportTypeColor[selected.type]}`}
                  >
                    {reportTypeLabel[selected.type]}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(selected.reportDate)}</span>
                </div>

                <h2 className="text-lg font-extrabold text-slate-900">{selected.title}</h2>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadHtml(selected.id)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    HTML Indir
                  </button>
                </div>

                {/* Report content rendered as HTML */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
                  <div
                    className="prose prose-sm prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: selected.content }}
                  />
                </div>

                {/* Tasks from this report */}
                {selected.tasks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      Rapor Gorevleri ({selected.tasks.length})
                    </h3>
                    {selected.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${taskStatusColor[task.status]}`}
                          >
                            {taskStatusLabel[task.status]}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {task.source}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-slate-500">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3">
                          {task.responsible && (
                            <span className="text-xs text-slate-500">
                              Sorumlu: {task.responsible}
                            </span>
                          )}
                          {task.targetDate && (
                            <span className="text-xs text-slate-500">
                              Hedef: {formatDate(task.targetDate)}
                            </span>
                          )}
                          <button
                            onClick={() => handleAddTaskToTracking(task.id)}
                            disabled={taskActionLoading === task.id}
                            className="ml-auto rounded-lg border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                          >
                            {taskActionLoading === task.id
                              ? 'Ekleniyor...'
                              : 'Gorev Takibine Ekle'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Research Requests ── */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Arastirma Talepleri</h2>
        {researchRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-400">
            Henuz arastirma talebi yok.
          </div>
        ) : (
          <div className="space-y-2">
            {researchRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{req.topic}</p>
                  {req.details && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">{req.details}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{formatDateTime(req.createdAt)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${researchStatusColor[req.status]}`}
                >
                  {researchStatusLabel[req.status]}
                </span>
                {req.reportId && (
                  <button
                    onClick={() => {
                      const report = reports.find((r) => r.id === req.reportId);
                      if (report) setSelected(report);
                    }}
                    className="shrink-0 text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Rapora Git &rarr;
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
