'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, tokens, isLoading } = useAuth();
  const router = useRouter();

  // Race condition fix: AuthContext'te isLoading, token restore biter bitmez
  // false'a döner ama `user` ayrı bir useEffect'te fetch edilir. O pencerede
  // `!user` true olur — eski guard buraya takılıp admin user'ı /dashboard'a
  // yönlendiriyordu; oradan da parent layout /dashboard/admin'e redirect
  // ediyor, sonuçta hard reload sonrası her admin alt sayfası /admin'e
  // düşüyordu. Artık `user` null iken (tokens varsa hâlâ yükleniyor demektir)
  // dokunmuyoruz; kesin "non-admin user" durumunda redirect ediyoruz.
  useEffect(() => {
    if (isLoading) return;
    if (!tokens) return; // parent dashboard layout /auth/login'e yönlendirir
    if (!user) return; // profile fetch devam ediyor — bekle
    if (!user.roles.includes('ADMIN')) {
      router.replace('/dashboard');
    }
  }, [isLoading, tokens, user, router]);

  // Admin değilse (veya henüz user yüklenmediyse) spinner göster.
  if (isLoading || !user || !user.roles.includes('ADMIN')) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
