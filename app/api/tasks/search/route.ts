import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/withRole';

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    // Search using Prisma (works with any database)
    const searchTerm = q.toLowerCase();
    const where: any = {
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    if (session?.user?.role === 'WORKER') {
      where.assignedToId = session.user.id;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 20,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error searching tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

