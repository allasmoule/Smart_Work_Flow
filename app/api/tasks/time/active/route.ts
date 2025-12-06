import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        endAt: null,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!activeEntry) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      id: activeEntry.id,
      taskId: activeEntry.taskId,
      startAt: activeEntry.startAt,
      task: activeEntry.task,
    });
  } catch (error) {
    console.error('Error fetching active timer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

