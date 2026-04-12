'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import OnboardingWizard from '../../components/onboarding-wizard';

interface DashboardData {
  roles: string[];
  fullName: string;
  memberSince: string;
  tenant?: {
    activeContracts: number;
    totalMonthlyRent: number;
    pendingPayments: number;
    overduePayments: number;
    totalPaid: number;
    kmhStatus: string | null;
    kmhLimit: number | null;
    nextPaymentDate: string | null;
    nextPaymentAmount: number | null;
  };
  landlord?: {
    activeContracts: number;
    totalProperties: number;
    rentedProperties: number;
    totalMonthlyIncome: number;
    totalReceived: number;
    pendingPayments: number;
    overduePayments: number;
    occupancyRate: number;
  };
  recentNotifications: unknown[];
}

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
  const { user, tokens, refreshUser } = useAuth();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingJustCompleted, setOnboardingJustCompleted] = useState(false);

  useEffect(() => {
    if (!tokens?.accessToken) return;

    const load = async () => {
      try {
        const [contractsRes, paymentsRes, dashRes] = await Promise.all([
          api<ContractSummary[]>('/api/v1/contracts', { token: tokens.accessToken }),
          api<PaymentItem[]>('/api/v1/payments/my', { token: tokens.accessToken }),
          api<DashboardData>('/api/v1/users/dashboard', { token: tokens.accessToken }),
        ]);

        if (contractsRes.status === 'success' && contractsRes.data) {
          setContracts(contractsRes.data);
        }
        if (paymentsRes.status === 'success' && paymentsRes.data) {
          setPayments(paymentsRes.data);
        }
        if (dashRes.status === 'success' && dashRes.data) {
          setDashboardData(dashRes.data);
        }
      } catch {
        // Silently fail - individual sections handle empty state
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tokens?.accessToken]);

  const showOnboarding = !loading && !onboardingJustCompleted && !user?.onboardingCompleted && contracts.length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          <span className="text-sm text-slate-400">Veriler yukleniyor...</span>
        </div>
      </div>
    );
  }

  if (showOnboarding && tokens?.accessToken) {
    return (
      <OnboardingWizard
        token={tokens.accessToken}
        userName={user?.fullName || ''}
        onComplete={() => {
          setOnboardingJustCompleted(true);
          refreshUser();
        }}
      />
    );
  }

  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE');
  const upcomingPayments = payments
    .filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE')
    .slice(0, 5);

  const isTenant = user?.roles.includes('TENANT');
  const isLandlord = user?.roles.includes('LANDLORD');

  // Compute stats from nested dashboard data
  const dd = dashboardData;
  const landlordData = dd?.landlord;
  const tenantData = dd?.tenant;

  const stats = {
    activeContracts: (isLandlord ? landlordData?.activeContracts : tenantData?.activeContracts) ?? activeContracts.length,
    totalContracts: contracts.length,
    pendingPayments: (isLandlord ? landlordData?.pendingPayments : tenantData?.pendingPayments) ?? payments.filter((p) => p.status === 'PENDING').length,
    overduePayments: (isLandlord ? landlordData?.overduePayments : tenantData?.overduePayments) ?? payments.filter((p) => p.status === 'OVERDUE').length,
    properties: landlordData?.totalProperties ?? 0,
    monthlyIncome: landlordData?.totalMonthlyIncome ?? tenantData?.totalMonthlyRent ?? 0,
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Hos geldiniz, {user?.fullName}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {user?.roles.length ? user.roles.map(r =>
            r === 'TENANT' ? 'Kiraci' : r === 'LANDLORD' ? 'Ev Sahibi' : r === 'ADMIN' ? 'Yonetici' : r
          ).join(' / ') : 'Henuz rol atanmadi'}
          {' '}&middot; Kira Güvence Kontrol Paneli
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Aktif Sozlesme"
          value={stats.activeContracts}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          title="Bekleyen Odeme"
          value={stats.pendingPayments}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="yellow"
        />
        <StatCard
          title="Geciken Odeme"
          value={stats.overduePayments}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          color="red"
        />
        {isLandlord ? (
          <StatCard
            title="Mulk Sayisi"
            value={stats.properties}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            color="emerald"
          />
        ) : (
          <StatCard
            title="Toplam Sozlesme"
            value={stats.totalContracts}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            color="slate"
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickAction
          href="/dashboard/properties"
          title="Mulk Yonetimi"
          desc="Mulklerinizi ekleyin ve yonetin"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <QuickAction
          href="/dashboard/contracts"
          title="Sozlesmeler"
          desc="Kira sozlesmelerinizi goruntuleyin"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <QuickAction
          href="/dashboard/bank"
          title="Banka Hesaplari"
          desc="KMH hesabi acin ve yonetin"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />
      </div>

      {/* Active Contracts */}
      {activeContracts.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Aktif Sozlesmeler</h2>
            <Link href="/dashboard/contracts" className="text-sm font-medium text-blue-400 hover:text-blue-300">
              Tumunu Gor &rarr;
            </Link>
          </div>
          <div className="space-y-3">
            {activeContracts.slice(0, 3).map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/contracts/${c.id}`}
                className="block rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-4 transition hover:border-blue-500/30 hover:bg-[#112240]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-white">{c.propertyTitle}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {isTenant ? `Ev Sahibi: ${c.landlordName}` : `Kiraci: ${c.tenantName}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-blue-400">
                      {c.monthlyRent.toLocaleString('tr-TR')} TL/ay
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Yaklasan Odemeler</h2>
            <Link href="/dashboard/payments" className="text-sm font-medium text-blue-400 hover:text-blue-300">
              Tumunu Gor &rarr;
            </Link>
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] divide-y divide-slate-700/50">
            {upcomingPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-white">{p.propertyTitle}</div>
                  <div className="mt-0.5 text-sm text-slate-400">{p.periodLabel} &middot; Vade: {p.dueDate}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    p.status === 'OVERDUE'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {p.status === 'OVERDUE' ? 'Gecikti' : 'Bekliyor'}
                  </span>
                  <span className="font-semibold text-white">
                    {p.amount.toLocaleString('tr-TR')} TL
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {contracts.length === 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-700/50">
            <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-lg font-medium text-slate-300">Henuz sozlesmeniz yok</div>
          <p className="mt-2 text-sm text-slate-500">
            {isLandlord
              ? stats.properties > 0
                ? 'Mulkunuz var ancak henuz sozlesme olusturmamissiniz.'
                : 'Once mulk ekleyin, sonra sozlesme olusturun.'
              : 'Ev sahibiniz sozlesme olusturdugunda burada gorunecektir.'}
          </p>
          {isLandlord && (
            <div className="mt-4 flex items-center justify-center gap-3">
              {stats.properties === 0 && (
                <Link
                  href="/dashboard/properties"
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Mulk Ekle
                </Link>
              )}
              {stats.properties > 0 && (
                <Link
                  href="/dashboard/contracts"
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Sozlesme Olustur
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', text: 'text-blue-400' },
    yellow: { bg: 'bg-yellow-500/10', icon: 'text-yellow-400', text: 'text-yellow-400' },
    red: { bg: 'bg-red-500/10', icon: 'text-red-400', text: 'text-red-400' },
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', text: 'text-emerald-400' },
    slate: { bg: 'bg-slate-500/10', icon: 'text-slate-400', text: 'text-slate-400' },
  };

  const c = colorMap[color] || colorMap.slate;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg}`}>
          <span className={c.icon}>{icon}</span>
        </div>
      </div>
      <div className={`mt-3 text-3xl font-bold ${c.text}`}>{value}</div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 transition hover:border-blue-500/30 hover:bg-[#112240]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 transition group-hover:bg-blue-600/30">
        {icon}
      </div>
      <div>
        <div className="font-semibold text-white">{title}</div>
        <div className="mt-0.5 text-sm text-slate-400">{desc}</div>
      </div>
    </Link>
  );
}
