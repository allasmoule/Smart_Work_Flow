'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'WORKER' | 'MANAGER' | 'admin' | 'worker' | 'manager';
};

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requiredRole) {
        const roleUpper = requiredRole.toUpperCase();
        const profileRole = (profile as any)?.role?.toUpperCase() || '';
        if (profileRole !== roleUpper && profileRole !== requiredRole.toUpperCase()) {
          router.push('/');
        }
      }
    }
  }, [user, profile, loading, requiredRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole) {
    const roleUpper = requiredRole.toUpperCase();
    const profileRole = (profile as any)?.role?.toUpperCase() || '';
    if (profileRole !== roleUpper && profileRole !== requiredRole.toUpperCase()) {
      return null;
    }
  }

  return <>{children}</>;
}
