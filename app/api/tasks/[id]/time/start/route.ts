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

    // Check if there's an active timer for this user
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        endAt: null,
      },
    });

    if (activeEntry) {
      return NextResponse.json(
        { error: 'You have an active timer. Stop it first.' },
        { status: 400 }
      );
    }

    const entry = await prisma.timeEntry.create({
      data: {
        taskId: params.id,
        userId: session.user.id,
        startAt: new Date(),
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error starting timer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

