'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'WORKER';
  image?: string | null;
};

type AuthContextType = {
  user: User | null;
  profile: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(status === 'loading');
  }, [status]);

  async function handleSignOut() {
    await nextAuthSignOut({ redirect: false });
    router.push('/login');
  }

  const user = session?.user
    ? {
        id: session.user.id || '',
        email: session.user.email || '',
        name: session.user.name || null,
        role: (session.user.role as 'ADMIN' | 'WORKER') || 'WORKER',
        image: session.user.image || null,
      }
    : null;

  return (
    <AuthContext.Provider value={{ user, profile: user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

