import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/withRole';

export async function GET(req: NextRequest) {
  const { error } = await requireRole(['ADMIN']);
  if (error) return error;

  try {
    try {
      const searchParams = req.nextUrl.searchParams;
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      const format = searchParams.get('format') || 'json';

      const where: any = {};
      if (from) where.createdAt = { gte: new Date(from) };
      if (to) {
        where.createdAt = {
          ...where.createdAt,
          lte: new Date(to),
        };
      }

      const tasks = await prisma.task.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              name: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (format === 'csv') {
        const headers = ['ID', 'Title', 'Status', 'Priority', 'Assigned To', 'Created By', 'Deadline', 'Created At'];
        const rows = tasks.map(t => [
          t.id,
          t.title,
          t.status,
          t.priority,
          t.assignedTo?.name || t.assignedTo?.email || 'Unassigned',
          t.createdBy?.name || t.createdBy?.email || 'Unknown',
          t.deadline.toISOString(),
          t.createdAt.toISOString(),
        ]);

        const csv = [
          headers.join(','),
          ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        ].join('\n');

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="tasks-export.csv"',
          },
        });
      }

      return NextResponse.json(tasks);
    } catch (error) {
      console.error('Error generating report:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

