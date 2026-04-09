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
  IN_PROGRESS: 'Geliştiriliyor',
  DONE: 'Tamamlandı',
  REJECTED: 'Reddedildi',
};

const statusColor: Record<Status, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
};

const priorityLabel: Record<Priority, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
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

  // New suggestion form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'HIGH' as Priority });
  const [formLoading, setFormLoading] = useState(false);

  const fetchSuggestions = async () => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    const res = await api<Suggestion[]>('/api/v1/suggestions', { token: tokens.accessToken });
    if (res.status === 'success' && res.data) setSuggestions(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchSuggestions(); }, [tokens?.accessToken]);

  const handleStatusChange = async (id: string, status: Status) => {
    if (!tokens?.accessToken) return;
    setActionLoading(id);
    const res = await api<Suggestion>(`/api/v1/suggestions/${id}`, {
      method: 'PATCH',
      token: tokens.accessToken,
      body: { status },
    });
    if (res.status === 'success' && res.data) {
      setSelected(res.data);
      fetchSuggestions();
    }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!tokens?.accessToken || !confirm('Bu öneriyi silmek istediğinize emin misiniz?')) return;
    setActionLoading(id);
    await api(`/api/v1/suggestions/${id}`, { method: 'DELETE', token: tokens.accessToken });
    setActionLoading(null);
    setSelected(null);
    fetchSuggestions();
  };

  const handleCreate = async () => {
    if (!tokens?.accessToken || !form.title.trim() || !form.description.trim()) return;
    setFormLoading(true);
    const res = await api<Suggestion>('/api/v1/suggestions', {
      method: 'POST',
      token: tokens.accessToken,
      body: form,
    });
    if (res.status === 'success') {
      setForm({ title: '', description: '', priority: 'HIGH' });
      setShowForm(false);
      fetchSuggestions();
    }
    setFormLoading(false);
  };

  const filtered = filterStatus === 'ALL'
    ? suggestions
    : suggestions.filter((s) => s.status === filterStatus);

  const pendingCount = suggestions.filter((s) => s.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Geliştirme Önerileri</h1>
          <p className="mt-1 text-sm text-slate-500">
            Developer Agent&apos;ın işleyeceği görevleri buradan ekleyin ve takip edin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {pendingCount} bekliyor
            </span>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            + Yeni Öneri
          </button>
        </div>
      </div>

      {/* New suggestion form */}
      {showForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Yeni Geliştirme Önerisi</h2>
          <div>
            <label className="text-xs font-medium text-slate-600">Başlık</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Kısaca ne yapılsın?"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Açıklama</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detaylı açıklama — agent bunu okuyarak geliştirecek..."
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Öncelik</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="CRITICAL">Kritik</option>
              <option value="HIGH">Yüksek</option>
              <option value="MEDIUM">Orta</option>
              <option value="LOW">Düşük</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={formLoading}
              className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
            >
              {formLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(['ALL', 'PENDING', 'IN_PROGRESS', 'DONE', 'REJECTED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setSelected(null); }}
            className={`pb-2 px-1 text-sm font-semibold border-b-2 transition ${
              filterStatus === s
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {s === 'ALL' ? 'Tümü' : statusLabel[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
          Bu durumda öneri yok.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* List */}
          <div className="space-y-3">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={`w-full text-left rounded-2xl border p-5 transition ${
                  selected?.id === s.id
                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold ${priorityColor[s.priority]}`}>
                    ▲ {priorityLabel[s.priority]}
                  </span>
                  <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[s.status]}`}>
                    {statusLabel[s.status]}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{s.title}</p>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{s.description}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(s.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            {!selected ? (
              <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-slate-400">
                Detay için sol taraftan bir öneri seçin.
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[selected.status]}`}>
                    {statusLabel[selected.status]}
                  </span>
                  <span className={`text-xs font-bold ${priorityColor[selected.priority]}`}>
                    ▲ {priorityLabel[selected.priority]}
                  </span>
                </div>

                <h2 className="text-lg font-extrabold text-slate-900">{selected.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selected.description}</p>

                {selected.agentNotes && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Agent Notları</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.agentNotes}</p>
                  </div>
                )}

                {selected.prLink && (
                  <a
                    href={selected.prLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
                  >
                    PR Linki →
                  </a>
                )}

                {/* Status actions */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-slate-500">Durumu Güncelle</p>
                  <div className="flex flex-wrap gap-2">
                    {(['PENDING', 'IN_PROGRESS', 'DONE', 'REJECTED'] as Status[])
                      .filter((s) => s !== selected.status)
                      .map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(selected.id, s)}
                          disabled={actionLoading === selected.id}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${statusColor[s]} hover:opacity-80`}
                        >
                          {statusLabel[s]}
                        </button>
                      ))}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(selected.id)}
                  disabled={actionLoading === selected.id}
                  className="mt-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  Sil
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
