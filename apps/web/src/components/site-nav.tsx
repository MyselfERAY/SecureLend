'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from './logo';

export default function SiteNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Logo size="md" />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/#nasil-calisir" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            Nasıl Çalışır?
          </Link>
          <Link href="/rehber" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            Rehber
          </Link>
          <Link href="/fiyatlandirma" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            Fiyatlandirma
          </Link>
          <Link href="/#iletisim" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            İletişim
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/auth/login"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Giriş Yap
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Hesap Oluştur
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/#nasil-calisir" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600">Nasıl Çalışır?</Link>
            <Link href="/rehber" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600">Rehber</Link>
            <Link href="/fiyatlandirma" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600">Fiyatlandirma</Link>
            <Link href="/#iletisim" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600">İletişim</Link>
            <hr className="border-slate-200" />
            <Link href="/auth/login" className="text-sm font-semibold text-slate-700">Giriş Yap</Link>
            <Link href="/auth/register" className="rounded-lg bg-blue-700 px-4 py-2 text-center text-sm font-semibold text-white">Hesap Oluştur</Link>
          </div>
        </div>
      )}
    </header>
  );
}
