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

  if (loading) return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Paneli</h1>
        <p className="text-sm text-gray-500 mt-1">Platform yönetim ve komisyon takibi</p>
      </div>

      {stats && (
        <>
          {/* Genel Istatistikler */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Kullanıcılar" value={stats.totalUsers} color="blue" />
            <StatCard title="Aktif Sözleşme" value={stats.activeContracts} color="green" />
            <StatCard title="Toplam Sözleşme" value={stats.totalContracts} color="gray" />
            <StatCard title="Tamamlanan Ödeme" value={stats.completedPayments} color="purple" />
          </div>

          {/* Finansal Özet */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Finansal Özet</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-sm text-gray-500">Toplam İşlem Hacmi</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalRevenue.toLocaleString('tr-TR')} TL
                </div>
                <div className="text-xs text-gray-400 mt-1">{stats.commissionCount} işlem</div>
              </div>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-5">
                <div className="text-sm text-yellow-700">Platform Komisyonu (%1)</div>
                <div className="text-2xl font-bold text-yellow-800 mt-1">
                  {stats.totalCommission.toLocaleString('tr-TR')} TL
                </div>
                <div className="text-xs text-yellow-600 mt-1">Toplam kazanç</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-sm text-gray-500">Ev Sahibi Ödemeleri</div>
                <div className="text-2xl font-bold text-green-700 mt-1">
                  {stats.totalLandlordPayouts.toLocaleString('tr-TR')} TL
                </div>
                <div className="text-xs text-gray-400 mt-1">Net ev sahibi ödemesi</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hizli Erisim */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Yönetim</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AdminLink href="/dashboard/admin/users" title="Kullanıcılar" desc="Tüm kullanıcıları listele" icon="U" />
          <AdminLink href="/dashboard/admin/contracts" title="Sözleşmeler" desc="Tüm sözleşmeleri görüntüle" icon="S" />
          <AdminLink href="/dashboard/admin/payments" title="Ödemeler" desc="Ödeme geçmişi ve detaylar" icon="O" />
          <AdminLink href="/dashboard/admin/commissions" title="Komisyon Raporu" desc="Gelir ve komisyon detayları" icon="K" />
          <AdminLink href="/dashboard/admin/support" title="Destek Mesajları" desc="Kullanıcı destek talepleri" icon="D" />
          <AdminLink href="/dashboard/admin/articles" title="Makaleler" desc="AI taslaklar, incele ve yayınla (Salı+Perş)" icon="M" />
          <AdminLink href="/dashboard/admin/suggestions" title="Geliştirme Önerileri" desc="Developer Agent görev listesi" icon="G" />
          <AdminLink href="/dashboard/admin/po" title="PO Günlüğü" desc="Günlük ürün raporu ve öneriler" icon="P" />
          <AdminLink href="/dashboard/admin/marketing" title="Pazarlama & Strateji" desc="Pazarlama raporları ve araştırma" icon="R" />
          <AdminLink href="/dashboard/admin/tasks" title="Görev Takibi" desc="Tüm görevler ve son tarihler" icon="T" />
          <AdminLink href="/dashboard/admin/agents" title="Agent KPI" desc="Agent performansı ve çalışma geçmişi" icon="A" />
          <AdminLink href="/dashboard/admin/promos" title="Promosyonlar" desc="Şablon oluştur, ata ve takip et" icon="F" />
          <AdminLink href="/dashboard/admin/analytics" title="Site Analitiği" desc="Sayfa görüntülemesi, cihaz, hata takibi" icon="A" />
          <AdminLink href="/dashboard/admin/newsletter" title="Bülten Aboneleri" desc="Newsletter aboneleri ve istatistikler" icon="B" />
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
