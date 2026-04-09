'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

// ── Types ──

type ItemCategory = 'UX_IMPROVEMENT' | 'COMPETITOR_ANALYSIS' | 'REGULATION_COMPLIANCE' | 'FEATURE_SUGGESTION' | 'BUG_REPORT' | 'METRIC_SUMMARY';
type ItemStatus = 'ACTIVE' | 'MOVED_TO_DEV' | 'DISMISSED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type DevSuggestionStatus = 'NEW' | 'APPROVED' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';

interface PoItem {
  id: string;
  category: ItemCategory;
  title: string;
  description: string;
  priority: Priority;
  status: ItemStatus;
  isDevTask: boolean;
  devSuggestionId: string | null;
  devSuggestionStatus: DevSuggestionStatus | null;
  createdAt: string;
  updatedAt: string;
}

interface MetricsSnapshot {
  totalUsers?: number;
  activeContracts?: number;
  monthlyPayments?: number;
  pendingSuggestions?: number;
  [key: string]: number | undefined;
}

interface PoReport {
  id: string;
  reportDate: string;
  summary: string;
  metricsSnapshot: MetricsSnapshot | null;
  items: PoItem[];
  createdAt: string;
}

// ── Category display config ──

const categoryLabel: Record<ItemCategory, string> = {
  UX_IMPROVEMENT: 'UX',
  COMPETITOR_ANALYSIS: 'Rakip Analizi',
  REGULATION_COMPLIANCE: 'Regulasyon',
  FEATURE_SUGGESTION: 'Ozellik',
  BUG_REPORT: 'Bug',
  METRIC_SUMMARY: 'Metrik Ozeti',
};

const categoryColor: Record<ItemCategory, string> = {
  UX_IMPROVEMENT: 'bg-blue-100 text-blue-700',
  COMPETITOR_ANALYSIS: 'bg-purple-100 text-purple-700',
  REGULATION_COMPLIANCE: 'bg-amber-100 text-amber-700',
  FEATURE_SUGGESTION: 'bg-emerald-100 text-emerald-700',
  BUG_REPORT: 'bg-rose-100 text-rose-700',
  METRIC_SUMMARY: 'bg-slate-100 text-slate-700',
};

const categoryBorder: Record<ItemCategory, string> = {
  UX_IMPROVEMENT: 'border-blue-400 bg-blue-50',
  COMPETITOR_ANALYSIS: 'border-purple-400 bg-purple-50',
  REGULATION_COMPLIANCE: 'border-amber-400 bg-amber-50',
  FEATURE_SUGGESTION: 'border-emerald-400 bg-emerald-50',
  BUG_REPORT: 'border-rose-400 bg-rose-50',
  METRIC_SUMMARY: 'border-slate-400 bg-slate-50',
};

// ── Status display config ──

const itemStatusLabel: Record<ItemStatus, string> = {
  ACTIVE: 'Aktif',
  MOVED_TO_DEV: 'Gelistirmede',
  DISMISSED: 'Kapatildi',
};

const itemStatusColor: Record<ItemStatus, string> = {
  ACTIVE: 'bg-slate-100 text-slate-600',
  MOVED_TO_DEV: 'bg-emerald-100 text-emerald-700',
  DISMISSED: 'bg-rose-100 text-rose-600',
};

const devStatusLabel: Record<DevSuggestionStatus, string> = {
  NEW: 'Yeni',
  APPROVED: 'Onaylandi',
  IN_PROGRESS: 'Gelistiriliyor',
  DONE: 'Tamamlandi',
  REJECTED: 'Reddedildi',
};

const devStatusColor: Record<DevSuggestionStatus, string> = {
  NEW: 'bg-purple-100 text-purple-700',
  APPROVED: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
};

const priorityLabel: Record<Priority, string> = {
  LOW: 'Dusuk',
  MEDIUM: 'Orta',
  HIGH: 'Yuksek',
  CRITICAL: 'Kritik',
};

const priorityColor: Record<Priority, string> = {
  LOW: 'text-slate-400',
  MEDIUM: 'text-amber-500',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-rose-600',
};

const metricsLabel: Record<string, string> = {
  totalUsers: 'Toplam Kullanici',
  activeContracts: 'Aktif Sozlesme',
  monthlyPayments: 'Aylik Odeme',
  pendingSuggestions: 'Bekleyen Oneri',
  'users.total': 'Toplam Kullanici',
  'users.lastSevenDays': 'Son 7 Gun (Kullanici)',
  'contracts.lastSevenDays': 'Son 7 Gun (Sozlesme)',
  total: 'Toplam',
  lastSevenDays: 'Son 7 Gun',
};

// ── Helpers ──

type FilterKey = 'ALL' | ItemCategory;

const filterChips: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'Tumu' },
  { key: 'UX_IMPROVEMENT', label: 'UX' },
  { key: 'COMPETITOR_ANALYSIS', label: 'Rakip Analizi' },
  { key: 'REGULATION_COMPLIANCE', label: 'Regulasyon' },
  { key: 'FEATURE_SUGGESTION', label: 'Ozellik' },
  { key: 'BUG_REPORT', label: 'Bug' },
  { key: 'METRIC_SUMMARY', label: 'Metrik Ozeti' },
];

