import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/withRole';

export async function GET(req: NextRequest) {
  const { error } = await requireRole(['ADMIN']);
  if (error) return error;

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Task status distribution
    const statusCounts = await prisma.task.groupBy({
      by: ['status'],
      _count: true,
    });

    // Priority distribution
    const priorityCounts = await prisma.task.groupBy({
      by: ['priority'],
      _count: true,
    });

    // Task trends (last 7 days)
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const created = await prisma.task.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const completed = await prisma.task.count({
        where: {
          status: 'APPROVED',
          approvedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      trendData.push({
        date: startOfDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        created,
        completed,
      });
    }

    // Worker performance
    const workers = await prisma.user.findMany({
      where: { role: 'WORKER' },
      include: {
        assignedTasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    const workerPerformance = workers.map(worker => ({
      name: worker.name || worker.email,
      tasks: worker.assignedTasks.length,
      completed: worker.assignedTasks.filter(t => t.status === 'APPROVED').length,
    }));

    // Completion time trends (last 4 weeks)
    const completionTimeData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - (i * 7));

      const completedTasks = await prisma.task.findMany({
        where: {
          status: 'APPROVED',
          approvedAt: {
            gte: weekStart,
            lte: weekEnd,
          },
          startedAt: { not: null },
        },
        select: {
          startedAt: true,
          approvedAt: true,
        },
      });

      const avgHours = completedTasks.length > 0
        ? completedTasks.reduce((sum, task) => {
            if (task.startedAt && task.approvedAt) {
              return sum + (task.approvedAt.getTime() - task.startedAt.getTime()) / (1000 * 60 * 60);
            }
            return sum;
          }, 0) / completedTasks.length
        : 0;

      completionTimeData.push({
        week: `Week ${4 - i}`,
        avgHours: Math.round(avgHours * 10) / 10,
      });
    }

    return NextResponse.json({
      statusDistribution: statusCounts.map(s => ({
        status: s.status,
        count: s._count,
      })),
      priorityDistribution: priorityCounts.map(p => ({
        priority: p.priority,
        count: p._count,
      })),
      trends: trendData,
      workerPerformance,
      completionTime: completionTimeData,
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

