'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/logo';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

const sidebarLinks = [
  {
    href: '/dashboard',
    label: 'Panel',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/contracts',
    label: 'Sözleşmeler',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/payments',
    label: 'Ödemeler',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/properties',
    label: 'Mülkler',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/dashboard/bank',
    label: 'Banka',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/referral',
    label: 'Davet Et',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/notifications',
    label: 'Bildirimler',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    href: '/dashboard/profile',
    label: 'Profil',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, tokens, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !tokens) {
      router.replace('/auth/login');
    }
    // Admin users go directly to admin panel — regular dashboard is irrelevant
    if (!isLoading && user?.roles.includes('ADMIN') && pathname === '/dashboard') {
      router.replace('/dashboard/admin');
    }
  }, [isLoading, tokens, user, pathname, router]);

  const fetchUnreadCount = useCallback(async () => {
    if (!tokens?.accessToken) return;
    try {
      const res = await api<{ unreadCount: number }>('/api/v1/notifications/unread-count', {
        token: tokens.accessToken,
      });
      if (res.status === 'success' && res.data) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // Notification endpoint may not exist yet
    }
  }, [tokens?.accessToken]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1628]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          <span className="text-sm font-medium text-slate-400">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!tokens) return null;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-[#0a1628]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-700/50 bg-[#0d1b2a] transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-slate-700/50 px-6" onClick={() => setSidebarOpen(false)}>
          <Logo variant="light" size="sm" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {sidebarLinks
            .filter((link) => {
              // Admin users only see Admin panel — regular menu items are irrelevant
              if (user?.roles.includes('ADMIN')) return false;
              return true;
            })
            .map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
                {link.href === '/dashboard/notifications' && unreadCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          {user?.roles.includes('ADMIN') && (
            <Link
              href="/dashboard/admin"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname.startsWith('/dashboard/admin')
                  ? 'bg-rose-600/20 text-rose-400'
                  : 'text-rose-400/70 hover:bg-rose-900/20 hover:text-rose-300'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* User section at bottom */}
        <div className="border-t border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/30 text-sm font-bold text-blue-400">
              {user?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold text-slate-200">{user?.fullName}</div>
              <div className="truncate text-xs text-slate-500">
                {user?.roles.length ? user.roles.join(', ') : 'Kullanıcı'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-700/50 bg-[#0d1b2a]/95 px-4 backdrop-blur-sm sm:px-6">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 lg:hidden"
            aria-label="Menuyu ac"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Page title area - hidden on mobile, can be used by children */}
          <div className="hidden lg:block" />

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-3">
            {/* Notification bell */}
            <Link
              href="/dashboard/notifications"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-700/50 hover:text-slate-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User info (desktop) */}
            <div className="hidden items-center gap-3 sm:flex">
              <Link href="/dashboard/profile" className="text-right transition hover:opacity-80">
                <div className="text-sm font-semibold text-slate-200">{user?.fullName}</div>
                <div className="text-xs text-slate-500">
                  {user?.roles.length ? user.roles.join(', ') : 'Kullanıcı'}
                </div>
              </Link>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-600 bg-transparent px-3 py-1.5 text-sm font-medium text-slate-400 transition hover:bg-slate-700/50 hover:text-slate-200"
            >
              Çıkış
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
