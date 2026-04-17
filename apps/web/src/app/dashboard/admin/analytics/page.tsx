'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import { PageHeader } from '../_components/admin-ui';

// ─── Types ───

interface AnalyticsDashboard {
  summary: {
    totalPageViews: number;
    uniqueSessions: number;
    uniqueUsers: number;
    totalErrors: number;
    avgPagesPerSession: number;
  };
  pageViews: { page: string; count: number }[];
  topPages: { page: string; sessions: number }[];
  avgDurations: { page: string; avgSeconds: number; samples: number }[];
  devices: { device: string; count: number }[];
  browsers: { browser: string; count: number }[];
  recentErrors: {
    page: string;
    errorMessage: string | null;
    browser: string | null;
    device: string | null;
    createdAt: string;
  }[];
  dailyViews: { day: string; count: number }[];
}

interface ApiDashboard {
  summary: {
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
    avgResponseTime: number;
  };
  topEndpoints: { endpoint: string; count: number; avgMs: number }[];
  errorEndpoints: { endpoint: string; count: number }[];
  statusCodes: { code: string; count: number }[];
  methods: { method: string; count: number }[];
  slowEndpoints: { endpoint: string; avgMs: number; maxMs: number; samples: number }[];
  recentErrors: {
    endpoint: string;
    method: string | null;
    statusCode: string | null;
    errorMessage: string | null;
    ip: string | null;
    userId: string | null;
    durationMs: number | null;
    createdAt: string;
  }[];
  granularity?: 'hour' | 'day';
  dailyRequests: { day: string; count: number }[];
  dailyErrors: { day: string; count: number }[];
}

interface ExtendedMetrics {
  bounceRate: { rate: number; bounced: number; total: number };
  funnel: { landing: number; register: number; otp: number; dashboard: number };
  conversionRate: { visitors: number; registered: number; rate: number };
  referrers: {
    categories: { category: string; count: number }[];
    topSources: { source: string; count: number }[];
  };
  ctaClicks: { page: string; label: string | null; count: number }[];
  scrollDepth: { depth: string; count: number }[];
}

interface ActivationFunnel {
  steps: { step: number; name: string; count: number; rate: number }[];
  users: {
    userId: string;
    fullName: string;
    tcknMasked: string;
    kycStatus: string;
    registeredAt: string;
    kycCompletedAt: string | null;
    contractCreatedAt: string | null;
    contractSignedAt: string | null;
    firstPaymentAt: string | null;
    currentStep: number;
  }[];
  period: { days: number; since: string };
}

type TabType = 'overview' | 'pages' | 'errors' | 'api' | 'metrics' | 'funnel';

// Zaman aralığı preset'leri — ani trafik/hata artışlarını görebilmek için
// saatlik seçenekler (1-6 saat) + günlük seçenekler (1-90 gün).
// minutes: backend'e gönderilen dakika sayısı
// days: saatlik range'de de eski `days` tabanlı endpoint'ler için 1'e yuvarlanır
const RANGE_PRESETS: { label: string; minutes: number }[] = [
  { label: 'Son 1 saat', minutes: 60 },
  { label: 'Son 6 saat', minutes: 360 },
  { label: 'Son 1 gün', minutes: 1440 },
  { label: 'Son 7 gün', minutes: 7 * 1440 },
  { label: 'Son 14 gün', minutes: 14 * 1440 },
  { label: 'Son 30 gün', minutes: 30 * 1440 },
  { label: 'Son 90 gün', minutes: 90 * 1440 },
];

