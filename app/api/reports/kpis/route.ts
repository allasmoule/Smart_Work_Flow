import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/withRole';

export async function GET(req: NextRequest) {
  const { error } = await requireRole(['ADMIN']);
  if (error) return error;

  try {
    const now = new Date();

    const [
      totalTasks,
      inProgress,
      overdue,
      completedTasks,
      avgCompletion,
      tasksPerUser,
    ] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.task.count({
        where: {
          status: { not: 'APPROVED' },
          deadline: { lt: now },
        },
      }),
      prisma.task.findMany({
        where: {
          status: 'APPROVED',
          approvedAt: { not: null },
          startedAt: { not: null },
        },
        select: {
          startedAt: true,
          approvedAt: true,
        },
      }),
      prisma.user.count(),
      prisma.task.groupBy({
        by: ['assignedToId'],
        _count: true,
      }),
    ]);

    const avgCompletionHours = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => {
          if (task.startedAt && task.approvedAt) {
            const hours = (task.approvedAt.getTime() - task.startedAt.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0) / completedTasks.length
      : 0;

    const avgTasksPerUser = tasksPerUser.length > 0
      ? tasksPerUser.reduce((sum, g) => sum + g._count, 0) / tasksPerUser.length
      : 0;

    return NextResponse.json({
      totalTasks,
      inProgress,
      overdue,
      avgCompletionHours,
      tasksPerUser: avgTasksPerUser,
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

