import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        taskId: params.id,
        userId: session.user.id,
        endAt: null,
      },
    });

    if (!activeEntry) {
      return NextResponse.json({ error: 'No active timer found' }, { status: 404 });
    }

    const endAt = new Date();
    const durationSec = Math.floor((endAt.getTime() - activeEntry.startAt.getTime()) / 1000);

    const updated = await prisma.timeEntry.update({
      where: { id: activeEntry.id },
      data: {
        endAt,
        durationSec,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error stopping timer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

