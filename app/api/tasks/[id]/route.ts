import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/withRole';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      assignedTo: true,
      createdBy: true,
      files: true,
      timeEntries: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();

  const task = await prisma.task.findUnique({
    where: { id: params.id },
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Check permissions
  if (session?.user?.role !== 'ADMIN' && task.assignedToId !== session?.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updateData: any = {};
  if (body.status) updateData.status = body.status;
  if (body.priority) updateData.priority = body.priority;
  if (body.title) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.deadline) updateData.deadline = new Date(body.deadline);
  if (body.assignedToId) updateData.assignedToId = body.assignedToId;

  // Update timestamps based on status
  if (body.status === 'IN_PROGRESS' && !task.startedAt) {
    updateData.startedAt = new Date();
  }
  if (body.status === 'SUBMITTED' && !task.submittedAt) {
    updateData.submittedAt = new Date();
  }
  if (body.status === 'APPROVED' && !task.approvedAt) {
    updateData.approvedAt = new Date();
  }

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: updateData,
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
  triggerTaskUpdate(updated.id, { type: 'updated', task: updated });

  return NextResponse.json(updated);
}

