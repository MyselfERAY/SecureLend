'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

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

// ── Display helpers ──
// DB has 4 statuses. We use REJECTED with null agentNotes as "NEW" (awaiting approval)
function getDisplayStatus(s: Suggestion): DisplayStatus {
  if (s.status === 'REJECTED' && !s.agentNotes) return 'NEW';
  if (s.status === 'REJECTED') return 'REJECTED';
  if (s.status === 'PENDING') return 'APPROVED';
  if (s.status === 'IN_PROGRESS') return 'IN_PROGRESS';
  return 'DONE';
}

const displayStatusLabel: Record<DisplayStatus, string> = {
  NEW: 'Yeni',
  APPROVED: 'Onaylandi',
  IN_PROGRESS: 'Gelistiriliyor',
  DONE: 'Tamamlandi',
  REJECTED: 'Reddedildi',
};

const displayStatusColor: Record<DisplayStatus, string> = {
  NEW: 'bg-purple-100 text-purple-700',
  APPROVED: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
};

const displayStatusBorder: Record<DisplayStatus, string> = {
  NEW: 'border-purple-400 bg-purple-50',
  APPROVED: 'border-amber-400 bg-amber-50',
  IN_PROGRESS: 'border-blue-400 bg-blue-50',
  DONE: 'border-emerald-400 bg-emerald-50',
  REJECTED: 'border-rose-400 bg-rose-50',
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az once';
  if (mins < 60) return `${mins} dk once`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat once`;
  const days = Math.floor(hours / 24);
  return `${days} gun once`;
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

  const fetchSuggestions = async () => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    const res = await api<Suggestion[]>('/api/v1/suggestions', { token: tokens.accessToken });
    if (res.status === 'success' && res.data) {
      setSuggestions(res.data);
      if (selected) {
        const updated = res.data.find((s: Suggestion) => s.id === selected.id);
        if (updated) setSelected(updated);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchSuggestions(); }, [tokens?.accessToken]);

  useEffect(() => {
    const interval = setInterval(fetchSuggestions, 15000);
    return () => clearInterval(interval);
  }, [tokens?.accessToken]);

  // ── Actions ──
  const handleStatusChange = async (id: string, status: Status, notes?: string) => {
    if (!tokens?.accessToken) return;
    setActionLoading(id);
    const body: Record<string, string> = { status };
    if (notes) body.agentNotes = notes;
    const res = await api<Suggestion>(`/api/v1/suggestions/${id}`, {
      method: 'PATCH', token: tokens.accessToken, body,
    });
    if (res.status === 'success' && res.data) { setSelected(res.data); fetchSuggestions(); }
    setActionLoading(null);
  };

  const handleApprove = (id: string) => handleStatusChange(id, 'PENDING', 'Admin tarafindan onaylandi.');
  const handleReject = (id: string) => handleStatusChange(id, 'REJECTED', 'Admin tarafindan reddedildi.');

  const handleDelete = async (id: string) => {
    if (!tokens?.accessToken || !confirm('Bu oneriyi silmek istediginize emin misiniz?')) return;
    setActionLoading(id);
    await api(`/api/v1/suggestions/${id}`, { method: 'DELETE', token: tokens.accessToken });
    setActionLoading(null); setSelected(null); fetchSuggestions();
  };

  const handleCreate = async () => {
    if (!tokens?.accessToken || !form.title.trim() || !form.description.trim()) return;
    setFormLoading(true);
    // Create as REJECTED with null agentNotes = "NEW" (awaiting approval)
    const res = await api<Suggestion>('/api/v1/suggestions', {
      method: 'POST', token: tokens.accessToken,
      body: { ...form, status: 'REJECTED' },
    });
    if (res.status === 'success') {
      setForm({ title: '', description: '', priority: 'HIGH' }); setShowForm(false); fetchSuggestions();
    }
    setFormLoading(false);
  };

  const handleTriggerAgent = () => {
    setTriggerLoading(true);
    window.open('https://github.com/MyselfERAY/SecureLend/actions/workflows/dev-agent.yml', '_blank');
    setTimeout(() => setTriggerLoading(false), 2000);
  };

  // ── Filtering ──
  const filtered = filterStatus === 'ALL'
    ? suggestions
    : suggestions.filter((s) => getDisplayStatus(s) === filterStatus);

  // ── Pipeline counts ──
  const counts: Record<DisplayStatus, number> = { NEW: 0, APPROVED: 0, IN_PROGRESS: 0, DONE: 0, REJECTED: 0 };
  suggestions.forEach((s) => { counts[getDisplayStatus(s)]++; });

  const pipeline: DisplayStatus[] = ['NEW', 'APPROVED', 'IN_PROGRESS', 'DONE', 'REJECTED'];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Gelistirme Onerileri</h1>
          <p className="mt-1 text-sm text-slate-500">Oneri ekle, onayla, agent otomatik gelistirir.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleTriggerAgent} disabled={triggerLoading}
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50">
            {triggerLoading ? 'Aciliyor...' : 'Agent Baslat'}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800">
            + Yeni Oneri
          </button>
        </div>
      </div>

      {/* ── Pipeline Filters ── */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {pipeline.map((ds) => (
          <button key={ds}
            onClick={() => { setFilterStatus(filterStatus === ds ? 'ALL' : ds); fetchSuggestions(); }}
            className={`rounded-xl border p-3 text-center transition ${
              filterStatus === ds ? displayStatusBorder[ds] : 'border-slate-200 bg-white hover:border-slate-300'
            }`}>
            <div className="text-xs font-semibold text-slate-600">{displayStatusLabel[ds]}</div>
            <div className="text-lg font-bold text-slate-900">{counts[ds]}</div>
          </button>
        ))}
      </div>

      {/* ── Create Form ── */}
      {showForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Yeni Gelistirme Onerisi</h2>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Baslik"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Detayli aciklama... (ne yapilacagini, hangi dosyalarin etkilenecegini, beklenen davranisi yazin)" rows={5}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none resize-none" />
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none">
            <option value="CRITICAL">Kritik</option>
            <option value="HIGH">Yuksek</option>
            <option value="MEDIUM">Orta</option>
            <option value="LOW">Dusuk</option>
          </select>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={formLoading}
              className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
              {formLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Iptal
            </button>
          </div>
        </div>
      )}

      {/* ── List + Detail ── */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Yukleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
          {filterStatus === 'ALL' ? 'Henuz oneri yok. Yukaridaki butona tiklayarak ekleyin.' : 'Bu durumda oneri yok.'}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* List */}
          <div className="space-y-3">
            {filtered.map((s) => {
              const ds = getDisplayStatus(s);
              return (
                <button key={s.id} onClick={() => setSelected(s)}
                  className={`w-full text-left rounded-2xl border p-5 transition ${
                    selected?.id === s.id ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'
                  }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold ${priorityColor[s.priority]}`}>{priorityLabel[s.priority]}</span>
                    <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${displayStatusColor[ds]}`}>
                      {displayStatusLabel[ds]}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{s.title}</p>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{s.description}</p>
                  <p className="mt-2 text-xs text-slate-400">{timeAgo(s.createdAt)}</p>
                </button>
              );
            })}
          </div>

          {/* Detail Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white sticky top-20">
            {!selected ? (
              <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-slate-400">
                Detay icin bir oneri secin.
              </div>
            ) : (
              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Status + Priority badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${displayStatusColor[getDisplayStatus(selected)]}`}>
                    {displayStatusLabel[getDisplayStatus(selected)]}
                  </span>
                  <span className={`text-xs font-bold ${priorityColor[selected.priority]}`}>
                    {priorityLabel[selected.priority]}
                  </span>
                </div>

                {/* Title + Description */}
                <h2 className="text-lg font-extrabold text-slate-900">{selected.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selected.description}</p>

                {/* Metadata */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Olusturulma</span>
                    <span className="font-medium text-slate-700">{formatDate(selected.createdAt)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Son Guncelleme</span>
                    <span className="font-medium text-slate-700">{formatDate(selected.updatedAt)}</span>
                  </div>
                  {selected.status === 'DONE' && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Deploy Tarihi</span>
                      <span className="font-medium text-emerald-600">{formatDate(selected.updatedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Agent Notes */}
                {selected.agentNotes && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Agent Notlari</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.agentNotes}</p>
                  </div>
                )}

                {/* PR Link */}
                {selected.prLink && (
                  <a href={selected.prLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800">
                    PR Linki &rarr;
                  </a>
                )}

                {/* ── Action Buttons ── */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  {/* NEW → Approve or Reject */}
                  {getDisplayStatus(selected) === 'NEW' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(selected.id)} disabled={actionLoading === selected.id}
                        className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                        {actionLoading === selected.id ? 'Isleniyor...' : 'Onayla'}
                      </button>
                      <button onClick={() => handleReject(selected.id)} disabled={actionLoading === selected.id}
                        className="flex-1 rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
                        Reddet
                      </button>
                    </div>
                  )}

                  {/* APPROVED (PENDING) → Can reject */}
                  {getDisplayStatus(selected) === 'APPROVED' && (
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-center text-sm font-medium text-amber-700">
                        Agent bekliyor...
                      </div>
                      <button onClick={() => handleReject(selected.id)} disabled={actionLoading === selected.id}
                        className="rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
                        Iptal
                      </button>
                    </div>
                  )}

                  {/* IN_PROGRESS → Show progress */}
                  {getDisplayStatus(selected) === 'IN_PROGRESS' && (
                    <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-2.5 text-center text-sm font-medium text-blue-700 animate-pulse">
                      Agent calisiyor...
                    </div>
                  )}

                  {/* DONE → Show success */}
                  {getDisplayStatus(selected) === 'DONE' && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-center text-sm font-medium text-emerald-700">
                      Tamamlandi ve deploy edildi
                    </div>
                  )}

                  {/* REJECTED → Can re-approve */}
                  {getDisplayStatus(selected) === 'REJECTED' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(selected.id)} disabled={actionLoading === selected.id}
                        className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                        Tekrar Onayla
                      </button>
                    </div>
                  )}

                  {/* Delete button (always available) */}
                  <button onClick={() => handleDelete(selected.id)} disabled={actionLoading === selected.id}
                    className="w-full rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                    Sil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
