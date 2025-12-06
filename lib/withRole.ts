import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

type Role = 'ADMIN' | 'WORKER';

export async function requireRole(roles: Role[]) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }

  const userRole = session.user.role as Role;
  if (!roles.includes(userRole)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
  }

  return { error: null, session };
}

export async function requireAuth() {
  return requireRole(['ADMIN', 'WORKER']);
}

