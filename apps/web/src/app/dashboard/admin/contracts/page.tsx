'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

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

export default function AdminContractsPage() {
  const { tokens } = useAuth();
  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async (p: number) => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    const res = await api<{ contracts: AdminContract[]; total: number }>(`/api/v1/admin/contracts?page=${p}&limit=20`, { token: tokens.accessToken });
    if (res.status === 'success' && res.data) {
      setContracts(res.data.contracts);
      setTotal(res.data.total);
    }
    setLoading(false);
  };

  useEffect(() => { load(page); }, [tokens?.accessToken, page]);

  const statusLabel: Record<string, { text: string; cls: string }> = {
    DRAFT: { text: 'Taslak', cls: 'bg-gray-100 text-gray-700' },
    PENDING_SIGNATURES: { text: 'Imza Bekliyor', cls: 'bg-yellow-100 text-yellow-700' },
    ACTIVE: { text: 'Aktif', cls: 'bg-green-100 text-green-700' },
    TERMINATED: { text: 'Feshedildi', cls: 'bg-red-100 text-red-700' },
    EXPIRED: { text: 'Suresi Doldu', cls: 'bg-gray-100 text-gray-600' },
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sozlesmeler</h1>
        <span className="text-sm text-gray-500">{total} sozlesme</span>
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kiraci</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ev Sahibi</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kira</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Durum</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tarih</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Odeme</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{c.propertyTitle}</div>
                      <div className="text-xs text-gray-500">{c.city}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.tenantName}</td>
                    <td className="px-4 py-3 text-gray-600">{c.landlordName}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.monthlyRent.toLocaleString('tr-TR')} TL</td>
                    <td className="px-4 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusLabel[c.status]?.cls || ''}`}>
                        {statusLabel[c.status]?.text || c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {c.startDate} - {c.endDate}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.paymentCount}</td>
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
