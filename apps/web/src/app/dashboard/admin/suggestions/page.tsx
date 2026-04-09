'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

type Status = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

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

const statusLabel: Record<Status, string> = {
  PENDING: 'Bekliyor',
  IN_PROGRESS: 'Gelistiriliyor',
  DONE: 'Tamamlandi',
  REJECTED: 'Reddedildi',
};

const statusColor: Record<Status, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
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

export default function AdminSuggestionsPage() {
  const { tokens } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | 'ALL'>('ALL');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'HIGH' as Priority });
  const [formLoading, setFormLoading] = useState(false);

  const fetchSuggestions = async () => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    const res = await api<Suggestion[]>('/api/v1/suggestions', { token: tokens.accessToken });
    if (res.status === 'success' && res.data) {
      setSuggestions(res.data);
      // Keep selected item in sync with fresh data
      if (selected) {
        const updated = res.data.find((s: Suggestion) => s.id === selected.id);
        if (updated) setSelected(updated);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchSuggestions(); }, [tokens?.accessToken]);

  // Auto-refresh every 15 seconds to keep data current
  useEffect(() => {
    const interval = setInterval(fetchSuggestions, 15000);
    return () => clearInterval(interval);
  }, [tokens?.accessToken]);

  const handleStatusChange = async (id: string, status: Status) => {
    if (!tokens?.accessToken) return;
    setActionLoading(id);
    const res = await api<Suggestion>(`/api/v1/suggestions/${id}`, {
      method: 'PATCH', token: tokens.accessToken, body: { status },
    });
    if (res.status === 'success' && res.data) { setSelected(res.data); fetchSuggestions(); }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!tokens?.accessToken || !confirm('Bu oneriyi silmek istediginize emin misiniz?')) return;
    setActionLoading(id);
    await api(`/api/v1/suggestions/${id}`, { method: 'DELETE', token: tokens.accessToken });
    setActionLoading(null); setSelected(null); fetchSuggestions();
  };

  const handleCreate = async () => {
    if (!tokens?.accessToken || !form.title.trim() || !form.description.trim()) return;
    setFormLoading(true);
    const res = await api<Suggestion>('/api/v1/suggestions', {
      method: 'POST', token: tokens.accessToken, body: form,
    });
    if (res.status === 'success') {
      setForm({ title: '', description: '', priority: 'HIGH' }); setShowForm(false); fetchSuggestions();
    }
    setFormLoading(false);
  };

  const filtered = filterStatus === 'ALL' ? suggestions : suggestions.filter((s) => s.status === filterStatus);

  const allowedTransitions: Record<Status, Status[]> = {
    PENDING: ['IN_PROGRESS', 'REJECTED'],
    IN_PROGRESS: ['DONE', 'REJECTED'],
    DONE: [],
    REJECTED: ['PENDING'],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Gelistirme Onerileri</h1>
          <p className="mt-1 text-sm text-slate-500">Oneri ekle, onayla, agent otomatik gelistirir.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800">
          + Yeni Oneri
        </button>
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(['PENDING', 'IN_PROGRESS', 'DONE', 'REJECTED'] as Status[]).map((s) => {
          const count = suggestions.filter((sg) => sg.status === s).length;
          return (
            <button key={s} onClick={() => { setFilterStatus(filterStatus === s ? 'ALL' : s); fetchSuggestions(); }}
              className={`rounded-xl border p-3 text-center transition ${filterStatus === s ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <div className="text-xs font-semibold text-slate-600">{statusLabel[s]}</div>
              <div className="text-lg font-bold text-slate-900">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Yeni Gelistirme Onerisi</h2>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Baslik"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detayli aciklama..." rows={4}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none resize-none" />
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none">
            <option value="CRITICAL">Kritik</option>
            <option value="HIGH">Yuksek</option>
            <option value="MEDIUM">Orta</option>
            <option value="LOW">Dusuk</option>
          </select>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={formLoading} className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
              {formLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Iptal</button>
          </div>
        </div>
      )}

      {/* List + Detail */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Yukleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400">Bu durumda oneri yok.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {filtered.map((s) => (
              <button key={s.id} onClick={() => setSelected(s)}
                className={`w-full text-left rounded-2xl border p-5 transition ${selected?.id === s.id ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold ${priorityColor[s.priority]}`}>{priorityLabel[s.priority]}</span>
                  <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[s.status]}`}>{statusLabel[s.status]}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{s.title}</p>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{s.description}</p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white sticky top-20">
            {!selected ? (
              <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-slate-400">Detay icin bir oneri secin.</div>
            ) : (
              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[selected.status]}`}>{statusLabel[selected.status]}</span>
                  <span className={`text-xs font-bold ${priorityColor[selected.priority]}`}>{priorityLabel[selected.priority]}</span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900">{selected.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selected.description}</p>

                {selected.agentNotes && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Agent Notlari</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.agentNotes}</p>
                  </div>
                )}

                {selected.prLink && (
                  <a href={selected.prLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800">PR Linki &rarr;</a>
                )}

                {allowedTransitions[selected.status].length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-slate-500">Durumu Guncelle</p>
                    <div className="flex flex-wrap gap-2">
                      {allowedTransitions[selected.status].map((s) => (
                        <button key={s} onClick={() => handleStatusChange(selected.id, s)} disabled={actionLoading === selected.id}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${statusColor[s]} hover:opacity-80`}>
                          {statusLabel[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => handleDelete(selected.id)} disabled={actionLoading === selected.id}
                  className="mt-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50">Sil</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
