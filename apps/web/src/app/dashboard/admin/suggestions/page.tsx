'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Lightbulb, Plus, Play, ExternalLink, Trash2, Check, X, Loader2, AlertCircle, Search,
} from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import {
  PageHeader, Card, Badge, EmptyState, LoadingSkeleton, Button,
  type BadgeTone,
} from '../_components/admin-ui';

type Status = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type DisplayStatus = 'NEW' | 'APPROVED' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  agentNotes: string | null;
  prLink: string | null;
  createdAt: string;
  updatedAt: string;
}

function getDisplayStatus(s: Suggestion): DisplayStatus {
  if (s.status === 'REJECTED' && !s.agentNotes) return 'NEW';
  if (s.status === 'REJECTED') return 'REJECTED';
  if (s.status === 'PENDING') return 'APPROVED';
  if (s.status === 'IN_PROGRESS') return 'IN_PROGRESS';
  return 'DONE';
}

const STATUS_META: Record<DisplayStatus, { label: string; tone: BadgeTone }> = {
  NEW: { label: 'Yeni', tone: 'info' },
  APPROVED: { label: 'Onaylandı', tone: 'warning' },
  IN_PROGRESS: { label: 'Geliştiriliyor', tone: 'info' },
  DONE: { label: 'Tamamlandı', tone: 'success' },
  REJECTED: { label: 'Reddedildi', tone: 'danger' },
};

