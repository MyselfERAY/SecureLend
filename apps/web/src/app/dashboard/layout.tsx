'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { Navbar } from '../../components/navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, tokens } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !tokens) {
      router.replace('/auth/login');
    }
  }, [isLoading, tokens, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
          Yukleniyor...
        </div>
      </div>
    );
  }

  if (!tokens) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