const chipActiveColor: Record<FilterKey, string> = {
  ALL: 'border-slate-500 bg-slate-100 text-slate-800',
  UX_IMPROVEMENT: categoryBorder.UX_IMPROVEMENT + ' text-blue-800',
  COMPETITOR_ANALYSIS: categoryBorder.COMPETITOR_ANALYSIS + ' text-purple-800',
  REGULATION_COMPLIANCE: categoryBorder.REGULATION_COMPLIANCE + ' text-amber-800',
  FEATURE_SUGGESTION: categoryBorder.FEATURE_SUGGESTION + ' text-emerald-800',
  BUG_REPORT: categoryBorder.BUG_REPORT + ' text-rose-800',
  METRIC_SUMMARY: categoryBorder.METRIC_SUMMARY + ' text-slate-800',
};

/** Flatten nested metrics into [label, number] pairs for safe rendering */
function flattenMetrics(obj: Record<string, unknown>, prefix = ''): [string, number][] {
  const result: [string, number][] = [];
  for (const [key, value] of Object.entries(obj)) {
    const label = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'number') {
      result.push([label, value]);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result.push(...flattenMetrics(value as Record<string, unknown>, label));
    }
  }
  return result;
}

function formatReportDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function groupItemsByCategory(items: PoItem[]): Record<ItemCategory, PoItem[]> {
  const groups: Record<ItemCategory, PoItem[]> = {
    UX_IMPROVEMENT: [],
    COMPETITOR_ANALYSIS: [],
    REGULATION_COMPLIANCE: [],
    FEATURE_SUGGESTION: [],
    BUG_REPORT: [],
    METRIC_SUMMARY: [],
  };
  items.forEach((item) => {
    if (groups[item.category]) {
      groups[item.category].push(item);
    }
  });
  return groups;
}

// ── Component ──

