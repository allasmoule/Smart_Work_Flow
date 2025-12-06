'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { KPI } from '@/components/KPI';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ModalCreateTask } from '@/components/ModalCreateTask';
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

export default function AdminDashboard() {
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [workers, setWorkers] = useState<Array<{ id: string; name: string | null; email: string }>>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    inProgress: 0,
    overdue: 0,
    avgCompletionHours: 0,
    tasksPerUser: 0,
  });
  const [chartData, setChartData] = useState({
    statusDistribution: [],
    priorityDistribution: [],
    trends: [],
    workerPerformance: [],
    completionTime: [],
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'kanban' | 'list' | 'analytics'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [tasksRes, workersRes, statsRes, chartsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/admin/workers'),
        fetch('/api/reports/kpis'),
        fetch('/api/reports/charts'),
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.map((t: any) => ({
          ...t,
          deadline: new Date(t.deadline),
          createdAt: new Date(t.createdAt),
        })));
      }

      if (workersRes.ok) {
        setWorkers(await workersRes.json());
      }

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      if (chartsRes.ok) {
        setChartData(await chartsRes.json());
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask(data: {
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    deadline: Date;
    assignedToId?: string;
  }) {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to create task');
      toast.success('Task created successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to create task');
      throw error;
    }
  }

  async function handleTaskUpdate(taskId: string, status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED') {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update task');
      loadData();
    } catch (error) {
      throw error;
    }
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Layout>
        <div className="space-y-6">
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                  <p className="text-blue-100 text-lg">Manage tasks and monitor workflow performance</p>
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
            <TabsList className="grid w-full max-w-md grid-cols-4 bg-slate-100">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Activity className="h-4 w-4 mr-2" />
                Overview
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
                        onClick={() => {}}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
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
                      onClick={() => {}}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <ModalCreateTask
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSubmit={handleCreateTask}
          workers={workers}
        />
      </Layout>
    </ProtectedRoute>
  );
}
