'use client';

import { useEffect, useState } from 'react';
import { Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import {
  PageHeader, Card, Badge, DataTable, EmptyState, LoadingSkeleton, Button,
  type Column, type BadgeTone,
} from '../_components/admin-ui';

interface AdminUser {
  id: string;
  fullName: string;
  tcknMasked: string;
  phone: string;
  email: string | null;
  roles: string[];
  kycStatus: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  contractCount: number;
  accountCount: number;
}

const ROLE_LABEL: Record<string, string> = {
  TENANT: 'Kiracı',
  LANDLORD: 'Ev Sahibi',
  ADMIN: 'Admin',
  SERVICE: 'Servis',
};

const KYC_TONE: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Bekliyor', tone: 'warning' },
  IN_PROGRESS: { label: 'İşlemde', tone: 'info' },
  COMPLETED: { label: 'Tamamlandı', tone: 'success' },
  REJECTED: { label: 'Reddedildi', tone: 'danger' },
};

export default function AdminUsersPage() {
  const { tokens } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async (p: number) => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    const res = await api<{ users: AdminUser[]; total: number }>(
      `/api/v1/admin/users?page=${p}&limit=20`,
      { token: tokens.accessToken },
    );
    if (res.status === 'success' && res.data) {
      setUsers(res.data.users);
      setTotal(res.data.total);
    }
    setLoading(false);
  };

  useEffect(() => { load(page); }, [tokens?.accessToken, page]);

  const totalPages = Math.ceil(total / 20);

  const filtered = search
    ? users.filter((u) =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.phone.includes(search) ||
        u.tcknMasked.includes(search),
      )
    : users;

  const columns: Column<AdminUser>[] = [
    {
      key: 'user',
      label: 'Kullanıcı',
      render: (u) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{u.fullName}</span>
            {!u.isActive && <Badge tone="danger">Pasif</Badge>}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">{u.tcknMasked}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Telefon',
      render: (u) => <span className="font-mono text-slate-300 text-sm">{u.phone}</span>,
    },
    {
      key: 'roles',
      label: 'Roller',
      render: (u) => (
        <div className="flex gap-1 flex-wrap">
          {u.roles.length === 0 ? (
            <span className="text-xs text-slate-500">—</span>
          ) : (
            u.roles.map((r) => (
              <Badge key={r} tone={r === 'ADMIN' ? 'danger' : r === 'LANDLORD' ? 'info' : 'neutral'}>
                {ROLE_LABEL[r] || r}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'kyc',
      label: 'KYC',
      render: (u) => {
        const k = KYC_TONE[u.kycStatus] || { label: u.kycStatus, tone: 'neutral' as BadgeTone };
        return <Badge tone={k.tone}>{k.label}</Badge>;
      },
    },
    {
      key: 'contracts',
      label: 'Sözleşme',
      align: 'center',
      render: (u) => (
        <span className={`font-mono text-sm ${u.contractCount > 0 ? 'text-white' : 'text-slate-500'}`}>
          {u.contractCount}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Kayıt',
      render: (u) => (
        <span className="text-xs text-slate-400">
          {new Date(u.createdAt).toLocaleDateString('tr-TR')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kullanıcılar"
        desc={`Toplam ${total.toLocaleString('tr-TR')} kullanıcı`}
        icon={Users}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
      />

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, telefon veya TCKN ara..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700 bg-[#0d1b2a] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'Arama sonucu bulunamadı' : 'Henüz kullanıcı yok'}
          desc={search ? `"${search}" için eşleşme yok.` : undefined}
        />
      ) : (
        <>
          <DataTable columns={columns} data={filtered} />

          {totalPages > 1 && (
            <Card>
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Sayfa {page} / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ChevronLeft}
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Önceki
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Sonraki
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
