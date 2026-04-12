'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from './logo';

interface SiteNavProps {
  variant?: 'light' | 'dark';
}

export default function SiteNav({ variant = 'light' }: SiteNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDark = variant === 'dark';

  const headerCls = isDark
    ? 'sticky top-0 z-50 border-b border-slate-700/50 bg-[#0d1b2a]/95 backdrop-blur-sm'
    : 'sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm';

  const linkCls = isDark
    ? 'min-h-[44px] min-w-[44px] flex items-center text-sm font-medium text-slate-400 hover:text-white transition'
    : 'min-h-[44px] min-w-[44px] flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition';

  const loginCls = isDark
    ? 'min-h-[44px] flex items-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800'
    : 'min-h-[44px] flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50';

  const mobileBtnCls = isDark
    ? 'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 md:hidden'
    : 'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden';

  const mobileMenuCls = isDark
    ? 'border-t border-slate-700/50 bg-[#0d1b2a] px-4 py-4 md:hidden'
    : 'border-t border-slate-200 bg-white px-4 py-4 md:hidden';

  const mobileLinkCls = isDark
    ? 'min-h-[44px] flex items-center text-sm font-medium text-slate-400'
    : 'min-h-[44px] flex items-center text-sm font-medium text-slate-600';

  const mobileLoginCls = isDark
    ? 'min-h-[44px] flex items-center text-sm font-semibold text-slate-300'
    : 'min-h-[44px] flex items-center text-sm font-semibold text-slate-700';

  const hrCls = isDark ? 'border-slate-700/50' : 'border-slate-200';

  return (
    <header className={headerCls}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Logo size="md" variant={isDark ? 'light' : 'dark'} />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/#nasil-calisir" className={linkCls}>
            Nasıl Çalışır?
          </Link>
          <Link href="/rehber" className={linkCls}>
            Rehber
          </Link>
          <Link href="/fiyatlandirma" className={linkCls}>
            Fiyatlandırma
          </Link>
          <Link href="/sablonlar" className={linkCls}>
            Şablonlar
          </Link>
          <Link href="/#iletisim" className={linkCls}>
            İletişim
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/auth/login" className={loginCls}>
            Giriş Yap
          </Link>
          <Link
            href="/auth/register"
            className="min-h-[44px] flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Ücretsiz Hesap Oluştur
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={mobileBtnCls}
          aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {mobileMenuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className={mobileMenuCls}>
          <div className="flex flex-col gap-3">
            <Link href="/#nasil-calisir" onClick={() => setMobileMenuOpen(false)} className={mobileLinkCls}>Nasıl Çalışır?</Link>
            <Link href="/rehber" onClick={() => setMobileMenuOpen(false)} className={mobileLinkCls}>Rehber</Link>
            <Link href="/fiyatlandirma" onClick={() => setMobileMenuOpen(false)} className={mobileLinkCls}>Fiyatlandırma</Link>
            <Link href="/sablonlar" onClick={() => setMobileMenuOpen(false)} className={mobileLinkCls}>Şablonlar</Link>
            <Link href="/#iletisim" onClick={() => setMobileMenuOpen(false)} className={mobileLinkCls}>İletişim</Link>
            <hr className={hrCls} />
            <Link href="/auth/login" className={mobileLoginCls}>Giriş Yap</Link>
            <Link href="/auth/register" className="min-h-[44px] flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-center text-sm font-semibold text-white">Ücretsiz Hesap Oluştur</Link>
          </div>
        </div>
      )}
    </header>
  );
}
