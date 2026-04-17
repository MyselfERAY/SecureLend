'use client';

import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import {
  PageHeader, Card, Badge, DataTable, EmptyState, LoadingSkeleton, StatCard,
  type Column,
} from '../_components/admin-ui';

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
    ])
      .then(([subsRes, statsRes]) => {
        if (subsRes.status === 'success' && subsRes.data) setSubscribers(subsRes.data);
        if (statsRes.status === 'success' && statsRes.data) setStats(statsRes.data);
      })
      .finally(() => setLoading(false));
  }, [tokens?.accessToken]);

  const columns: Column<Subscriber>[] = [
    {
      key: 'email', label: 'E-posta',
      render: (s) => <span className="font-medium text-white">{s.email}</span>,
    },
    {
      key: 'name', label: 'İsim',
      render: (s) => <span className="text-slate-300">{s.name || '—'}</span>,
    },
    {
      key: 'source', label: 'Kaynak',
      render: (s) => <Badge tone="info">{s.source}</Badge>,
    },
    {
      key: 'date', label: 'Kayıt',
      render: (s) => (
        <span className="text-xs text-slate-400">
          {new Date(s.createdAt).toLocaleDateString('tr-TR')}
        </span>
      ),
    },
    {
      key: 'status', label: 'Durum',
      render: (s) => (
        <Badge tone={s.isActive ? 'success' : 'danger'}>
          {s.isActive ? 'Aktif' : 'İptal'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bülten Aboneleri"
        desc="E-posta bülten aboneleri ve kaynak dağılımı"
        icon={Mail}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
      />

      {loading && <LoadingSkeleton rows={4} />}

      {!loading && stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Aktif Abone" value={stats.active} accent="emerald" />
            <StatCard label="Toplam Kayıt" value={stats.total} accent="blue" />
            <StatCard label="İptal Edilen" value={stats.unsubscribed} accent="rose" />
          </div>

          {stats.bySource.length > 0 && (
            <Card>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Kaynak Dağılımı
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.bySource.map((s) => (
                  <Badge key={s.source} tone="info">
                    {s.source}: <span className="font-bold ml-1">{s.count}</span>
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {subscribers.length === 0 ? (
            <EmptyState icon={Mail} title="Henüz abone yok" />
          ) : (
            <DataTable columns={columns} data={subscribers} />
          )}
        </>
      )}
    </div>
  );
}
