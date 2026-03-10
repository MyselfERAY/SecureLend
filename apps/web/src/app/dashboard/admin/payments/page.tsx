'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

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
  commission: {
    commissionAmount: number;
    landlordAmount: number;
    rate: number;
  } | null;
}

export default function AdminPaymentsPage() {
  const { tokens } = useAuth();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async (p: number) => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    const res = await api<{ payments: AdminPayment[]; total: number }>(`/api/v1/admin/payments?page=${p}&limit=20`, { token: tokens.accessToken });
    if (res.status === 'success' && res.data) {
      setPayments(res.data.payments);
      setTotal(res.data.total);
    }
    setLoading(false);
  };

  useEffect(() => { load(page); }, [tokens?.accessToken, page]);

  const statusLabel: Record<string, { text: string; cls: string }> = {
    PENDING: { text: 'Bekliyor', cls: 'bg-yellow-100 text-yellow-700' },
    COMPLETED: { text: 'Odendi', cls: 'bg-green-100 text-green-700' },
    OVERDUE: { text: 'Gecikti', cls: 'bg-red-100 text-red-700' },
    FAILED: { text: 'Basarisiz', cls: 'bg-red-100 text-red-700' },
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Odemeler</h1>
        <span className="text-sm text-gray-500">{total} odeme</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yukleniyor...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Mulk</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Donem</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kiraci</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ev Sahibi</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Tutar</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Komisyon</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Net</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.propertyTitle}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.periodLabel}<br/><span className="text-gray-400">Vade: {p.dueDate}</span></td>
                    <td className="px-4 py-3 text-gray-600">{p.tenantName}</td>
                    <td className="px-4 py-3 text-gray-600">{p.landlordName}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{p.amount.toLocaleString('tr-TR')} TL</td>
                    <td className="px-4 py-3 text-right">
                      {p.commission ? (
                        <span className="font-medium text-yellow-700">{p.commission.commissionAmount.toLocaleString('tr-TR')} TL</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.commission ? (
                        <span className="font-medium text-green-700">{p.commission.landlordAmount.toLocaleString('tr-TR')} TL</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusLabel[p.status]?.cls || ''}`}>
                        {statusLabel[p.status]?.text || p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 py-3 border-t">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-30">Onceki</button>
              <span className="px-3 py-1 text-sm text-gray-500">{page} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-30">Sonraki</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
