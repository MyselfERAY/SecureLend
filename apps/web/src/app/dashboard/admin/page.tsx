'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, FileText, CreditCard, Wallet, Receipt, MessageSquare,
  BookOpen, Lightbulb, Target, Megaphone, CheckSquare, Activity,
  Gift, BarChart3, Mail, ShieldCheck, TrendingUp, ArrowUpRight,
  LucideIcon,
} from 'lucide-react';
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Yönetim Paneli</h1>
          <p className="text-sm text-slate-400 mt-1">Platform metrikleri, finansal özet ve modül erişimi</p>
        </div>
        <div className="text-xs text-slate-500">
          Canlı veri · {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {loading && <LoadingState />}

      {!loading && stats && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Kullanıcı"
              value={stats.totalUsers}
              icon={Users}
              accent="blue"
            />
            <StatCard
              label="Aktif Sözleşme"
              value={stats.activeContracts}
              sublabel={`/${stats.totalContracts} toplam`}
              icon={FileText}
              accent="emerald"
            />
            <StatCard
              label="Tamamlanan Ödeme"
              value={stats.completedPayments}
              sublabel={`/${stats.totalPayments} toplam`}
              icon={CheckSquare}
              accent="violet"
            />
            <StatCard
              label="Garanti Ücreti Adedi"
              value={stats.commissionCount}
              icon={Receipt}
              accent="amber"
            />
          </div>

          {/* Financial Summary */}
          <section>
            <SectionTitle icon={TrendingUp}>Finansal Özet</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FinanceCard
                label="Toplam İşlem Hacmi"
                value={stats.totalRevenue}
                sub={`${stats.commissionCount} işlem`}
                tone="neutral"
              />
              <FinanceCard
                label="Platform Geliri (%1)"
                value={stats.totalCommission}
                sub="Garanti ücreti toplamı"
                tone="highlight"
              />
              <FinanceCard
                label="Ev Sahibi Ödemeleri"
                value={stats.totalLandlordPayouts}
                sub="Net dağıtılan"
                tone="positive"
              />
            </div>
          </section>
        </>
      )}

      {/* Modules — grouped by category */}
      <section>
        <SectionTitle icon={Activity}>Modüller</SectionTitle>

        <CategoryGroup title="Kullanıcı & Sözleşme">
          <ModuleCard href="/dashboard/admin/users" icon={Users} title="Kullanıcılar" desc="Liste, filtre, KYC durumu" />
          <ModuleCard href="/dashboard/admin/contracts" icon={FileText} title="Sözleşmeler" desc="Tüm sözleşmeler, durumlar" />
          <ModuleCard href="/dashboard/admin/kyc-compliance" icon={ShieldCheck} title="KYC Uyumluluk" desc="Doğrulama dağılımı, UAVT oranı" />
          <ModuleCard href="/dashboard/admin/support" icon={MessageSquare} title="Destek Mesajları" desc="Kullanıcı talepleri" />
        </CategoryGroup>

        <CategoryGroup title="Finans">
          <ModuleCard href="/dashboard/admin/payments" icon={CreditCard} title="Ödemeler" desc="Ödeme geçmişi ve detay" />
          <ModuleCard href="/dashboard/admin/commissions" icon={Wallet} title="Garanti Ücreti Raporu" desc="Gelir, CSV export" />
          <ModuleCard href="/dashboard/admin/promos" icon={Gift} title="Promosyonlar" desc="Şablon, atama, takip" />
        </CategoryGroup>

        <CategoryGroup title="İçerik & Pazarlama">
          <ModuleCard href="/dashboard/admin/articles" icon={BookOpen} title="Makaleler" desc="AI taslakları, yayın" />
          <ModuleCard href="/dashboard/admin/marketing" icon={Megaphone} title="Pazarlama & Strateji" desc="Raporlar ve araştırma" />
          <ModuleCard href="/dashboard/admin/newsletter" icon={Mail} title="Bülten Aboneleri" desc="Newsletter ve metrikler" />
        </CategoryGroup>

        <CategoryGroup title="Agent Sistemi">
          <ModuleCard href="/dashboard/admin/suggestions" icon={Lightbulb} title="Geliştirme Önerileri" desc="Dev Agent kuyruğu" />
          <ModuleCard href="/dashboard/admin/po" icon={Target} title="PO Günlüğü" desc="Ürün raporu, öneriler" />
          <ModuleCard href="/dashboard/admin/tasks" icon={CheckSquare} title="Görev Takibi" desc="Tüm görevler ve tarih" />
          <ModuleCard href="/dashboard/admin/agents" icon={Activity} title="Agent KPI" desc="Performans ve geçmiş" />
        </CategoryGroup>

        <CategoryGroup title="Analitik">
          <ModuleCard href="/dashboard/admin/analytics" icon={BarChart3} title="Site Analitiği" desc="Görüntüleme, hata, cihaz" />
        </CategoryGroup>
      </section>
    </div>
  );
}

// ─── Components ────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-slate-800/50 border border-slate-700/50 animate-pulse" />
      ))}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
      <Icon className="h-4 w-4" />
      {children}
    </h2>
  );
}

function CategoryGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {children}
      </div>
    </div>
  );
}

const ACCENT_CLASSES = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
} as const;

type Accent = keyof typeof ACCENT_CLASSES;

function StatCard({
  label, value, sublabel, icon: Icon, accent,
}: {
  label: string; value: number; sublabel?: string; icon: LucideIcon; accent: Accent;
}) {
  const c = ACCENT_CLASSES[accent];
  return (
    <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 hover:border-slate-600 transition">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{value.toLocaleString('tr-TR')}</span>
            {sublabel && <span className="text-xs text-slate-500">{sublabel}</span>}
          </div>
        </div>
        <div className={`h-9 w-9 rounded-lg ${c.bg} ${c.border} border flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${c.text}`} />
        </div>
      </div>
    </div>
  );
}

function FinanceCard({
  label, value, sub, tone,
}: {
  label: string; value: number; sub: string; tone: 'neutral' | 'highlight' | 'positive';
}) {
  const styles = {
    neutral: 'bg-[#0d1b2a] border-slate-700/50',
    highlight: 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20',
    positive: 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
  };
  const valueColor = {
    neutral: 'text-white',
    highlight: 'text-amber-300',
    positive: 'text-emerald-300',
  };
  return (
    <div className={`rounded-xl border p-5 ${styles[tone]}`}>
      <div className="text-sm text-slate-400">{label}</div>
      <div className={`text-2xl font-bold mt-2 ${valueColor[tone]}`}>
        {value.toLocaleString('tr-TR')} <span className="text-base font-medium opacity-75">TL</span>
      </div>
      <div className="text-xs text-slate-500 mt-1.5">{sub}</div>
    </div>
  );
}

function ModuleCard({
  href, icon: Icon, title, desc,
}: {
  href: string; icon: LucideIcon; title: string; desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-4 hover:border-blue-500/50 hover:bg-[#0f2037] transition flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition">
          <Icon className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 transition" />
      </div>
      <div className="font-semibold text-white text-sm">{title}</div>
      <div className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</div>
    </Link>
  );
}
