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
  // Yeni alanlar opsiyonel — backend henüz deploy olmamışsa frontend kırılmaz.
  window?: { since: string; until: string; days: number };
  pageViews: { page: string; count: number }[];
  topPages: { page: string; sessions: number }[];
  avgDurations: { page: string; avgSeconds: number; samples: number }[];
  devices: { device: string; count: number }[];
  browsers: { browser: string; count: number }[];
  operatingSystems?: { os: string | null; count: number }[];
  trafficSources?: {
    categories: { category: string; count: number }[];
    topSources: { source: string; count: number }[];
  };
  hourly?: { hour: number; count: number }[];
  screenSizes?: { bucket: string; count: number }[];
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

interface ApiErrorDetail {
  window: { from: string | null; to: string | null };
  topEndpoints: { endpoint: string; count: number }[];
  events: {
    endpoint: string;
    method: string | null;
    statusCode: string | null;
    errorMessage: string | null;
    userId: string | null;
    ip: string | null;
    durationMs: number | null;
    createdAt: string;
  }[];
  truncated?: boolean;
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

// Trafik kaynağı kategorileri için renk eşlemesi (backend kategori string'leriyle uyumlu)
const REFERRER_COLORS: Record<string, string> = {
  'Arama Motoru': 'bg-blue-500/100',
  'Sosyal Medya': 'bg-pink-500',
  'Diğer Site': 'bg-amber-500/100',
  'Direkt': 'bg-slate-400',
};

// Cihaz tipi için okunaklı Türkçe etiketler
const DEVICE_LABELS: Record<string, string> = {
  desktop: 'Masaüstü',
  mobile: 'Mobil',
  tablet: 'Tablet',
};

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

