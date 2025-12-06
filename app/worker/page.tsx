'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { supabase, Task } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Play,
  Upload,
} from 'lucide-react';
import { format } from 'date-fns';
import { SubmitTaskDialog } from '@/components/worker/submit-task-dialog';
import { WorkerAnalytics } from '@/components/worker/worker-analytics';

export default function WorkerDashboard() {
  const { profile, signOut } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    submitted: 0,
    approved: 0,
  });
  const [submitTask, setSubmitTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
    subscribeToChanges();
  }, [profile]);

  async function loadTasks() {
    if (!profile) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        created_by_profile:profiles!tasks_created_by_fkey(id, full_name)
      `)
      .eq('assigned_to', profile.id)
      .order('deadline', { ascending: true });

    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setTasks(data || []);
      calculateStats(data || []);
    }
    setLoading(false);
  }

  function calculateStats(tasks: Task[]) {
    setStats({
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      submitted: tasks.filter((t) => t.status === 'submitted').length,
      approved: tasks.filter((t) => t.status === 'approved').length,
    });
  }

  function subscribeToChanges() {
    const channel = supabase
      .channel('worker-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${profile?.id}`,
        },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function handleStartTask(taskId: string) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
      loadTasks();
    } catch (error) {
      console.error('Error starting task:', error);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'submitted':
        return 'bg-purple-100 text-purple-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  }

  function isDelayed(task: Task) {
    return task.status !== 'approved' && new Date(task.deadline) < new Date();
  }

  function filterTasks(status?: string) {
    if (!status) return tasks;
    return tasks.filter((t) => t.status === status);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="worker">
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
                <p className="text-sm text-slate-600">Welcome back, {profile?.full_name}</p>
              </div>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <WorkerAnalytics tasks={tasks} />

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="submitted">Submitted</TabsTrigger>
              <TabsTrigger value="approved">Completed</TabsTrigger>
            </TabsList>

            {['all', 'pending', 'in_progress', 'submitted', 'approved'].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {filterTasks(tab === 'all' ? undefined : tab).length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <AlertCircle className="h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-slate-600">No tasks in this category</p>
                    </CardContent>
                  </Card>
                ) : (
                  filterTasks(tab === 'all' ? undefined : tab).map((task) => {
                    const delayed = isDelayed(task);
                    const createdBy = task.created_by_profile as any;

                    return (
                      <Card key={task.id} className={delayed ? 'border-red-300' : ''}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">{task.title}</h3>
                                <Badge className={getStatusColor(task.status)}>
                                  {task.status.replace('_', ' ')}
                                </Badge>
                                <Badge className={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                                {delayed && (
                                  <Badge className="bg-red-100 text-red-800">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Delayed
                                  </Badge>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-slate-600 mb-3">{task.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                {createdBy && (
                                  <div>
                                    <span className="font-medium">Created by:</span> {createdBy.full_name}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    Due: {format(new Date(task.deadline), 'MMM dd, yyyy HH:mm')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              {task.status === 'pending' && (
                                <Button onClick={() => handleStartTask(task.id)}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Start Task
                                </Button>
                              )}
                              {task.status === 'in_progress' && (
                                <Button onClick={() => setSubmitTask(task)}>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Submit Work
                                </Button>
                              )}
                              {task.status === 'approved' && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>
            ))}
          </Tabs>
        </main>

        {submitTask && (
          <SubmitTaskDialog
            task={submitTask}
            open={!!submitTask}
            onOpenChange={(open) => !open && setSubmitTask(null)}
            onSuccess={loadTasks}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
