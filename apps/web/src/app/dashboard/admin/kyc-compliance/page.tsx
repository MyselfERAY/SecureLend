'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';

interface ComplianceMetric {
  count: number;
  pct: number;
}

interface KycComplianceData {
  summary: {
    totalUsers: number;
    nviVerified: ComplianceMetric;
    phoneTcknVerified: ComplianceMetric;
    kpsVerified: ComplianceMetric;
    kycCompleted: ComplianceMetric;
    tcknEncrypted: ComplianceMetric;
  };
  properties: {
    total: number;
    uavtVerified: number;
    uavtVerificationRate: number;
  };
  incompleteVerifications: Array<{
    id: string;
    tcknMasked: string;
    fullName: string;
    phone: string;
    nviVerified: boolean;
    phoneTcknVerified: boolean;
    kpsVerified: boolean;
    kycStatus: string;
    createdAt: string;
  }>;
  recentFailures: Array<{
    action: string;
    tcknMasked: string;
    createdAt: string;
  }>;
}

export default function KycCompliancePage() {
  const { tokens } = useAuth();
  const [data, setData] = useState<KycComplianceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens?.accessToken) return;
    api<KycComplianceData>('/api/v1/admin/kyc-compliance', {
      token: tokens.accessToken,
    })
      .then((res) => {
        if (res.status === 'success' && res.data) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [tokens?.accessToken]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;
  }
  if (!data) {
    return <div className="text-center py-12 text-gray-500">Veri yüklenemedi.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KYC Uyumluluk Paneli</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kimlik doğrulama, TCKN şifreleme, UAVT ve KKB kontrolleri
        </p>
      </div>

      {/* Kullanıcı doğrulama metrikleri */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Kullanıcı Doğrulama Dağılımı ({data.summary.totalUsers} kullanıcı)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            title="NVI Doğrulandı"
            value={data.summary.nviVerified.count}
            pct={data.summary.nviVerified.pct}
            desc="TCKN + ad + soyad + doğum yılı"
          />
          <MetricCard
            title="KKB Telefon Eşleşti"
            value={data.summary.phoneTcknVerified.count}
            pct={data.summary.phoneTcknVerified.pct}
            desc="TCKN ↔ telefon (banka partneri)"
          />
          <MetricCard
            title="KPS Doğrulandı"
            value={data.summary.kpsVerified.count}
            pct={data.summary.kpsVerified.pct}
            desc="Legacy kimlik doğrulama"
          />
          <MetricCard
            title="KYC Tamamlandı"
            value={data.summary.kycCompleted.count}
            pct={data.summary.kycCompleted.pct}
            desc="Banka KYC süreci"
          />
          <MetricCard
            title="TCKN Şifreli"
            value={data.summary.tcknEncrypted.count}
            pct={data.summary.tcknEncrypted.pct}
            desc="AES-256-GCM saklama"
          />
        </div>
      </div>

      {/* Mülk UAVT */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Mülk UAVT Doğrulama
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Toplam Mülk</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {data.properties.total}
            </p>
          </div>
          <div className="rounded-lg bg-white border border-gray-200 p-4">
            <p className="text-sm text-gray-500">UAVT Doğrulandı</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {data.properties.uavtVerified}
            </p>
          </div>
          <div className="rounded-lg bg-white border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Doğrulama Oranı</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              %{data.properties.uavtVerificationRate}
            </p>
          </div>
        </div>
      </div>

      {/* Eksik doğrulama olan kullanıcılar */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Eksik Doğrulama ({data.incompleteVerifications.length} kullanıcı)
        </h2>
        {data.incompleteVerifications.length === 0 ? (
          <p className="text-sm text-gray-500">
            Tüm kullanıcılar doğrulanmış ✓
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Kullanıcı</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">TCKN</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Telefon</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">NVI</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">KKB Tel</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">KYC</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Kayıt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.incompleteVerifications.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-2 text-gray-900">{u.fullName}</td>
                    <td className="px-4 py-2 font-mono text-gray-600">{u.tcknMasked}</td>
                    <td className="px-4 py-2 text-gray-600">{u.phone}</td>
                    <td className="px-4 py-2 text-center">
                      {u.nviVerified ? '✓' : '✗'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {u.phoneTcknVerified ? '✓' : '✗'}
                    </td>
                    <td className="px-4 py-2 text-center text-xs text-gray-500">
                      {u.kycStatus}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  pct,
  desc,
}: {
  title: string;
  value: number;
  pct: number;
  desc: string;
}) {
  const color = pct >= 90 ? 'green' : pct >= 60 ? 'blue' : 'red';
  const colors = {
    green: 'text-green-600 bg-green-50',
    blue: 'text-blue-600 bg-blue-50',
    red: 'text-red-600 bg-red-50',
  };
  return (
    <div className="rounded-lg bg-white border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-600">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${colors[color]}`}>
          %{pct}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-2">{desc}</p>
    </div>
  );
}
