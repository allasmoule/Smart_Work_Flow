import { PrismaClient, Priority, Status, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: Role.ADMIN,
      passwordHash: await bcrypt.hash('admin123', 10),
    },
  });

  console.log('Created admin:', admin.email);

  // Create workers
  const workers = [];
  for (let i = 1; i <= 4; i++) {
    const worker = await prisma.user.upsert({
      where: { email: `worker${i}@example.com` },
      update: {},
      create: {
        email: `worker${i}@example.com`,
        name: `Worker ${i}`,
        role: Role.WORKER,
        passwordHash: await bcrypt.hash('worker123', 10),
      },
    });
    workers.push(worker);
    console.log(`Created worker ${i}:`, worker.email);
  }

  // Create tasks
  const priorities: Priority[] = [Priority.LOW, Priority.MEDIUM, Priority.HIGH];
  const statuses: Status[] = [Status.PENDING, Status.IN_PROGRESS, Status.SUBMITTED, Status.APPROVED];
  const now = new Date();

  for (let i = 1; i <= 20; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const daysFromNow = Math.floor(Math.random() * 30) - 10; // Some overdue
    const deadline = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);

    const task = await prisma.task.create({
      data: {
        title: `Task ${i}: ${['Design', 'Develop', 'Test', 'Review', 'Deploy'][i % 5]} Feature ${i}`,
        description: `Description for task ${i}. This is a sample task with various priorities and statuses.`,
        priority: priorities[i % priorities.length],
        status: statuses[i % statuses.length],
        deadline,
        createdById: admin.id,
        assignedToId: workers[i % workers.length].id,
        startedAt: i % 3 === 0 ? new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000) : null,
        submittedAt: i % 4 === 0 ? new Date(now.getTime() - (daysAgo - 2) * 24 * 60 * 60 * 1000) : null,
        approvedAt: i % 5 === 0 ? new Date(now.getTime() - (daysAgo - 5) * 24 * 60 * 60 * 1000) : null,
      },
    });

    // Create some time entries for in-progress tasks
    if (task.status === Status.IN_PROGRESS && task.startedAt) {
      await prisma.timeEntry.create({
        data: {
          taskId: task.id,
          userId: task.assignedToId!,
          startAt: task.startedAt,
          durationSec: Math.floor(Math.random() * 14400), // 0-4 hours
        },
      });
    }

    // Create some notifications
    if (i % 3 === 0) {
      await prisma.notification.create({
        data: {
          userId: task.assignedToId!,
          type: 'task_assigned',
          title: `Task "${task.title}" assigned`,
          body: `You have been assigned a new task`,
          data: { taskId: task.id },
        },
      });
    }
  }

  console.log('Created 20 tasks');
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

