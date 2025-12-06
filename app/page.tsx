'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile?.role === 'admin' || profile?.role === 'ADMIN') {
        router.push('/admin');
      } else if (profile?.role === 'manager' || profile?.role === 'MANAGER') {
        router.push('/manager');
      } else if (profile?.role === 'worker' || profile?.role === 'WORKER') {
        router.push('/worker');
      }
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return null;
}
