'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { KPI } from '@/components/KPI';
import { KanbanBoard } from '@/components/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  ClipboardList,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Users
} from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { TaskCard, TaskCardData } from '@/components/TaskCard';
import { toast } from 'sonner';
import { TaskStatusChart } from '@/components/admin/TaskStatusChart';
import { TaskPriorityChart } from '@/components/admin/TaskPriorityChart';
import { TaskTrendChart } from '@/components/admin/TaskTrendChart';
import { WorkerPerformanceChart } from '@/components/admin/WorkerPerformanceChart';
import { CompletionTimeChart } from '@/components/admin/CompletionTimeChart';
import { TasksList } from '@/components/admin/tasks-list';
import { WorkersList } from '@/components/admin/workers-list';
import { AddTaskDialog } from '@/components/admin/add-task-dialog';
import { useAuth } from '@/lib/auth-context';
import { supabase, Task, Profile } from '@/lib/supabase/client';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [tasksRaw, setTasksRaw] = useState<Task[]>([]);
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    inProgress: 0,
    overdue: 0,
    avgCompletionHours: 0,
    tasksPerUser: 0,
  });
  const [chartData, setChartData] = useState({
    statusDistribution: [] as any[],
    priorityDistribution: [] as any[],
    trends: [] as any[],
    workerPerformance: [] as any[],
    completionTime: [] as any[],
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'kanban' | 'list' | 'analytics' | 'tasks' | 'workers'>('overview');

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToChanges();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load tasks from Supabase
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name, email),
          created_by_profile:profiles!tasks_created_by_fkey(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error loading tasks:', tasksError);
        toast.error('Failed to load tasks');
      }

      if (tasksData && tasksData.length > 0) {
        // Store raw tasks for TasksList component
        setTasksRaw(tasksData as Task[]);

        // Map for TaskCard components
        setTasks(tasksData.map((t: any) => {
          let status = (t.status || 'pending').toUpperCase().replace(' ', '_');
          // Map Supabase statuses to expected format
          if (status === 'IN_PROGRESS') status = 'IN_PROGRESS';
          if (status === 'PENDING') status = 'PENDING';
          if (status === 'SUBMITTED') status = 'SUBMITTED';
          if (status === 'APPROVED') status = 'APPROVED';

          return {
            id: t.id,
            title: t.title || '',
            description: t.description || null,
            status: status as any,
            priority: (t.priority || 'medium').toUpperCase() as any,
            deadline: t.deadline ? new Date(t.deadline) : new Date(),
            createdAt: t.created_at ? new Date(t.created_at) : new Date(),
            assignedTo: t.assigned_to_profile ? {
              name: t.assigned_to_profile.full_name,
              image: null,
            } : null,
          };
        }));
        calculateStats(tasksData);
      } else {
        // No tasks found
        setTasksRaw([]);
        setTasks([]);
        calculateStats([]);
      }

      // Load workers
      const { data: workersData, error: workersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at, updated_at')
        .eq('role', 'worker')
        .order('created_at', { ascending: false });

      if (workersError) {
        console.error('Error loading workers:', workersError);
        toast.error('Failed to load workers');
      }

      if (workersData) {
        setWorkers(workersData as Profile[]);
      }

      // Try to load chart data from API (if available)
      try {
        const chartsRes = await fetch('/api/reports/charts');
        if (chartsRes.ok) {
          const apiChartData = await chartsRes.json();
          setChartData(apiChartData);
        } else {
          // Generate chart data from Supabase data
          generateChartData(tasksData || []);
        }
      } catch (e) {
        // Generate chart data from Supabase data
        generateChartData(tasksData || []);
      }

      // Try to load stats from API
      try {
        const statsRes = await fetch('/api/reports/kpis');
        if (statsRes.ok) {
          const apiStats = await statsRes.json();
          setStats(apiStats);
        }
      } catch (e) {
        // Stats already calculated
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(tasksData: any[]) {
    const now = new Date();
    const overdue = tasksData.filter(
      (t: any) => t.status !== 'approved' && new Date(t.deadline) < now
    ).length;

    const inProgress = tasksData.filter((t: any) => t.status === 'in_progress').length;
    const totalTasks = tasksData.length;

    // Calculate average completion time
    const completedTasks = tasksData.filter((t: any) =>
      t.status === 'approved' && t.started_at && t.approved_at
    );
    const avgCompletionHours = completedTasks.length > 0
      ? completedTasks.reduce((sum: number, t: any) => {
        const hours = (new Date(t.approved_at).getTime() - new Date(t.started_at).getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0) / completedTasks.length
      : 0;

    setStats({
      totalTasks,
      inProgress,
      overdue,
      avgCompletionHours,
      tasksPerUser: workers.length > 0 ? totalTasks / workers.length : 0,
    });
  }

  function generateChartData(tasksData: any[]) {
    if (!tasksData || tasksData.length === 0) {
      setChartData({
        statusDistribution: [],
        priorityDistribution: [],
        trends: [],
        workerPerformance: [],
        completionTime: [],
      });
      return;
    }

    // Status distribution - normalize Supabase statuses
    const statusCounts: Record<string, number> = {};
    tasksData.forEach((t: any) => {
      if (!t.status) return;
      let status = t.status.toUpperCase();
      // Convert 'in_progress' to 'IN_PROGRESS', etc.
      status = status.replace(' ', '_');
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Priority distribution
    const priorityCounts: Record<string, number> = {};
    tasksData.forEach((t: any) => {
      const priority = (t.priority || 'medium').toUpperCase();
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    });

    setChartData({
      statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      })),
      priorityDistribution: Object.entries(priorityCounts).map(([priority, count]) => ({
        priority,
        count,
      })),
      trends: [],
      workerPerformance: [],
      completionTime: [],
    });
  }

  function subscribeToChanges() {
    const tasksChannel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
    };
  }

  async function handleCreateTask(data: {
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    deadline: Date;
    assignedToId?: string;
  }) {
    try {
      if (!profile?.id) {
        toast.error('User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .insert({
          title: data.title,
          description: data.description || '',
          priority: data.priority.toLowerCase(),
          deadline: data.deadline.toISOString(),
          assigned_to: data.assignedToId || null,
          created_by: profile.id,
          status: 'pending',
        });

      if (error) {
        console.error('Error creating task:', error);
        throw error;
      }
      toast.success('Task created successfully');
      loadData();
    } catch (error: any) {
      console.error('Failed to create task:', error);
      toast.error(error?.message || 'Failed to create task');
      throw error;
    }
  }

  async function handleTaskUpdate(taskId: string, status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED') {
    try {
      const statusLower = status.toLowerCase().replace('_', ' ');
      const updateData: any = { status: statusLower };

      if (status === 'IN_PROGRESS') {
        updateData.started_at = new Date().toISOString();
      }
      if (status === 'SUBMITTED') {
        updateData.submitted_at = new Date().toISOString();
      }
      if (status === 'APPROVED') {
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task:', error);
        throw error;
      }
      loadData();
    } catch (error: any) {
      console.error('Failed to update task:', error);
      toast.error(error?.message || 'Failed to update task');
      throw error;
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout>
        <div className="space-y-6">
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                  <p className="text-blue-100 text-lg">Welcome back, {(profile as any)?.full_name || (profile as any)?.name || 'Admin'}</p>
                </div>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Task
                </Button>
              </div>
            </div>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          </div>

          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="space-y-4">
            <TabsList className="grid w-full max-w-2xl grid-cols-6 bg-slate-100">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Activity className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <ClipboardList className="h-4 w-4 mr-2" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="workers" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Users className="h-4 w-4 mr-2" />
                Workers
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="kanban" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <PieChart className="h-4 w-4 mr-2" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <ClipboardList className="h-4 w-4 mr-2" />
                List
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* KPI Cards with animations */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="transform transition-all hover:scale-105">
                  <KPI
                    title="Total Tasks"
                    value={stats.totalTasks}
                    icon={ClipboardList}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
                  />
                </div>
                <div className="transform transition-all hover:scale-105">
                  <KPI
                    title="In Progress"
                    value={stats.inProgress}
                    icon={TrendingUp}
                    iconClassName="text-blue-600"
                    className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200"
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
                    title="Avg Completion"
                    value={`${stats.avgCompletionHours.toFixed(1)}h`}
                    icon={Clock}
                    className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
                  />
                </div>
                <div className="transform transition-all hover:scale-105">
                  <KPI
                    title="Tasks/User"
                    value={stats.tasksPerUser.toFixed(1)}
                    icon={CheckCircle2}
                    iconClassName="text-green-600"
                    className="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                  />
                </div>
              </div>

              {/* Quick Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {chartData.statusDistribution.length > 0 && (
                  <TaskStatusChart data={chartData.statusDistribution} />
                )}
                {chartData.priorityDistribution.length > 0 && (
                  <TaskPriorityChart data={chartData.priorityDistribution} />
                )}
              </div>

              {/* Recent Tasks */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-slate-900">Recent Tasks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasks.slice(0, 6).map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => { }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">All Tasks</h2>
                  <p className="text-sm text-slate-600">Manage and monitor task progress</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
              <TasksList tasks={tasksRaw} workers={workers} onUpdate={loadData} />
            </TabsContent>

            {/* Workers Tab */}
            <TabsContent value="workers" className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">Workers</h2>
                  <p className="text-sm text-slate-600">Manage your team members</p>
                </div>
              </div>
              <WorkersList workers={workers} tasks={tasksRaw} />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {chartData.trends.length > 0 && (
                  <TaskTrendChart data={chartData.trends} />
                )}
                {chartData.completionTime.length > 0 && (
                  <CompletionTimeChart data={chartData.completionTime} />
                )}
              </div>
              {chartData.workerPerformance.length > 0 && (
                <WorkerPerformanceChart data={chartData.workerPerformance} />
              )}
              {chartData.trends.length === 0 && chartData.completionTime.length === 0 && (
                <Card className="p-8 text-center text-slate-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p>Analytics data will appear here once more tasks are completed</p>
                </Card>
              )}
            </TabsContent>

            {/* Kanban Tab */}
            <TabsContent value="kanban">
              <KanbanBoard
                tasks={tasks}
                onTaskUpdate={handleTaskUpdate}
                loading={loading}
              />
            </TabsContent>

            {/* List Tab */}
            <TabsContent value="list">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-lg" />
                  ))
                ) : tasks.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-500">
                    No tasks found
                  </div>
                ) : (
                  tasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => { }}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <AddTaskDialog
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          workers={workers}
          onSuccess={loadData}
        />
      </Layout>
    </ProtectedRoute>
  );
}
