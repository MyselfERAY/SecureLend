'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Activity, RefreshCw, CheckCircle2, XCircle, Clock, Zap,
  Target, Megaphone, Code, HeartPulse, BookOpen,
  LucideIcon, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import {
  PageHeader, Card, Badge, EmptyState, LoadingSkeleton, Button,
  type BadgeTone,
} from '../_components/admin-ui';

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

const AGENT_META: Record<string, { label: string; icon: LucideIcon; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral' }> = {
  PO:        { label: 'PO Agent',        icon: Target,      tone: 'info' },
  MARKETING: { label: 'Pazarlama Agent', icon: Megaphone,   tone: 'warning' },
  DEV:       { label: 'Geliştirici Agent', icon: Code,      tone: 'success' },
  HEALTH:    { label: 'Sağlık Agent',    icon: HeartPulse,  tone: 'danger' },
  ARTICLE:   { label: 'Makale Agent',    icon: BookOpen,    tone: 'info' },
};

const STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  COMPLETED: { label: 'Başarılı', tone: 'success' },
  FAILED:    { label: 'Başarısız', tone: 'danger' },
  RUNNING:   { label: 'Çalışıyor', tone: 'info' },
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
  if (!completedAt) return '—';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return '—';
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}sn`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}dk`;
  const hours = Math.floor(mins / 60);
  return `${hours}sa ${mins % 60}dk`;
}

