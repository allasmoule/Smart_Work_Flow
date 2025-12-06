// Example BullMQ worker for scheduling deadline checks
// Install: npm install bullmq ioredis
// Run: npx ts-node scripts/deadline-worker-bullmq.ts

import { Worker, Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { triggerNotification } from '../lib/pusher';

const prisma = new PrismaClient();
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
};

// Queue for deadline checks
export const deadlineQueue = new Queue('deadline-checks', { connection });

// Worker to process deadline checks
const worker = new Worker(
  'deadline-checks',
  async (job) => {
    const { taskId } = job.data;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignedTo: true, createdBy: true },
    });

    if (!task || task.status === 'APPROVED') {
      return;
    }

    const now = new Date();
    const isOverdue = task.deadline < now;
    const hoursUntilDeadline = (task.deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (isOverdue && task.assignedTo) {
      await prisma.notification.create({
        data: {
          userId: task.assignedTo.id,
          type: 'deadline_overdue',
          title: `Task "${task.title}" is overdue`,
          body: `Deadline was ${task.deadline.toLocaleDateString()}`,
          data: { taskId: task.id },
        },
      });

      triggerNotification(task.assignedTo.id, {
        type: 'deadline_overdue',
        title: `Task "${task.title}" is overdue`,
        taskId: task.id,
      });
    } else if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0 && task.assignedTo) {
      await prisma.notification.create({
        data: {
          userId: task.assignedTo.id,
          type: 'deadline_approaching',
          title: `Task "${task.title}" deadline approaching`,
          body: `Deadline is in ${Math.floor(hoursUntilDeadline)} hours`,
          data: { taskId: task.id },
        },
      });
    }
  },
  { connection }
);

// Function to schedule a deadline check job when a task is created/updated
export async function scheduleDeadlineCheck(taskId: string, deadline: Date) {
  await deadlineQueue.add(
    'check-deadline',
    { taskId },
    {
      delay: deadline.getTime() - Date.now(),
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000, // 1 minute
      },
    }
  );
}

console.log('Deadline worker started');