  // Seçili aralığın gerçek tarih penceresi — "hangi tarihler arası" görünür olsun.
  const activeRangeLabel = RANGE_PRESETS.find((p) => p.minutes === rangeMinutes)?.label ?? '';
  const windowLabel = data.window
    ? `${new Date(data.window.since).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} – ${new Date(data.window.until).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Analitiği"
        desc="Sayfa görüntülemesi, hata takibi, API performansı ve aktivasyon hunisi"
        icon={BarChart3}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
        actions={
          <div className="flex items-center gap-2">
            <ResetEventsButton
              onReset={() => {
                // Verileri zorla yenile
                setApiData(null);
                setExtData(null);
                setFunnelData(null);
                setLoading(true);
                if (tokens?.accessToken) {
                  api<AnalyticsDashboard>(`/api/v1/analytics/dashboard?days=${daysForLegacy}`, {
                    token: tokens.accessToken,
                  })
                    .then((res) => {
                      if (res.status === 'success' && res.data) setData(res.data);
                    })
                    .finally(() => setLoading(false));
                }
              }}
            />
            <select
              value={rangeMinutes}
              onChange={(e) => setRangeMinutes(Number(e.target.value))}
              className="rounded-lg border border-slate-700 bg-[#0d1b2a] px-3 py-2 text-sm font-medium text-slate-200 transition-colors duration-200 focus:outline-none focus:border-blue-500"
            >
              {RANGE_PRESETS.map((p) => (
                <option key={p.minutes} value={p.minutes}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Aktif tarih penceresi — kullanıcı hangi aralığı gördüğünü net anlasın */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-700/50 bg-[#0d1b2a] px-4 py-3 text-sm">
        <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="font-semibold text-slate-200">{activeRangeLabel}</span>
        {windowLabel && (
          <>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">{windowLabel}</span>
          </>
        )}
        <span className="ml-auto text-xs text-slate-500">Tüm saatler Türkiye saatine (UTC+3) göredir</span>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Sayfa Görüntülemesi', value: data.summary.totalPageViews, color: 'text-blue-400', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
          { label: 'Benzersiz Oturum', value: data.summary.uniqueSessions, color: 'text-emerald-400', icon: 'M9 17v-2a4 4 0 014-4h4M3 11h2a2 2 0 002-2V7a2 2 0 00-2-2H3m0 6v6a2 2 0 002 2h2' },
          { label: 'Girişli Kullanıcı', value: data.summary.uniqueUsers, color: 'text-violet-400', icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z' },
          { label: 'Ort. Sayfa/Oturum', value: data.summary.avgPagesPerSession, color: 'text-amber-400', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { label: 'Toplam Hata', value: data.summary.totalErrors, color: data.summary.totalErrors > 0 ? 'text-rose-400' : 'text-slate-500', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
        ].map((card, i) => (
          <div
            key={card.label}
            className="group animate-fade-up rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-[#112240]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className={`font-display text-3xl font-bold ${card.color}`}>
                {typeof card.value === 'number' ? card.value.toLocaleString('tr-TR') : card.value}
              </div>
              <svg className={`h-5 w-5 opacity-40 transition-transform duration-300 group-hover:scale-110 ${card.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={card.icon} />
              </svg>
            </div>
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
          { key: 'funnel', label: 'Aktivasyon Hunisi' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
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
            <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
              <h3 className="mb-4 text-sm font-semibold text-slate-200">Günlük Sayfa Görüntülemesi</h3>
              <div className="flex items-end gap-1" style={{ height: 160 }}>
                {data.dailyViews.map((d) => (
                  <div key={d.day} className="group relative flex flex-1 flex-col items-center">
                    <div className="absolute -top-6 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block z-10">
                      {d.count.toLocaleString('tr-TR')}
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

          {/* Saat bazlı ziyaret dağılımı — günün hangi saatlerinde yoğun */}
          <HourlyChart hourly={data.hourly} />

          {/* Trafik kaynağı + En popüler sayfalar */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
              <h3 className="mb-1 text-sm font-semibold text-slate-200">Trafik Kaynağı</h3>
              <p className="mb-4 text-xs text-slate-500">Ziyaretçiler siteye nereden geldi</p>
              {!data.trafficSources || data.trafficSources.categories.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz veri yok</p>
              ) : (
                <>
                  <Breakdown
                    items={data.trafficSources.categories.map((c) => ({ label: c.category, count: c.count }))}
                    colorFor={(label) => REFERRER_COLORS[label] || 'bg-slate-400'}
                  />
                  {data.trafficSources.topSources.length > 0 && (
                    <div className="mt-4 border-t border-slate-700/50 pt-4">
                      <h4 className="mb-2 text-xs font-semibold text-slate-400">En Yüksek Kaynaklar</h4>
                      <div className="space-y-1.5">
                        {data.trafficSources.topSources.map((s, i) => (
                          <div key={i} className="flex justify-between gap-2 text-xs">
                            <span className="truncate text-slate-300" title={s.source}>{s.source}</span>
                            <span className="ml-2 shrink-0 font-medium text-slate-400">{s.count.toLocaleString('tr-TR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
              <h3 className="mb-1 text-sm font-semibold text-slate-200">En Popüler Sayfalar</h3>
              <p className="mb-4 text-xs text-slate-500">Benzersiz ziyaretçi (oturum) sayısına göre</p>
              {data.topPages.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz veri yok</p>
              ) : (
                <div className="space-y-2">
                  {data.topPages.slice(0, 8).map((p, i) => {
                    const maxSessions = Math.max(...data.topPages.map((x) => x.sessions), 1);
                    const pct = Math.round((p.sessions / maxSessions) * 100);
                    return (
                      <div key={p.page} className="flex items-center gap-3">
                        <span className="w-5 shrink-0 text-right text-xs font-semibold text-slate-500">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-mono text-xs text-slate-200" title={p.page}>{p.page}</span>
                            <span className="shrink-0 text-xs font-semibold text-slate-300">{p.sessions.toLocaleString('tr-TR')}</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
                            <div className="h-1.5 rounded-full bg-blue-500/80" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cihaz / Tarayıcı / İşletim Sistemi */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
              <h3 className="mb-4 text-sm font-semibold text-slate-200">Cihaz Dağılımı</h3>
              {data.devices.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz veri yok</p>
              ) : (
                <Breakdown
                  items={data.devices.map((d) => ({ label: DEVICE_LABELS[d.device ?? ''] || d.device || '—', count: d.count }))}
                  total={totalDevices}
                  barColor="bg-blue-500/100"
                />
              )}
            </div>

            <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
              <h3 className="mb-4 text-sm font-semibold text-slate-200">Tarayıcı Dağılımı</h3>
              {data.browsers.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz veri yok</p>
              ) : (
                <Breakdown
                  items={data.browsers.map((b) => ({ label: b.browser || '—', count: b.count }))}
                  total={totalBrowsers}
                  barColor="bg-emerald-500/100"
                />
              )}
            </div>

            <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
              <h3 className="mb-4 text-sm font-semibold text-slate-200">İşletim Sistemi</h3>
              {!data.operatingSystems || data.operatingSystems.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz veri yok</p>
              ) : (
                <Breakdown
                  items={data.operatingSystems.map((o) => ({ label: o.os || '—', count: o.count }))}
                  barColor="bg-violet-500/100"
                />
              )}
            </div>
          </div>

          {/* Ekran boyutu dağılımı */}
          {data.screenSizes && data.screenSizes.length > 0 && (
            <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
              <h3 className="mb-1 text-sm font-semibold text-slate-200">Ekran Boyutu</h3>
              <p className="mb-4 text-xs text-slate-500">Ziyaretçilerin ekran/pencere genişliği</p>
              <Breakdown
                items={data.screenSizes.map((s) => ({ label: s.bucket, count: s.count }))}
                barColor="bg-amber-500/100"
              />
            </div>
          )}
        </div>
      )}

      {/* ─── Pages Tab ─── */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden transition-colors duration-300 hover:border-slate-600/60">
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
                  <tr key={p.page} className="border-b border-slate-700/50 transition-colors duration-150 hover:bg-blue-500/[0.06]">
                    <td className="px-6 py-3 font-mono text-sm text-white">{p.page}</td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-200">{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden transition-colors duration-300 hover:border-slate-600/60">
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
                    <tr key={p.page} className="border-b border-slate-700/50 transition-colors duration-150 hover:bg-blue-500/[0.06]">
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
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden transition-colors duration-300 hover:border-slate-600/60">
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
                <div key={idx} className="px-6 py-4 transition-colors duration-150 hover:bg-blue-500/[0.06]">
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
// Yatay-bar dağılım listesi (cihaz/tarayıcı/OS/ekran/trafik için ortak)
// ═══════════════════════════════════════════════════════════════

function Breakdown({
  items,
  total,
  barColor = 'bg-blue-500/100',
  colorFor,
}: {
  items: { label: string; count: number }[];
  total?: number;
  barColor?: string;
  colorFor?: (label: string) => string;
}) {
  const sum = total ?? (items.reduce((s, i) => s + i.count, 0) || 1);
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = Math.round((item.count / sum) * 100);
        return (
          <div key={item.label}>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-200">{item.label}</span>
              <span className="text-slate-400">
                {pct}% <span className="text-slate-500">({item.count.toLocaleString('tr-TR')})</span>
              </span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-slate-800">
              <div
                className={`h-2 rounded-full ${colorFor ? colorFor(item.label) : barColor} transition-all`}
                style={{ width: `${Math.max(pct, 1)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Saat bazlı ziyaret grafiği (0–23, Türkiye saati) + yoğun saat vurgusu
// ═══════════════════════════════════════════════════════════════

function HourlyChart({ hourly }: { hourly?: { hour: number; count: number }[] }) {
  if (!hourly || hourly.length === 0) return null;

  // 0–23 tüm saatleri doldur (eksik saatler 0 olsun ki grafik tutarlı görünsün)
  const byHour = new Map(hourly.map((h) => [h.hour, h.count]));
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: byHour.get(h) || 0 }));
  const max = Math.max(...hours.map((h) => h.count), 1);
  const peak = hours.reduce((a, b) => (b.count > a.count ? b : a), hours[0]);
  const totalVisits = hours.reduce((s, h) => s + h.count, 0);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Ziyaret Saatleri</h3>
          <p className="mt-0.5 text-xs text-slate-500">Günün hangi saatlerinde ziyaret ediliyor (Türkiye saati)</p>
        </div>
        {totalVisits > 0 && (
          <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300">
            En yoğun: {String(peak.hour).padStart(2, '0')}:00 ({peak.count.toLocaleString('tr-TR')})
          </span>
        )}
      </div>
      <div className="flex items-end gap-0.5" style={{ height: 140 }}>
        {hours.map((h) => {
          const isPeak = h.hour === peak.hour && h.count > 0;
          return (
            <div key={h.hour} className="group relative flex flex-1 flex-col items-center">
              <div className="absolute -top-6 hidden whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block z-10">
                {String(h.hour).padStart(2, '0')}:00 — {h.count.toLocaleString('tr-TR')}
              </div>
              <div
                className={`w-full rounded-t transition-all ${isPeak ? 'bg-blue-400' : 'bg-blue-500/60 group-hover:bg-blue-500'}`}
                style={{ height: `${Math.max((h.count / max) * 120, h.count > 0 ? 4 : 1)}px` }}
              />
              {h.hour % 3 === 0 && (
                <div className="mt-1 text-[9px] text-slate-500">{String(h.hour).padStart(2, '0')}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// API Tab Component
// ═══════════════════════════════════════════════════════════════

function ApiTabContent({ data, loading, rangeMinutes: _rangeMinutes }: { data: ApiDashboard | null; loading: boolean; rangeMinutes: number }) {
  const { tokens } = useAuth();
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [bucketDetail, setBucketDetail] = useState<ApiErrorDetail | null>(null);
  const [bucketLoading, setBucketLoading] = useState(false);

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

  // Bar'a tıklandığında bucket (saat / gün) aralığını hesapla + detayı çek.
  const handleBucketClick = (day: string) => {
    if (!tokens?.accessToken) return;
    // Aynı bar'a tekrar tıklandıysa paneli kapat
    if (selectedBucket === day) {
      setSelectedBucket(null);
      setBucketDetail(null);
      return;
    }
    let from: Date;
    let to: Date;
    if (isHourly) {
      from = new Date(day);
      if (Number.isNaN(from.getTime())) return;
      to = new Date(from.getTime() + 60 * 60 * 1000);
    } else {
      // Beklenen format "YYYY-MM-DD". Önce regex ile doğrula;
      // backend bozuk string (ör. "Fri Apr 17") dönerse Date(day) fallback dene.
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
      if (match) {
        const [, ys, ms, ds] = match;
        from = new Date(Number(ys), Number(ms) - 1, Number(ds), 0, 0, 0, 0);
      } else {
        const fallback = new Date(day);
        if (Number.isNaN(fallback.getTime())) return;
        from = new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate(), 0, 0, 0, 0);
      }
      if (Number.isNaN(from.getTime())) return;
      to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    }
    setSelectedBucket(day);
    setBucketDetail(null);
    setBucketLoading(true);
    api<ApiErrorDetail>(
      `/api/v1/analytics/api-errors?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&limit=50`,
      { token: tokens.accessToken },
    )
      .then((res) => {
        if (res.status === 'success' && res.data) setBucketDetail(res.data);
      })
      .finally(() => setBucketLoading(false));
  };

  const formatBucketTitle = (day: string): string => {
    if (isHourly) {
      const dt = new Date(day);
      if (Number.isNaN(dt.getTime())) return day;
      return dt.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return day;
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
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
          <div className="text-3xl font-bold text-blue-600">{data.summary.totalRequests.toLocaleString('tr-TR')}</div>
          <div className="mt-1 text-sm text-slate-400">Toplam İstek</div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
          <div className={`text-3xl font-bold ${data.summary.totalErrors > 0 ? 'text-red-600' : 'text-slate-500'}`}>
            {data.summary.totalErrors.toLocaleString('tr-TR')}
          </div>
          <div className="mt-1 text-sm text-slate-400">Toplam Hata</div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
          <div className={`text-3xl font-bold ${data.summary.errorRate > 5 ? 'text-red-600' : data.summary.errorRate > 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
            %{data.summary.errorRate}
          </div>
          <div className="mt-1 text-sm text-slate-400">Hata Oranı</div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
          <div className="text-3xl font-bold text-purple-600">{data.summary.avgResponseTime}ms</div>
          <div className="mt-1 text-sm text-slate-400">Ort. Yanıt Süresi</div>
        </div>
      </div>

      {/* Daily API Chart — bar'a tıklayınca altta detay paneli açılır */}
      {dailyMerged.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">{chartTitle}</h3>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-blue-500/100 inline-block" /> İstek</span>
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-red-400 inline-block" /> Hata</span>
              <span className="text-slate-500">• Detay için bara tıkla</span>
            </div>
          </div>
          <div className="flex items-end gap-1" style={{ height: 160 }}>
            {dailyMerged.map((d) => {
              const isSelected = selectedBucket === d.day;
              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => handleBucketClick(d.day)}
                  className={`group relative flex flex-1 flex-col items-center cursor-pointer focus:outline-none ${
                    isSelected ? 'ring-2 ring-blue-400 rounded-sm' : ''
                  }`}
                >
                  <div className="absolute -top-6 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block z-10">
                    {d.requests} / {d.errors}
                  </div>
                  <div className="w-full flex flex-col-reverse">
                    <div
                      className="w-full bg-blue-500/100 transition-all group-hover:bg-blue-600"
                      style={{ height: `${Math.max((d.requests / maxDaily) * 130, 2)}px` }}
                    />
                    {d.errors > 0 && (
                      <div
                        className="w-full bg-red-400 group-hover:bg-red-500"
                        style={{ height: `${Math.max((d.errors / maxDaily) * 130, 2)}px` }}
                      />
                    )}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 rotate-[-45deg] origin-top-left whitespace-nowrap">
                    {formatBucketLabel(d.day)}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedBucket && (
            <div className="mt-6 border-t border-slate-700/50 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-200">
                  {formatBucketTitle(selectedBucket)} — hata detayı
                </h4>
                <button
                  type="button"
                  onClick={() => { setSelectedBucket(null); setBucketDetail(null); }}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Kapat ✕
                </button>
              </div>

              {bucketLoading ? (
                <p className="text-sm text-slate-500">Detay yükleniyor...</p>
              ) : !bucketDetail ? (
                <p className="text-sm text-slate-500">Detay yüklenemedi.</p>
              ) : bucketDetail.truncated ? (
                <p className="text-sm text-amber-500">
                  Seçilen aralık 7 günden büyük — detay gösterilmiyor. Daha kısa bir preset seç.
                </p>
              ) : bucketDetail.events.length === 0 ? (
                <p className="text-sm text-emerald-500">Bu bucket'ta API hatası yok. ✨</p>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Top error endpoints */}
                  <div>
                    <div className="text-xs font-semibold text-slate-400 mb-2">
                      En Çok Hata Veren Endpoint'ler
                    </div>
                    <div className="rounded-lg border border-slate-700/40 bg-slate-900/40 divide-y divide-slate-700/40">
                      {bucketDetail.topEndpoints.map((e) => (
                        <div key={e.endpoint} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="font-mono text-slate-200 truncate">{e.endpoint}</span>
                          <span className="ml-2 rounded-full bg-red-500/20 text-red-400 px-2 py-0.5 text-xs font-semibold">
                            {e.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Son hata event'leri */}
                  <div>
                    <div className="text-xs font-semibold text-slate-400 mb-2">
                      Son Hatalar ({bucketDetail.events.length})
                    </div>
                    <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-700/40 bg-slate-900/40 divide-y divide-slate-700/40">
                      {bucketDetail.events.map((ev, idx) => (
                        <div key={idx} className="px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="rounded bg-red-500/20 text-red-400 px-1.5 py-0.5 font-mono">
                              {ev.statusCode || '???'}
                            </span>
                            <span className="font-mono text-slate-400">{ev.method}</span>
                            <span className="font-mono text-slate-200 truncate">{ev.endpoint}</span>
                          </div>
                          {ev.errorMessage && (
                            <div className="text-slate-400 italic truncate">{ev.errorMessage}</div>
                          )}
                          <div className="mt-1 text-[10px] text-slate-500">
                            {new Date(ev.createdAt).toLocaleString('tr-TR')}
                            {ev.userId ? ` • user ${ev.userId.slice(0, 8)}` : ' • anonim'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Method & Status Code Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
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

        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
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
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden transition-colors duration-300 hover:border-slate-600/60">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-200">En Çok Kullanılan Endpoint&apos;ler</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/40 border-b border-slate-700/50">
              <th className="px-6 py-3 text-left font-semibold text-slate-300">Endpoint</th>
              <th className="px-6 py-3 text-right font-semibold text-slate-300">İstek</th>
              <th className="px-6 py-3 text-right font-semibold text-slate-300">Ort. Yanıt</th>
            </tr>
          </thead>
          <tbody>
            {data.topEndpoints.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Henüz veri yok</td></tr>
            ) : data.topEndpoints.map((e) => (
              <tr key={e.endpoint} className="border-b border-slate-700/50 transition-colors duration-150 hover:bg-blue-500/[0.06]">
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
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden transition-colors duration-300 hover:border-slate-600/60">
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
              <tr key={s.endpoint} className="border-b border-slate-700/50 transition-colors duration-150 hover:bg-blue-500/[0.06]">
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
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden transition-colors duration-300 hover:border-slate-600/60">
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
                  <tr key={e.endpoint} className="border-b border-slate-700/50 transition-colors duration-150 hover:bg-blue-500/[0.06]">
                    <td className="px-6 py-3 font-mono text-sm text-white">{e.endpoint}</td>
                    <td className="px-6 py-3 text-right font-semibold text-red-600">{e.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden max-h-96 overflow-y-auto transition-colors duration-300 hover:border-slate-600/60">
          <div className="px-6 py-4 border-b border-slate-700/50 sticky top-0 bg-[#0d1b2a] z-10">
            <h3 className="text-sm font-semibold text-slate-200">Son API Hataları</h3>
          </div>
          {data.recentErrors.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">Hata yok</div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {data.recentErrors.slice(0, 20).map((err, idx) => (
                <div key={idx} className="px-6 py-3 transition-colors duration-150 hover:bg-blue-500/[0.06]">
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
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
          <div className={`text-3xl font-bold ${data.bounceRate.rate > 70 ? 'text-red-600' : data.bounceRate.rate > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
            %{data.bounceRate.rate}
          </div>
          <div className="mt-1 text-sm text-slate-400">Bounce Rate (Hemen Çıkma)</div>
          <div className="mt-0.5 text-xs text-slate-500">{data.bounceRate.bounced} / {data.bounceRate.total} oturum</div>
        </div>

        {/* Conversion Rate */}
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
          <div className="text-3xl font-bold text-purple-600">%{data.conversionRate.rate}</div>
          <div className="mt-1 text-sm text-slate-400">Dönüşüm Oranı</div>
          <div className="mt-0.5 text-xs text-slate-500">{data.conversionRate.registered} kayıtlı / {data.conversionRate.visitors} ziyaretçi</div>
        </div>

        {/* Total CTA Clicks */}
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
          <div className="text-3xl font-bold text-blue-600">{data.ctaClicks.reduce((s, c) => s + c.count, 0)}</div>
          <div className="mt-1 text-sm text-slate-400">CTA Tıklama</div>
          <div className="mt-0.5 text-xs text-slate-500">{data.ctaClicks.length} farklı CTA</div>
        </div>
      </div>

      {/* Funnel */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
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
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
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
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm transition-colors duration-300 hover:border-slate-600/60">
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
                      <span className="font-medium text-slate-200">{d.depth} kaydırma</span>
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
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden transition-colors duration-300 hover:border-slate-600/60">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-200">CTA Tıklamaları</h3>
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
                <tr key={idx} className="border-b border-slate-700/50 transition-colors duration-150 hover:bg-blue-500/[0.06]">
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
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-6 shadow-sm space-y-4 transition-colors duration-300 hover:border-slate-600/60">
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
          <div key={step.step} className={`rounded-xl border border-slate-700/50 p-4 shadow-sm transition-colors duration-300 hover:border-slate-600/60 ${STEP_BG_LIGHT[idx]}`}>
            <div className={`text-2xl font-bold ${STEP_TEXT_COLORS[idx]}`}>{step.count}</div>
            <div className="mt-0.5 text-xs font-semibold text-slate-300">{step.name}</div>
            <div className={`mt-1 text-xs font-bold ${STEP_TEXT_COLORS[idx]}`}>%{step.rate}</div>
          </div>
        ))}
      </div>

      {/* Per-user table */}
      <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] shadow-sm overflow-hidden transition-colors duration-300 hover:border-slate-600/60">
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
                    <tr key={u.userId} className="border-b border-slate-700/50 transition-colors duration-150 hover:bg-blue-500/[0.06]">
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

// ═══════════════════════════════════════════════════════════════
// Reset / Milat butonu — hata log'larini temizleyip sifirdan izlemek icin
// ═══════════════════════════════════════════════════════════════

function ResetEventsButton({ onReset }: { onReset: () => void }) {
  const { tokens } = useAuth();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Disariya tiklaninca menuyu kapat
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-reset-menu]')) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  const handleReset = async (type?: string) => {
    setOpen(false);
    if (!tokens?.accessToken) return;
    const label = type === 'api_error' ? 'sadece API hatalarini'
      : type === 'api_request' ? 'sadece API isteklerini'
      : 'TUM event log\'larini';
    if (!confirm(`${label} silmek uzeresin. Geri alinmaz. Emin misin?`)) return;
    setLoading(true);
    const qs = type ? `?type=${type}` : '';
    const res = await api<{ deleted: number; type: string }>(
      `/api/v1/analytics/events${qs}`,
      { method: 'DELETE', token: tokens.accessToken },
    );
    setLoading(false);
    if (res.status === 'success' && res.data) {
      alert(`Silindi: ${res.data.deleted} kayit (${res.data.type})`);
      onReset();
    } else {
      alert('Silme basarisiz: ' + (res.message ?? 'bilinmeyen hata'));
    }
  };

  return (
    <div className="relative" data-reset-menu>
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-red-700/50 bg-red-950/40 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-900/40 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
      >
        {loading ? 'Siliniyor...' : 'Milat At ▾'}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[220px] rounded-lg border border-slate-700 bg-[#0d1b2a] p-2 shadow-xl z-20 animate-scale-in">
          <button
            type="button"
            onClick={() => handleReset('api_error')}
            className="block w-full rounded px-3 py-2 text-left text-sm text-slate-200 transition-colors duration-150 hover:bg-slate-800"
          >
            Sadece hatalari sil
          </button>
          <button
            type="button"
            onClick={() => handleReset('api_request')}
            className="block w-full rounded px-3 py-2 text-left text-sm text-slate-200 transition-colors duration-150 hover:bg-slate-800"
          >
            Sadece API isteklerini sil
          </button>
          <button
            type="button"
            onClick={() => handleReset()}
            className="block w-full rounded px-3 py-2 text-left text-sm text-red-300 transition-colors duration-150 hover:bg-red-900/40"
          >
            Tum log'lari sil
          </button>
        </div>
      )}
    </div>
  );
}
