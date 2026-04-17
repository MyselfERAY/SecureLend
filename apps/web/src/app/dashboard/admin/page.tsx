'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, FileText, CreditCard, Wallet, Receipt, MessageSquare,
  BookOpen, Lightbulb, Target, Megaphone, CheckSquare, Activity,
  Gift, BarChart3, Mail, TrendingUp, ArrowUpRight,
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

type CategoryKey = 'user' | 'finance' | 'content' | 'agent' | 'analytics';

interface Module {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  category: CategoryKey;
}

const CATEGORY_META: Record<CategoryKey, { label: string; accent: string }> = {
  user:      { label: 'Kullanıcı',  accent: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  finance:   { label: 'Finans',     accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  content:   { label: 'İçerik',     accent: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  agent:     { label: 'Agent',      accent: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  analytics: { label: 'Analitik',   accent: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
};

const MODULES: Module[] = [
  { href: '/dashboard/admin/users',        icon: Users,         title: 'Kullanıcılar',       desc: 'Liste, filtre, KYC durumu',         category: 'user' },
  { href: '/dashboard/admin/contracts',    icon: FileText,      title: 'Sözleşmeler',        desc: 'Tüm sözleşmeler, durumlar',         category: 'user' },
  { href: '/dashboard/admin/support',      icon: MessageSquare, title: 'Destek Mesajları',   desc: 'Kullanıcı talepleri',               category: 'user' },
  { href: '/dashboard/admin/payments',     icon: CreditCard,    title: 'Ödemeler',           desc: 'Ödeme geçmişi ve detay',            category: 'finance' },
  { href: '/dashboard/admin/commissions',  icon: Wallet,        title: 'Garanti Ücreti',     desc: 'Gelir raporu, CSV export',          category: 'finance' },
  { href: '/dashboard/admin/promos',       icon: Gift,          title: 'Promosyonlar',       desc: 'Şablon, atama, takip',              category: 'finance' },
  { href: '/dashboard/admin/articles',     icon: BookOpen,      title: 'Makaleler',          desc: 'AI taslakları, yayın',              category: 'content' },
  { href: '/dashboard/admin/marketing',    icon: Megaphone,     title: 'Pazarlama',          desc: 'Raporlar ve araştırma',             category: 'content' },
  { href: '/dashboard/admin/newsletter',   icon: Mail,          title: 'Bülten',             desc: 'Newsletter ve metrikler',           category: 'content' },
  { href: '/dashboard/admin/suggestions',  icon: Lightbulb,     title: 'Geliştirme Önerileri', desc: 'Dev Agent kuyruğu',               category: 'agent' },
  { href: '/dashboard/admin/po',           icon: Target,        title: 'PO Günlüğü',         desc: 'Ürün raporu, öneriler',             category: 'agent' },
  { href: '/dashboard/admin/tasks',        icon: CheckSquare,   title: 'Görev Takibi',       desc: 'Tüm görevler ve tarih',             category: 'agent' },
  { href: '/dashboard/admin/agents',       icon: Activity,      title: 'Agent KPI',          desc: 'Performans ve geçmiş',              category: 'agent' },
  { href: '/dashboard/admin/analytics',    icon: BarChart3,     title: 'Site Analitiği',     desc: 'Görüntüleme, hata, cihaz',          category: 'analytics' },
];

export default function AdminDashboardPage() {
  const { tokens } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens?.accessToken) return;
    api<OverviewStats>('/api/v1/admin/overview', { token: tokens.accessToken })
      .then((res) => { if (res.status === 'success' && res.data) setStats(res.data); })
      .finally(() => setLoading(false));
  }, [tokens?.accessToken]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Yönetim Paneli</h1>
          <p className="text-sm text-slate-400 mt-1">Platform metrikleri, finansal özet ve modül erişimi</p>
        </div>
        <div className="text-xs text-slate-500">
          {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Stat row — compact */}
      {loading && <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-slate-800/40 border border-slate-700/50 animate-pulse" />)}
      </div>}

      {!loading && stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatItem label="Kullanıcı"          value={stats.totalUsers}                            icon={Users}       tone="blue" />
            <StatItem label="Aktif Sözleşme"     value={stats.activeContracts}   sub={`/${stats.totalContracts}`} icon={FileText}    tone="emerald" />
            <StatItem label="Tamamlanan Ödeme"   value={stats.completedPayments} sub={`/${stats.totalPayments}`}  icon={CheckSquare} tone="violet" />
            <StatItem label="Garanti Ücreti"     value={stats.commissionCount}                       icon={Receipt}     tone="amber" />
          </div>

          {/* Financial strip — single row, inline */}
          <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Finansal Özet</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-700/50 -mx-5">
              <FinItem label="Toplam İşlem Hacmi"  value={stats.totalRevenue}          sub={`${stats.commissionCount} işlem`} tone="neutral" />
              <FinItem label="Platform Geliri (%1)" value={stats.totalCommission}       sub="Garanti ücreti"                    tone="amber" />
              <FinItem label="Ev Sahibine Net"       value={stats.totalLandlordPayouts}  sub="Dağıtılan"                         tone="emerald" />
            </div>
          </div>
        </>
      )}

      {/* Modules — uniform 4-column grid with category dot */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-slate-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Modüller</h2>
          <div className="ml-auto flex items-center gap-3">
            {Object.entries(CATEGORY_META).map(([k, m]) => (
              <div key={k} className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className={`h-1.5 w-1.5 rounded-full ${m.accent.split(' ').find(c => c.startsWith('bg-'))?.replace('/10', '')}`} />
                {m.label}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {MODULES.map((m) => (
            <ModuleCard key={m.href} module={m} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Compact Stat Item ──────────────────────────────────────── */

function StatItem({
  label, value, sub, icon: Icon, tone,
}: {
  label: string; value: number; sub?: string;
  icon: LucideIcon;
  tone: 'blue' | 'emerald' | 'violet' | 'amber';
}) {
  const colors = {
    blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20' },
    amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  }[tone];
  return (
    <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center shrink-0`}>
        <Icon className={`h-4 w-4 ${colors.text}`} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-slate-400">{label}</div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-xl font-bold text-white">{value.toLocaleString('tr-TR')}</span>
          {sub && <span className="text-xs text-slate-500">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

/* ─── Financial Strip Item ───────────────────────────────────── */

function FinItem({
  label, value, sub, tone,
}: {
  label: string; value: number; sub: string; tone: 'neutral' | 'amber' | 'emerald';
}) {
  const valueColor = {
    neutral: 'text-white',
    amber: 'text-amber-300',
    emerald: 'text-emerald-300',
  }[tone];
  return (
    <div className="px-5 py-2">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${valueColor}`}>
        {value.toLocaleString('tr-TR')}
        <span className="text-sm font-medium opacity-60 ml-1">TL</span>
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

/* ─── Module Card ────────────────────────────────────────────── */

function ModuleCard({ module }: { module: Module }) {
  const { href, icon: Icon, title, desc, category } = module;
  const catMeta = CATEGORY_META[category];
  const catColor = catMeta.accent.split(' ').find(c => c.startsWith('bg-'))?.replace('/10', '');
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-4 hover:border-slate-600 hover:bg-[#0f2037] transition flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`h-9 w-9 rounded-lg border flex items-center justify-center ${catMeta.accent}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${catColor}`} />
          <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition" />
        </div>
      </div>
      <div className="font-semibold text-white text-sm leading-tight">{title}</div>
      <div className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</div>
    </Link>
  );
}
