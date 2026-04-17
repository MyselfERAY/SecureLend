'use client';

import { useEffect, useState } from 'react';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import {
  PageHeader, Card, Badge, DataTable, EmptyState, LoadingSkeleton, Button,
  type Column, type BadgeTone,
} from '../_components/admin-ui';

interface AdminContract {
  id: string;
  status: string;
  monthlyRent: number;
  startDate: string;
  endDate: string;
  propertyTitle: string;
  city: string;
  tenantName: string;
  landlordName: string;
  paymentCount: number;
  commissionCount: number;
  createdAt: string;
}

const STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: 'Taslak', tone: 'neutral' },
  PENDING_SIGNATURES: { label: 'İmza Bekliyor', tone: 'warning' },
  PENDING_ACTIVATION: { label: 'Aktivasyon Bekliyor', tone: 'info' },
  ACTIVE: { label: 'Aktif', tone: 'success' },
  TERMINATED: { label: 'Feshedildi', tone: 'danger' },
  EXPIRED: { label: 'Süresi Doldu', tone: 'neutral' },
};

export default function AdminContractsPage() {
  const { tokens } = useAuth();
  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async (p: number) => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    const res = await api<{ contracts: AdminContract[]; total: number }>(
      `/api/v1/admin/contracts?page=${p}&limit=20`,
      { token: tokens.accessToken },
    );
    if (res.status === 'success' && res.data) {
      setContracts(res.data.contracts);
      setTotal(res.data.total);
    }
    setLoading(false);
  };

  useEffect(() => { load(page); }, [tokens?.accessToken, page]);

  const totalPages = Math.ceil(total / 20);

  const columns: Column<AdminContract>[] = [
    {
      key: 'property',
      label: 'Mülk',
      render: (c) => (
        <div>
          <div className="font-medium text-white">{c.propertyTitle}</div>
          <div className="text-xs text-slate-500 mt-0.5">{c.city}</div>
        </div>
      ),
    },
    {
      key: 'tenant',
      label: 'Kiracı',
      render: (c) => <span className="text-slate-300">{c.tenantName}</span>,
    },
    {
      key: 'landlord',
      label: 'Ev Sahibi',
      render: (c) => <span className="text-slate-300">{c.landlordName}</span>,
    },
    {
      key: 'rent',
      label: 'Aylık Kira',
      align: 'right',
      render: (c) => (
        <span className="font-mono font-medium text-white">
          {c.monthlyRent.toLocaleString('tr-TR')} TL
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Durum',
      render: (c) => {
        const m = STATUS_META[c.status] || { label: c.status, tone: 'neutral' as BadgeTone };
        return <Badge tone={m.tone}>{m.label}</Badge>;
      },
    },
    {
      key: 'dates',
      label: 'Dönem',
      render: (c) => (
        <span className="text-xs text-slate-400">
          {c.startDate} → {c.endDate}
        </span>
      ),
    },
    {
      key: 'payments',
      label: 'Ödeme',
      align: 'center',
      render: (c) => (
        <span className={`font-mono text-sm ${c.paymentCount > 0 ? 'text-white' : 'text-slate-500'}`}>
          {c.paymentCount}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sözleşmeler"
        desc={`Toplam ${total.toLocaleString('tr-TR')} sözleşme`}
        icon={FileText}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
      />

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : contracts.length === 0 ? (
        <EmptyState icon={FileText} title="Henüz sözleşme yok" />
      ) : (
        <>
          <DataTable columns={columns} data={contracts} />

          {totalPages > 1 && (
            <Card>
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">Sayfa {page} / {totalPages}</div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" icon={ChevronLeft} onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                    Önceki
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
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
