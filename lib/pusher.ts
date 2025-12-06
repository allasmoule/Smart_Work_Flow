import Pusher from 'pusher';

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER || 'mt1',
  useTLS: true,
});

export function triggerNotification(userId: string, notification: {
  type: string;
  title: string;
  body?: string;
  data?: any;
}) {
  return pusher.trigger(`user-${userId}`, 'notification', notification);
}

export function triggerTaskUpdate(taskId: string, update: any) {
  return pusher.trigger('tasks', 'task_updated', { taskId, ...update });
}

