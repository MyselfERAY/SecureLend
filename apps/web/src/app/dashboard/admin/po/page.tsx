'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Target, Plus, ArrowRight, AlertCircle, Loader2, CheckSquare, X,
  Sparkles, Bug, TrendingUp, Gavel, Eye, Trophy,
} from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import {
  PageHeader, Card, Badge, EmptyState, LoadingSkeleton, Button,
  type BadgeTone,
} from '../_components/admin-ui';

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

interface MetricsSnapshot { [key: string]: any }

interface PoReport {
  id: string;
  reportDate: string;
  summary: string;
  metricsSnapshot: MetricsSnapshot | null;
  items: PoItem[];
  createdAt: string;
}

const CATEGORY_META: Record<ItemCategory, { label: string; tone: BadgeTone; icon: React.ComponentType<{ className?: string }> }> = {
  UX_IMPROVEMENT:       { label: 'UX', tone: 'info', icon: Eye },
  COMPETITOR_ANALYSIS:  { label: 'Rakip', tone: 'info', icon: Trophy },
  REGULATION_COMPLIANCE:{ label: 'Regülasyon', tone: 'warning', icon: Gavel },
  FEATURE_SUGGESTION:   { label: 'Özellik', tone: 'success', icon: Sparkles },
  BUG_REPORT:           { label: 'Bug', tone: 'danger', icon: Bug },
  METRIC_SUMMARY:       { label: 'Metrik', tone: 'neutral', icon: TrendingUp },
};

const ITEM_STATUS_META: Record<ItemStatus, { label: string; tone: BadgeTone }> = {
  ACTIVE:       { label: 'Aktif', tone: 'neutral' },
  MOVED_TO_DEV: { label: 'Geliştirmede', tone: 'info' },
  DISMISSED:    { label: 'Kapatıldı', tone: 'danger' },
};

const PRIORITY_META: Record<Priority, { label: string; tone: BadgeTone }> = {
  LOW:      { label: 'Düşük',  tone: 'neutral' },
  MEDIUM:   { label: 'Orta',   tone: 'warning' },
  HIGH:     { label: 'Yüksek', tone: 'warning' },
  CRITICAL: { label: 'Kritik', tone: 'danger' },
};

const DEV_STATUS_META: Record<DevSuggestionStatus, { label: string; tone: BadgeTone }> = {
  NEW:         { label: 'Yeni', tone: 'info' },
  APPROVED:    { label: 'Onaylandı', tone: 'warning' },
  IN_PROGRESS: { label: 'Geliştiriliyor', tone: 'info' },
  DONE:        { label: 'Tamamlandı', tone: 'success' },
  REJECTED:    { label: 'Reddedildi', tone: 'danger' },
};

