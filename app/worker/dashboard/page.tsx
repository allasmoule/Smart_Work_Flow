'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { KPI } from '@/components/KPI';
import { TaskCard, TaskCardData } from '@/components/TaskCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Square, Clock, ClipboardList, CheckCircle2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function WorkerDashboard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [activeTimer, setActiveTimer] = useState<{ taskId: string; startTime: Date } | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
    loadActiveTimer();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer) {
      interval = setInterval(() => {
        // Timer UI updates automatically via state
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  async function loadTasks() {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks?assignedTo=me');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.map((t: any) => ({
          ...t,
          deadline: new Date(t.deadline),
          createdAt: new Date(t.createdAt),
        })));
        setStats({
          total: data.length,
          inProgress: data.filter((t: any) => t.status === 'IN_PROGRESS').length,
          completed: data.filter((t: any) => t.status === 'APPROVED').length,
        });
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadActiveTimer() {
    try {
      const res = await fetch('/api/tasks/time/active');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setActiveTimer({
            taskId: data.taskId,
            startTime: new Date(data.startAt),
          });
        }
      }
    } catch (error) {
      console.error('Error loading active timer:', error);
    }
  }

  async function handleStartTimer(taskId: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/time/start`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to start timer');
      setActiveTimer({ taskId, startTime: new Date() });
      toast.success('Timer started');
    } catch (error) {
      toast.error('Failed to start timer');
    }
  }

  async function handleStopTimer(taskId: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/time/stop`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to stop timer');
      setActiveTimer(null);
      toast.success('Timer stopped');
      loadTasks();
    } catch (error) {
      toast.error('Failed to stop timer');
    }
  }

  const activeTask = activeTimer ? tasks.find(t => t.id === activeTimer.taskId) : null;
  const timerDuration = activeTimer
    ? Math.floor((Date.now() - activeTimer.startTime.getTime()) / 1000)
    : 0;
  const hours = Math.floor(timerDuration / 3600);
  const minutes = Math.floor((timerDuration % 3600) / 60);
  const seconds = timerDuration % 60;

  return (
    <ProtectedRoute requiredRole="WORKER">
      <Layout>
        <div className="space-y-6">
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-2">My Tasks</h1>
              <p className="text-indigo-100 text-lg">Welcome back, {profile?.name}</p>
            </div>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          </div>

          {activeTimer && activeTask && (
            <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-xl animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100 mb-1">Currently tracking:</p>
                    <p className="font-bold text-xl mb-3">{activeTask.title}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-mono font-bold">
                        {String(hours).padStart(2, '0')}:
                        {String(minutes).padStart(2, '0')}:
                        {String(seconds).padStart(2, '0')}
                      </p>
                      <span className="text-blue-200 text-sm">hours</span>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={() => handleStopTimer(activeTimer.taskId)}
                    className="bg-white text-red-600 hover:bg-red-50 shadow-lg"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop Timer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="transform transition-all hover:scale-105">
              <KPI 
                title="Total Tasks" 
                value={stats.total} 
                icon={ClipboardList}
                className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
              />
            </div>
            <div className="transform transition-all hover:scale-105">
              <KPI 
                title="In Progress" 
                value={stats.inProgress} 
                icon={Clock} 
                iconClassName="text-blue-600"
                className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200"
              />
            </div>
            <div className="transform transition-all hover:scale-105">
              <KPI 
                title="Completed" 
                value={stats.completed} 
                icon={CheckCircle2} 
                iconClassName="text-green-600"
                className="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-lg" />
              ))
            ) : tasks.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500">
                No tasks assigned
              </div>
            ) : (
              tasks.map(task => {
                const isActive = activeTimer?.taskId === task.id;
                return (
                  <div key={task.id} className="relative">
                    <TaskCard task={task} />
                    {task.status === 'PENDING' && !isActive && (
                      <div className="absolute bottom-4 right-4">
                        <Button
                          size="sm"
                          onClick={() => handleStartTimer(task.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      </div>
                    )}
                    {task.status === 'IN_PROGRESS' && !isActive && (
                      <div className="absolute bottom-4 right-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartTimer(task.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

