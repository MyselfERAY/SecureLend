'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

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

interface CommissionTotals {
  totalRevenue: number;
  totalCommission: number;
  totalLandlordPayouts: number;
  count: number;
}

interface CommissionReport {
  records: CommissionRecord[];
  monthly: MonthlyData[];
  totals: CommissionTotals;
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

  if (loading) return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;
  if (!report) return <div className="text-center py-12 text-gray-500">Veri yuklenemedi</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Komisyon Raporu</h1>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Toplam İşlem</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{report.totals.count}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">İşlem Hacmi</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{report.totals.totalRevenue.toLocaleString('tr-TR')} TL</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-4">
          <div className="text-xs text-yellow-700">Toplam Komisyon</div>
          <div className="text-xl font-bold text-yellow-800 mt-1">{report.totals.totalCommission.toLocaleString('tr-TR')} TL</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Ev Sahibi Ödemesi</div>
          <div className="text-xl font-bold text-green-700 mt-1">{report.totals.totalLandlordPayouts.toLocaleString('tr-TR')} TL</div>
        </div>
      </div>

      {/* Aylık Özet */}
      {report.monthly.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Aylık Özet</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ay</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">İşlem Sayısı</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">İşlem Hacmi</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Komisyon</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {report.monthly.map((m) => (
                  <tr key={m.month} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{m.month}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{m.totalPayments}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{m.totalAmount.toLocaleString('tr-TR')} TL</td>
                    <td className="px-4 py-3 text-right font-medium text-yellow-700">{m.totalCommission.toLocaleString('tr-TR')} TL</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detaylı Kayıtlar */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Komisyon Kayıtları ({report.records.length})</h2>
        {report.records.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="text-gray-400 text-lg">Henüz komisyon kaydı yok</div>
            <p className="text-gray-500 text-sm mt-2">Ödeme işlendiğinde komisyon kayıtları burada görünecek.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Mülk</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Dönem</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Kiracı</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Ev Sahibi</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Brut</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Komisyon (%{(report.records[0]?.rate * 100) || 1})</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Net</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.records.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.propertyTitle}</td>
                      <td className="px-4 py-3 text-gray-600">{r.periodLabel}</td>
                      <td className="px-4 py-3 text-gray-600">{r.tenantName}</td>
                      <td className="px-4 py-3 text-gray-600">{r.landlordName}</td>
                      <td className="px-4 py-3 text-right text-gray-900">{r.totalAmount.toLocaleString('tr-TR')} TL</td>
                      <td className="px-4 py-3 text-right font-medium text-yellow-700">{r.commissionAmount.toLocaleString('tr-TR')} TL</td>
                      <td className="px-4 py-3 text-right font-medium text-green-700">{r.landlordAmount.toLocaleString('tr-TR')} TL</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.createdAt).toLocaleString('tr-TR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
