'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { KPI } from '@/components/KPI';
import { TaskCard, TaskCardData } from '@/components/TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio, ClipboardList, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useTaskRealtime } from '@/lib/useTaskRealtime';

export default function LivePage() {
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    inProgress: 0,
    overdue: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Subscribe to realtime updates
  useTaskRealtime((event) => {
    if (event.type === 'task_updated' || event.type === 'task_created') {
      loadTasks();
    }
  });

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function loadTasks() {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.map((t: any) => ({
          ...t,
          deadline: new Date(t.deadline),
          createdAt: new Date(t.createdAt),
        })));
        calculateStats(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(tasksData: any[]) {
    const now = new Date();
    const overdue = tasksData.filter(
      (t) => t.status !== 'APPROVED' && new Date(t.deadline) < now
    ).length;

    setStats({
      totalTasks: tasksData.length,
      inProgress: tasksData.filter((t) => t.status === 'IN_PROGRESS').length,
      overdue,
      completed: tasksData.filter((t) => t.status === 'APPROVED').length,
    });
  }

  return (
    <Layout showSidebar={false}>
      <div className="space-y-6">
        {/* Header with gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white shadow-2xl">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Radio className="h-10 w-10 animate-pulse" />
                Live Task Feed
              </h1>
              <p className="text-emerald-100 text-lg">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live</span>
            </div>
          </div>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="transform transition-all hover:scale-105">
            <KPI 
              title="Total Tasks" 
              value={stats.totalTasks} 
              icon={ClipboardList}
              className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200"
            />
          </div>
          <div className="transform transition-all hover:scale-105">
            <KPI 
              title="In Progress" 
              value={stats.inProgress} 
              icon={TrendingUp} 
              iconClassName="text-blue-600"
              className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
            />
          </div>
          <div className="transform transition-all hover:scale-105">
            <KPI 
              title="Overdue" 
              value={stats.overdue} 
              icon={AlertCircle} 
              iconClassName="text-red-600"
              className="bg-gradient-to-br from-red-50 to-red-100 border-red-200"
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
            Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-48 bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse rounded-xl" />
            ))
          ) : tasks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <ClipboardList className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 text-lg">No tasks found</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="transform transition-all hover:scale-105">
                <TaskCard task={task} />
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
