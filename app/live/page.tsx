'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { KPI } from '@/components/KPI';
import { TaskCard } from '@/components/TaskCard';
import { supabase, Task } from '@/lib/supabase/client';
import { ClipboardList, TrendingUp, CheckCircle2, AlertCircle, Radio } from 'lucide-react';

export default function LivePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    inProgress: 0,
    overdue: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchTasks();

    // Real-time subscription
    const channel = supabase
      .channel('live-tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchTasks(); // Reload all tasks on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchTasks() {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
            *,
            created_by_profile:profiles!tasks_created_by_fkey(full_name),
            assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
      } else {
        setTasks(data || []);
        calculateStats(data || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(tasksData: Task[]) {
    const now = new Date();
    const overdue = tasksData.filter(
      (t) => t.status !== 'approved' && new Date(t.deadline) < now
    ).length;

    setStats({
      totalTasks: tasksData.length,
      inProgress: tasksData.filter((t) => t.status === 'in_progress').length,
      overdue,
      completed: tasksData.filter((t) => t.status === 'approved').length,
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
            tasks.map((task) => {
              // Map Supabase Task to TaskCardData
              const taskData = {
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status.toUpperCase() as any,
                priority: task.priority.toUpperCase() as any,
                deadline: task.deadline,
                createdAt: task.created_at,
                assignedTo: (task as any).assigned_to_profile ? {
                  name: (task as any).assigned_to_profile.full_name,
                  image: null
                } : null
              };

              return (
                <div key={task.id} className="transform transition-all hover:scale-105">
                  <TaskCard task={taskData} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