export default function AgentKPIDashboardPage() {
  const { tokens } = useAuth();
  const [stats, setStats] = useState<AgentRunStats | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<string>('ALL');

  const fetchAll = useCallback(async (background = false) => {
    if (!tokens?.accessToken) return;
    if (background) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [statsRes, runsRes] = await Promise.all([
        api<AgentRunStats>('/api/v1/agent-runs/stats', { token: tokens.accessToken }),
        api<AgentRun[]>('/api/v1/agent-runs', { token: tokens.accessToken }),
      ]);
      if (statsRes.status === 'success' && statsRes.data) setStats(statsRes.data);
      if (runsRes.status === 'success' && runsRes.data) setRuns(runsRes.data);
      setLastRefresh(new Date());
    } catch {
      setError('Veriler yüklenirken bir hata oluştu.');
    }
    if (background) setRefreshing(false); else setLoading(false);
  }, [tokens?.accessToken]);

  useEffect(() => { fetchAll(false); }, [fetchAll]);
  useEffect(() => {
    const i = setInterval(() => fetchAll(true), 60000);
    return () => clearInterval(i);
  }, [fetchAll]);

  const AGENT_TYPES = Object.keys(AGENT_META);

  const overallSuccessRate = stats
    ? Math.round(
        Object.values(stats.successRatePerType).reduce((a, b) => a + b, 0) /
        Math.max(Object.keys(stats.successRatePerType).length, 1),
      )
    : 0;

  const totalRuns = runs.length;
  const completedRuns = runs.filter((r) => r.status === 'COMPLETED').length;
  const failedRuns = runs.filter((r) => r.status === 'FAILED').length;
  const runningRuns = runs.filter((r) => r.status === 'RUNNING').length;

  const filteredRuns = useMemo(
    () => (filterType === 'ALL' ? runs : runs.filter((r) => r.agentType === filterType)),
    [runs, filterType],
  );

  const lastRunByType: Record<string, AgentRun | undefined> = {};
  AGENT_TYPES.forEach((type) => {
    lastRunByType[type] = runs.find((r) => r.agentType === type);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent KPI"
        desc="Otonom agent performansı ve çalışma metrikleri"
        icon={Activity}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
        actions={
          <>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Son güncelleme: {lastRefresh.toLocaleTimeString('tr-TR')}
            </span>
            <Button variant="secondary" icon={RefreshCw} onClick={() => fetchAll(true)} disabled={refreshing}>
              {refreshing ? 'Yenileniyor...' : 'Yenile'}
            </Button>
          </>
        }
      />

      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading && <LoadingSkeleton rows={4} />}

      {!loading && (
        <>
          {/* Top metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              icon={Zap}
              label="Bu Ay Çalışma"
              value={stats?.totalThisMonth ?? 0}
              tone="blue"
            />
            <MetricCard
              icon={CheckCircle2}
              label="Genel Başarı"
              value={`%${overallSuccessRate}`}
              tone={overallSuccessRate > 90 ? 'emerald' : overallSuccessRate > 70 ? 'amber' : 'rose'}
            />
            <MetricCard
              icon={Clock}
              label="Şu An Çalışan"
              value={runningRuns}
              sub={runningRuns > 0 ? 'aktif' : 'beklemede'}
              tone="blue"
            />
            <MetricCard
              icon={XCircle}
              label="Başarısız"
              value={failedRuns}
              sub={`/${totalRuns} toplam`}
              tone={failedRuns > 0 ? 'rose' : 'slate'}
            />
          </div>

          {/* Per-agent cards */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Agent Durumu</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {AGENT_TYPES.map((type) => {
                const meta = AGENT_META[type];
                const Icon = meta.icon;
                const runsCount = stats?.runsPerType[type] ?? 0;
                const successRate = stats?.successRatePerType[type] ?? 0;
                const lastRun = lastRunByType[type];
                const rateColor = successRate > 90 ? 'bg-emerald-500' : successRate > 70 ? 'bg-amber-500' : 'bg-rose-500';

                return (
                  <Card key={type}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-slate-300" />
                      </div>
                      {lastRun && <Badge tone={STATUS_META[lastRun.status]?.tone ?? 'neutral'}>{STATUS_META[lastRun.status]?.label}</Badge>}
                    </div>
                    <div className="font-semibold text-white text-sm">{meta.label}</div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Başarı</span>
                      <span className="font-mono text-sm font-semibold text-white">%{successRate}</span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-800 overflow-hidden mt-1">
                      <div className={`h-full ${rateColor} transition-all`} style={{ width: `${successRate}%` }} />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{runsCount} çalışma</span>
                      {lastRun && (
                        <span className="text-slate-400">{timeAgo(lastRun.startedAt)}</span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Run history */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Çalışma Geçmişi · {filteredRuns.length}
              </div>
              <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${filterType === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Tümü
                </button>
                {AGENT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${filterType === type ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {AGENT_META[type].label.replace(' Agent', '')}
                  </button>
                ))}
              </div>
            </div>

            {filteredRuns.length === 0 ? (
              <EmptyState title="Bu filtrede çalışma yok" />
            ) : (
              <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-800/40 border-b border-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-400 text-xs uppercase tracking-wider">Agent</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-400 text-xs uppercase tracking-wider">Durum</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-400 text-xs uppercase tracking-wider">Başlangıç</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-400 text-xs uppercase tracking-wider">Süre</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-400 text-xs uppercase tracking-wider">Token</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-400 text-xs uppercase tracking-wider">Özet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredRuns.slice(0, 50).map((run) => {
                      const agentMeta = AGENT_META[run.agentType];
                      const Icon = agentMeta?.icon ?? Activity;
                      const statusMeta = STATUS_META[run.status] ?? { label: run.status, tone: 'neutral' as BadgeTone };
                      return (
                        <tr key={run.id} className="hover:bg-slate-800/30 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-slate-200 text-sm">{agentMeta?.label || run.agentType}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-400" title={new Date(run.startedAt).toLocaleString('tr-TR')}>
                              {timeAgo(run.startedAt)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono text-xs text-slate-300">{formatDuration(run.startedAt, run.completedAt)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono text-xs text-slate-400">
                              {run.tokenUsage != null ? run.tokenUsage.toLocaleString('tr-TR') : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-400 block max-w-md truncate" title={run.errorMessage || run.summary || ''}>
                              {run.errorMessage ? (
                                <span className="text-rose-400">{run.errorMessage}</span>
                              ) : (
                                run.summary || '—'
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredRuns.length > 50 && (
                  <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-700/50 text-center">
                    İlk 50 gösteriliyor — toplam {filteredRuns.length}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon, label, value, sub, tone,
}: {
  icon: LucideIcon; label: string; value: string | number; sub?: string;
  tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}) {
  const colors = {
    blue:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose:    'text-rose-400 bg-rose-500/10 border-rose-500/20',
    slate:   'text-slate-400 bg-slate-500/10 border-slate-500/20',
  }[tone];
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{value}</span>
            {sub && <span className="text-xs text-slate-500">{sub}</span>}
          </div>
        </div>
        <div className={`h-9 w-9 rounded-lg ${colors} border flex items-center justify-center`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}
