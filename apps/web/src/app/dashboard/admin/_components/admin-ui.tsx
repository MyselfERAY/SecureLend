'use client';

import Link from 'next/link';
import { ChevronLeft, LucideIcon } from 'lucide-react';

/* ─── Page Header ─────────────────────────────────────────────── */

export function PageHeader({
  title, desc, icon: Icon, back, actions,
}: {
  title: string;
  desc?: string;
  icon?: LucideIcon;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition mb-3"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {back.label}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Icon className="h-5 w-5 text-blue-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {desc && <p className="text-sm text-slate-400 mt-1">{desc}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* ─── Card ───────────────────────────────────────────────────── */

export function Card({
  children, className = '', padding = true,
}: { children: React.ReactNode; className?: string; padding?: boolean }) {
  return (
    <div className={`rounded-xl border border-slate-700/50 bg-[#0d1b2a] ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────── */

export const ACCENT_CLASSES = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  slate: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
} as const;

export type Accent = keyof typeof ACCENT_CLASSES;

export function StatCard({
  label, value, sublabel, icon: Icon, accent = 'blue',
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  accent?: Accent;
}) {
  const c = ACCENT_CLASSES[accent];
  const displayValue = typeof value === 'number' ? value.toLocaleString('tr-TR') : value;
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{displayValue}</span>
            {sublabel && <span className="text-xs text-slate-500">{sublabel}</span>}
          </div>
        </div>
        {Icon && (
          <div className={`h-9 w-9 rounded-lg ${c.bg} ${c.border} border flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${c.text}`} />
          </div>
        )}
      </div>
    </Card>
  );
}

/* ─── Badge ──────────────────────────────────────────────────── */

const BADGE_TONES = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  neutral: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({
  tone = 'neutral', children,
}: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

/* ─── Data Table ─────────────────────────────────────────────── */

export interface Column<T> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => React.ReactNode;
  width?: string;
}

export function DataTable<T extends { id: string }>({
  columns, data, empty,
}: {
  columns: Column<T>[];
  data: T[];
  empty?: string;
}) {
  if (data.length === 0) {
    return (
      <Card>
        <div className="py-8 text-center text-sm text-slate-500">
          {empty || 'Gösterilecek kayıt yok.'}
        </div>
      </Card>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-800/40 border-b border-slate-700/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium text-slate-400 text-xs uppercase tracking-wider ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-800/30 transition">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-slate-200 ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────────── */

export function EmptyState({
  icon: Icon, title, desc,
}: { icon?: LucideIcon; title: string; desc?: string }) {
  return (
    <Card>
      <div className="py-12 text-center">
        {Icon && (
          <div className="inline-flex h-12 w-12 rounded-full bg-slate-800 border border-slate-700 items-center justify-center mb-3">
            <Icon className="h-6 w-6 text-slate-500" />
          </div>
        )}
        <div className="text-sm font-medium text-white">{title}</div>
        {desc && <div className="text-xs text-slate-400 mt-1">{desc}</div>}
      </div>
    </Card>
  );
}

/* ─── Loading ────────────────────────────────────────────────── */

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
      ))}
    </div>
  );
}

/* ─── Button ─────────────────────────────────────────────────── */

const BUTTON_VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white border border-transparent',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-600',
} as const;

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: 'sm' | 'md';
  icon?: LucideIcon;
}) {
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${sizeClass} ${props.className || ''}`}
    >
      {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      {children}
    </button>
  );
}
