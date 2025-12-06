import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/withRole';

export async function GET(req: NextRequest) {
  const { error } = await requireRole(['ADMIN']);
  if (error) return error;

  try {
    try {
      const workers = await prisma.user.findMany({
        where: {
          role: 'WORKER',
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(workers);
    } catch (error) {
      console.error('Error fetching workers:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

