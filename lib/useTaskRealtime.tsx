'use client';

import { useEffect } from 'react';
import Pusher from 'pusher-js';

let pusherClient: Pusher | null = null;

function getPusherClient() {
  if (!pusherClient && typeof window !== 'undefined') {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (!pusherKey) {
      console.warn('Pusher key not configured');
      return null;
    }
    try {
      pusherClient = new Pusher(pusherKey, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
      });
    } catch (error) {
      console.error('Failed to initialize Pusher:', error);
      return null;
    }
  }
  return pusherClient;
}

type RealtimeEvent = {
  type: 'task_updated' | 'task_created' | 'notification';
  data?: any;
};

export function useTaskRealtime(callback: (event: RealtimeEvent) => void) {
  useEffect(() => {
    const client = getPusherClient();
    if (!client) return;

    const tasksChannel = client.subscribe('tasks');
    tasksChannel.bind('task_updated', (data: any) => {
      callback({ type: 'task_updated', data });
    });
    tasksChannel.bind('task_created', (data: any) => {
      callback({ type: 'task_created', data });
    });

    return () => {
      client.unsubscribe('tasks');
    };
  }, [callback]);
}

export function useUserNotifications(userId: string | undefined, callback: (event: RealtimeEvent) => void) {
  useEffect(() => {
    if (!userId) return;
    const client = getPusherClient();
    if (!client) return;

    const userChannel = client.subscribe(`user-${userId}`);
    userChannel.bind('notification', (data: any) => {
      callback({ type: 'notification', data });
    });

    return () => {
      client.unsubscribe(`user-${userId}`);
    };
  }, [userId, callback]);
}

