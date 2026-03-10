'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !user.roles.includes('ADMIN'))) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user?.roles.includes('ADMIN')) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-gray-500">Yukleniyor...</div>
      </div>
    );
  }

  return <>{children}</>;
}
