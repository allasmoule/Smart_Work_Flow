import { PrismaClient } from '@prisma/client';
import Pusher from 'pusher';
import sgMail from '@sendgrid/mail';

const prisma = new PrismaClient();
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER || 'mt1',
  useTLS: true,
});

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

async function checkDeadlines() {
  console.log('Checking deadlines...');
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Find overdue tasks
  const overdueTasks = await prisma.task.findMany({
    where: {
      status: { not: 'APPROVED' },
      deadline: { lt: now },
    },
    include: {
      assignedTo: true,
      createdBy: true,
    },
  });

  // Find tasks approaching deadline (within 24 hours)
  const approachingTasks = await prisma.task.findMany({
    where: {
      status: { not: 'APPROVED' },
      deadline: {
        gte: now,
        lte: oneDayFromNow,
      },
    },
    include: {
      assignedTo: true,
      createdBy: true,
    },
  });

  // Process overdue tasks
  for (const task of overdueTasks) {
    // Create notification
    if (task.assignedTo) {
      await prisma.notification.create({
        data: {
          userId: task.assignedTo.id,
          type: 'deadline_overdue',
          title: `Task "${task.title}" is overdue`,
          body: `The deadline for this task was ${task.deadline.toLocaleDateString()}`,
          data: { taskId: task.id },
        },
      });

      // Trigger Pusher notification
      pusher.trigger(`user-${task.assignedTo.id}`, 'notification', {
        type: 'deadline_overdue',
        title: `Task "${task.title}" is overdue`,
        taskId: task.id,
      });

      // Send email if SendGrid is configured
      if (process.env.SENDGRID_API_KEY && task.assignedTo.email) {
        try {
          await sgMail.send({
            to: task.assignedTo.email,
            from: process.env.EMAIL_FROM || 'noreply@example.com',
            subject: `Overdue Task: ${task.title}`,
            text: `The task "${task.title}" is overdue. Deadline was ${task.deadline.toLocaleDateString()}.`,
            html: `
              <h2>Overdue Task</h2>
              <p>The task "<strong>${task.title}</strong>" is overdue.</p>
              <p>Deadline: ${task.deadline.toLocaleDateString()}</p>
            `,
          });
        } catch (error) {
          console.error('Error sending email:', error);
        }
      }
    }

    // Notify admin
    if (task.createdBy) {
      await prisma.notification.create({
        data: {
          userId: task.createdBy.id,
          type: 'deadline_overdue',
          title: `Task "${task.title}" assigned to ${task.assignedTo?.name || 'Unassigned'} is overdue`,
          body: `The deadline for this task was ${task.deadline.toLocaleDateString()}`,
          data: { taskId: task.id },
        },
      });
    }
  }

  // Process approaching tasks
  for (const task of approachingTasks) {
    if (task.assignedTo) {
      await prisma.notification.create({
        data: {
          userId: task.assignedTo.id,
          type: 'deadline_approaching',
          title: `Task "${task.title}" deadline approaching`,
          body: `The deadline is ${task.deadline.toLocaleDateString()}`,
          data: { taskId: task.id },
        },
      });

      pusher.trigger(`user-${task.assignedTo.id}`, 'notification', {
        type: 'deadline_approaching',
        title: `Task "${task.title}" deadline approaching`,
        taskId: task.id,
      });
    }
  }

  console.log(`Processed ${overdueTasks.length} overdue tasks and ${approachingTasks.length} approaching tasks`);
}

checkDeadlines()
  .catch((error) => {
    console.error('Error checking deadlines:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

