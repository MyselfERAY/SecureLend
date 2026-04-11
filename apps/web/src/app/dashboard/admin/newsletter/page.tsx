'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  source: string;
  createdAt: string;
}

interface NewsletterStats {
  total: number;
  active: number;
  unsubscribed: number;
  bySource: { source: string; count: number }[];
}

export default function AdminNewsletterPage() {
  const { tokens } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens?.accessToken) return;
    Promise.all([
      api<Subscriber[]>('/api/v1/newsletter/subscribers', { token: tokens.accessToken }),
      api<NewsletterStats>('/api/v1/newsletter/stats', { token: tokens.accessToken }),
    ]).then(([subsRes, statsRes]) => {
      if (subsRes.status === 'success' && subsRes.data) setSubscribers(subsRes.data);
      if (statsRes.status === 'success' && statsRes.data) setStats(statsRes.data);
    }).finally(() => setLoading(false));
  }, [tokens?.accessToken]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Yukleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bulten Aboneleri</h1>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{stats.active}</div>
            <div className="mt-1 text-sm text-gray-500">Aktif Abone</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-gray-700">{stats.total}</div>
            <div className="mt-1 text-sm text-gray-500">Toplam Kayit</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-red-500">{stats.unsubscribed}</div>
            <div className="mt-1 text-sm text-gray-500">Iptal Edilmis</div>
          </div>
        </div>
      )}

      {/* Source breakdown */}
      {stats && stats.bySource.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Kaynak Dagilimi</h3>
          <div className="flex flex-wrap gap-3">
            {stats.bySource.map((s) => (
              <span key={s.source} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                {s.source}: <span className="font-bold">{s.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Subscriber list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-600">E-posta</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Isim</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Kaynak</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Tarih</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Durum</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Henuz abone yok</td>
              </tr>
            ) : (
              subscribers.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.email}</td>
                  <td className="px-4 py-3 text-gray-600">{s.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{s.source}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(s.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {s.isActive ? 'Aktif' : 'Iptal'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
