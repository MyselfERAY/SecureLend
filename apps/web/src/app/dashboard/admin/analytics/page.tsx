'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

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

type TabType = 'overview' | 'pages' | 'errors' | 'api' | 'metrics';

export default function AdminAnalyticsPage() {
  const { tokens } = useAuth();
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [apiData, setApiData] = useState<ApiDashboard | null>(null);
  const [extData, setExtData] = useState<ExtendedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(false);
  const [extLoading, setExtLoading] = useState(false);
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Fetch frontend analytics
  useEffect(() => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    api<AnalyticsDashboard>(`/api/v1/analytics/dashboard?days=${days}`, {
      token: tokens.accessToken,
    })
      .then((res) => {
        if (res.status === 'success' && res.data) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [tokens?.accessToken, days]);

  // Fetch API analytics (lazy — only when tab active)
  useEffect(() => {
    if (activeTab !== 'api' || !tokens?.accessToken || apiData) return;
    setApiLoading(true);
    api<ApiDashboard>(`/api/v1/analytics/api-dashboard?days=${days}`, {
      token: tokens.accessToken,
    })
      .then((res) => {
        if (res.status === 'success' && res.data) setApiData(res.data);
      })
      .finally(() => setApiLoading(false));
  }, [tokens?.accessToken, days, activeTab, apiData]);

  // Fetch extended metrics (lazy)
  useEffect(() => {
    if (activeTab !== 'metrics' || !tokens?.accessToken || extData) return;
    setExtLoading(true);
    api<ExtendedMetrics>(`/api/v1/analytics/extended?days=${days}`, {
      token: tokens.accessToken,
    })
      .then((res) => {
        if (res.status === 'success' && res.data) setExtData(res.data);
      })
      .finally(() => setExtLoading(false));
  }, [tokens?.accessToken, days, activeTab, extData]);

  // Reset lazy data when days change
  useEffect(() => {
    setApiData(null);
    setExtData(null);
  }, [days]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Yukleniyor...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">Veri yuklenemedi.</div>;
  }

  const maxDailyView = Math.max(...data.dailyViews.map((d) => d.count), 1);
  const totalDevices = data.devices.reduce((s, d) => s + d.count, 0) || 1;
  const totalBrowsers = data.browsers.reduce((s, b) => s + b.count, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Site Analitigi</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm"
        >
          <option value={7}>Son 7 gun</option>
          <option value={14}>Son 14 gun</option>
          <option value={30}>Son 30 gun</option>
          <option value={90}>Son 90 gun</option>
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Sayfa Goruntulemesi', value: data.summary.totalPageViews, color: 'text-blue-600' },
          { label: 'Benzersiz Oturum', value: data.summary.uniqueSessions, color: 'text-emerald-600' },
          { label: 'Girisli Kullanici', value: data.summary.uniqueUsers, color: 'text-purple-600' },
          { label: 'Ort. Sayfa/Oturum', value: data.summary.avgPagesPerSession, color: 'text-amber-600' },
          { label: 'Toplam Hata', value: data.summary.totalErrors, color: data.summary.totalErrors > 0 ? 'text-red-600' : 'text-gray-400' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
            <div className="mt-1 text-sm text-gray-500">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 overflow-x-auto">
        {([
          { key: 'overview', label: 'Genel Bakis' },
          { key: 'pages', label: 'Sayfalar' },
          { key: 'errors', label: `Hatalar (${data.summary.totalErrors})` },
          { key: 'api', label: 'API' },
          { key: 'metrics', label: 'Metrikler' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
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
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">Gunluk Sayfa Goruntulemesi</h3>
              <div className="flex items-end gap-1" style={{ height: 160 }}>
                {data.dailyViews.map((d) => (
                  <div key={d.day} className="group relative flex flex-1 flex-col items-center">
                    <div className="absolute -top-6 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
                      {d.count}
                    </div>
                    <div
                      className="w-full rounded-t bg-blue-500 transition-all hover:bg-blue-600"
                      style={{ height: `${Math.max((d.count / maxDailyView) * 140, 4)}px` }}
                    />
                    <div className="mt-1 text-[10px] text-gray-400 rotate-[-45deg] origin-top-left whitespace-nowrap">
                      {d.day.slice(5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">Cihaz Dagilimi</h3>
              {data.devices.length === 0 ? (
                <p className="text-sm text-gray-400">Henuz veri yok</p>
              ) : (
                <div className="space-y-3">
                  {data.devices.map((d) => {
                    const pct = Math.round((d.count / totalDevices) * 100);
                    return (
                      <div key={d.device}>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700 capitalize">{d.device}</span>
                          <span className="text-gray-500">{pct}% ({d.count})</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                          <div className="h-2 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">Tarayici Dagilimi</h3>
              {data.browsers.length === 0 ? (
                <p className="text-sm text-gray-400">Henuz veri yok</p>
              ) : (
                <div className="space-y-3">
                  {data.browsers.map((b) => {
                    const pct = Math.round((b.count / totalBrowsers) * 100);
                    return (
                      <div key={b.browser}>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">{b.browser}</span>
                          <span className="text-gray-500">{pct}% ({b.count})</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                          <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
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
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Sayfa Goruntulemesi (Toplam)</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Sayfa</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-600">Goruntuleme</th>
                </tr>
              </thead>
              <tbody>
                {data.pageViews.length === 0 ? (
                  <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-400">Henuz veri yok</td></tr>
                ) : data.pageViews.map((p) => (
                  <tr key={p.page} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-sm text-gray-900">{p.page}</td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-700">{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Ortalama Sayfa Suresi</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Sayfa</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-600">Ort. Sure</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-600">Orneklem</th>
                </tr>
              </thead>
              <tbody>
                {data.avgDurations.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">Henuz veri yok</td></tr>
                ) : data.avgDurations.map((p) => {
                  const mins = Math.floor(p.avgSeconds / 60);
                  const secs = p.avgSeconds % 60;
                  const timeStr = mins > 0 ? `${mins}dk ${secs}sn` : `${secs}sn`;
                  return (
                    <tr key={p.page} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-sm text-gray-900">{p.page}</td>
                      <td className="px-6 py-3 text-right font-medium text-blue-700">{timeStr}</td>
                      <td className="px-6 py-3 text-right text-gray-500">{p.samples}</td>
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
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Son Frontend Hatalari</h3>
          </div>
          {data.recentErrors.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <svg className="h-6 w-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="font-medium text-gray-600">Hata yok!</div>
              <p className="mt-1 text-sm">Son {days} gunde hicbir frontend hatasi raporlanmadi.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.recentErrors.map((err, idx) => (
                <div key={idx} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">HATA</span>
                        <span className="font-mono text-sm text-gray-900">{err.page}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-gray-600">{err.errorMessage || 'Bilinmeyen hata'}</p>
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      <div className="text-xs text-gray-500">{new Date(err.createdAt).toLocaleString('tr-TR')}</div>
                      <div className="mt-0.5 text-xs text-gray-400">
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
        <ApiTabContent data={apiData} loading={apiLoading} days={days} />
      )}

      {/* ─── Metrics Tab ─── */}
      {activeTab === 'metrics' && (
        <MetricsTabContent data={extData} loading={extLoading} days={days} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// API Tab Component
// ═══════════════════════════════════════════════════════════════

function ApiTabContent({ data, loading, days }: { data: ApiDashboard | null; loading: boolean; days: number }) {
  if (loading) return <div className="text-center py-12 text-gray-500">API verileri yukleniyor...</div>;
  if (!data) return <div className="text-center py-12 text-gray-500">API verisi yuklenemedi.</div>;

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
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">{data.summary.totalRequests.toLocaleString('tr-TR')}</div>
          <div className="mt-1 text-sm text-gray-500">Toplam Istek</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className={`text-3xl font-bold ${data.summary.totalErrors > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {data.summary.totalErrors.toLocaleString('tr-TR')}
          </div>
          <div className="mt-1 text-sm text-gray-500">Toplam Hata</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className={`text-3xl font-bold ${data.summary.errorRate > 5 ? 'text-red-600' : data.summary.errorRate > 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
            %{data.summary.errorRate}
          </div>
          <div className="mt-1 text-sm text-gray-500">Hata Orani</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-3xl font-bold text-purple-600">{data.summary.avgResponseTime}ms</div>
          <div className="mt-1 text-sm text-gray-500">Ort. Yanit Suresi</div>
        </div>
      </div>

      {/* Daily API Chart */}
      {dailyMerged.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Gunluk API Trafigi</h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-blue-500 inline-block" /> Istek</span>
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
                    className="w-full bg-blue-500 transition-all hover:bg-blue-600"
                    style={{ height: `${Math.max((d.requests / maxDaily) * 130, 2)}px` }}
                  />
                  {d.errors > 0 && (
                    <div
                      className="w-full bg-red-400"
                      style={{ height: `${Math.max((d.errors / maxDaily) * 130, 2)}px` }}
                    />
                  )}
                </div>
                <div className="mt-1 text-[10px] text-gray-400 rotate-[-45deg] origin-top-left whitespace-nowrap">
                  {d.day.slice(5)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Method & Status Code Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">HTTP Method Dagilimi</h3>
          {data.methods.length === 0 ? (
            <p className="text-sm text-gray-400">Henuz veri yok</p>
          ) : (
            <div className="space-y-3">
              {data.methods.map((m) => {
                const pct = Math.round((m.count / totalMethods) * 100);
                const colors: Record<string, string> = {
                  GET: 'bg-blue-500', POST: 'bg-emerald-500', PATCH: 'bg-amber-500',
                  DELETE: 'bg-red-500', PUT: 'bg-purple-500',
                };
                return (
                  <div key={m.method}>
                    <div className="flex justify-between text-sm">
                      <span className="font-mono font-semibold text-gray-700">{m.method}</span>
                      <span className="text-gray-500">{pct}% ({m.count.toLocaleString('tr-TR')})</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                      <div className={`h-2 rounded-full ${colors[m.method || ''] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Status Code Dagilimi</h3>
          {data.statusCodes.length === 0 ? (
            <p className="text-sm text-gray-400">Henuz veri yok</p>
          ) : (
            <div className="space-y-3">
              {data.statusCodes.map((s) => {
                const pct = Math.round((s.count / totalCodes) * 100);
                const code = parseInt(s.code || '0', 10);
                const color = code >= 500 ? 'bg-red-500' : code >= 400 ? 'bg-amber-500' : code >= 300 ? 'bg-blue-400' : 'bg-emerald-500';
                return (
                  <div key={s.code}>
                    <div className="flex justify-between text-sm">
                      <span className="font-mono font-semibold text-gray-700">{s.code}</span>
                      <span className="text-gray-500">{pct}% ({s.count.toLocaleString('tr-TR')})</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
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
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">En Cok Kullanilan Endpoint&apos;ler</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Endpoint</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-600">Istek</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-600">Ort. Yanit</th>
            </tr>
          </thead>
          <tbody>
            {data.topEndpoints.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">Henuz veri yok</td></tr>
            ) : data.topEndpoints.map((e) => (
              <tr key={e.endpoint} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-3 font-mono text-sm text-gray-900">{e.endpoint}</td>
                <td className="px-6 py-3 text-right font-semibold text-gray-700">{e.count.toLocaleString('tr-TR')}</td>
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
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">En Yavas Endpoint&apos;ler</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Endpoint</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-600">Ort.</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-600">Maks.</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-600">Orneklem</th>
            </tr>
          </thead>
          <tbody>
            {data.slowEndpoints.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Henuz veri yok</td></tr>
            ) : data.slowEndpoints.map((s) => (
              <tr key={s.endpoint} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-3 font-mono text-sm text-gray-900">{s.endpoint}</td>
                <td className="px-6 py-3 text-right">
                  <span className={`font-medium ${s.avgMs > 500 ? 'text-red-600' : s.avgMs > 200 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {s.avgMs}ms
                  </span>
                </td>
                <td className="px-6 py-3 text-right font-medium text-gray-700">{s.maxMs}ms</td>
                <td className="px-6 py-3 text-right text-gray-500">{s.samples}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Error Endpoints + Recent Errors */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">En Cok Hata Veren Endpoint&apos;ler</h3>
          </div>
          {data.errorEndpoints.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400">Hata yok</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Endpoint</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-600">Hata</th>
                </tr>
              </thead>
              <tbody>
                {data.errorEndpoints.map((e) => (
                  <tr key={e.endpoint} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-sm text-gray-900">{e.endpoint}</td>
                    <td className="px-6 py-3 text-right font-semibold text-red-600">{e.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden max-h-96 overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h3 className="text-sm font-semibold text-gray-700">Son API Hatalari</h3>
          </div>
          {data.recentErrors.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400">Hata yok</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.recentErrors.slice(0, 20).map((err, idx) => (
                <div key={idx} className="px-6 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded bg-red-100 px-1.5 py-0.5 font-semibold text-red-700">{err.statusCode}</span>
                    <span className="font-mono font-medium text-gray-700">{err.method}</span>
                    <span className="font-mono text-gray-900 truncate">{err.endpoint}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-500">{err.errorMessage || 'Bilinmeyen hata'}</p>
                  <div className="mt-0.5 text-[10px] text-gray-400">
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
  if (loading) return <div className="text-center py-12 text-gray-500">Metrikler yukleniyor...</div>;
  if (!data) return <div className="text-center py-12 text-gray-500">Metrik verisi yuklenemedi.</div>;

  const funnelMax = Math.max(data.funnel.landing, 1);
  const funnelSteps = [
    { key: 'landing', label: 'Ana Sayfa', count: data.funnel.landing, color: 'bg-blue-500' },
    { key: 'register', label: 'Kayit Sayfasi', count: data.funnel.register, color: 'bg-emerald-500' },
    { key: 'otp', label: 'OTP Dogrulama', count: data.funnel.otp, color: 'bg-amber-500' },
    { key: 'dashboard', label: 'Dashboard', count: data.funnel.dashboard, color: 'bg-purple-500' },
  ];

  const totalScrolls = data.scrollDepth.reduce((s, d) => s + d.count, 0) || 1;
  const totalReferrerCats = data.referrers.categories.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Top metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Bounce Rate */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className={`text-3xl font-bold ${data.bounceRate.rate > 70 ? 'text-red-600' : data.bounceRate.rate > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
            %{data.bounceRate.rate}
          </div>
          <div className="mt-1 text-sm text-gray-500">Bounce Rate (Hemen Cikma)</div>
          <div className="mt-0.5 text-xs text-gray-400">{data.bounceRate.bounced} / {data.bounceRate.total} oturum</div>
        </div>

        {/* Conversion Rate */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-3xl font-bold text-purple-600">%{data.conversionRate.rate}</div>
          <div className="mt-1 text-sm text-gray-500">Donusum Orani</div>
          <div className="mt-0.5 text-xs text-gray-400">{data.conversionRate.registered} kayitli / {data.conversionRate.visitors} ziyaretci</div>
        </div>

        {/* Total CTA Clicks */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">{data.ctaClicks.reduce((s, c) => s + c.count, 0)}</div>
          <div className="mt-1 text-sm text-gray-500">CTA Tiklama</div>
          <div className="mt-0.5 text-xs text-gray-400">{data.ctaClicks.length} farkli CTA</div>
        </div>
      </div>

      {/* Funnel */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Kayit Akisi (Funnel)</h3>
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
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-700">{step.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{step.count.toLocaleString('tr-TR')}</span>
                    {dropoff > 0 && (
                      <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
                        -{dropoff}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100">
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
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Trafik Kaynaklari</h3>
          {data.referrers.categories.length === 0 ? (
            <p className="text-sm text-gray-400">Henuz veri yok</p>
          ) : (
            <div className="space-y-3">
              {data.referrers.categories.map((c) => {
                const pct = Math.round((c.count / totalReferrerCats) * 100);
                const colors: Record<string, string> = {
                  'Arama Motoru': 'bg-blue-500',
                  'Sosyal Medya': 'bg-pink-500',
                  'Diger Site': 'bg-amber-500',
                  'Direkt': 'bg-gray-400',
                };
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{c.category}</span>
                      <span className="text-gray-500">{pct}% ({c.count})</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                      <div className={`h-2 rounded-full ${colors[c.category] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Top sources */}
          {data.referrers.topSources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 mb-2">En Yuksek Kaynaklar</h4>
              <div className="space-y-1.5">
                {data.referrers.topSources.slice(0, 8).map((s, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-600 truncate max-w-[200px]">{s.source}</span>
                    <span className="text-gray-500 font-medium ml-2">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scroll Depth */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Scroll Derinligi</h3>
          {data.scrollDepth.length === 0 ? (
            <p className="text-sm text-gray-400">Henuz veri yok</p>
          ) : (
            <div className="space-y-4">
              {data.scrollDepth.map((d) => {
                const pct = Math.round((d.count / totalScrolls) * 100);
                return (
                  <div key={d.depth}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{d.depth} kaydirma</span>
                      <span className="text-gray-500">{d.count.toLocaleString('tr-TR')} ({pct}%)</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-100">
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
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">CTA Tiklamalari</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Sayfa</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">CTA</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-600">Tiklama</th>
              </tr>
            </thead>
            <tbody>
              {data.ctaClicks.map((c, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-sm text-gray-900">{c.page}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{c.label || '-'}</td>
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
