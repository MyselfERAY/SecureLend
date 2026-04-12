'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

// ── Types ──

interface AgentRunStats {
  runsPerType: Record<string, number>;
  successRatePerType: Record<string, number>;
  totalThisMonth: number;
}

interface AgentRun {
  id: string;
  agentType: string;
  status: 'COMPLETED' | 'FAILED' | 'RUNNING';
  startedAt: string;
  completedAt: string | null;
  summary: string | null;
  errorMessage: string | null;
  tokenUsage: number | null;
}

interface Suggestion {
  id: string;
  title: string;
  priority: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

interface Article {
  id: string;
  status: 'DRAFT' | 'PUBLISHED';
}

// ── Display helpers ──

const agentLabel: Record<string, string> = {
  PO: 'PO Agent',
  MARKETING: 'Pazarlama Agent',
  DEV: 'Geliştirici Agent',
  HEALTH: 'Sağlık Agent',
  ARTICLE: 'Makale Agent',
};

const agentIcon: Record<string, string> = {
  PO: 'P',
  MARKETING: 'M',
  DEV: 'G',
  HEALTH: 'S',
  ARTICLE: 'A',
};

const agentGradient: Record<string, string> = {
  PO: 'from-indigo-50 to-blue-50 border-indigo-200',
  MARKETING: 'from-amber-50 to-orange-50 border-amber-200',
  DEV: 'from-emerald-50 to-teal-50 border-emerald-200',
  HEALTH: 'from-rose-50 to-pink-50 border-rose-200',
  ARTICLE: 'from-purple-50 to-violet-50 border-purple-200',
};

const agentIconColor: Record<string, string> = {
  PO: 'bg-indigo-100 text-indigo-600',
  MARKETING: 'bg-amber-100 text-amber-600',
  DEV: 'bg-emerald-100 text-emerald-600',
  HEALTH: 'bg-rose-100 text-rose-600',
  ARTICLE: 'bg-purple-100 text-purple-600',
};

const statusBadge: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-rose-100 text-rose-700',
  RUNNING: 'bg-blue-100 text-blue-700',
};

const statusLabel: Record<string, string> = {
  COMPLETED: 'Başarılı',
  FAILED: 'Başarısız',
  RUNNING: 'Çalışıyor',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return 'Devam ediyor';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return '-';
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}sn`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  if (mins < 60) return `${mins}dk ${remSecs}sn`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}sa ${remMins}dk`;
}

function successRateColor(rate: number): string {
  if (rate > 90) return 'text-emerald-600';
  if (rate > 70) return 'text-amber-600';
  return 'text-rose-600';
}

function successRateBg(rate: number): string {
  if (rate > 90) return 'bg-emerald-500';
  if (rate > 70) return 'bg-amber-500';
  return 'bg-rose-500';
}

// ── Main Component ──

