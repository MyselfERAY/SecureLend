'use client';

import { useEffect, useState } from 'react';
import { Wallet, Download, TrendingUp } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import {
  PageHeader, Card, DataTable, EmptyState, LoadingSkeleton, StatCard, Button,
  type Column,
} from '../_components/admin-ui';

interface CommissionRecord {
  id: string;
  totalAmount: number;
  commissionAmount: number;
  landlordAmount: number;
  rate: number;
  propertyTitle: string;
  tenantName: string;
  landlordName: string;
  periodLabel: string;
  createdAt: string;
}

interface MonthlyData {
  month: string;
  totalAmount: number;
  totalCommission: number;
  totalPayments: number;
  landlordAmount: number;
}

interface CommissionReport {
  records: CommissionRecord[];
  monthly: MonthlyData[];
  totals: {
    totalRevenue: number;
    totalCommission: number;
    totalLandlordPayouts: number;
    count: number;
  };
}

export default function AdminCommissionsPage() {
  const { tokens } = useAuth();
  const [report, setReport] = useState<CommissionReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens?.accessToken) return;
    api<CommissionReport>('/api/v1/admin/commissions', { token: tokens.accessToken })
      .then((res) => {
        if (res.status === 'success' && res.data) setReport(res.data);
      })
      .finally(() => setLoading(false));
  }, [tokens?.accessToken]);

  const handleExport = async () => {
    if (!tokens?.accessToken) return;
    const url = `/api/v1/admin/commissions/export`;
    window.open(url, '_blank');
  };

  const recordColumns: Column<CommissionRecord>[] = [
    {
      key: 'property',
      label: 'Mülk',
      render: (r) => (
        <div>
          <div className="font-medium text-white text-sm">{r.propertyTitle}</div>
          <div className="text-xs text-slate-500 mt-0.5">{r.periodLabel}</div>
        </div>
      ),
    },
    { key: 'tenant', label: 'Kiracı', render: (r) => <span className="text-slate-300 text-sm">{r.tenantName}</span> },
    { key: 'landlord', label: 'Ev Sahibi', render: (r) => <span className="text-slate-300 text-sm">{r.landlordName}</span> },
    {
      key: 'gross', label: 'Brüt', align: 'right',
      render: (r) => <span className="font-mono text-white">{r.totalAmount.toLocaleString('tr-TR')} TL</span>,
    },
    {
      key: 'commission', label: 'Garanti Ücreti', align: 'right',
      render: (r) => <span className="font-mono text-amber-400">{r.commissionAmount.toLocaleString('tr-TR')} TL</span>,
    },
    {
      key: 'net', label: 'Net', align: 'right',
      render: (r) => <span className="font-mono text-emerald-400">{r.landlordAmount.toLocaleString('tr-TR')} TL</span>,
    },
    {
      key: 'date', label: 'Tarih',
      render: (r) => <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>,
    },
  ];

  const monthlyColumns: Column<MonthlyData & { id: string }>[] = [
    { key: 'month', label: 'Ay', render: (m) => <span className="font-medium text-white">{m.month}</span> },
    {
      key: 'count', label: 'İşlem Sayısı', align: 'right',
      render: (m) => <span className="font-mono text-slate-300">{m.totalPayments}</span>,
    },
    {
      key: 'volume', label: 'İşlem Hacmi', align: 'right',
      render: (m) => <span className="font-mono text-white">{m.totalAmount.toLocaleString('tr-TR')} TL</span>,
    },
    {
      key: 'commission', label: 'Garanti Ücreti', align: 'right',
      render: (m) => <span className="font-mono text-amber-400">{m.totalCommission.toLocaleString('tr-TR')} TL</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Garanti Ücreti Raporu"
        desc="Platform geliri ve ev sahibi ödemeleri"
        icon={Wallet}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
        actions={
          <Button variant="secondary" icon={Download} onClick={handleExport}>
            CSV İndir
          </Button>
        }
      />

      {loading && <LoadingSkeleton rows={4} />}

      {!loading && report && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="İşlem Sayısı" value={report.totals.count} accent="slate" />
            <StatCard
              label="İşlem Hacmi"
              value={`${report.totals.totalRevenue.toLocaleString('tr-TR')} TL`}
              accent="blue"
            />
            <StatCard
              label="Platform Geliri"
              value={`${report.totals.totalCommission.toLocaleString('tr-TR')} TL`}
              icon={TrendingUp}
              accent="amber"
            />
            <StatCard
              label="Ev Sahibi Net"
              value={`${report.totals.totalLandlordPayouts.toLocaleString('tr-TR')} TL`}
              accent="emerald"
            />
          </div>

          {report.monthly.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Aylık Özet</h2>
              <DataTable columns={monthlyColumns} data={report.monthly.map((m) => ({ ...m, id: m.month }))} />
            </section>
          )}

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Detaylı Kayıtlar · {report.records.length}
            </h2>
            {report.records.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="Henüz garanti ücreti kaydı yok"
                desc="Ödeme işlendiğinde kayıtlar burada görünecek."
              />
            ) : (
              <DataTable columns={recordColumns} data={report.records} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
