'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

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

export default function AdminAnalyticsPage() {
  const { tokens } = useAuth();
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'errors'>('overview');

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
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
        {(['overview', 'pages', 'errors'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'overview' ? 'Genel Bakis' : tab === 'pages' ? 'Sayfalar' : `Hatalar (${data.summary.totalErrors})`}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Daily chart */}
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

          {/* Device & Browser */}
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

      {activeTab === 'pages' && (
        <div className="space-y-6">
          {/* Page views table */}
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

          {/* Avg duration table */}
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

      {activeTab === 'errors' && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Son Hatalar</h3>
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
    </div>
  );
}
