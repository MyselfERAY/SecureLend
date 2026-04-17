'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Users, Home, Phone, Lock, FileCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api';
import {
  PageHeader, Card, Badge, DataTable, LoadingSkeleton,
  type Column, type BadgeTone,
} from '../_components/admin-ui';

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
    api<KycComplianceData>('/api/v1/admin/kyc-compliance', { token: tokens.accessToken })
      .then((res) => {
        if (res.status === 'success' && res.data) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [tokens?.accessToken]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="KYC Uyumluluk"
        desc="Kimlik doğrulama, UAVT ve güvenlik metrikleri"
        icon={ShieldCheck}
        back={{ href: '/dashboard/admin', label: 'Yönetim Paneli' }}
      />

      {loading && <LoadingSkeleton rows={4} />}

      {!loading && data && (
        <>
          {/* User verification metrics */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Kullanıcı Doğrulama · {data.summary.totalUsers.toLocaleString('tr-TR')} kullanıcı
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <MetricCard
                icon={FileCheck}
                label="NVI"
                count={data.summary.nviVerified.count}
                total={data.summary.totalUsers}
                pct={data.summary.nviVerified.pct}
                desc="TCKN + kimlik"
              />
              <MetricCard
                icon={Phone}
                label="KKB Telefon"
                count={data.summary.phoneTcknVerified.count}
                total={data.summary.totalUsers}
                pct={data.summary.phoneTcknVerified.pct}
                desc="TCKN ↔ telefon"
              />
              <MetricCard
                icon={Users}
                label="KPS"
                count={data.summary.kpsVerified.count}
                total={data.summary.totalUsers}
                pct={data.summary.kpsVerified.pct}
                desc="Legacy doğrulama"
              />
              <MetricCard
                icon={ShieldCheck}
                label="KYC Tamam"
                count={data.summary.kycCompleted.count}
                total={data.summary.totalUsers}
                pct={data.summary.kycCompleted.pct}
                desc="Banka KYC"
              />
              <MetricCard
                icon={Lock}
                label="TCKN Şifreli"
                count={data.summary.tcknEncrypted.count}
                total={data.summary.totalUsers}
                pct={data.summary.tcknEncrypted.pct}
                desc="AES-256-GCM"
              />
            </div>
          </section>

          {/* Properties UAVT */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Mülk UAVT Doğrulama
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
                    <Home className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Toplam Mülk</div>
                    <div className="text-2xl font-bold text-white mt-0.5">
                      {data.properties.total.toLocaleString('tr-TR')}
                    </div>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">UAVT Doğrulandı</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-0.5">
                      {data.properties.uavtVerified.toLocaleString('tr-TR')}
                    </div>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="text-xs text-slate-400 mb-2">Doğrulama Oranı</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">
                    %{data.properties.uavtVerificationRate}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                    style={{ width: `${data.properties.uavtVerificationRate}%` }}
                  />
                </div>
              </Card>
            </div>
          </section>

          {/* Incomplete verifications */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Eksik Doğrulama · {data.incompleteVerifications.length} kullanıcı
              </span>
            </h2>

            {data.incompleteVerifications.length === 0 ? (
              <Card>
                <div className="py-6 text-center text-sm text-emerald-400">
                  <ShieldCheck className="h-8 w-8 mx-auto mb-2" />
                  Tüm kullanıcılar doğrulanmış
                </div>
              </Card>
            ) : (
              <DataTable columns={incompleteColumns} data={data.incompleteVerifications} />
            )}
          </section>
        </>
      )}
    </div>
  );
}

/* ─── Metric Card ────────────────────────────────────────────── */

function MetricCard({
  icon: Icon, label, count, total, pct, desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  total: number;
  pct: number;
  desc: string;
}) {
  const tone = pct >= 90 ? 'emerald' : pct >= 60 ? 'blue' : 'rose';
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <Icon className="h-4 w-4 text-slate-400" />
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[tone]}`}>
          %{pct}
        </span>
      </div>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-bold text-white">{count.toLocaleString('tr-TR')}</span>
        <span className="text-xs text-slate-500">/{total}</span>
      </div>
      <div className="text-xs text-slate-500 mt-1">{desc}</div>
      <div className="mt-3 h-1 rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`h-full transition-all ${
            tone === 'emerald' ? 'bg-emerald-500' : tone === 'blue' ? 'bg-blue-500' : 'bg-rose-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </Card>
  );
}

/* ─── Columns ─────────────────────────────────────────────────── */

const incompleteColumns: Column<KycComplianceData['incompleteVerifications'][0]>[] = [
  {
    key: 'user',
    label: 'Kullanıcı',
    render: (u) => (
      <div>
        <div className="font-medium text-white">{u.fullName}</div>
        <div className="text-xs text-slate-500 font-mono mt-0.5">{u.tcknMasked}</div>
      </div>
    ),
  },
  {
    key: 'phone',
    label: 'Telefon',
    render: (u) => <span className="text-xs font-mono text-slate-400">{u.phone}</span>,
  },
  {
    key: 'nvi',
    label: 'NVI',
    align: 'center',
    render: (u) =>
      u.nviVerified ? (
        <Badge tone="success">✓</Badge>
      ) : (
        <Badge tone="danger">✗</Badge>
      ),
  },
  {
    key: 'kkb',
    label: 'KKB Tel',
    align: 'center',
    render: (u) =>
      u.phoneTcknVerified ? <Badge tone="success">✓</Badge> : <Badge tone="danger">✗</Badge>,
  },
  {
    key: 'kyc',
    label: 'KYC',
    align: 'center',
    render: (u) => (
      <span className="text-xs text-slate-400">{u.kycStatus}</span>
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
