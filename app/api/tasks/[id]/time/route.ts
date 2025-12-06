import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entries = await prisma.timeEntry.findMany({
      where: {
        taskId: params.id,
        userId: session.user.id,
      },
      orderBy: {
        startAt: 'desc',
      },
    });

    const totalSeconds = entries
      .filter(e => e.durationSec)
      .reduce((sum, e) => sum + (e.durationSec || 0), 0);

    return NextResponse.json({
      entries,
      totalSeconds,
      totalHours: (totalSeconds / 3600).toFixed(2),
    });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

