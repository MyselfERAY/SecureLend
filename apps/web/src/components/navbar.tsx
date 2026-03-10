'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

const mainLinks = [
  { href: '/dashboard', label: 'Panel' },
  { href: '/dashboard/properties', label: 'Mulkler' },
  { href: '/dashboard/contracts', label: 'Sozlesmeler' },
  { href: '/dashboard/payments', label: 'Odemeler' },
  { href: '/dashboard/bank', label: 'Banka' },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-lg font-extrabold tracking-tight text-slate-900" onClick={closeMobileMenu}>
              SecureLend
            </Link>
            <div className="hidden items-center gap-1 sm:flex">
              {mainLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {link.label}
                </Link>
              ))}
              {user?.roles.includes('ADMIN') && (
                <Link href="/dashboard/admin" className="rounded-lg px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                  Admin
                </Link>
              )}
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/dashboard/profile" className="hidden rounded-lg px-2 py-1 text-right transition hover:bg-slate-50 sm:block">
                <div className="text-sm font-semibold text-slate-900">{user.fullName}</div>
                <div className="text-xs font-medium text-slate-500">
                  {user.roles.length > 0 ? user.roles.join(', ') : 'Kullanici'}
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cikis
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 sm:hidden"
                aria-label="Menuyu ac"
                aria-expanded={mobileMenuOpen}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          )}
        </div>

        {mobileMenuOpen && (
          <div className="space-y-1 border-t border-slate-200 py-3 sm:hidden">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
            {user?.roles.includes('ADMIN') && (
              <Link
                href="/dashboard/admin"
                onClick={closeMobileMenu}
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                Admin
              </Link>
            )}
            <Link
              href="/dashboard/profile"
              onClick={closeMobileMenu}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              Profil
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
