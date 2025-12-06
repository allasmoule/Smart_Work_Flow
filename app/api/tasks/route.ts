import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/withRole';

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const assignedTo = searchParams.get('assignedTo');

  const where: any = {};
  if (assignedTo === 'me' && session?.user) {
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, priority, deadline, assignedToId } = body;

  if (!title || !deadline) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority: priority || 'MEDIUM',
      deadline: new Date(deadline),
      createdById: session.user.id,
      assignedToId: assignedToId || null,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // Trigger realtime update
  const { triggerTaskUpdate } = await import('@/lib/pusher');
  triggerTaskUpdate(task.id, { type: 'created', task });

  return NextResponse.json(task);
}

