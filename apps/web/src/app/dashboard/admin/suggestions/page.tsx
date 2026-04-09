'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

type Status = 'NEW' | 'PENDING' | 'IN_PROGRESS' | 'DEVELOPED' | 'DEPLOYED' | 'REJECTED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  imageUrl: string | null;
  agentNotes: string | null;
  prLink: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

const statusLabel: Record<Status, string> = {
  NEW: 'Yeni',
  PENDING: 'Onaylandi',
  IN_PROGRESS: 'Gelistiriliyor',
  DEVELOPED: 'Gelistirildi',
  DEPLOYED: 'Deploy Edildi',
  REJECTED: 'Reddedildi',
};

const statusColor: Record<Status, string> = {
  NEW: 'bg-slate-100 text-slate-700',
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DEVELOPED: 'bg-violet-100 text-violet-700',
  DEPLOYED: 'bg-emerald-100 text-emerald-700',
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminSuggestionsPage() {
  const { tokens } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New suggestion form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'HIGH' as Priority, imageUrl: '' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    const url = `/api/v1/suggestions${params.toString() ? `?${params}` : ''}`;
    const res = await api<Suggestion[]>(url, { token: tokens.accessToken });
    if (res.status === 'success' && res.data) setSuggestions(res.data);
    setLoading(false);
  }, [tokens?.accessToken, searchQuery]);

  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

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
    if (!tokens?.accessToken || !confirm('Bu oneriyi silmek istediginize emin misiniz?')) return;
    setActionLoading(id);
    await api(`/api/v1/suggestions/${id}`, { method: 'DELETE', token: tokens.accessToken });
    setActionLoading(null);
    setSelected(null);
    fetchSuggestions();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu 5MB\'dan kucuk olmali.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!tokens?.accessToken || !form.title.trim() || !form.description.trim()) return;
    setFormLoading(true);
    const body: Record<string, string> = {
      title: form.title,
      description: form.description,
      priority: form.priority,
    };
    if (form.imageUrl) body.imageUrl = form.imageUrl;
    const res = await api<Suggestion>('/api/v1/suggestions', {
      method: 'POST',
      token: tokens.accessToken,
      body,
    });
    if (res.status === 'success') {
      setForm({ title: '', description: '', priority: 'HIGH', imageUrl: '' });
      setShowForm(false);
      fetchSuggestions();
    }
    setFormLoading(false);
  };

  const filtered = filterStatus === 'ALL'
    ? suggestions
    : suggestions.filter((s) => s.status === filterStatus);

  const newCount = suggestions.filter((s) => s.status === 'NEW').length;
  const pendingCount = suggestions.filter((s) => s.status === 'PENDING').length;

  const allowedTransitions: Record<Status, Status[]> = {
    NEW: ['PENDING', 'REJECTED'],
    PENDING: ['REJECTED'],
    IN_PROGRESS: ['REJECTED'],
    DEVELOPED: ['DEPLOYED', 'REJECTED'],
    DEPLOYED: [],
    REJECTED: ['NEW'],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Gelistirme Onerileri</h1>
          <p className="mt-1 text-sm text-slate-500">
            Oneri ekle &rarr; onayla &rarr; agent otomatik gelistirir &rarr; deploy edilir.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {newCount > 0 && (
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
              {newCount} yeni
            </span>
          )}
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {pendingCount} onaylandi
            </span>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            + Yeni Oneri
          </button>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Anahtar kelime ile ara..."
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Pipeline overview */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {(['NEW', 'PENDING', 'IN_PROGRESS', 'DEVELOPED', 'DEPLOYED', 'REJECTED'] as Status[]).map((s) => {
          const count = suggestions.filter((sg) => sg.status === s).length;
          return (
            <button
              key={s}
              onClick={() => { setFilterStatus(filterStatus === s ? 'ALL' : s); setSelected(null); }}
              className={`rounded-xl border p-3 text-center transition ${
                filterStatus === s ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-semibold text-slate-600">{statusLabel[s]}</div>
              <div className="text-lg font-bold text-slate-900">{count}</div>
            </button>
          );
        })}
      </div>

      {/* New suggestion form */}
      {showForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Yeni Gelistirme Onerisi</h2>
          <div>
            <label className="text-xs font-medium text-slate-600">Baslik</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Kisaca ne yapilsin?"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Aciklama</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detayli aciklama — agent bunu okuyarak gelistirecek..."
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Oncelik</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="CRITICAL">Kritik</option>
              <option value="HIGH">Yuksek</option>
              <option value="MEDIUM">Orta</option>
              <option value="LOW">Dusuk</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Gorsel (opsiyonel)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-200"
            />
            {form.imageUrl && (
              <div className="mt-2 relative inline-block">
                <img src={form.imageUrl} alt="preview" className="max-h-32 rounded-lg border border-slate-200" />
                <button
                  onClick={() => setForm({ ...form, imageUrl: '' })}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center"
                >
                  x
                </button>
              </div>
            )}
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
              Iptal
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400">Yukleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
          {searchQuery ? 'Arama sonucu bulunamadi.' : 'Bu durumda oneri yok.'}
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
                    {priorityLabel[s.priority]}
                  </span>
                  <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[s.status]}`}>
                    {statusLabel[s.status]}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{s.title}</p>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{s.description}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                  <span>{formatDate(s.createdAt)}</span>
                  {s.completedAt && (
                    <span className="text-emerald-600">Tamamlandi: {formatDate(s.completedAt)}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <div className="rounded-2xl border border-slate-200 bg-white sticky top-20">
            {!selected ? (
              <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-slate-400">
                Detay icin sol taraftan bir oneri secin.
              </div>
            ) : (
              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[selected.status]}`}>
                    {statusLabel[selected.status]}
                  </span>
                  <span className={`text-xs font-bold ${priorityColor[selected.priority]}`}>
                    {priorityLabel[selected.priority]}
                  </span>
                </div>

                <h2 className="text-lg font-extrabold text-slate-900">{selected.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selected.description}</p>

                {/* Image */}
                {selected.imageUrl && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Ekli Gorsel</p>
                    <img
                      src={selected.imageUrl}
                      alt="Oneri gorseli"
                      className="max-w-full rounded-xl border border-slate-200 cursor-pointer"
                      onClick={() => window.open(selected.imageUrl!, '_blank')}
                    />
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <span className="text-slate-400">Olusturulma</span>
                    <div className="font-semibold text-slate-700">{formatDate(selected.createdAt)}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <span className="text-slate-400">Son Guncelleme</span>
                    <div className="font-semibold text-slate-700">{formatDate(selected.updatedAt)}</div>
                  </div>
                  {selected.completedAt && (
                    <div className="rounded-lg bg-emerald-50 p-2 col-span-2">
                      <span className="text-emerald-600">Tamamlanma</span>
                      <div className="font-semibold text-emerald-700">{formatDate(selected.completedAt)}</div>
                    </div>
                  )}
                </div>

                {selected.agentNotes && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Agent Notlari</p>
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
                    PR Linki &rarr;
                  </a>
                )}

                {/* Status actions */}
                {allowedTransitions[selected.status].length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-slate-500">Durumu Guncelle</p>
                    <div className="flex flex-wrap gap-2">
                      {allowedTransitions[selected.status].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(selected.id, s)}
                          disabled={actionLoading === selected.id}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${statusColor[s]} hover:opacity-80`}
                        >
                          {s === 'PENDING' ? 'Onayla' : statusLabel[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
