'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

interface ContractSummary {
  id: string;
  status: string;
  monthlyRent: number;
  propertyTitle: string;
  tenantName: string;
  landlordName: string;
  startDate: string;
  endDate: string;
}

interface PaymentItem {
  id: string;
  contractId: string;
  propertyTitle: string;
  dueDate: string;
  amount: number;
  periodLabel: string;
  status: string;
}

export default function DashboardPage() {
  const { user, tokens } = useAuth();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens?.accessToken) return;

    const load = async () => {
      try {
        const [contractsRes, paymentsRes] = await Promise.all([
          api<ContractSummary[]>('/api/v1/contracts', { token: tokens.accessToken }),
          api<PaymentItem[]>('/api/v1/payments/my', { token: tokens.accessToken }),
        ]);

        if (contractsRes.status === 'success' && contractsRes.data) {
          setContracts(contractsRes.data);
        }
        if (paymentsRes.status === 'success' && paymentsRes.data) {
          setPayments(paymentsRes.data);
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tokens?.accessToken]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Yukleniyor...</div>;
  }

  const upcomingPayments = payments
    .filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE')
    .slice(0, 5);

  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE');

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hos geldiniz, {user?.fullName}
        </h1>
        <p className="text-gray-500 mt-1">
          Roller: {user?.roles.length ? user.roles.join(', ') : 'Henuz rol atanmadi'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Aktif Sozlesme" value={activeContracts.length} color="blue" />
        <StatCard
          title="Bekleyen Odeme"
          value={upcomingPayments.length}
          color={upcomingPayments.some((p) => p.status === 'OVERDUE') ? 'red' : 'yellow'}
        />
        <StatCard title="Toplam Sozlesme" value={contracts.length} color="gray" />
        <StatCard
          title="Roller"
          value={user?.roles.length || 0}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          href="/dashboard/properties"
          title="Mulk Yonetimi"
          desc="Mulklerinizi ekleyin ve yonetin"
        />
        <QuickAction
          href="/dashboard/contracts"
          title="Sozlesmeler"
          desc="Kira sozlesmelerinizi goruntuleyin"
        />
        <QuickAction
          href="/dashboard/bank"
          title="Banka Hesaplari"
          desc="KMH hesabi acin ve yonetin"
        />
      </div>

      {/* Active Contracts */}
      {activeContracts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktif Sozlesmeler</h2>
          <div className="space-y-3">
            {activeContracts.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/contracts/${c.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{c.propertyTitle}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Kiraci: {c.tenantName} | Ev Sahibi: {c.landlordName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-blue-600">
                      {c.monthlyRent.toLocaleString('tr-TR')} TL/ay
                    </div>
                    <div className="text-xs text-gray-400">
                      {c.startDate} - {c.endDate}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Yaklasan Odemeler</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y">
            {upcomingPayments.map((p) => (
              <div key={p.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">{p.propertyTitle}</div>
                  <div className="text-sm text-gray-500">{p.periodLabel} - {p.dueDate}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    p.status === 'OVERDUE'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {p.status === 'OVERDUE' ? 'Gecikti' : 'Bekliyor'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {p.amount.toLocaleString('tr-TR')} TL
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {contracts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-gray-400 text-lg mb-2">Henuz sozlesmeniz yok</div>
          <p className="text-gray-500 text-sm">
            Ev sahibi iseniz mulk ekleyip sozlesme olusturabilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
    gray: 'bg-gray-50 text-gray-700',
  };

  return (
    <div className={`rounded-xl p-4 ${colors[color] || colors.gray}`}>
      <div className="text-sm font-medium opacity-80">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

function QuickAction({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="font-semibold text-gray-900">{title}</div>
      <div className="text-sm text-gray-500 mt-1">{desc}</div>
    </Link>
  );
}