export default function AgentKPIDashboardPage() {
  const { tokens } = useAuth();

  const [stats, setStats] = useState<AgentRunStats | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAll = useCallback(async (background = false) => {
    if (!tokens?.accessToken) return;
    if (!background) setLoading(true);
    setError(null);

    try {
      const [statsRes, runsRes, suggestionsRes, articlesRes] = await Promise.all([
        api<AgentRunStats>('/api/v1/agent-runs/stats', { token: tokens.accessToken }),
        api<AgentRun[]>('/api/v1/agent-runs', { token: tokens.accessToken }),
        api<Suggestion[]>('/api/v1/suggestions', { token: tokens.accessToken }),
        api<Article[]>('/api/v1/articles/admin/all', { token: tokens.accessToken }),
      ]);

      if (statsRes.status === 'success' && statsRes.data) setStats(statsRes.data);
      if (runsRes.status === 'success' && runsRes.data) setRuns(runsRes.data);
      if (suggestionsRes.status === 'success' && suggestionsRes.data) setSuggestions(suggestionsRes.data);
      if (articlesRes.status === 'success' && articlesRes.data) setArticles(articlesRes.data);

      setLastRefresh(new Date());
    } catch {
      setError('Veriler yüklenirken bir hata oluştu.');
    } finally {
      if (!background) setLoading(false);
    }
  }, [tokens?.accessToken]);

  // Initial fetch
  useEffect(() => { fetchAll(false); }, [fetchAll]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchAll(true), 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ── Computed Values ──
  const overallSuccessRate = stats
    ? Math.round(
        Object.values(stats.successRatePerType).reduce((a, b) => a + b, 0) /
        Math.max(Object.keys(stats.successRatePerType).length, 1)
      )
    : 0;

  const activeSuggestions = suggestions.filter(
    (s) => s.status === 'PENDING' || s.status === 'IN_PROGRESS'
  ).length;

  const publishedArticles = articles.filter((a) => a.status === 'PUBLISHED').length;

  const suggestionCounts = {
    PENDING: suggestions.filter((s) => s.status === 'PENDING').length,
    IN_PROGRESS: suggestions.filter((s) => s.status === 'IN_PROGRESS').length,
    DONE: suggestions.filter((s) => s.status === 'DONE').length,
    REJECTED: suggestions.filter((s) => s.status === 'REJECTED').length,
  };
  const totalSuggestions = suggestions.length;

  const agentTypes = ['PO', 'MARKETING', 'DEV', 'HEALTH', 'ARTICLE'];

  const lastRunByType: Record<string, AgentRun | undefined> = {};
  agentTypes.forEach((type) => {
    lastRunByType[type] = runs.find((r) => r.agentType === type);
  });

  // ── Loading State ──
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Agent KPI Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Otonom agent performansı ve çalışma metrikleri
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Son güncelleme: {lastRefresh.toLocaleTimeString('tr-TR')}
          </span>
          <button
            onClick={() => fetchAll(true)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-red-300 hover:shadow-sm"
          >
            Yenile
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600 font-medium">
          {error}
        </div>
      )}

      {/* ── Section 1: Top Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="text-xs font-medium text-blue-600">Bu Ay Toplam Çalışma</div>
          <div className="text-2xl font-bold text-blue-800 mt-1">
            {stats?.totalThisMonth ?? 0}
          </div>
          <div className="text-xs text-blue-500 mt-1">agent çalışma sayısı</div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs font-medium text-emerald-600">Genel Başarı Oranı</div>
          <div className={`text-2xl font-bold mt-1 ${successRateColor(overallSuccessRate)}`}>
            %{overallSuccessRate}
          </div>
          <div className="text-xs text-emerald-500 mt-1">ortalama başarı</div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs font-medium text-amber-600">Aktif Geliştirme Önerileri</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">
            {activeSuggestions}
          </div>
          <div className="text-xs text-amber-500 mt-1">bekleyen + devam eden</div>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <div className="text-xs font-medium text-purple-600">Yayınlanan Makale</div>
          <div className="text-2xl font-bold text-purple-800 mt-1">
            {publishedArticles}
          </div>
          <div className="text-xs text-purple-500 mt-1">toplam yayinda</div>
        </div>
      </div>

      {/* ── Section 2: Per-Agent Performance Cards ── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Agent Performansı</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agentTypes.map((type) => {
            const totalRuns = stats?.runsPerType[type] ?? 0;
            const rate = stats?.successRatePerType[type] ?? 0;
            const lastRun = lastRunByType[type];

            return (
              <div
                key={type}
                className={`bg-gradient-to-br ${agentGradient[type]} rounded-xl border p-5`}
              >
                {/* Agent Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 ${agentIconColor[type]} rounded-lg flex items-center justify-center text-sm font-bold`}
                  >
                    {agentIcon[type]}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{agentLabel[type]}</div>
                    <div className="text-xs text-gray-500">
                      {type === 'PO' && 'Günlük ürün raporu'}
                      {type === 'MARKETING' && 'Pazarlama stratejisi'}
                      {type === 'DEV' && 'Otomatik geliştirme'}
                      {type === 'HEALTH' && 'Hata analizi ve fix önerileri'}
                      {type === 'ARTICLE' && 'SEO blog makale üretimi'}
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Toplam Çalışma</span>
                    <span className="text-sm font-bold text-gray-900">{totalRuns}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Başarı Oranı</span>
                    <span className={`text-sm font-bold ${successRateColor(rate)}`}>
                      %{rate}
                    </span>
                  </div>

                  {/* Success Rate Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${successRateBg(rate)} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(rate, 100)}%` }}
                    />
                  </div>

                  {/* Last Run */}
                  <div className="pt-2 border-t border-gray-200/60">
                    {lastRun ? (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Son Çalışma</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">
                            {timeAgo(lastRun.startedAt)}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[lastRun.status]}`}
                          >
                            {statusLabel[lastRun.status]}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 text-center">
                        Henüz çalışma yok
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: Recent Agent Runs Table ── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Son Agent Çalışmaları</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {runs.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              Henüz agent çalışması bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Agent
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Durum
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Başlangıç
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Sure
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Özet
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {runs.slice(0, 20).map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 ${agentIconColor[run.agentType] ?? 'bg-gray-100 text-gray-600'} rounded flex items-center justify-center text-xs font-bold`}
                          >
                            {agentIcon[run.agentType] ?? '?'}
                          </div>
                          <span className="font-medium text-gray-900">
                            {agentLabel[run.agentType] ?? run.agentType}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[run.status] ?? 'bg-gray-100 text-gray-700'}`}
                        >
                          {statusLabel[run.status] ?? run.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {timeAgo(run.startedAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                        {formatDuration(run.startedAt, run.completedAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                        {run.status === 'FAILED' && run.errorMessage ? (
                          <span className="text-rose-600">{run.errorMessage}</span>
                        ) : (
                          run.summary ?? '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 4: Dev Agent Pipeline ── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Geliştirici Agent Pipeline</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          {/* Status Counts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
              <div className="text-xs font-medium text-amber-600">Bekliyor</div>
              <div className="text-xl font-bold text-amber-800 mt-1">
                {suggestionCounts.PENDING}
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
              <div className="text-xs font-medium text-blue-600">Geliştiriliyor</div>
              <div className="text-xl font-bold text-blue-800 mt-1">
                {suggestionCounts.IN_PROGRESS}
              </div>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
              <div className="text-xs font-medium text-emerald-600">Tamamlandı</div>
              <div className="text-xl font-bold text-emerald-800 mt-1">
                {suggestionCounts.DONE}
              </div>
            </div>
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-center">
              <div className="text-xs font-medium text-rose-600">Reddedildi</div>
              <div className="text-xl font-bold text-rose-800 mt-1">
                {suggestionCounts.REJECTED}
              </div>
            </div>
          </div>

          {/* Horizontal Bar Chart */}
          {totalSuggestions > 0 ? (
            <div>
              <div className="text-xs text-gray-500 mb-2">
                Toplam {totalSuggestions} oneri
              </div>
              <div className="flex h-6 rounded-full overflow-hidden bg-gray-100">
                {suggestionCounts.PENDING > 0 && (
                  <div
                    className="bg-amber-400 transition-all duration-500"
                    style={{ width: `${(suggestionCounts.PENDING / totalSuggestions) * 100}%` }}
                    title={`Bekliyor: ${suggestionCounts.PENDING}`}
                  />
                )}
                {suggestionCounts.IN_PROGRESS > 0 && (
                  <div
                    className="bg-blue-400 transition-all duration-500"
                    style={{ width: `${(suggestionCounts.IN_PROGRESS / totalSuggestions) * 100}%` }}
                    title={`Geliştiriliyor: ${suggestionCounts.IN_PROGRESS}`}
                  />
                )}
                {suggestionCounts.DONE > 0 && (
                  <div
                    className="bg-emerald-400 transition-all duration-500"
                    style={{ width: `${(suggestionCounts.DONE / totalSuggestions) * 100}%` }}
                    title={`Tamamlandı: ${suggestionCounts.DONE}`}
                  />
                )}
                {suggestionCounts.REJECTED > 0 && (
                  <div
                    className="bg-rose-400 transition-all duration-500"
                    style={{ width: `${(suggestionCounts.REJECTED / totalSuggestions) * 100}%` }}
                    title={`Reddedildi: ${suggestionCounts.REJECTED}`}
                  />
                )}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-xs text-gray-500">Bekliyor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="text-xs text-gray-500">Geliştiriliyor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-gray-500">Tamamlandı</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="text-xs text-gray-500">Reddedildi</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-gray-400 text-sm">
              Henüz geliştirme önerisi bulunmuyor.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