export default function PoJournalPage() {
  const { tokens } = useAuth();
  const [reports, setReports] = useState<PoReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add Item form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: 'FEATURE_SUGGESTION' as ItemCategory,
    title: '',
    description: '',
    priority: 'HIGH' as Priority,
    isDevTask: false,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const reportsRef = useRef<PoReport[]>([]);
  reportsRef.current = reports;

  // ── Fetch reports ──

  const fetchReports = async (background = false) => {
    if (!tokens?.accessToken) return;
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await api<any>('/api/v1/po/reports', {
        token: tokens.accessToken,
      });
      if (res.status === 'success' && res.data) {
        // API returns { reports: [...], total, page, limit }
        const list: PoReport[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.reports)
          ? res.data.reports
          : [];
        setReports(list);
      }
    } catch {
      // silently fail on background refresh
    }
    if (background) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(false);
  }, [tokens?.accessToken]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchReports(true), 30000);
    return () => clearInterval(interval);
  }, [tokens?.accessToken]);

  // ── Actions ──

  const handleMoveToDev = async (itemId: string) => {
    if (!tokens?.accessToken) return;
    setActionLoading(itemId);
    try {
      await api(`/api/v1/po/items/${itemId}/move-to-dev`, {
        method: 'POST',
        token: tokens.accessToken,
      });
      fetchReports(true);
    } catch {
      // ignore
    }
    setActionLoading(null);
  };

  const handleCreateItem = async () => {
    if (!tokens?.accessToken) return;
    if (!form.title.trim() || !form.description.trim()) {
      setFormError('Baslik ve aciklama zorunludur.');
      return;
    }
    setFormError(null);
    setFormLoading(true);
    try {
      const res = await api('/api/v1/po/items', {
        method: 'POST',
        token: tokens.accessToken,
        body: {
          category: form.category,
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          isDevTask: form.isDevTask,
        },
      });
      if (res.status === 'success') {
        setForm({
          category: 'FEATURE_SUGGESTION',
          title: '',
          description: '',
          priority: 'HIGH',
          isDevTask: false,
        });
        setShowForm(false);
        fetchReports(true);
      } else {
        setFormError(res.message || 'Kaydetme basarisiz oldu.');
      }
    } catch {
      setFormError('Bir hata olustu. Tekrar deneyin.');
    }
    setFormLoading(false);
  };

  // ── Filter items within reports ──

  const filteredReports: PoReport[] = reports.map((report) => {
    const items = report.items ?? [];
    if (filter === 'ALL') return { ...report, items };
    return {
      ...report,
      items: items.filter((item) => item.category === filter),
    };
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            PO Gunlugu
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gunluk urun raporu ve oneriler
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          + Madde Ekle
        </button>
      </div>

      {/* ── Category Filter Chips ── */}
      <div className="flex flex-wrap gap-2">
        {filterChips.map((chip) => (
          <button
            key={chip.key}
            onClick={() => setFilter(chip.key)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              filter === chip.key
                ? chipActiveColor[chip.key]
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Add Item Form ── */}
      {showForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Yeni PO Maddesi</h2>

          <select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value as ItemCategory })
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          >
            <option value="UX_IMPROVEMENT">UX</option>
            <option value="COMPETITOR_ANALYSIS">Rakip Analizi</option>
            <option value="REGULATION_COMPLIANCE">Regulasyon</option>
            <option value="FEATURE_SUGGESTION">Ozellik</option>
            <option value="BUG_REPORT">Bug</option>
            <option value="METRIC_SUMMARY">Metrik Ozeti</option>
          </select>

          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Baslik"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />

          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Detayli aciklama..."
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none resize-none"
          />

          <select
            value={form.priority}
            onChange={(e) =>
              setForm({ ...form, priority: e.target.value as Priority })
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          >
            <option value="CRITICAL">Kritik</option>
            <option value="HIGH">Yuksek</option>
            <option value="MEDIUM">Orta</option>
            <option value="LOW">Dusuk</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDevTask}
              onChange={(e) =>
                setForm({ ...form, isDevTask: e.target.checked })
              }
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Gelistirme gorevi (Dev Task)
          </label>

          {formError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-600 font-medium">
              {formError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCreateItem}
              disabled={formLoading}
              className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {formLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Iptal
            </button>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Yukleniyor...</div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <div className="text-slate-400 text-sm">
            Henuz PO raporu yok.
          </div>
          <p className="mt-2 text-xs text-slate-400">
            PO Agent gunluk rapor olusturdugunda burada gorunecek.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {refreshing && (
            <div className="text-right text-xs text-slate-400 animate-pulse">
              Guncelleniyor...
            </div>
          )}

          {/* ── Timeline / Journal ── */}
          {filteredReports.map((report) => (
            <div key={report.id} className="relative">
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-100 flex-shrink-0" />
                <h2 className="text-lg font-extrabold text-slate-900">
                  {formatReportDate(report.reportDate)}
                </h2>
              </div>

              <div className="ml-1.5 border-l-2 border-slate-200 pl-6 space-y-4">
                {/* Summary */}
                {report.summary && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Ozet
                    </p>
                    <div
                      className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: report.summary }}
                    />
                  </div>
                )}

                {/* Metrics Snapshot */}
                {report.metricsSnapshot &&
                  Object.keys(report.metricsSnapshot).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {flattenMetrics(report.metricsSnapshot).map(
                        ([key, value]) => (
                            <div
                              key={key}
                              className="rounded-xl border border-slate-200 bg-white p-4 text-center"
                            >
                              <div className="text-xs font-semibold text-slate-500">
                                {metricsLabel[key] || key}
                              </div>
                              <div className="mt-1 text-xl font-bold text-slate-900">
                                {typeof value === 'number'
                                  ? value.toLocaleString('tr-TR')
                                  : String(value)}
                              </div>
                            </div>
                          ),
                      )}
                    </div>
                  )}

                {/* Items grouped by category */}
                {report.items.length > 0 ? (
                  Object.entries(groupItemsByCategory(report.items)).map(
                    ([cat, items]) => {
                      if (items.length === 0) return null;
                      const category = cat as ItemCategory;
                      return (
                        <div key={category} className="space-y-2">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {categoryLabel[category]}
                          </p>
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-sm"
                            >
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                {/* Category badge */}
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryColor[item.category]}`}
                                >
                                  {categoryLabel[item.category]}
                                </span>

                                {/* Priority */}
                                <span
                                  className={`text-xs font-bold ${priorityColor[item.priority]}`}
                                >
                                  {priorityLabel[item.priority]}
                                </span>

                                {/* Status badge */}
                                <span
                                  className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${itemStatusColor[item.status]}`}
                                >
                                  {itemStatusLabel[item.status]}
                                </span>
                              </div>

                              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                {item.title}
                              </h3>
                              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                                {item.description}
                              </p>

                              {/* Dev Suggestion status (when moved) */}
                              {item.status === 'MOVED_TO_DEV' &&
                                item.devSuggestionStatus && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <span className="text-xs text-slate-500">
                                      Gelistirme durumu:
                                    </span>
                                    <span
                                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${devStatusColor[item.devSuggestionStatus]}`}
                                    >
                                      {devStatusLabel[item.devSuggestionStatus]}
                                    </span>
                                  </div>
                                )}

                              {/* Move to dev button for ACTIVE items */}
                              {item.status === 'ACTIVE' && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                  <button
                                    onClick={() => handleMoveToDev(item.id)}
                                    disabled={actionLoading === item.id}
                                    className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                                  >
                                    {actionLoading === item.id
                                      ? 'Gonderiliyor...'
                                      : 'Gelistirmeye Gonder'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    },
                  )
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                    Bu raporda{' '}
                    {filter !== 'ALL'
                      ? `"${filterChips.find((c) => c.key === filter)?.label}" kategorisinde`
                      : ''}{' '}
                    madde yok.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