const PRIORITY_META: Record<Priority, { label: string; tone: BadgeTone }> = {
  LOW: { label: 'Düşük', tone: 'neutral' },
  MEDIUM: { label: 'Orta', tone: 'warning' },
  HIGH: { label: 'Yüksek', tone: 'warning' },
  CRITICAL: { label: 'Kritik', tone: 'danger' },
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminSuggestionsPage() {
  const { tokens } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<DisplayStatus | 'ALL'>('ALL');
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'HIGH' as Priority });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'ALL'>('ALL');
  const [sortKey, setSortKey] = useState<'created-desc' | 'created-asc' | 'priority' | 'status'>('created-desc');
  const selectedRef = useRef<Suggestion | null>(null);
  selectedRef.current = selected;

  const fetchSuggestions = async (background = false) => {
    if (!tokens?.accessToken) return;
    if (background) setRefreshing(true); else setLoading(true);
    const res = await api<Suggestion[]>('/api/v1/suggestions', { token: tokens.accessToken });
    if (res.status === 'success' && res.data) {
      setSuggestions(res.data);
      const cur = selectedRef.current;
      if (cur) {
        const updated = res.data.find((s) => s.id === cur.id);
        if (updated) setSelected(updated);
      }
    }
    if (background) setRefreshing(false); else setLoading(false);
  };

  useEffect(() => { fetchSuggestions(false); }, [tokens?.accessToken]);
  useEffect(() => {
    const i = setInterval(() => fetchSuggestions(true), 15000);
    return () => clearInterval(i);
  }, [tokens?.accessToken]);

  const handleStatusChange = async (id: string, status: Status, notes?: string) => {
    if (!tokens?.accessToken) return;
    setActionLoading(id);
    const body: Record<string, string> = { status };
    if (notes) body.agentNotes = notes;
    const res = await api<Suggestion>(`/api/v1/suggestions/${id}`, { method: 'PATCH', token: tokens.accessToken, body });
    if (res.status === 'success' && res.data) { setSelected(res.data); fetchSuggestions(true); }
    setActionLoading(null);
  };
  const handleApprove = (id: string) => handleStatusChange(id, 'PENDING', 'Admin tarafından onaylandı.');
  const handleReject = (id: string) => handleStatusChange(id, 'REJECTED', 'Admin tarafından reddedildi.');
  const handleDelete = async (id: string) => {
    if (!tokens?.accessToken || !confirm('Bu öneriyi silmek istediğinize emin misiniz?')) return;
    setActionLoading(id);
    await api(`/api/v1/suggestions/${id}`, { method: 'DELETE', token: tokens.accessToken });
    setActionLoading(null); setSelected(null); fetchSuggestions(true);
  };

  const handleCreate = async () => {
    if (!tokens?.accessToken) return;
    if (!form.title.trim() || !form.description.trim()) { setFormError('Başlık ve açıklama zorunludur.'); return; }
    setFormError(null); setFormLoading(true);
    try {
      const res = await api<Suggestion>('/api/v1/suggestions', {
        method: 'POST', token: tokens.accessToken,
        body: { title: form.title.trim(), description: form.description.trim(), priority: form.priority },
      });
      if (res.status === 'success') {
        setForm({ title: '', description: '', priority: 'HIGH' });
        setShowForm(false);
        fetchSuggestions(true);
      } else {
        setFormError(res.message || 'Kaydetme başarısız oldu.');
      }
    } catch {
      setFormError('Bir hata oluştu. Tekrar deneyin.');
    }
    setFormLoading(false);
  };

  const handleTriggerAgent = () => {
    setTriggerLoading(true);
    window.open('https://github.com/MyselfERAY/SecureLend/actions/workflows/dev-agent.yml', '_blank');
    setTimeout(() => setTriggerLoading(false), 2000);
  };

  const counts: Record<DisplayStatus, number> = { NEW: 0, APPROVED: 0, IN_PROGRESS: 0, DONE: 0, REJECTED: 0 };
  suggestions.forEach((s) => { counts[getDisplayStatus(s)]++; });
  const pipeline: DisplayStatus[] = ['NEW', 'APPROVED', 'IN_PROGRESS', 'DONE', 'REJECTED'];

  const filtered = useMemo(() => {
    let list = suggestions;
    if (filterStatus !== 'ALL') list = list.filter((s) => getDisplayStatus(s) === filterStatus);
    if (filterPriority !== 'ALL') list = list.filter((s) => s.priority === filterPriority);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    const sorted = [...list];
    const PRI_ORDER: Record<Priority, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const STATUS_ORDER: Record<DisplayStatus, number> = { NEW: 0, APPROVED: 1, IN_PROGRESS: 2, DONE: 3, REJECTED: 4 };
    sorted.sort((a, b) => {
      switch (sortKey) {
        case 'created-asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'priority': return PRI_ORDER[a.priority] - PRI_ORDER[b.priority];
        case 'status': return STATUS_ORDER[getDisplayStatus(a)] - STATUS_ORDER[getDisplayStatus(b)];
        case 'created-desc':
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return sorted;
  }, [suggestions, filterStatus, filterPriority, search, sortKey]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Geliştirme Önerileri"
        desc="Öneri ekle, onayla, Dev Agent otomatik geliştirir."
        icon={Lightbulb}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
        actions={
          <>
            <Button variant="secondary" icon={Play} onClick={handleTriggerAgent} disabled={triggerLoading}>
              {triggerLoading ? 'Açılıyor...' : 'Agent Başlat'}
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setShowForm(!showForm)}>
              Yeni Öneri
            </Button>
          </>
        }
      />

      {/* Pipeline */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {pipeline.map((ds) => {
          const active = filterStatus === ds;
          const meta = STATUS_META[ds];
          return (
            <button
              key={ds}
              onClick={() => setFilterStatus(active ? 'ALL' : ds)}
              className={`rounded-xl border p-3 text-center transition ${
                active
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : 'border-slate-700/50 bg-[#0d1b2a] hover:border-slate-600'
              }`}
            >
              <div className="text-xs font-medium text-slate-400">{meta.label}</div>
              <div className="text-2xl font-bold text-white mt-1">{counts[ds]}</div>
            </button>
          );
        })}
      </div>

      {/* Filters: search + priority + sort */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Başlık veya açıklamada ara..."
            className="w-full rounded-lg border border-slate-700 bg-[#0d1b2a] pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as Priority | 'ALL')}
          className="rounded-lg border border-slate-700 bg-[#0d1b2a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">Tüm Öncelikler</option>
          <option value="CRITICAL">Kritik</option>
          <option value="HIGH">Yüksek</option>
          <option value="MEDIUM">Orta</option>
          <option value="LOW">Düşük</option>
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
          className="rounded-lg border border-slate-700 bg-[#0d1b2a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="created-desc">En yeni</option>
          <option value="created-asc">En eski</option>
          <option value="priority">Önceliğe göre</option>
          <option value="status">Duruma göre</option>
        </select>
        {(search || filterPriority !== 'ALL' || filterStatus !== 'ALL') && (
          <button
            type="button"
            onClick={() => { setSearch(''); setFilterPriority('ALL'); setFilterStatus('ALL'); }}
            className="rounded-lg border border-slate-700 bg-[#0d1b2a] px-3 py-2 text-sm text-slate-400 hover:text-white hover:border-slate-600"
          >
            Temizle
          </button>
        )}
      </div>

      {/* Result summary */}
      {(search || filterPriority !== 'ALL' || filterStatus !== 'ALL') && (
        <div className="text-xs text-slate-400">
          {filtered.length} sonuç gösteriliyor (toplam {suggestions.length})
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <Card className="border-blue-500/30">
          <h3 className="text-sm font-semibold text-white mb-4">Yeni Geliştirme Önerisi</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Başlık"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detaylı açıklama — ne yapılacağını, hangi dosyaların etkileneceğini, beklenen davranışı yazın."
              rows={5}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="CRITICAL">Kritik</option>
              <option value="HIGH">Yüksek</option>
              <option value="MEDIUM">Orta</option>
              <option value="LOW">Düşük</option>
            </select>
            {formError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {formError}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleCreate} disabled={formLoading}>
                {formLoading ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
            </div>
          </div>
        </Card>
      )}

      {/* List + Detail */}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title={filterStatus === 'ALL' ? 'Henüz öneri yok' : 'Bu durumda öneri yok'}
          desc={filterStatus === 'ALL' ? 'Yukarıdaki butona tıklayarak öneri ekleyin.' : undefined}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* List */}
          <div className="space-y-3">
            {refreshing && (
              <div className="text-right text-xs text-slate-500 animate-pulse">Güncelleniyor...</div>
            )}
            {filtered.map((s) => {
              const ds = getDisplayStatus(s);
              const meta = STATUS_META[ds];
              const pMeta = PRIORITY_META[s.priority];
              const active = selected?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className={`w-full text-left rounded-xl border p-4 transition ${
                    active
                      ? 'border-blue-500/50 bg-[#0f2037]'
                      : 'border-slate-700/50 bg-[#0d1b2a] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge tone={pMeta.tone}>{pMeta.label}</Badge>
                    <div className="ml-auto">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                  </div>
                  <div className="font-semibold text-white text-sm leading-snug line-clamp-2">{s.title}</div>
                  <div className="text-xs text-slate-400 mt-1 line-clamp-2">{s.description}</div>
                  <div className="text-xs text-slate-500 mt-2">{timeAgo(s.createdAt)}</div>
                </button>
              );
            })}
          </div>

          {/* Detail Panel */}
          <div className="lg:sticky lg:top-6 h-fit">
            {!selected ? (
              <Card>
                <div className="flex items-center justify-center py-16 text-sm text-slate-500">
                  Detay için bir öneri seçin
                </div>
              </Card>
            ) : (
              <Card>
                <div className="space-y-4 max-h-[75vh] overflow-y-auto">
                  <div className="flex items-center gap-2">
                    <Badge tone={STATUS_META[getDisplayStatus(selected)].tone}>
                      {STATUS_META[getDisplayStatus(selected)].label}
                    </Badge>
                    <Badge tone={PRIORITY_META[selected.priority].tone}>
                      {PRIORITY_META[selected.priority].label}
                    </Badge>
                  </div>
                  <h2 className="text-lg font-bold text-white">{selected.title}</h2>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{selected.description}</p>

                  {/* Metadata */}
                  <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Oluşturulma</span>
                      <span className="text-slate-300">{formatDate(selected.createdAt)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Son Güncelleme</span>
                      <span className="text-slate-300">{formatDate(selected.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Agent Notes */}
                  {selected.agentNotes && (
                    <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                      <div className="text-xs font-semibold text-blue-400 mb-1.5">Agent Notları</div>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{selected.agentNotes}</div>
                    </div>
                  )}

                  {selected.prLink && (
                    <a
                      href={selected.prLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300"
                    >
                      PR Linki <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-3 border-t border-slate-700/50">
                    {getDisplayStatus(selected) === 'NEW' && (
                      <div className="flex gap-2">
                        <Button variant="primary" icon={Check} onClick={() => handleApprove(selected.id)} disabled={actionLoading === selected.id} className="flex-1 justify-center">
                          Onayla
                        </Button>
                        <Button variant="danger" icon={X} onClick={() => handleReject(selected.id)} disabled={actionLoading === selected.id} className="flex-1 justify-center">
                          Reddet
                        </Button>
                      </div>
                    )}
                    {getDisplayStatus(selected) === 'APPROVED' && (
                      <div className="flex gap-2">
                        <div className="flex-1 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Agent bekliyor
                        </div>
                        <Button variant="ghost" onClick={() => handleReject(selected.id)} disabled={actionLoading === selected.id}>İptal</Button>
                      </div>
                    )}
                    {getDisplayStatus(selected) === 'IN_PROGRESS' && (
                      <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-2 text-center text-xs text-blue-300 flex items-center justify-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Agent çalışıyor
                      </div>
                    )}
                    {getDisplayStatus(selected) === 'DONE' && (
                      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-center text-xs text-emerald-300 flex items-center justify-center gap-2">
                        <Check className="h-3.5 w-3.5" /> Tamamlandı ve deploy edildi
                      </div>
                    )}
                    {getDisplayStatus(selected) === 'REJECTED' && (
                      <Button variant="primary" onClick={() => handleApprove(selected.id)} disabled={actionLoading === selected.id} className="w-full justify-center">
                        Tekrar Onayla
                      </Button>
                    )}
                    <Button variant="ghost" icon={Trash2} onClick={() => handleDelete(selected.id)} disabled={actionLoading === selected.id} className="w-full justify-center text-rose-400 hover:text-rose-300">
                      Sil
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