type FilterKey = 'ALL' | ItemCategory;
const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'Tümü' },
  ...Object.entries(CATEGORY_META).map(([k, m]) => ({ key: k as ItemCategory, label: m.label })),
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PoJournalPage() {
  const { tokens } = useAuth();
  const [reports, setReports] = useState<PoReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedReportId;

  const fetchReports = async (background = false) => {
    if (!tokens?.accessToken) return;
    if (background) setRefreshing(true); else setLoading(true);
    try {
      const res = await api<any>('/api/v1/po/reports', { token: tokens.accessToken });
      if (res.status === 'success' && res.data) {
        const list: PoReport[] = Array.isArray(res.data) ? res.data : Array.isArray(res.data.reports) ? res.data.reports : [];
        setReports(list);
        if (!selectedIdRef.current && list.length > 0) {
          setSelectedReportId(list[0].id);
        }
      }
    } catch {}
    if (background) setRefreshing(false); else setLoading(false);
  };

  useEffect(() => { fetchReports(false); }, [tokens?.accessToken]);
  useEffect(() => {
    const i = setInterval(() => fetchReports(true), 30000);
    return () => clearInterval(i);
  }, [tokens?.accessToken]);

  const handleMoveToDev = async (itemId: string) => {
    if (!tokens?.accessToken) return;
    setActionLoading('dev-' + itemId);
    try {
      await api(`/api/v1/po/items/${itemId}/move-to-dev`, { method: 'POST', token: tokens.accessToken });
      fetchReports(true);
    } catch {}
    setActionLoading(null);
  };

  const handleSendToTasks = async (itemId: string) => {
    if (!tokens?.accessToken) return;
    setActionLoading('task-' + itemId);
    try {
      await api(`/api/v1/po/items/${itemId}/send-to-tasks`, { method: 'POST', token: tokens.accessToken });
      fetchReports(true);
    } catch {}
    setActionLoading(null);
  };

  const handleDismiss = async (itemId: string) => {
    if (!tokens?.accessToken) return;
    setActionLoading('dismiss-' + itemId);
    try {
      await api(`/api/v1/po/items/${itemId}`, { method: 'PATCH', token: tokens.accessToken, body: { status: 'DISMISSED' } });
      fetchReports(true);
    } catch {}
    setActionLoading(null);
  };

  const handleCreateItem = async () => {
    if (!tokens?.accessToken) return;
    if (!form.title.trim() || !form.description.trim()) { setFormError('Başlık ve açıklama zorunludur.'); return; }
    setFormError(null); setFormLoading(true);
    try {
      const res = await api('/api/v1/po/items', {
        method: 'POST', token: tokens.accessToken,
        body: {
          category: form.category,
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          isDevTask: form.isDevTask,
        },
      });
      if (res.status === 'success') {
        setForm({ category: 'FEATURE_SUGGESTION', title: '', description: '', priority: 'HIGH', isDevTask: false });
        setShowForm(false);
        fetchReports(true);
      } else {
        setFormError(res.message || 'Kaydetme başarısız oldu.');
      }
    } catch {
      setFormError('Bir hata oluştu. Tekrar deneyin.');
    }
    setFormLoading(false);
  };

  const selectedReport = reports.find((r) => r.id === selectedReportId) || null;

  const visibleItems = useMemo(() => {
    if (!selectedReport) return [];
    const items = selectedReport.items ?? [];
    return filter === 'ALL' ? items : items.filter((i) => i.category === filter);
  }, [selectedReport, filter]);

  const fieldCls = 'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500';
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1';

  return (
    <div className="space-y-6">
      <PageHeader
        title="PO Günlüğü"
        desc="Günlük ürün raporları, öneriler ve Dev Agent'a taşınan görevler"
        icon={Target}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setShowForm(!showForm)}>
            Madde Ekle
          </Button>
        }
      />

      {/* Add item form */}
      {showForm && (
        <Card className="border-blue-500/30">
          <h3 className="text-sm font-semibold text-white mb-3">Yeni PO Maddesi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Kategori</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ItemCategory })} className={fieldCls}>
                {Object.entries(CATEGORY_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Öncelik</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className={fieldCls}>
                <option value="CRITICAL">Kritik</option>
                <option value="HIGH">Yüksek</option>
                <option value="MEDIUM">Orta</option>
                <option value="LOW">Düşük</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Başlık *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={fieldCls} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Açıklama *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${fieldCls} resize-none`} />
            </div>
            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.isDevTask} onChange={(e) => setForm({ ...form, isDevTask: e.target.checked })} className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600" />
                Doğrudan Dev Agent'a taşı
              </label>
            </div>
          </div>
          {formError && (
            <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {formError}
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <Button variant="primary" onClick={handleCreateItem} disabled={formLoading}>
              {formLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : reports.length === 0 ? (
        <EmptyState icon={Target} title="Henüz PO raporu yok" desc="PO Agent günlük 08:00'de otomatik üretir." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Left: Report timeline — 3 cols */}
          <div className="lg:col-span-3 space-y-2">
            {refreshing && <div className="text-right text-xs text-slate-500 animate-pulse">Güncelleniyor...</div>}
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Raporlar · {reports.length}
            </div>
            {reports.map((r) => {
              const active = r.id === selectedReportId;
              const itemCount = r.items?.length ?? 0;
              const devCount = r.items?.filter((i) => i.status === 'MOVED_TO_DEV').length ?? 0;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedReportId(r.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 transition ${
                    active
                      ? 'border-blue-500/50 bg-[#0f2037]'
                      : 'border-slate-700/50 bg-[#0d1b2a] hover:border-slate-600'
                  }`}
                >
                  <div className="text-sm font-medium text-white">{formatDate(r.reportDate)}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{itemCount} madde</span>
                    {devCount > 0 && <span className="text-emerald-400">· {devCount} dev'e</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Selected report detail — 9 cols */}
          <div className="lg:col-span-9 space-y-4">
            {!selectedReport ? (
              <Card>
                <div className="flex items-center justify-center py-12 text-sm text-slate-500">
                  Detay için bir rapor seçin
                </div>
              </Card>
            ) : (
              <>
                {/* Report summary */}
                <Card>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">Rapor Özeti</div>
                      <h2 className="text-lg font-bold text-white mt-1">{formatDate(selectedReport.reportDate)}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      {Object.entries(CATEGORY_META).map(([k, m]) => {
                        const count = (selectedReport.items ?? []).filter((i) => i.category === (k as ItemCategory)).length;
                        if (count === 0) return null;
                        const Icon = m.icon;
                        return (
                          <div key={k} className="flex items-center gap-1.5 text-xs">
                            <Icon className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-slate-300">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {selectedReport.summary && (
                    <p className="mt-3 text-sm text-slate-300 leading-relaxed">{selectedReport.summary}</p>
                  )}

                  {/* Metrics snapshot */}
                  {selectedReport.metricsSnapshot && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(flattenMetrics(selectedReport.metricsSnapshot)).slice(0, 8).map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-slate-700/50 bg-slate-900/30 px-3 py-2">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider truncate">{label}</div>
                          <div className="text-lg font-bold text-white mt-0.5">{value.toLocaleString('tr-TR')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Category filter */}
                <div className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.map((opt) => {
                    const count = opt.key === 'ALL'
                      ? (selectedReport.items?.length ?? 0)
                      : (selectedReport.items?.filter((i) => i.category === opt.key).length ?? 0);
                    if (opt.key !== 'ALL' && count === 0) return null;
                    const active = filter === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setFilter(opt.key)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          active
                            ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                            : 'border-slate-700/50 bg-[#0d1b2a] text-slate-400 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        {opt.label} <span className="opacity-60 ml-1">{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Items */}
                {visibleItems.length === 0 ? (
                  <EmptyState title="Bu kategoride madde yok" />
                ) : (
                  <div className="space-y-2">
                    {visibleItems.map((item) => {
                      const catMeta = CATEGORY_META[item.category];
                      const CatIcon = catMeta.icon;
                      const pMeta = PRIORITY_META[item.priority];
                      const sMeta = ITEM_STATUS_META[item.status];
                      const devMeta = item.devSuggestionStatus ? DEV_STATUS_META[item.devSuggestionStatus] : null;

                      return (
                        <div key={item.id} className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-4">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                              <CatIcon className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                <Badge tone={catMeta.tone}>{catMeta.label}</Badge>
                                <Badge tone={pMeta.tone}>{pMeta.label}</Badge>
                                <Badge tone={sMeta.tone}>{sMeta.label}</Badge>
                                {devMeta && (
                                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                    <ArrowRight className="h-3 w-3" />
                                    <Badge tone={devMeta.tone}>{devMeta.label}</Badge>
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-semibold text-white leading-snug">{item.title}</div>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>

                              {item.status === 'ACTIVE' && (
                                <div className="flex items-center gap-2 mt-3">
                                  {!item.isDevTask && (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      icon={ArrowRight}
                                      onClick={() => handleMoveToDev(item.id)}
                                      disabled={actionLoading === 'dev-' + item.id}
                                    >
                                      {actionLoading === 'dev-' + item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Dev\'e Taşı'}
                                    </Button>
                                  )}
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    icon={CheckSquare}
                                    onClick={() => handleSendToTasks(item.id)}
                                    disabled={actionLoading === 'task-' + item.id}
                                  >
                                    Göreve Ekle
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={X}
                                    onClick={() => handleDismiss(item.id)}
                                    disabled={actionLoading === 'dismiss-' + item.id}
                                    className="text-slate-500 hover:text-slate-300"
                                  >
                                    Kapat
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function flattenMetrics(obj: Record<string, unknown>, prefix = ''): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(obj)) {
    const label = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'number') {
      out[label] = value;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flattenMetrics(value as Record<string, unknown>, label));
    }
  }
  return out;
}