export default function AdminAnalyticsPage() {
  const { tokens } = useAuth();
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [apiData, setApiData] = useState<ApiDashboard | null>(null);
  const [extData, setExtData] = useState<ExtendedMetrics | null>(null);
  const [funnelData, setFunnelData] = useState<ActivationFunnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(false);
  const [extLoading, setExtLoading] = useState(false);
  const [funnelLoading, setFunnelLoading] = useState(false);
  const [rangeMinutes, setRangeMinutes] = useState(30 * 1440);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // `days` — günlük-tabanlı eski endpoint'ler için (dashboard/extended/funnel).
  // Saatlik aralık seçildiğinde en az 1 gün'e yuvarlanıyor.
  const daysForLegacy = Math.max(1, Math.ceil(rangeMinutes / 1440));

  // Fetch frontend analytics
  useEffect(() => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    api<AnalyticsDashboard>(`/api/v1/analytics/dashboard?days=${daysForLegacy}`, {
      token: tokens.accessToken,
    })
      .then((res) => {
        if (res.status === 'success' && res.data) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [tokens?.accessToken, daysForLegacy]);

  // Fetch API analytics (lazy — only when tab active)
  useEffect(() => {
    if (activeTab !== 'api' || !tokens?.accessToken || apiData) return;
    setApiLoading(true);
    api<ApiDashboard>(`/api/v1/analytics/api-dashboard?minutes=${rangeMinutes}`, {
      token: tokens.accessToken,
    })
      .then((res) => {
        if (res.status === 'success' && res.data) setApiData(res.data);
      })
      .finally(() => setApiLoading(false));
  }, [tokens?.accessToken, rangeMinutes, activeTab, apiData]);

  // Fetch extended metrics (lazy)
  useEffect(() => {
    if (activeTab !== 'metrics' || !tokens?.accessToken || extData) return;
    setExtLoading(true);
    api<ExtendedMetrics>(`/api/v1/analytics/extended?days=${daysForLegacy}`, {
      token: tokens.accessToken,
    })
      .then((res) => {
        if (res.status === 'success' && res.data) setExtData(res.data);
      })
      .finally(() => setExtLoading(false));
  }, [tokens?.accessToken, daysForLegacy, activeTab, extData]);

  // Fetch activation funnel (lazy)
  useEffect(() => {
    if (activeTab !== 'funnel' || !tokens?.accessToken || funnelData) return;
    setFunnelLoading(true);
    api<ActivationFunnel>(`/api/v1/admin/activation-funnel?days=${daysForLegacy}`, {
      token: tokens.accessToken,
    })
      .then((res) => {
        if (res.status === 'success' && res.data) setFunnelData(res.data);
      })
      .finally(() => setFunnelLoading(false));
  }, [tokens?.accessToken, daysForLegacy, activeTab, funnelData]);

  // Reset lazy data when range changes
  useEffect(() => {
    setApiData(null);
    setExtData(null);
    setFunnelData(null);
  }, [rangeMinutes]);

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Yükleniyor...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-slate-400">Veri yüklenemedi.</div>;
  }

  const maxDailyView = Math.max(...data.dailyViews.map((d) => d.count), 1);
  const totalDevices = data.devices.reduce((s, d) => s + d.count, 0) || 1;
  const totalBrowsers = data.browsers.reduce((s, b) => s + b.count, 0) || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Analitiği"
        desc="Sayfa görüntülemesi, hata takibi, API performansı ve aktivasyon hunisi"
        icon={BarChart3}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
        actions={
          <select
            value={rangeMinutes}
            onChange={(e) => setRangeMinutes(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-[#0d1b2a] px-3 py-2 text-sm font-medium text-slate-200"
          >
            {RANGE_PRESETS.map((p) => (
              <option key={p.minutes} value={p.minutes}>
                {p.label}
              </option>
            ))}
          </select>
        }
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Sayfa Görüntülemesi', value: data.summary.totalPageViews, color: 'text-blue-600' },
          { label: 'Benzersiz Oturum', value: data.summary.uniqueSessions, color: 'text-emerald-600' },
          { label: 'Girişli Kullanıcı', value: data.summary.uniqueUsers, color: 'text-purple-600' },
          { label: 'Ort. Sayfa/Oturum', value: data.summary.avgPagesPerSession, color: 'text-amber-600' },
          { label: 'Toplam Hata', value: data.summary.totalErrors, color: data.summary.totalErrors > 0 ? 'text-red-600' : 'text-slate-500' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm">
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
            <div className="mt-1 text-sm text-slate-400">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-700/50 bg-slate-800 p-1 overflow-x-auto">
        {([
          { key: 'overview', label: 'Genel Bakış' },
          { key: 'pages', label: 'Sayfalar' },
          { key: 'errors', label: `Hatalar (${data.summary.totalErrors})` },
          { key: 'api', label: 'API' },
          { key: 'metrics', label: 'Metrikler' },
          { key: 'funnel', label: 'Aktivasyon Hünisi' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key ? 'bg-[#0d1b2a] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {data.dailyViews.length > 0 && (
            <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-200">Gunluk Sayfa Görüntülemesi</h3>
              <div className="flex items-end gap-1" style={{ height: 160 }}>
                {data.dailyViews.map((d) => (
                  <div key={d.day} className="group relative flex flex-1 flex-col items-center">
                    <div className="absolute -top-6 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
                      {d.count}
                    </div>
                    <div
                      className="w-full rounded-t bg-blue-500/100 transition-all hover:bg-blue-600"
                      style={{ height: `${Math.max((d.count / maxDailyView) * 140, 4)}px` }}
                    />
                    <div className="mt-1 text-[10px] text-slate-500 rotate-[-45deg] origin-top-left whitespace-nowrap">
                      {d.day.slice(5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-200">Cihaz Dağılımı</h3>
              {data.devices.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz veri yok</p>
              ) : (
                <div className="space-y-3">
                  {data.devices.map((d) => {
                    const pct = Math.round((d.count / totalDevices) * 100);
                    return (
                      <div key={d.device}>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-200 capitalize">{d.device}</span>
                          <span className="text-slate-400">{pct}% ({d.count})</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-slate-800">
                          <div className="h-2 rounded-full bg-blue-500/100" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-200">Tarayıcı Dağılımı</h3>
              {data.browsers.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz veri yok</p>
              ) : (
                <div className="space-y-3">
                  {data.browsers.map((b) => {
                    const pct = Math.round((b.count / totalBrowsers) * 100);
                    return (
                      <div key={b.browser}>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-200">{b.browser}</span>
                          <span className="text-slate-400">{pct}% ({b.count})</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-slate-800">
                          <div className="h-2 rounded-full bg-emerald-500/100" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Pages Tab ─── */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-200">Sayfa Görüntülemesi (Toplam)</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/40 border-b border-slate-700/50">
                  <th className="px-6 py-3 text-left font-semibold text-slate-300">Sayfa</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-300">Görüntüleme</th>
                </tr>
              </thead>
              <tbody>
                {data.pageViews.length === 0 ? (
                  <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-500">Henüz veri yok</td></tr>
                ) : data.pageViews.map((p) => (
                  <tr key={p.page} className="border-b border-slate-700/50 hover:bg-slate-800/40">
                    <td className="px-6 py-3 font-mono text-sm text-white">{p.page}</td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-200">{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-200">Ortalama Sayfa Süresi</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/40 border-b border-slate-700/50">
                  <th className="px-6 py-3 text-left font-semibold text-slate-300">Sayfa</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-300">Ort. Süre</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-300">Örneklem</th>
                </tr>
              </thead>
              <tbody>
                {data.avgDurations.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Henüz veri yok</td></tr>
                ) : data.avgDurations.map((p) => {
                  const mins = Math.floor(p.avgSeconds / 60);
                  const secs = p.avgSeconds % 60;
                  const timeStr = mins > 0 ? `${mins}dk ${secs}sn` : `${secs}sn`;
                  return (
                    <tr key={p.page} className="border-b border-slate-700/50 hover:bg-slate-800/40">
                      <td className="px-6 py-3 font-mono text-sm text-white">{p.page}</td>
                      <td className="px-6 py-3 text-right font-medium text-blue-700">{timeStr}</td>
                      <td className="px-6 py-3 text-right text-slate-400">{p.samples}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Errors Tab ─── */}
      {activeTab === 'errors' && (
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-200">Son Frontend Hataları</h3>
          </div>
          {data.recentErrors.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <svg className="h-6 w-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="font-medium text-slate-300">Hata yok!</div>
              <p className="mt-1 text-sm">Son {daysForLegacy} günde hiçbir frontend hatası raporlanmadı.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {data.recentErrors.map((err, idx) => (
                <div key={idx} className="px-6 py-4 hover:bg-slate-800/40">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">HATA</span>
                        <span className="font-mono text-sm text-white">{err.page}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-300">{err.errorMessage || 'Bilinmeyen hata'}</p>
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      <div className="text-xs text-slate-400">{new Date(err.createdAt).toLocaleString('tr-TR')}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {err.browser} / {err.device}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── API Tab ─── */}
      {activeTab === 'api' && (
        <ApiTabContent data={apiData} loading={apiLoading} rangeMinutes={rangeMinutes} />
      )}

      {/* ─── Metrics Tab ─── */}
      {activeTab === 'metrics' && (
        <MetricsTabContent data={extData} loading={extLoading} days={daysForLegacy} />
      )}

      {/* ─── Funnel Tab ─── */}
      {activeTab === 'funnel' && (
        <FunnelTabContent data={funnelData} loading={funnelLoading} days={daysForLegacy} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// API Tab Component
// ═══════════════════════════════════════════════════════════════

function ApiTabContent({ data, loading, rangeMinutes }: { data: ApiDashboard | null; loading: boolean; rangeMinutes: number }) {
  if (loading) return <div className="text-center py-12 text-slate-400">API verileri yükleniyor...</div>;
  if (!data) return <div className="text-center py-12 text-slate-400">API verisi yüklenemedi.</div>;

  const isHourly = data.granularity === 'hour';
  const chartTitle = isHourly ? 'Saatlik API Trafiği' : 'Günlük API Trafiği';
  // Saatlik görünümde x-ekseni "HH:mm", günlükte "MM-DD"
  const formatBucketLabel = (day: string): string => {
    if (isHourly) {
      const dt = new Date(day);
      if (Number.isNaN(dt.getTime())) return day;
      const hh = String(dt.getHours()).padStart(2, '0');
      const mm = String(dt.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return day.slice(5);
  };

  const maxDaily = Math.max(...data.dailyRequests.map((d) => d.count), ...data.dailyErrors.map((d) => d.count), 1);
  const totalMethods = data.methods.reduce((s, m) => s + m.count, 0) || 1;
  const totalCodes = data.statusCodes.reduce((s, c) => s + c.count, 0) || 1;

  // Build daily merged data
  const dayMap = new Map<string, { requests: number; errors: number }>();
  for (const d of data.dailyRequests) dayMap.set(d.day, { requests: d.count, errors: 0 });
  for (const d of data.dailyErrors) {
    const existing = dayMap.get(d.day);
    if (existing) existing.errors = d.count;
    else dayMap.set(d.day, { requests: 0, errors: d.count });
  }
  const dailyMerged = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day, ...v }));

  return (
    <div className="space-y-6">
      {/* API Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">{data.summary.totalRequests.toLocaleString('tr-TR')}</div>
          <div className="mt-1 text-sm text-slate-400">Toplam İstek</div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm">
          <div className={`text-3xl font-bold ${data.summary.totalErrors > 0 ? 'text-red-600' : 'text-slate-500'}`}>
            {data.summary.totalErrors.toLocaleString('tr-TR')}
          </div>
          <div className="mt-1 text-sm text-slate-400">Toplam Hata</div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm">
          <div className={`text-3xl font-bold ${data.summary.errorRate > 5 ? 'text-red-600' : data.summary.errorRate > 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
            %{data.summary.errorRate}
          </div>
          <div className="mt-1 text-sm text-slate-400">Hata Oranı</div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm">
          <div className="text-3xl font-bold text-purple-600">{data.summary.avgResponseTime}ms</div>
          <div className="mt-1 text-sm text-slate-400">Ort. Yanıt Süresi</div>
        </div>
      </div>

      {/* Daily API Chart */}
      {dailyMerged.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">{chartTitle}</h3>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-blue-500/100 inline-block" /> Istek</span>
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-red-400 inline-block" /> Hata</span>
            </div>
          </div>
          <div className="flex items-end gap-1" style={{ height: 160 }}>
            {dailyMerged.map((d) => (
              <div key={d.day} className="group relative flex flex-1 flex-col items-center">
                <div className="absolute -top-6 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block z-10">
                  {d.requests} / {d.errors}
                </div>
                <div className="w-full flex flex-col-reverse">
                  <div
                    className="w-full bg-blue-500/100 transition-all hover:bg-blue-600"
                    style={{ height: `${Math.max((d.requests / maxDaily) * 130, 2)}px` }}
                  />
                  {d.errors > 0 && (
                    <div
                      className="w-full bg-red-400"
                      style={{ height: `${Math.max((d.errors / maxDaily) * 130, 2)}px` }}
                    />
                  )}
                </div>
                <div className="mt-1 text-[10px] text-slate-500 rotate-[-45deg] origin-top-left whitespace-nowrap">
                  {formatBucketLabel(d.day)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Method & Status Code Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">HTTP Method Dağılımı</h3>
          {data.methods.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz veri yok</p>
          ) : (
            <div className="space-y-3">
              {data.methods.map((m) => {
                const pct = Math.round((m.count / totalMethods) * 100);
                const colors: Record<string, string> = {
                  GET: 'bg-blue-500/100', POST: 'bg-emerald-500/100', PATCH: 'bg-amber-500/100',
                  DELETE: 'bg-rose-500/100', PUT: 'bg-violet-500/100',
                };
                return (
                  <div key={m.method}>
                    <div className="flex justify-between text-sm">
                      <span className="font-mono font-semibold text-slate-200">{m.method}</span>
                      <span className="text-slate-400">{pct}% ({m.count.toLocaleString('tr-TR')})</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-slate-800">
                      <div className={`h-2 rounded-full ${colors[m.method || ''] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">Status Code Dağılımı</h3>
          {data.statusCodes.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz veri yok</p>
          ) : (
            <div className="space-y-3">
              {data.statusCodes.map((s) => {
                const pct = Math.round((s.count / totalCodes) * 100);
                const code = parseInt(s.code || '0', 10);
                const color = code >= 500 ? 'bg-rose-500/100' : code >= 400 ? 'bg-amber-500/100' : code >= 300 ? 'bg-blue-400' : 'bg-emerald-500/100';
                return (
                  <div key={s.code}>
                    <div className="flex justify-between text-sm">
                      <span className="font-mono font-semibold text-slate-200">{s.code}</span>
                      <span className="text-slate-400">{pct}% ({s.count.toLocaleString('tr-TR')})</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-slate-800">
                      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Endpoints */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-200">En Çok Kullanılan Endpoint&apos;ler</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/40 border-b border-slate-700/50">
              <th className="px-6 py-3 text-left font-semibold text-slate-300">Endpoint</th>
              <th className="px-6 py-3 text-right font-semibold text-slate-300">Istek</th>
              <th className="px-6 py-3 text-right font-semibold text-slate-300">Ort. Yanıt</th>
            </tr>
          </thead>
          <tbody>
            {data.topEndpoints.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Henüz veri yok</td></tr>
            ) : data.topEndpoints.map((e) => (
              <tr key={e.endpoint} className="border-b border-slate-700/50 hover:bg-slate-800/40">
                <td className="px-6 py-3 font-mono text-sm text-white">{e.endpoint}</td>
                <td className="px-6 py-3 text-right font-semibold text-slate-200">{e.count.toLocaleString('tr-TR')}</td>
                <td className="px-6 py-3 text-right">
                  <span className={`font-medium ${e.avgMs > 500 ? 'text-red-600' : e.avgMs > 200 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {e.avgMs}ms
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slowest Endpoints */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-200">En Yavaş Endpoint&apos;ler</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/40 border-b border-slate-700/50">
              <th className="px-6 py-3 text-left font-semibold text-slate-300">Endpoint</th>
              <th className="px-6 py-3 text-right font-semibold text-slate-300">Ort.</th>
              <th className="px-6 py-3 text-right font-semibold text-slate-300">Maks.</th>
              <th className="px-6 py-3 text-right font-semibold text-slate-300">Örneklem</th>
            </tr>
          </thead>
          <tbody>
            {data.slowEndpoints.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Henüz veri yok</td></tr>
            ) : data.slowEndpoints.map((s) => (
              <tr key={s.endpoint} className="border-b border-slate-700/50 hover:bg-slate-800/40">
                <td className="px-6 py-3 font-mono text-sm text-white">{s.endpoint}</td>
                <td className="px-6 py-3 text-right">
                  <span className={`font-medium ${s.avgMs > 500 ? 'text-red-600' : s.avgMs > 200 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {s.avgMs}ms
                  </span>
                </td>
                <td className="px-6 py-3 text-right font-medium text-slate-200">{s.maxMs}ms</td>
                <td className="px-6 py-3 text-right text-slate-400">{s.samples}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Error Endpoints + Recent Errors */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-200">En Çok Hata Veren Endpoint&apos;ler</h3>
          </div>
          {data.errorEndpoints.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">Hata yok</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/40 border-b border-slate-700/50">
                  <th className="px-6 py-3 text-left font-semibold text-slate-300">Endpoint</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-300">Hata</th>
                </tr>
              </thead>
              <tbody>
                {data.errorEndpoints.map((e) => (
                  <tr key={e.endpoint} className="border-b border-slate-700/50 hover:bg-slate-800/40">
                    <td className="px-6 py-3 font-mono text-sm text-white">{e.endpoint}</td>
                    <td className="px-6 py-3 text-right font-semibold text-red-600">{e.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden max-h-96 overflow-y-auto">
          <div className="px-6 py-4 border-b border-slate-700/50 sticky top-0 bg-[#0d1b2a] z-10">
            <h3 className="text-sm font-semibold text-slate-200">Son API Hataları</h3>
          </div>
          {data.recentErrors.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">Hata yok</div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {data.recentErrors.slice(0, 20).map((err, idx) => (
                <div key={idx} className="px-6 py-3 hover:bg-slate-800/40">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded bg-red-100 px-1.5 py-0.5 font-semibold text-red-700">{err.statusCode}</span>
                    <span className="font-mono font-medium text-slate-200">{err.method}</span>
                    <span className="font-mono text-white truncate">{err.endpoint}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-400">{err.errorMessage || 'Bilinmeyen hata'}</p>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    {new Date(err.createdAt).toLocaleString('tr-TR')}
                    {err.durationMs != null && ` · ${err.durationMs}ms`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Metrics Tab Component
// ═══════════════════════════════════════════════════════════════

function MetricsTabContent({ data, loading, days }: { data: ExtendedMetrics | null; loading: boolean; days: number }) {
  if (loading) return <div className="text-center py-12 text-slate-400">Metrikler yükleniyor...</div>;
  if (!data) return <div className="text-center py-12 text-slate-400">Metrik verisi yüklenemedi.</div>;

  const funnelMax = Math.max(data.funnel.landing, 1);
  const funnelSteps = [
    { key: 'landing', label: 'Ana Sayfa', count: data.funnel.landing, color: 'bg-blue-500/100' },
    { key: 'register', label: 'Kayıt Sayfası', count: data.funnel.register, color: 'bg-emerald-500/100' },
    { key: 'otp', label: 'OTP Doğrulama', count: data.funnel.otp, color: 'bg-amber-500/100' },
    { key: 'dashboard', label: 'Dashboard', count: data.funnel.dashboard, color: 'bg-violet-500/100' },
  ];

  const totalScrolls = data.scrollDepth.reduce((s, d) => s + d.count, 0) || 1;
  const totalReferrerCats = data.referrers.categories.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Top metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Bounce Rate */}
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm">
          <div className={`text-3xl font-bold ${data.bounceRate.rate > 70 ? 'text-red-600' : data.bounceRate.rate > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
            %{data.bounceRate.rate}
          </div>
          <div className="mt-1 text-sm text-slate-400">Bounce Rate (Hemen Çıkma)</div>
          <div className="mt-0.5 text-xs text-slate-500">{data.bounceRate.bounced} / {data.bounceRate.total} oturum</div>
        </div>

        {/* Conversion Rate */}
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm">
          <div className="text-3xl font-bold text-purple-600">%{data.conversionRate.rate}</div>
          <div className="mt-1 text-sm text-slate-400">Dönüşüm Oranı</div>
          <div className="mt-0.5 text-xs text-slate-500">{data.conversionRate.registered} kayıtlı / {data.conversionRate.visitors} ziyaretçi</div>
        </div>

        {/* Total CTA Clicks */}
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">{data.ctaClicks.reduce((s, c) => s + c.count, 0)}</div>
          <div className="mt-1 text-sm text-slate-400">CTA Tıklama</div>
          <div className="mt-0.5 text-xs text-slate-500">{data.ctaClicks.length} farklı CTA</div>
        </div>
      </div>

      {/* Funnel */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-200">Kayıt Akışı (Funnel)</h3>
        <div className="space-y-4">
          {funnelSteps.map((step, idx) => {
            const pct = Math.round((step.count / funnelMax) * 100);
            const dropoff = idx > 0 && funnelSteps[idx - 1].count > 0
              ? Math.round(((funnelSteps[idx - 1].count - step.count) / funnelSteps[idx - 1].count) * 100)
              : 0;
            return (
              <div key={step.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-200">{step.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">{step.count.toLocaleString('tr-TR')}</span>
                    {dropoff > 0 && (
                      <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-xs font-medium text-red-600">
                        -{dropoff}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800">
                  <div className={`h-3 rounded-full ${step.color} transition-all`} style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referrer + Scroll Depth */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Referrer Categories */}
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">Trafik Kaynakları</h3>
          {data.referrers.categories.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz veri yok</p>
          ) : (
            <div className="space-y-3">
              {data.referrers.categories.map((c) => {
                const pct = Math.round((c.count / totalReferrerCats) * 100);
                const colors: Record<string, string> = {
                  'Arama Motoru': 'bg-blue-500/100',
                  'Sosyal Medya': 'bg-pink-500',
                  'Diger Site': 'bg-amber-500/100',
                  'Direkt': 'bg-gray-400',
                };
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-200">{c.category}</span>
                      <span className="text-slate-400">{pct}% ({c.count})</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-slate-800">
                      <div className={`h-2 rounded-full ${colors[c.category] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Top sources */}
          {data.referrers.topSources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <h4 className="text-xs font-semibold text-slate-400 mb-2">En Yüksek Kaynaklar</h4>
              <div className="space-y-1.5">
                {data.referrers.topSources.slice(0, 8).map((s, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-[200px]">{s.source}</span>
                    <span className="text-slate-400 font-medium ml-2">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scroll Depth */}
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">Scroll Derinliği</h3>
          {data.scrollDepth.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz veri yok</p>
          ) : (
            <div className="space-y-4">
              {data.scrollDepth.map((d) => {
                const pct = Math.round((d.count / totalScrolls) * 100);
                return (
                  <div key={d.depth}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-200">{d.depth} kaydirma</span>
                      <span className="text-slate-400">{d.count.toLocaleString('tr-TR')} ({pct}%)</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-800">
                      <div className="h-3 rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CTA Clicks */}
      {data.ctaClicks.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-200">CTA Tıklamalari</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/40 border-b border-slate-700/50">
                <th className="px-6 py-3 text-left font-semibold text-slate-300">Sayfa</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-300">CTA</th>
                <th className="px-6 py-3 text-right font-semibold text-slate-300">Tıklama</th>
              </tr>
            </thead>
            <tbody>
              {data.ctaClicks.map((c, idx) => (
                <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-800/40">
                  <td className="px-6 py-3 font-mono text-sm text-white">{c.page}</td>
                  <td className="px-6 py-3 text-sm text-slate-200">{c.label || '-'}</td>
                  <td className="px-6 py-3 text-right font-semibold text-blue-600">{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Funnel Tab Component
// ═══════════════════════════════════════════════════════════════

const STEP_COLORS = [
  'bg-blue-500/100',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-violet-500/100',
  'bg-emerald-500/100',
];

const STEP_TEXT_COLORS = [
  'text-blue-700',
  'text-indigo-700',
  'text-violet-700',
  'text-purple-700',
  'text-emerald-700',
];

const STEP_BG_LIGHT = [
  'bg-blue-500/10',
  'bg-indigo-50',
  'bg-violet-50',
  'bg-violet-500/10',
  'bg-emerald-500/10',
];

const STEP_BADGE = [
  'bg-blue-100 text-blue-800',
  'bg-indigo-100 text-indigo-800',
  'bg-violet-100 text-violet-800',
  'bg-purple-100 text-purple-800',
  'bg-emerald-100 text-emerald-800',
];

function fmt(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function FunnelTabContent({ data, loading, days }: { data: ActivationFunnel | null; loading: boolean; days: number }) {
  if (loading) return <div className="text-center py-12 text-slate-400">Huni verisi yükleniyor...</div>;
  if (!data) return <div className="text-center py-12 text-slate-400">Huni verisi yüklenemedi.</div>;

  const maxCount = Math.max(...data.steps.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Period info */}
      <p className="text-sm text-slate-400">
        Son <span className="font-semibold">{days} gün</span> içinde kayıt olan kullanıcıların aktivasyon hunisi.
        {' '}Toplam <span className="font-semibold">{data.steps[0].count}</span> kayıt.
      </p>

      {/* Funnel bars */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-2">Adım Bazında Dönüşüm</h3>
        {data.steps.map((step, idx) => {
          const barWidth = maxCount > 0 ? Math.max((step.count / maxCount) * 100, step.count > 0 ? 4 : 0) : 0;
          const dropOff = idx > 0 ? data.steps[idx - 1].count - step.count : 0;
          return (
            <div key={step.step} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${STEP_TEXT_COLORS[idx]}`}>
                  {step.step}. {step.name}
                </span>
                <div className="flex items-center gap-3">
                  {idx > 0 && dropOff > 0 && (
                    <span className="text-xs text-red-500">-{dropOff} kullanıcı terketti</span>
                  )}
                  <span className="font-semibold text-white">{step.count}</span>
                  <span className={`w-12 text-right font-bold ${STEP_TEXT_COLORS[idx]}`}>%{step.rate}</span>
                </div>
              </div>
              <div className="h-8 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${STEP_COLORS[idx]} transition-all`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-5">
        {data.steps.map((step, idx) => (
          <div key={step.step} className={`rounded-xl border border-slate-700/50 p-4 shadow-sm ${STEP_BG_LIGHT[idx]}`}>
            <div className={`text-2xl font-bold ${STEP_TEXT_COLORS[idx]}`}>{step.count}</div>
            <div className="mt-0.5 text-xs font-semibold text-slate-300">{step.name}</div>
            <div className={`mt-1 text-xs font-bold ${STEP_TEXT_COLORS[idx]}`}>%{step.rate}</div>
          </div>
        ))}
      </div>

      {/* Per-user table */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-200">Kullanıcı Bazında Huni Durumu</h3>
        </div>
        {data.users.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-500 text-sm">Bu dönemde kayıt yok.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/40 border-b border-slate-700/50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Kullanıcı</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-300">Mevcut Adım</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-300">Kayıt</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-300">KYC</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-300">Sözleşme</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-300">İmza</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-300">İlk Ödeme</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => {
                  const stepIdx = u.currentStep - 1;
                  const stepLabel = data.steps[stepIdx]?.name ?? '?';
                  return (
                    <tr key={u.userId} className="border-b border-slate-700/50 hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{u.fullName}</div>
                        <div className="text-xs text-slate-500">{u.tcknMasked}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STEP_BADGE[stepIdx] ?? 'bg-slate-800 text-slate-200'}`}>
                          {u.currentStep}. {stepLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-300">{fmt(u.registeredAt)}</td>
                      <td className="px-4 py-3 text-center text-xs">
                        {u.kycCompletedAt
                          ? <span className="text-emerald-600">{fmt(u.kycCompletedAt)}</span>
                          : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {u.contractCreatedAt
                          ? <span className="text-emerald-600">{fmt(u.contractCreatedAt)}</span>
                          : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {u.contractSignedAt
                          ? <span className="text-emerald-600">{fmt(u.contractSignedAt)}</span>
                          : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {u.firstPaymentAt
                          ? <span className="text-emerald-600">{fmt(u.firstPaymentAt)}</span>
                          : <span className="text-slate-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
