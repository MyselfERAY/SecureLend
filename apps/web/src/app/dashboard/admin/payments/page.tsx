'use client';

import { useEffect, useState } from 'react';
import { CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import {
  PageHeader, Card, Badge, DataTable, EmptyState, LoadingSkeleton, Button,
  type Column, type BadgeTone,
} from '../_components/admin-ui';

interface AdminPayment {
  id: string;
  status: string;
  dueDate: string;
  amount: number;
  paidAt: string | null;
  paidAmount: number | null;
  periodLabel: string;
  propertyTitle: string;
  tenantName: string;
  landlordName: string;
  commission: { commissionAmount: number; landlordAmount: number; rate: number } | null;
}

const STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Bekliyor', tone: 'warning' },
  PROCESSING: { label: 'İşleniyor', tone: 'info' },
  COMPLETED: { label: 'Ödendi', tone: 'success' },
  OVERDUE: { label: 'Gecikti', tone: 'danger' },
  FAILED: { label: 'Başarısız', tone: 'danger' },
};

export default function AdminPaymentsPage() {
  const { tokens } = useAuth();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async (p: number) => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    const res = await api<{ payments: AdminPayment[]; total: number }>(
      `/api/v1/admin/payments?page=${p}&limit=20`,
      { token: tokens.accessToken },
    );
    if (res.status === 'success' && res.data) {
      setPayments(res.data.payments);
      setTotal(res.data.total);
    }
    setLoading(false);
  };

  useEffect(() => { load(page); }, [tokens?.accessToken, page]);

  const totalPages = Math.ceil(total / 20);

  const columns: Column<AdminPayment>[] = [
    {
      key: 'property',
      label: 'Mülk',
      render: (p) => (
        <div>
          <div className="font-medium text-white text-sm">{p.propertyTitle}</div>
          <div className="text-xs text-slate-500 mt-0.5">{p.periodLabel} · Vade {p.dueDate}</div>
        </div>
      ),
    },
    {
      key: 'tenant',
      label: 'Kiracı',
      render: (p) => <span className="text-slate-300 text-sm">{p.tenantName}</span>,
    },
    {
      key: 'landlord',
      label: 'Ev Sahibi',
      render: (p) => <span className="text-slate-300 text-sm">{p.landlordName}</span>,
    },
    {
      key: 'amount',
      label: 'Tutar',
      align: 'right',
      render: (p) => (
        <span className="font-mono font-semibold text-white">
          {p.amount.toLocaleString('tr-TR')} TL
        </span>
      ),
    },
    {
      key: 'commission',
      label: 'Garanti Ücreti',
      align: 'right',
      render: (p) => p.commission ? (
        <span className="font-mono text-amber-400">
          {p.commission.commissionAmount.toLocaleString('tr-TR')} TL
        </span>
      ) : <span className="text-slate-600">—</span>,
    },
    {
      key: 'net',
      label: 'Ev Sahibine Net',
      align: 'right',
      render: (p) => p.commission ? (
        <span className="font-mono text-emerald-400">
          {p.commission.landlordAmount.toLocaleString('tr-TR')} TL
        </span>
      ) : <span className="text-slate-600">—</span>,
    },
    {
      key: 'status',
      label: 'Durum',
      render: (p) => {
        const m = STATUS_META[p.status] || { label: p.status, tone: 'neutral' as BadgeTone };
        return <Badge tone={m.tone}>{m.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ödemeler"
        desc={`Toplam ${total.toLocaleString('tr-TR')} ödeme kaydı`}
        icon={CreditCard}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
      />

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="Henüz ödeme yok" />
      ) : (
        <>
          <DataTable columns={columns} data={payments} />

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
