'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';

interface OverviewStats {
  totalUsers: number;
  totalContracts: number;
  activeContracts: number;
  totalPayments: number;
  completedPayments: number;
  totalRevenue: number;
  totalCommission: number;
  totalLandlordPayouts: number;
  commissionCount: number;
}

export default function AdminDashboardPage() {
  const { tokens } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens?.accessToken) return;
    api<OverviewStats>('/api/v1/admin/overview', { token: tokens.accessToken })
      .then((res) => {
        if (res.status === 'success' && res.data) setStats(res.data);
      })
      .finally(() => setLoading(false));
  }, [tokens?.accessToken]);

  if (loading) return <div className="text-center py-12 text-gray-500">Yukleniyor...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Paneli</h1>
        <p className="text-sm text-gray-500 mt-1">Platform yonetim ve komisyon takibi</p>
      </div>

      {stats && (
        <>
          {/* Genel Istatistikler */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Kullanicilar" value={stats.totalUsers} color="blue" />
            <StatCard title="Aktif Sozlesme" value={stats.activeContracts} color="green" />
            <StatCard title="Toplam Sozlesme" value={stats.totalContracts} color="gray" />
            <StatCard title="Tamamlanan Odeme" value={stats.completedPayments} color="purple" />
          </div>

          {/* Finansal Ozet */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Finansal Ozet</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-sm text-gray-500">Toplam Islem Hacmi</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalRevenue.toLocaleString('tr-TR')} TL
                </div>
                <div className="text-xs text-gray-400 mt-1">{stats.commissionCount} islem</div>
              </div>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-5">
                <div className="text-sm text-yellow-700">Platform Komisyonu (%1)</div>
                <div className="text-2xl font-bold text-yellow-800 mt-1">
                  {stats.totalCommission.toLocaleString('tr-TR')} TL
                </div>
                <div className="text-xs text-yellow-600 mt-1">Toplam kazanc</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-sm text-gray-500">Ev Sahibi Odemeleri</div>
                <div className="text-2xl font-bold text-green-700 mt-1">
                  {stats.totalLandlordPayouts.toLocaleString('tr-TR')} TL
                </div>
                <div className="text-xs text-gray-400 mt-1">Net ev sahibi odemesi</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hizli Erisim */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Yonetim</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AdminLink href="/dashboard/admin/users" title="Kullanicilar" desc="Tum kullanicilari listele" icon="U" />
          <AdminLink href="/dashboard/admin/contracts" title="Sozlesmeler" desc="Tum sozlesmeleri goruntule" icon="S" />
          <AdminLink href="/dashboard/admin/payments" title="Odemeler" desc="Odeme gecmisi ve detaylar" icon="O" />
          <AdminLink href="/dashboard/admin/commissions" title="Komisyon Raporu" desc="Gelir ve komisyon detaylari" icon="K" />
          <AdminLink href="/dashboard/admin/support" title="Destek Mesajlari" desc="Kullanici destek talepleri" icon="D" />
          <AdminLink href="/dashboard/admin/articles" title="Makaleler" desc="Taslakları incele ve yayınla" icon="M" />
          <AdminLink href="/dashboard/admin/suggestions" title="Geliştirme Önerileri" desc="Developer Agent görev listesi" icon="G" />
          <AdminLink href="/dashboard/admin/po" title="PO Gunlugu" desc="Gunluk urun raporu ve oneriler" icon="P" />
          <AdminLink href="/dashboard/admin/marketing" title="Pazarlama & Strateji" desc="Pazarlama raporlari ve arastirma" icon="R" />
          <AdminLink href="/dashboard/admin/tasks" title="Gorev Takibi" desc="Tum gorevler ve son tarihler" icon="T" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.gray}`}>
      <div className="text-xs font-medium opacity-75">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function AdminLink({ href, title, desc, icon }: { href: string; title: string; desc: string; icon: string }) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:border-red-300 hover:shadow-sm transition group"
    >
      <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-sm font-bold mb-2 group-hover:bg-red-200 transition">
        {icon}
      </div>
      <div className="font-semibold text-gray-900 text-sm">{title}</div>
      <div className="text-xs text-gray-500 mt-1">{desc}</div>
    </Link>
  );
}
