'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, FileText, CreditCard, Wallet, Receipt, MessageSquare,
  BookOpen, Lightbulb, Target, Megaphone, CheckSquare, Activity,
  Gift, BarChart3, Mail, ArrowRight, TrendingUp, TrendingDown,
  LucideIcon, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';

interface OverviewStats {
  totalUsers: number;
  newUsersThisMonth: number;
  totalContracts: number;
  activeContracts: number;
  totalPayments: number;
  completedPayments: number;
  totalRevenue: number;
  totalCommission: number;
  totalLandlordPayouts: number;
  commissionCount: number;
  totalMonthlyRentVolume?: number;
  kmhApplications?: { pending: number; approved: number; rejected: number; total: number };
  averageCreditScoreApprovedKmh?: number | null;
}

interface Suggestion {
  id: string;
  status: string;
  agentNotes: string | null;
  priority: string;
}

export default function AdminDashboardPage() {
  const { tokens } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens?.accessToken) return;
    Promise.all([
      api<OverviewStats>('/api/v1/admin/overview', { token: tokens.accessToken }),
      api<Suggestion[]>('/api/v1/suggestions', { token: tokens.accessToken }),
    ])
      .then(([overview, sugs]) => {
        if (overview.status === 'success' && overview.data) setStats(overview.data);
        if (sugs.status === 'success' && sugs.data) setSuggestions(sugs.data);
      })
      .finally(() => setLoading(false));
  }, [tokens?.accessToken]);

  // Derived metrics
  const pendingSuggestions = suggestions.filter((s) => s.status === 'REJECTED' && !s.agentNotes).length;
  const approvedSuggestions = suggestions.filter((s) => s.status === 'PENDING').length;
  const inProgressSuggestions = suggestions.filter((s) => s.status === 'IN_PROGRESS').length;
  const criticalSuggestions = suggestions.filter(
    (s) => s.priority === 'CRITICAL' && s.status === 'REJECTED' && !s.agentNotes,
  ).length;

  const paymentCompletionRate = stats && stats.totalPayments > 0
    ? Math.round((stats.completedPayments / stats.totalPayments) * 100)
    : 0;

  const contractActivationRate = stats && stats.totalContracts > 0
    ? Math.round((stats.activeContracts / stats.totalContracts) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            {new Date().toLocaleDateString('tr-TR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </div>
          <h1 className="text-2xl font-bold text-white">Yönetim Paneli</h1>
        </div>

        {/* Critical alerts */}
        {!loading && criticalSuggestions > 0 && (
          <Link
            href="/dashboard/admin/suggestions"
            className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/15 transition"
          >
            <AlertCircle className="h-4 w-4" />
            {criticalSuggestions} kritik öneri bekliyor
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {loading && <LoadingLayout />}

      {!loading && stats && (
        <>
          {/* BENTO LAYOUT */}
          <div className="grid grid-cols-12 gap-3">

            {/* Revenue card — 5 cols, tall */}
            <div className="col-span-12 md:col-span-5 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-[#0d1b2a] to-[#0d1b2a] p-5">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-300 uppercase tracking-wider">
                <TrendingUp className="h-3.5 w-3.5" />
                Platform Geliri
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">
                  {stats.totalCommission.toLocaleString('tr-TR')}
                </span>
                <span className="text-lg text-amber-200/60">TL</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                %1 garanti ücreti · {stats.commissionCount} işlem
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-500">İşlem Hacmi</div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {stats.totalRevenue.toLocaleString('tr-TR')} <span className="text-xs text-slate-500">TL</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Ev Sahibine Net</div>
                  <div className="text-sm font-semibold text-emerald-400 mt-0.5">
                    {stats.totalLandlordPayouts.toLocaleString('tr-TR')} <span className="text-xs text-slate-500">TL</span>
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard/admin/commissions"
                className="inline-flex items-center gap-1 mt-4 text-xs font-medium text-amber-400 hover:text-amber-300"
              >
                Detaylı rapor <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Right: 4-cell metric grid */}
            <div className="col-span-12 md:col-span-7 grid grid-cols-2 gap-3">
              <MetricTile
                href="/dashboard/admin/users"
                icon={Users}
                label="Kullanıcı"
                value={stats.totalUsers}
                sub={stats.newUsersThisMonth > 0 ? `+${stats.newUsersThisMonth} bu ay` : 'Yeni kullanıcı yok'}
                tone="blue"
              />
              <MetricTile
                href="/dashboard/admin/contracts"
                icon={FileText}
                label="Aktif Sözleşme"
                value={stats.activeContracts}
                sub={`${stats.totalContracts} toplam · %${contractActivationRate} aktif`}
                tone="emerald"
                progress={contractActivationRate}
              />
              <MetricTile
                href="/dashboard/admin/payments"
                icon={CreditCard}
                label="Tamamlanan Ödeme"
                value={stats.completedPayments}
                sub={`${stats.totalPayments} toplam · %${paymentCompletionRate}`}
                tone="violet"
                progress={paymentCompletionRate}
              />
              <MetricTile
                href="/dashboard/admin/commissions"
                icon={Receipt}
                label="Garanti Ücreti"
                value={stats.commissionCount}
                sub="Toplam işlem"
                tone="amber"
              />
            </div>

            {/* Agent pipeline — 8 cols */}
            <Link
              href="/dashboard/admin/suggestions"
              className="col-span-12 md:col-span-8 rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5 hover:border-slate-600 transition group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-400" />
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Geliştirme Pipeline
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 transition" />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <PipelineStage label="Yeni" count={pendingSuggestions} tone="info" />
                <PipelineStage label="Onaylı" count={approvedSuggestions} tone="warning" />
                <PipelineStage label="Geliştiriliyor" count={inProgressSuggestions} tone="info" active />
                <PipelineStage
                  label="Tamamlandı"
                  count={suggestions.filter((s) => s.status === 'DONE').length}
                  tone="success"
                />
              </div>
            </Link>

            {/* KMH stats — 4 cols */}
            {stats.kmhApplications && (
              <div className="col-span-12 md:col-span-4 rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  KMH Başvuruları
                </div>
                <div className="text-3xl font-bold text-white">{stats.kmhApplications.total}</div>
                <div className="text-xs text-slate-500 mt-1">Toplam başvuru</div>
                <div className="mt-4 space-y-1.5 text-xs">
                  <KmhRow label="Onaylı" count={stats.kmhApplications.approved} tone="success" />
                  <KmhRow label="Bekliyor" count={stats.kmhApplications.pending} tone="warning" />
                  <KmhRow label="Reddedildi" count={stats.kmhApplications.rejected} tone="danger" />
                </div>
                {stats.averageCreditScoreApprovedKmh != null && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <div className="text-xs text-slate-500">Ort. Onay Skoru</div>
                    <div className="text-sm font-semibold text-white">
                      {stats.averageCreditScoreApprovedKmh}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modules grid — uniform 4 col */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-slate-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tüm Modüller
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {MODULES.map((m) => <ModuleTile key={m.href} {...m} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────── */

function LoadingLayout() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-5 h-48 rounded-xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
        <div className="col-span-12 md:col-span-7 grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Metric Tile ────────────────────────────────────────────── */

function MetricTile({
  href, icon: Icon, label, value, sub, tone, progress,
}: {
  href: string; icon: LucideIcon; label: string; value: number; sub: string;
  tone: 'blue' | 'emerald' | 'violet' | 'amber';
  progress?: number;
}) {
  const colors = {
    blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    bar: 'bg-blue-500' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'bg-emerald-500' },
    violet:  { text: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  bar: 'bg-violet-500' },
    amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   bar: 'bg-amber-500' },
  }[tone];
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-4 hover:border-slate-600 transition flex flex-col justify-between"
    >
      <div className="flex items-start justify-between">
        <div className={`h-8 w-8 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${colors.text}`} />
        </div>
        <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition" />
      </div>
      <div className="mt-3">
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-2xl font-bold text-white mt-0.5">{value.toLocaleString('tr-TR')}</div>
        <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
        {progress != null && (
          <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div className={`h-full ${colors.bar} transition-all`} style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}

/* ─── Pipeline Stage ─────────────────────────────────────────── */

function PipelineStage({
  label, count, tone, active,
}: {
  label: string; count: number;
  tone: 'info' | 'warning' | 'success';
  active?: boolean;
}) {
  const colors = {
    info:    'text-blue-400',
    warning: 'text-amber-400',
    success: 'text-emerald-400',
  }[tone];
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3 relative">
      {active && count > 0 && (
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
      )}
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-bold ${count > 0 ? colors : 'text-slate-600'} mt-1`}>{count}</div>
    </div>
  );
}

/* ─── KMH Row ────────────────────────────────────────────────── */

function KmhRow({ label, count, tone }: { label: string; count: number; tone: 'success' | 'warning' | 'danger' }) {
  const color = { success: 'text-emerald-400', warning: 'text-amber-400', danger: 'text-rose-400' }[tone];
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={`font-mono font-semibold ${color}`}>{count}</span>
    </div>
  );
}

/* ─── Module Tile ────────────────────────────────────────────── */

interface ModuleDef {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}

const MODULES: ModuleDef[] = [
  { href: '/dashboard/admin/users',       icon: Users,         title: 'Kullanıcılar',        desc: 'Liste, filtre, KYC durumu' },
  { href: '/dashboard/admin/contracts',   icon: FileText,      title: 'Sözleşmeler',         desc: 'Tüm sözleşmeler, durumlar' },
  { href: '/dashboard/admin/support',     icon: MessageSquare, title: 'Destek Mesajları',    desc: 'Kullanıcı talepleri' },
  { href: '/dashboard/admin/payments',    icon: CreditCard,    title: 'Ödemeler',            desc: 'Ödeme geçmişi ve detay' },
  { href: '/dashboard/admin/commissions', icon: Wallet,        title: 'Garanti Ücreti',      desc: 'Gelir raporu, CSV export' },
  { href: '/dashboard/admin/promos',      icon: Gift,          title: 'Promosyonlar',        desc: 'Şablon, atama, takip' },
  { href: '/dashboard/admin/articles',    icon: BookOpen,      title: 'Makaleler',           desc: 'AI taslakları, yayın' },
  { href: '/dashboard/admin/marketing',   icon: Megaphone,     title: 'Pazarlama',           desc: 'Raporlar, araştırma' },
  { href: '/dashboard/admin/newsletter',  icon: Mail,          title: 'Bülten',              desc: 'Newsletter aboneleri' },
  { href: '/dashboard/admin/suggestions', icon: Lightbulb,     title: 'Geliştirme Önerileri', desc: 'Dev Agent kuyruğu' },
  { href: '/dashboard/admin/po',          icon: Target,        title: 'PO Günlüğü',          desc: 'Ürün raporu, öneriler' },
  { href: '/dashboard/admin/tasks',       icon: CheckSquare,   title: 'Görev Takibi',        desc: 'Tüm görevler ve tarih' },
  { href: '/dashboard/admin/agents',      icon: Activity,      title: 'Agent KPI',           desc: 'Performans ve geçmiş' },
  { href: '/dashboard/admin/analytics',   icon: BarChart3,     title: 'Site Analitiği',      desc: 'Görüntüleme, hata' },
];

function ModuleTile({ href, icon: Icon, title, desc }: ModuleDef) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-700/50 bg-[#0d1b2a] p-3 hover:border-slate-600 hover:bg-[#0f2037] transition flex items-center gap-3"
    >
      <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition">
        <Icon className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-white text-sm truncate">{title}</div>
        <div className="text-xs text-slate-500 truncate">{desc}</div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-slate-700 group-hover:text-slate-400 transition shrink-0" />
    </Link>
  );
}
